"""Book download manager handling search and retrieval operations."""

import time, json, re
from pathlib import Path
from urllib.parse import quote
from typing import List, Optional, Dict, Union, Callable
from threading import Event
from bs4 import BeautifulSoup, Tag, NavigableString, ResultSet

import downloader
from logger import setup_logger
from config import SUPPORTED_FORMATS, BOOK_LANGUAGE, AA_BASE_URL
from env import AA_DONATOR_KEY, USE_CF_BYPASS, PRIORITIZE_WELIB, ALLOW_USE_WELIB
from models import BookInfo, SearchFilters
logger = setup_logger(__name__)



def search_books(query: str, filters: SearchFilters) -> List[BookInfo]:
    """Search for books matching the query.

    Args:
        query: Search term (ISBN, title, author, etc.)

    Returns:
        List[BookInfo]: List of matching books

    Raises:
        Exception: If no books found or parsing fails
    """
    logger.info(f"Starting search for query: '{query}' with filters: {filters}")
    
    query_html = quote(query)

    if filters.isbn:
        # ISBNs are included in query string
        isbns = " || ".join(
            [f"('isbn13:{isbn}' || 'isbn10:{isbn}')" for isbn in filters.isbn]
        )
        query_html = quote(f"({isbns}) {query}")

    filters_query = ""

    for value in filters.lang or BOOK_LANGUAGE:
        if value != "all":
            filters_query += f"&lang={quote(value)}"

    if filters.sort:
        filters_query += f"&sort={quote(filters.sort)}"

    if filters.content:
        for value in filters.content:
            filters_query += f"&content={quote(value)}"

    # Handle format filter
    formats_to_use = filters.format if filters.format else SUPPORTED_FORMATS

    index = 1
    for filter_type, filter_values in vars(filters).items():
        if filter_type == "author" or filter_type == "title" and filter_values:
            for value in filter_values:
                filters_query += (
                    f"&termtype_{index}={filter_type}&termval_{index}={quote(value)}"
                )
                index += 1

    url = (
        f"{AA_BASE_URL}"
        f"/search?index=&page=1&display=table"
        f"&acc=aa_download&acc=external_download"
        f"&ext={'&ext='.join(formats_to_use)}"
        f"&q={query_html}"
        f"{filters_query}"
    )

    logger.debug(f"Search URL: {url}")

    html = downloader.html_get_page(url)
    if not html:
        logger.error(f"Failed to fetch search results from {url}")
        raise Exception("Failed to fetch search results")

    if "No files found." in html:
        logger.info(f"No books found for query: {query}")
        raise Exception("No books found. Please try another query.")

    soup = BeautifulSoup(html, "html.parser")
    tbody: Tag | NavigableString | None = soup.find("table")

    if not tbody:
        logger.warning(f"No results table found for query: {query}")
        # Log the HTML structure for debugging
        logger.debug(f"HTML structure received: {html[:500]}...")
        raise Exception("No books found. Please try another query.")

    books = []
    total_rows = 0
    successful_parses = 0
    failed_parses = 0
    
    if isinstance(tbody, Tag):
        rows = tbody.find_all("tr")
        total_rows = len(rows)
        logger.debug(f"Found {total_rows} rows in search results table")
        
        for line_tr in rows:
            try:
                book = _parse_search_result_row(line_tr)
                if book:
                    books.append(book)
                    successful_parses += 1
                else:
                    failed_parses += 1
            except Exception as e:
                logger.error_trace(f"Failed to parse search result row: {e}")
                failed_parses += 1
    
    logger.info(f"Search parsing complete: {successful_parses} successful, {failed_parses} failed out of {total_rows} total rows")
    
    if not books and total_rows > 0:
        logger.warning(f"No books were successfully parsed from {total_rows} rows. This might indicate a structure change in the search results.")
        # Log a sample of the HTML structure for debugging
        if total_rows > 0:
            sample_row = tbody.find_all("tr")[0]
            logger.debug(f"Sample row HTML structure: {str(sample_row)[:500]}...")

    books.sort(
        key=lambda x: (
            SUPPORTED_FORMATS.index(x.format)
            if x.format in SUPPORTED_FORMATS
            else len(SUPPORTED_FORMATS)
        )
    )

    logger.info(f"Returning {len(books)} books for query: '{query}'")
    return books


