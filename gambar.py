from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time

# --- Konfigurasi ---
BASE_URL = 'https://codingstella.com/'
MAX_ARTICLES = 100
OUTPUT_FILE = 'codingstella_articles.sql'

# Data storage
titles = []
subtitles = []
contents = []
images = []

def setup_driver():
    """Setup Firefox driver dengan opsi optimal"""
    firefox_options = Options()
    
    # HAPUS headless untuk debugging - uncomment setelah berhasil
    # firefox_options.add_argument('--headless')
    firefox_options.add_argument('--no-sandbox')
    firefox_options.add_argument('--disable-dev-shm-usage')
    
    # Set user agent
    firefox_options.set_preference('general.useragent.override', 
                                   'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0')
    
    # Disable notifications
    firefox_options.set_preference('dom.webnotifications.enabled', False)
    firefox_options.set_preference('dom.push.enabled', False)
    
    driver = webdriver.Firefox(options=firefox_options)
    driver.set_page_load_timeout(30)
    driver.maximize_window()
    
    return driver

def wait_for_element(driver, selector, timeout=10):
    """Wait untuk element dengan timeout"""
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
        )
        return element
    except TimeoutException:
        print(f"⚠ Timeout menunggu element: {selector}")
        return None

def safe_get_text(element):
    """Safely get text dan escape untuk SQL"""
    try:
        text = element.text.strip()
        # Escape single quotes dan hapus newline bermasalah
        text = text.replace("'", "''").replace('\n', ' ').replace('\r', ' ')
        return text
    except:
        return ''

def safe_get_attribute(element, attr):
    """Safely get attribute"""
    try:
        value = element.get_attribute(attr)
        if value:
            return value.replace("'", "''")
        return ''
    except:
        return ''

def scrape_article(driver, link):
    """Scrape single article"""
    try:
        driver.get(link)
        
        # Wait untuk title load
        title_element = wait_for_element(driver, 'h1.entry-title', timeout=10)
        if not title_element:
            print(f"✗ Gagal load artikel: {link}")
            return False
        
        # Ambil title
        title = safe_get_text(title_element)
        
        # Ambil semua paragraf
        try:
            paragraphs = driver.find_elements(By.CSS_SELECTOR, 'div.entry-content p')
            
            if paragraphs:
                # Subtitle = paragraf pertama
                subtitle = safe_get_text(paragraphs[0])
                
                # Content = gabungan semua paragraf
                content_parts = [safe_get_text(p) for p in paragraphs if safe_get_text(p)]
                content = ' '.join(content_parts)
            else:
                subtitle = ''
                content = ''
        except:
            subtitle = ''
            content = ''
        
        # Ambil gambar utama
        img_url = ''
        try:
            # Coba beberapa selector untuk gambar
            img_selectors = [
                'div.entry-content img',
                'article img',
                'img.wp-post-image',
                'figure img'
            ]
            
            for selector in img_selectors:
                try:
                    img_element = driver.find_element(By.CSS_SELECTOR, selector)
                    img_url = safe_get_attribute(img_element, 'src')
                    if img_url:
                        break
                except:
                    continue
        except:
            pass
        
        # Validasi data minimal
        if title:
            titles.append(title)
            subtitles.append(subtitle)
            contents.append(content if content else subtitle)  # Fallback ke subtitle jika content kosong
            images.append(img_url)
            return True
        else:
            print(f"⚠ Artikel tidak valid (tidak ada title): {link}")
            return False
            
    except Exception as e:
        print(f"✗ Error scraping {link}: {e}")
        return False

def format_sql_array(arr):
    """Format array Python menjadi ARRAY PostgreSQL"""
    if not arr:
        return "ARRAY[]::TEXT[]"
    
    formatted_items = [f"'{item}'" for item in arr]
    return "ARRAY[\n  " + ",\n  ".join(formatted_items) + "\n]"

