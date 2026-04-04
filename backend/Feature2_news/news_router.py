from fastapi import APIRouter, HTTPException, Request, Body, Query
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import os
import requests
import datetime
import math
import logging
import time

# Create Router
router = APIRouter(prefix="/news", tags=["News"])

# --- CONFIGURATION ---
# Use absolute path for database to ensure it's always found
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# We might want to store DB in the same folder as the script for now
DB_FILE = os.path.join(BASE_DIR, 'disaster_news.db')

# API KEYS (Ideally move to .env, but keeping here for direct port as per plan)
# NOTE: User provided this key in the original Flask app
NEWS_API_KEY = os.getenv("GNEWS_API_KEY")

# Keywords for disaster detection and categorization
DISASTER_KEYWORDS = {
    'flood': 'Flood',
    'flooding': 'Flood',
    'earthquake': 'Earthquake',
    'quake': 'Earthquake',
    'seismic': 'Earthquake',
    'tremor': 'Earthquake',
    'cyclone': 'Cyclone',
    'storm': 'Cyclone',
    'hurricane': 'Cyclone',
    'typhoon': 'Cyclone',
    'tornado': 'Cyclone',
    'fire': 'Wildfire',
    'wildfire': 'Wildfire',
    'blaze': 'Wildfire',
    'landslide': 'Landslide',
    'mudslide': 'Landslide',
    'drought': 'Drought',
    'tsunami': 'Tsunami',
    'avalanche': 'Avalanche',
    'volcano': 'Volcano',
    'eruption': 'Volcano',
    'disaster': 'General Alert',
    'emergency': 'General Alert',
    'crisis': 'General Alert',
    'evacuation': 'General Alert',
    'rescue': 'General Alert'
}

# --- Pydantic Models ---
class NewsFetchRequest(BaseModel):
    location: str = "India"

class NewsArticle(BaseModel):
    id: Optional[int] = None
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    source_name: Optional[str] = None
    article_url: str
    published_at: Optional[str] = None
    category: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_km: Optional[float] = None
    created_at: Optional[str] = None

# --- DATABASE HELPERS ---

def init_db():
    """Initializes the SQLite database and table."""
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS disaster_news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                image_url TEXT,
                source_name TEXT,
                article_url TEXT UNIQUE NOT NULL,
                published_at TIMESTAMP,
                category TEXT,
                location_name TEXT,
                latitude REAL,
                longitude REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()
        logging.info(f"Database initialized at {DB_FILE}")
    except Exception as e:
        logging.error(f"DB Init Error: {e}")

def get_db_connection():
    """Establishes connection to SQLite database."""
    try:
        conn = sqlite3.connect(DB_FILE, timeout=30)
        conn.row_factory = sqlite3.Row
        # Enable Write-Ahead Logging (WAL) for better concurrency
        conn.execute("PRAGMA journal_mode=WAL")
        return conn
    except Exception as e:
        logging.error(f"Error connecting to SQLite: {e}")
        return None

# --- UTILITY FUNCTIONS ---

def determine_category(title, description):
    """Auto-detects disaster category based on text content."""
    text = (str(title) + " " + (str(description) or "")).lower()
    for key, category in DISASTER_KEYWORDS.items():
        if key in text:
            return category
    return "General Alert"