def _parse_search_result_row(row: Tag) -> Optional[BookInfo]:
    """Parse a single search result row into a BookInfo object."""
    try:
        # Filtrer rapidement les lignes de publicité pour éviter le bruit dans les logs
        row_class = row.get('class', [])
        if isinstance(row_class, list):
            row_class_str = ' '.join(row_class)
        else:
            row_class_str = str(row_class)
            
        if 'aa-logged-in' in row_class_str or 'ad' in row_class_str.lower():
            # Ignorer silencieusement les lignes de publicité
            return None
            
        cells = row.find_all("td")
        
        # Validation du nombre de cellules attendues (minimum 11 pour les indices utilisés)
        expected_min_cells = 11
        if len(cells) < expected_min_cells:
            logger.debug(f"Invalid table row structure: expected at least {expected_min_cells} cells, got {len(cells)}. Row content: {str(row)[:200]}...")
            return None
        
        # Validation des liens pour l'ID
        links = row.find_all("a")
        if not links or not links[0].has_attr("href"):
            logger.warning(f"Invalid table row structure: no valid links found for ID. Row content: {str(row)[:200]}...")
            return None
        
        # Fonction helper pour extraire le texte en toute sécurité
        def safe_extract_text(cell, field_name, index):
            if index >= len(cells):
                logger.warning(f"Cell index {index} out of range for field '{field_name}'. Total cells: {len(cells)}")
                return None
            span = cells[index].find("span")
            if not span:
                logger.warning(f"No span found for field '{field_name}' at index {index}")
                return None
            
            # Utiliser get_text pour garantir une chaîne de caractères
            text = span.get_text(strip=True)
            if not text:
                logger.warning(f"Empty text content for field '{field_name}' at index {index}")
                return None
            
            return text
        
        # Extraction sécurisée de l'ID
        book_id = links[0]["href"].split("/")[-1]
        
        # Extraction sécurisée de l'image de prévisualisation
        preview_img = cells[0].find("img")
        preview = preview_img["src"] if preview_img and preview_img.has_attr("src") else None
        
        # Extraction sécurisée des autres champs
        title = safe_extract_text(cells, "title", 1)
        author = safe_extract_text(cells, "author", 2)
        publisher = safe_extract_text(cells, "publisher", 3)
        year = safe_extract_text(cells, "year", 4)
        language = safe_extract_text(cells, "language", 7)
        
        # Extraction sécurisée du format (avec conversion en minuscules)
        format_text = safe_extract_text(cells, "format", 9)
        format_lower = format_text.lower() if format_text else None
        
        # Extraction sécurisée de la taille
        size = safe_extract_text(cells, "size", 10)
        
        # Vérification que les champs obligatoires sont présents
        if not book_id or not title:
            logger.warning(f"Missing required fields (id: {bool(book_id)}, title: {bool(title)}). Skipping row.")
            return None
        
        return BookInfo(
            id=book_id,
            preview=preview,
            title=title,
            author=author,
            publisher=publisher,
            year=year,
            language=language,
            format=format_lower,
            size=size,
        )
    except Exception as e:
        logger.error_trace(f"Error parsing search result row: {e}")
        # Ajout d'informations détaillées pour le débogage
        logger.debug(f"Row HTML structure: {str(row)[:500]}...")
        return None