def save_to_sql_file(filename=OUTPUT_FILE):
    """Simpan data ke file SQL"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            # Header
            f.write("-- ============================================\n")
            f.write("-- Scraped from CodingStella.com\n")
            f.write(f"-- Total Articles: {len(titles)}\n")
            f.write(f"-- Generated at: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("-- ============================================\n\n")
            
            # Create table
            f.write("-- Buat tabel jika belum ada\n")
            f.write("CREATE TABLE IF NOT EXISTS articles (\n")
            f.write("  id SERIAL PRIMARY KEY,\n")
            f.write("  title TEXT NOT NULL,\n")
            f.write("  subtitle TEXT,\n")
            f.write("  content TEXT,\n")
            f.write("  image_url TEXT,\n")
            f.write("  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n")
            f.write(");\n\n")
            
            # Insert data menggunakan DO block
            f.write("-- Insert data\n")
            f.write("DO $$\n")
            f.write("DECLARE\n")
            f.write(f"  titles TEXT[] := {format_sql_array(titles)};\n")
            f.write(f"  subtitles TEXT[] := {format_sql_array(subtitles)};\n")
            f.write(f"  contents TEXT[] := {format_sql_array(contents)};\n")
            f.write(f"  images TEXT[] := {format_sql_array(images)};\n")
            f.write("BEGIN\n")
            f.write("  INSERT INTO articles (title, subtitle, content, image_url)\n")
            f.write("  SELECT unnest(titles), unnest(subtitles), unnest(contents), unnest(images);\n")
            f.write("  RAISE NOTICE 'Berhasil insert % artikel', array_length(titles, 1);\n")
            f.write("END $$;\n\n")
            
            # Query untuk verifikasi
            f.write("-- Verifikasi data\n")
            f.write("SELECT COUNT(*) as total_articles FROM articles;\n")
            f.write("SELECT title, substring(content, 1, 100) as preview FROM articles LIMIT 5;\n")
        
        print(f"\n✓ File SQL berhasil disimpan: {filename}")
        return filename
        
    except Exception as e:
        print(f"\n✗ Error menyimpan file: {e}")
        return None

def main():
    """Main scraping function"""
    driver = None
    
    try:
        print("="*60)
        print("SELENIUM SCRAPER - CodingStella.com (Firefox)")
        print("="*60 + "\n")
        
        # Setup driver
        print("→ Setup Firefox driver...")
        driver = setup_driver()
        print("✓ Firefox driver ready\n")
        
        # Buka homepage
        print(f"→ Membuka {BASE_URL}...")
        driver.get(BASE_URL)
        
        # Wait lebih lama dan scroll untuk trigger lazy load
        print("→ Menunggu halaman load...")
        time.sleep(5)
        
        # Scroll ke bawah untuk trigger lazy loading
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(2)
        
        # Debug: Simpan screenshot dan HTML
        try:
            driver.save_screenshot('debug_homepage.png')
            print("✓ Screenshot tersimpan: debug_homepage.png")
        except:
            pass
        
        # Ambil semua link artikel dengan berbagai selector
        print(f"→ Mengambil link artikel (max {MAX_ARTICLES})...")
        article_links = []
        
        # Coba berbagai selector yang umum digunakan WordPress
        selectors = [
            'h2.entry-title a',
            'h3.entry-title a', 
            'article h2 a',
            'article h3 a',
            '.post-title a',
            'h2 a[href*="codingstella"]',
            'article a[href*="codingstella"]',
            '.entry-header a',
            'a[rel="bookmark"]'
        ]
        
        print("\n→ Mencoba berbagai selector...")
        for selector in selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    print(f"   ✓ Selector '{selector}' menemukan {len(elements)} element")
                    article_links = [a.get_attribute('href') for a in elements[:MAX_ARTICLES] 
                                   if a.get_attribute('href') and 'codingstella.com' in a.get_attribute('href')]
                    if article_links:
                        print(f"   ✓ Ditemukan {len(article_links)} link artikel valid")
                        break
            except Exception as e:
                print(f"   ✗ Selector '{selector}' error: {e}")
        
        # Jika masih tidak ada, tampilkan semua link untuk debugging
        if not article_links:
            print("\n⚠ DEBUG: Menampilkan semua link di halaman...")
            try:
                all_links = driver.find_elements(By.TAG_NAME, 'a')
                print(f"   Total link di halaman: {len(all_links)}")
                print("\n   Sample 10 link pertama:")
                for i, link in enumerate(all_links[:10]):
                    href = link.get_attribute('href')
                    text = link.text[:50] if link.text else '(no text)'
                    print(f"   {i+1}. {text} -> {href}")
                
                # Simpan HTML untuk inspeksi manual
                with open('debug_page.html', 'w', encoding='utf-8') as f:
                    f.write(driver.page_source)
                print("\n✓ HTML tersimpan: debug_page.html")
                print("   Silakan buka file ini untuk cek struktur HTML yang sebenarnya")
            except Exception as e:
                print(f"   ✗ Error debug: {e}")
        
        if not article_links:
            print("\n✗ Tidak ada artikel ditemukan.")
            print("\n📋 TROUBLESHOOTING:")
            print("   1. Cek file 'debug_homepage.png' - apakah halaman ter-load dengan benar?")
            print("   2. Cek file 'debug_page.html' - lihat struktur HTML sebenarnya")
            print("   3. Buka browser manual dan inspect element artikel")
            print("   4. Website mungkin butuh login atau ada CAPTCHA")
            print("   5. Coba matikan headless mode (sudah dimatikan di kode ini)")
            return
        
        # Scrape setiap artikel
        print("→ Memulai scraping artikel...\n")
        success_count = 0
        
        for idx, link in enumerate(article_links, 1):
            print(f"[{idx}/{len(article_links)}] Scraping: {link[:60]}...")
            
            if scrape_article(driver, link):
                success_count += 1
                print(f"    ✓ Berhasil")
            else:
                print(f"    ✗ Gagal")
            
            # Progress update setiap 10 artikel
            if idx % 10 == 0:
                print(f"\n--- Progress: {success_count}/{idx} artikel berhasil ---\n")
            
            time.sleep(1)  # Delay antar artikel
        
        print(f"\n{'='*60}")
        print(f"SELESAI - {success_count}/{len(article_links)} artikel berhasil di-scrape")
        print(f"{'='*60}\n")
        
        # Simpan ke file SQL
        if success_count > 0:
            sql_file = save_to_sql_file()
            
            if sql_file:
                print(f"\n{'='*60}")
                print("CARA MENGGUNAKAN:")
                print(f"{'='*60}")
                print(f"1. File tersimpan: {sql_file}")
                print("2. Import ke PostgreSQL:")
                print(f"   psql -U username -d database_name -f {sql_file}")
                print("3. Atau buka file dan copy-paste ke pgAdmin")
                print(f"{'='*60}\n")
        else:
            print("\n⚠ Tidak ada data yang berhasil di-scrape")
            
    except KeyboardInterrupt:
        print("\n\n⚠ Scraping dibatalkan oleh user")
    except Exception as e:
        print(f"\n✗ Error tidak terduga: {e}")
    finally:
        if driver:
            print("\n→ Menutup browser...")
            driver.quit()
            print("✓ Browser ditutup")

if __name__ == "__main__":
    main()