def get_coordinates(location_name):
    """Get coordinates for a location using geocoding API."""
    if not location_name or len(location_name) > 50:
        return None, None
        
    try:
        # Respect Nominatim Usage Policy (max 1 request/sec)
        time.sleep(1.1) 
        
        url = f"https://nominatim.openstreetmap.org/search?q={location_name}&format=json&limit=1"
        headers = {
            'User-Agent': 'SanketSathi_DisasterApp/1.0 (sanketsathi@example.com)',
            'Accept-Language': 'en'
        }
        response = requests.get(url, headers=headers, timeout=3)
        
        if response.status_code == 200:
            data = response.json()
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        logging.error(f"Geocoding error for {location_name}: {e}")
    return None, None

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula (in km)."""
    if None in (lat1, lon1, lat2, lon2):
        return float('inf')
    
    try:
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(float(lat1))
        lat2_rad = math.radians(float(lat2))
        delta_lat = math.radians(float(lat2) - float(lat1))
        delta_lon = math.radians(float(lon2) - float(lon1))
        
        a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    except:
        return float('inf')

def extract_location_from_text(text):
    """Extract potential location names from article text."""
    import re
    # Limit to words that look like proper nouns
    words = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b', text or '')
    
    ignore_list = {'The', 'A', 'An', 'In', 'On', 'At', 'Of', 'To', 'For', 'With', 'From', 
                   'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
                   'Flood', 'Earthquake', 'Cyclone', 'Fire', 'Storm', 'Hurricane', 'Alert', 'Warning'}
    
    candidates = [w for w in words if w not in ignore_list and w.split()[0] not in ignore_list]
    
    return candidates[0] if candidates else None

# --- ROUTES ---

# Initialize database on module load
init_db()

# Placeholder images for different disaster categories
PLACEHOLDER_IMAGES = {
    'Flood': 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&h=400&fit=crop',
    'Earthquake': 'https://images.unsplash.com/photo-1600096194534-95cf5ac3a0e2?w=600&h=400&fit=crop',
    'Cyclone': 'https://images.unsplash.com/photo-1509635022432-0220ac12960b?w=600&h=400&fit=crop',
    'Wildfire': 'https://images.unsplash.com/photo-1473260079731-7d82cdc3b6b0?w=600&h=400&fit=crop',
    'Landslide': 'https://images.unsplash.com/photo-1560012057-4372e14c5085?w=600&h=400&fit=crop',
    'Tsunami': 'https://images.unsplash.com/photo-1559060017-445fb9722f2a?w=600&h=400&fit=crop',
    'Drought': 'https://images.unsplash.com/photo-1504297050568-910d24c426d3?w=600&h=400&fit=crop',
    'General Alert': 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&h=400&fit=crop',
    'default': 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&h=400&fit=crop'
}

def get_placeholder_image(category):
    """Get a relevant placeholder image for the disaster category."""
    return PLACEHOLDER_IMAGES.get(category, PLACEHOLDER_IMAGES['default'])

@router.post("/fetch-news")
def trigger_fetch_news(payload: NewsFetchRequest):
    """Fetches news from NewsAPI, processes them, and stores in DB."""
    try:
        location = payload.location or "India"
        
        # NewsAPI Configuration
        url = "https://newsapi.org/v2/everything"
        
        base_query = "flood OR landslide OR earthquake"
        if location and location.lower() != "india":
            final_query = f"({base_query}) AND {location}"
        else:
            final_query = base_query

        # LIMIT PAGE SIZE TO 5 TO PREVENT TIMEOUTS
        # Geocoding 5 items takes ~5 seconds (1.1s buffer per item)
        params = {
            "q": final_query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 5,
            "apiKey": NEWS_API_KEY
        }

        logging.info(f"Fetching news for: {location} with query: {final_query}")
        print(f"Fetching news using NewsAPI for: {location}")
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code != 200:
            logging.error(f"NewsAPI Error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail=f"NewsAPI Error: {response.status_code}")
            
        data = response.json()
        articles = data.get('articles', [])
        
        if not articles:
            logging.info(f"No articles found for query: {final_query}")
            print("No articles found.")

        processed_articles = []
        
        for article in articles:
            title = article.get('title')
            desc = article.get('description')
            article_url = article.get('url')
            
            if not title or not article_url:
                continue
                
            # NewsAPI uses 'urlToImage'
            img_url = article.get('urlToImage')
            source = article.get('source', {}).get('name') if article.get('source') else 'Unknown'
            pub_date_str = article.get('publishedAt') 
            
            # Date normalization
            try:
                if pub_date_str:
                    if 'T' in str(pub_date_str):
                        pub_date = pub_date_str
                    else:
                        pub_date = datetime.datetime.now().isoformat()
                else:
                    pub_date = datetime.datetime.now().isoformat()
            except:
                pub_date = datetime.datetime.now().isoformat()

            category = determine_category(title, desc)

            # Use category-specific placeholder if no image
            if not img_url or img_url.strip() == '':
                img_url = get_placeholder_image(category)

            # Geocoding
            article_text = f"{title} {desc or ''}"
            found_location = extract_location_from_text(article_text)
            location_name_to_use = found_location if found_location else location
            
            lat, lon = get_coordinates(location_name_to_use)
            
            # Fallback geocoding
            if lat is None and location and location.lower() != "india" and location.lower() in article_text.lower():
                 if location_name_to_use != location:
                     lat, lon = get_coordinates(location)
            
            processed_articles.append({
                'title': title,
                'description': desc or 'No description available.',
                'image_url': img_url,
                'source_name': source or 'Unknown Source',
                'article_url': article_url,
                'published_at': pub_date,
                'category': category,
                'location_name': location_name_to_use,
                'latitude': lat,
                'longitude': lon
            })

        # Database Insertion
        new_count = 0
        conn = get_db_connection()
        if not conn:
             raise HTTPException(status_code=500, detail="Database connection failed")
             
        try:
            cursor = conn.cursor()
            for item in processed_articles:
                try:
                    check_sql = "SELECT id FROM disaster_news WHERE article_url = ? OR title = ?"
                    cursor.execute(check_sql, (item['article_url'], item['title']))
                    if not cursor.fetchone():
                        insert_sql = """
                            INSERT INTO disaster_news 
                            (title, description, image_url, source_name, article_url, published_at, category, location_name, latitude, longitude)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """
                        cursor.execute(insert_sql, (
                            item['title'], item['description'], item['image_url'], item['source_name'], 
                            item['article_url'], item['published_at'], item['category'], 
                            item['location_name'], item['latitude'], item['longitude']
                        ))
                        new_count += 1
                except Exception as err:
                    print(f"Error inserting: {err}")
            
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=500, detail=f"DB Error: {e}")
        finally:
            conn.close()

        return {"status": "success", "new_articles_count": new_count}

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_news(
    location: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    limit: int = Query(default=20, le=50)
):
    """Retrieves stored news, prioritizing distance."""
    try:
        # Initialize DB if needed
        init_db()
        
        conn = get_db_connection()
        if not conn:
            logging.error("Database connection failed")
            raise HTTPException(status_code=500, detail="Database connection failed")

        user_location = location.lower().strip() if location else ""
        
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM disaster_news ORDER BY published_at DESC LIMIT 100")
        rows = cursor.fetchall()
        
        if not rows:
            conn.close()
            return []  # Return empty list if no news
        
        results = []
        for row in rows:
            item = dict(row)
            # Ensure all fields have proper defaults
            item['description'] = item.get('description') or 'No description available.'
            item['source_name'] = item.get('source_name') or 'Unknown Source'
            item['category'] = item.get('category') or 'General Alert'
            item['image_url'] = item.get('image_url') or get_placeholder_image(item['category'])
            results.append(item)
        
        # Calculate Distance
        if latitude is not None and longitude is not None:
            for item in results:
                i_lat = item.get('latitude')
                i_lon = item.get('longitude')
                
                if i_lat is not None and i_lon is not None:
                    dist = calculate_distance(latitude, longitude, i_lat, i_lon)
                    item['distance_km'] = round(dist, 2)
                else:
                    item['distance_km'] = float('inf')
            
            results.sort(key=lambda x: x.get('distance_km', float('inf')))
        
        # Fallback Text Match - prioritize news mentioning user's location
        elif user_location and user_location != "india":
            def sort_key(item):
                content = (str(item.get('title', '')) + " " + str(item.get('description', '')) + " " + str(item.get('location_name', ''))).lower()
                if user_location in content:
                    return 0 
                return 1
            results.sort(key=sort_key)

        # Return with limit
        return results[:limit]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'conn' in locals() and conn:
            conn.close()


@router.get("/categories")
async def get_categories():
    """Get all available disaster categories."""
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT category FROM disaster_news WHERE category IS NOT NULL ORDER BY category")
        rows = cursor.fetchall()
        conn.close()
        
        categories = [row['category'] for row in rows]
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_stats():
    """Get news statistics."""
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = conn.cursor()
        
        # Total articles
        cursor.execute("SELECT COUNT(*) as count FROM disaster_news")
        total = cursor.fetchone()['count']
        
        # Latest article date
        cursor.execute("SELECT MAX(published_at) as latest FROM disaster_news")
        latest = cursor.fetchone()['latest']
        
        # Category breakdown
        cursor.execute("SELECT category, COUNT(*) as count FROM disaster_news GROUP BY category ORDER BY count DESC")
        category_rows = cursor.fetchall()
        category_breakdown = {row['category']: row['count'] for row in category_rows}
        
        conn.close()
        
        return {
            "total_articles": total,
            "latest_article_date": latest,
            "category_breakdown": category_breakdown
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