def get_book_info(book_id: str) -> BookInfo:
    """Get detailed information for a specific book.

    Args:
        book_id: Book identifier (MD5 hash)

    Returns:
        BookInfo: Detailed book information
    """
    url = f"{AA_BASE_URL}/md5/{book_id}"
    html = downloader.html_get_page(url)

    if not html:
        raise Exception(f"Failed to fetch book info for ID: {book_id}")

    soup = BeautifulSoup(html, "html.parser")

    return _parse_book_info_page(soup, book_id)


def _parse_book_info_page(soup: BeautifulSoup, book_id: str) -> BookInfo:
    """Parse the book info page HTML into a BookInfo object."""
    logger.debug(f"Parsing book info page for ID: {book_id}")
    
    data = soup.select_one("body > main > div:nth-of-type(1)")

    if not data:
        logger.warning(f"Failed to find main data container for book ID: {book_id}")
        # Log the HTML structure for debugging
        logger.debug(f"HTML structure received: {str(soup)[:500]}...")
        raise Exception(f"Failed to parse book info for ID: {book_id}")

    preview: str = ""

    node = data.select_one("div:nth-of-type(1) > img")
    if node:
        preview_value = node.get("src", "")
        if isinstance(preview_value, list):
            preview = preview_value[0]
        else:
            preview = preview_value

    main_inner_divs = soup.find_all("div", {"class": "main-inner"})
    if not main_inner_divs:
        logger.warning(f"No main-inner div found for book ID: {book_id}")
        raise Exception(f"Failed to parse book info structure for ID: {book_id}")
    
    data = main_inner_divs[0].find_next("div")
    if not data:
        logger.warning(f"No data div found after main-inner for book ID: {book_id}")
        raise Exception(f"Failed to parse book info structure for ID: {book_id}")
    
    divs = list(data.children)
    if not divs:
        logger.warning(f"No child divs found in data container for book ID: {book_id}")
        raise Exception(f"Failed to parse book info structure for ID: {book_id}")

    every_url = soup.find_all("a")
    slow_urls_no_waitlist = set()
    slow_urls_with_waitlist = set()
    external_urls_libgen = set()
    external_urls_z_lib = set()
    external_urls_welib = set()

    for url in every_url:
        try:
            if url.text.strip().lower().startswith("slow partner server"):
                if (
                    url.next is not None
                    and url.next.next is not None
                    and "waitlist" in url.next.next.strip().lower()
                ):
                    internal_text = url.next.next.strip().lower()
                    if "no waitlist" in internal_text:
                        slow_urls_no_waitlist.add(url["href"])
                    else:
                        slow_urls_with_waitlist.add(url["href"])
            elif (
                url.next is not None
                and url.next.next is not None
                and "click “GET” at the top" in url.next.next.text.strip()
            ):
                libgen_url = url["href"]
                # TODO : Temporary fix ? Maybe get URLs from https://open-slum.org/ ?
                libgen_url = re.sub(r'libgen\.(lc|is|bz|st)', 'libgen.gl', url["href"])

                external_urls_libgen.add(libgen_url)
            elif url.text.strip().lower().startswith("z-lib"):
                if ".onion/" not in url["href"]:
                    external_urls_z_lib.add(url["href"])
        except:
            pass

    external_urls_welib = _get_download_urls_from_welib(book_id) if USE_CF_BYPASS else set()

    urls = []
    urls += list(external_urls_welib) if PRIORITIZE_WELIB else []
    urls += list(slow_urls_no_waitlist) if USE_CF_BYPASS else []
    urls += list(external_urls_libgen)
    urls += list(external_urls_welib) if not PRIORITIZE_WELIB else []
    urls += list(slow_urls_with_waitlist)  if USE_CF_BYPASS else []
    urls += list(external_urls_z_lib)

    for i in range(len(urls)):
        urls[i] = downloader.get_absolute_url(AA_BASE_URL, urls[i])

    # Remove empty urls
    urls = [url for url in urls if url != ""]

    # Filter out divs that are not text
    original_divs = divs
    divs = [div.text.strip() for div in divs if div.text.strip() != ""]

    separator_index = 6
    for i, div in enumerate(divs):
        if hasattr(div, 'strip') and "·" in div.strip():
            separator_index = i
            break
    
    # Validation de l'index du séparateur
    if separator_index >= len(divs):
        logger.warning(f"Separator index {separator_index} out of range for {len(divs)} divs in book ID: {book_id}")
        separator_index = min(6, len(divs) - 1)
    
    if not hasattr(divs[separator_index], 'strip'):
        logger.warning(f"Div at separator index {separator_index} is not a text element for book ID: {book_id}")
        # Essayer de trouver un élément textuel valide
        for i, div in enumerate(divs):
            if hasattr(div, 'strip') and div.strip():
                separator_index = i
                break
        else:
            logger.error(f"No valid text div found for book ID: {book_id}")
            raise Exception(f"Failed to parse book details for ID: {book_id}")
            
    _details = divs[separator_index].lower().split(" · ")
    format = ""
    size = ""
    for f in _details:
        if format == "" and f.strip().lower() in SUPPORTED_FORMATS:
            format = f.strip().lower()
        if size == "" and any(u in f.strip().lower() for u in ["mb", "kb", "gb"]):
            size = f.strip().lower()

    if format == "" or size == "":
        for f in _details:
            if f == "" and not " " in f.strip().lower():
                format = f.strip().lower()
            if size == "" and "." in f.strip().lower():
                size = f.strip().lower()

    
    # Validation de l'index pour le titre
    title_index = separator_index - 3
    if title_index < 0 or title_index >= len(divs):
        logger.warning(f"Title index {title_index} out of range for {len(divs)} divs in book ID: {book_id}")
        title_index = max(0, min(title_index, len(divs) - 1))
    
    if not hasattr(divs[title_index], 'strip'):
        logger.warning(f"Title div at index {title_index} is not a text element for book ID: {book_id}")
        book_title = f"Unknown Title (ID: {book_id})"
    else:
        book_title = divs[title_index].strip("🔍")

    # Extraction sécurisée de l'éditeur et de l'auteur
    publisher_index = separator_index - 1
    author_index = separator_index - 2
    
    publisher = None
    author = None
    
    if 0 <= publisher_index < len(divs) and hasattr(divs[publisher_index], 'strip'):
        publisher = divs[publisher_index]
    else:
        logger.warning(f"Publisher index {publisher_index} out of range for book ID: {book_id}")
    
    if 0 <= author_index < len(divs) and hasattr(divs[author_index], 'strip'):
        author = divs[author_index]
    else:
        logger.warning(f"Author index {author_index} out of range for book ID: {book_id}")

    # Extract basic information
    book_info = BookInfo(
        id=book_id,
        preview=preview,
        title=book_title,
        publisher=publisher,
        author=author,
        format=format,
        size=size,
        download_urls=urls,
    )

    # Extraction sécurisée des métadonnées
    if len(original_divs) >= 6:
        try:
            info = _extract_book_metadata(original_divs[-6])
        except Exception as e:
            logger.warning(f"Failed to extract metadata for book ID: {book_id}: {e}")
            info = {}
    else:
        logger.warning(f"Not enough divs ({len(original_divs)}) to extract metadata for book ID: {book_id}")
        info = {}
    book_info.info = info

    # Set language and year from metadata if available
    if info.get("Language"):
        book_info.language = info["Language"][0]
    if info.get("Year"):
        book_info.year = info["Year"][0]

    return book_info

def _get_download_urls_from_welib(book_id: str) -> set[str]:
    """Get download urls from welib.org."""
    if not ALLOW_USE_WELIB:
        logger.debug("WELIB usage is disabled")
        return set()
    
    logger.debug(f"Getting download urls from welib.org for {book_id}")
    url = f"https://welib.org/md5/{book_id}"
    
    try:
        logger.info(f"Fetching welib.org page for {book_id}. This uses the bypasser but won't start downloading yet.")
        html = downloader.html_get_page(url, use_bypasser=True)
        
        if not html:
            logger.warning(f"Failed to fetch welib.org page for {book_id}")
            return set()
        
        soup = BeautifulSoup(html, "html.parser")
        download_links = soup.find_all("a", href=True)
        
        if not download_links:
            logger.warning(f"No download links found on welib.org page for {book_id}")
            return set()
        
        # Filtrer les liens de téléchargement
        download_links = [link["href"] for link in download_links if link.has_attr("href")]
        download_links = [link for link in download_links if "/slow_download/" in link]
        
        if not download_links:
            logger.warning(f"No slow_download links found on welib.org page for {book_id}")
            return set()
        
        # Convertir en URLs absolues
        absolute_links = []
        for link in download_links:
            try:
                absolute_link = downloader.get_absolute_url(url, link)
                if absolute_link:
                    absolute_links.append(absolute_link)
            except Exception as e:
                logger.warning(f"Failed to convert welib link to absolute URL for {book_id}: {e}")
        
        result = set(absolute_links)
        logger.debug(f"Found {len(result)} welib download URLs for {book_id}")
        return result
        
    except Exception as e:
        logger.error_trace(f"Error getting welib download URLs for {book_id}: {e}")
        return set()

def _extract_book_metadata(
    metadata_divs
) -> Dict[str, List[str]]:
    """Extract metadata from book info divs."""
    logger.debug("Extracting book metadata")
    info: Dict[str, List[str]] = {}

    try:
        # Validation de la structure des métadonnées
        if not metadata_divs:
            logger.warning("No metadata divs provided")
            return {}
        
        # Process the first set of metadata
        all_divs = metadata_divs.find_all("div")
        if not all_divs:
            logger.warning("No divs found in metadata container")
            return {}
        
        sub_datas = all_divs[0]
        sub_datas = list(sub_datas.children)
        
        for i, sub_data in enumerate(sub_datas):
            try:
                if not hasattr(sub_data, 'text') or sub_data.text.strip() == "":
                    continue
                
                sub_data_children = list(sub_data.children)
                if len(sub_data_children) < 2:
                    logger.debug(f"Skipping metadata item {i}: not enough children")
                    continue
                
                # Extraction sécurisée de la clé et de la valeur
                key_element = sub_data_children[0]
                value_element = sub_data_children[1]
                
                if not hasattr(key_element, 'text') or not hasattr(value_element, 'text'):
                    logger.debug(f"Skipping metadata item {i}: elements don't have text attribute")
                    continue
                
                key = key_element.text.strip()
                value = value_element.text.strip()
                
                if not key or not value:
                    logger.debug(f"Skipping metadata item {i}: empty key or value")
                    continue
                
                if key not in info:
                    info[key] = set()
                info[key].add(value)
                
            except Exception as e:
                logger.debug(f"Error processing metadata item {i}: {e}")
                continue
        
        # make set into list
        for key, value in info.items():
            info[key] = list(value)

        # Filter relevant metadata
        relevant_prefixes = [
            "ISBN-",
            "ALTERNATIVE",
            "ASIN",
            "Goodreads",
            "Language",
            "Year",
        ]
        
        filtered_info = {
            k.strip(): v
            for k, v in info.items()
            if any(k.lower().startswith(prefix.lower()) for prefix in relevant_prefixes)
            and "filename" not in k.lower()
        }
        
        logger.debug(f"Extracted {len(filtered_info)} metadata fields")
        return filtered_info
        
    except Exception as e:
        logger.warning(f"Error extracting book metadata: {e}")
        return {}


def download_book(book_info: BookInfo, book_path: Path, progress_callback: Optional[Callable[[float], None]] = None, cancel_flag: Optional[Event] = None) -> bool:
    """Download a book from available sources.

    Args:
        book_id: Book identifier (MD5 hash)
        title: Book title for logging

    Returns:
        Optional[BytesIO]: Book content buffer if successful
    """

    if len(book_info.download_urls) == 0:
        book_info = get_book_info(book_info.id)
    download_links = book_info.download_urls

    # If AA_DONATOR_KEY is set, use the fast download URL. Else try other sources.
    if AA_DONATOR_KEY != "":
        download_links.insert(
            0,
            f"{AA_BASE_URL}/dyn/api/fast_download.json?md5={book_info.id}&key={AA_DONATOR_KEY}",
        )

    for link in download_links:
        try:
            download_url = _get_download_url(link, book_info.title, cancel_flag)
            if download_url != "":
                logger.info(f"Downloading `{book_info.title}` from `{download_url}`")

                data = downloader.download_url(download_url, book_info.size or "", progress_callback, cancel_flag)
                if not data:
                    raise Exception("No data received")

                logger.info(f"Download finished. Writing to {book_path}")
                with open(book_path, "wb") as f:
                    f.write(data.getbuffer())
                logger.info(f"Writing `{book_info.title}` successfully")
                return True

        except Exception as e:
            logger.error_trace(f"Failed to download from {link}: {e}")
            continue

    return False


def _get_download_url(link: str, title: str, cancel_flag: Optional[Event] = None, max_retries: int = 3) -> str:
    """Extract actual download URL from various source pages."""
    logger.debug(f"Extracting download URL from: {link}")
    url = ""

    try:
        if link.startswith(f"{AA_BASE_URL}/dyn/api/fast_download.json"):
            page = downloader.html_get_page(link)
            if not page:
                logger.warning(f"Failed to fetch fast download page for {title}")
                return ""
            
            try:
                response_data = json.loads(page)
                url = response_data.get("download_url")
                if not url:
                    logger.warning(f"No download URL found in fast download response for {title}")
                    return ""
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse fast download JSON response for {title}: {e}")
                return ""
        else:
            html = downloader.html_get_page(link)

            if not html or html == "":
                logger.warning(f"Empty HTML response from {link} for {title}")
                return ""

            soup = BeautifulSoup(html, "html.parser")

            if link.startswith("https://z-lib."):
                download_link = soup.find_all("a", href=True, class_="addDownloadedBook")
                if download_link:
                    url = download_link[0]["href"]
                else:
                    logger.warning(f"No download link found for z-lib book {title}")
            elif "/slow_download/" in link:
                download_links = soup.find_all("a", href=True, string="📚 Download now")
                if not download_links:
                    countdown = soup.find_all("span", class_="js-partner-countdown")
                    if countdown:
                        # Vérifier la limite de tentatives pour éviter la récursion infinie
                        if max_retries <= 0:
                            logger.warning(f"Max retries reached for {title} - giving up")
                            return ""
                        
                        try:
                            sleep_time = int(countdown[0].text)
                            logger.info(f"Waiting {sleep_time}s for {title} (retries left: {max_retries})")
                            if cancel_flag is not None and cancel_flag.wait(timeout=sleep_time):
                                logger.info(f"Cancelled wait for {title}")
                                return ""
                            url = _get_download_url(link, title, cancel_flag, max_retries - 1)
                        except (ValueError, IndexError) as e:
                            logger.warning(f"Invalid countdown value for {title}: {e}")
                    else:
                        logger.warning(f"No countdown or download link found for {title}")
                else:
                    url = download_links[0]["href"]
            else:
                get_links = soup.find_all("a", string="GET")
                if get_links:
                    url = get_links[0]["href"]
                else:
                    logger.warning(f"No GET link found for {title}")

        if url:
            absolute_url = downloader.get_absolute_url(link, url)
            logger.debug(f"Successfully extracted download URL for {title}")
            return absolute_url
        else:
            logger.warning(f"No download URL extracted for {title}")
            return ""

    except Exception as e:
        logger.error_trace(f"Error extracting download URL for {title} from {link}: {e}")
        return ""
