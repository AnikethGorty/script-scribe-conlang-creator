import os
import sqlite3
import logging
import traceback
from datetime import datetime
import json

logger = logging.getLogger(__name__)

# SQLite database setup - use an absolute path that's definitely writable
# Use a user-writable location instead of the server directory
HOME_DIR = os.path.expanduser("~")
APP_DATA_DIR = os.path.join(HOME_DIR, ".vocabulary_app")
DATABASE_PATH = os.path.join(APP_DATA_DIR, "vocabulary.db")

def get_sqlite_connection():
    """Get a connection to the SQLite database"""
    try:
        # Ensure the application data directory exists
        if not os.path.exists(APP_DATA_DIR):
            logger.info(f"Creating application data directory at {APP_DATA_DIR}")
            os.makedirs(APP_DATA_DIR, exist_ok=True)
            
        # Log the database path for debugging
        logger.info(f"Connecting to SQLite database at: {DATABASE_PATH}")
        
        conn = sqlite3.connect(DATABASE_PATH, timeout=10)
        conn.row_factory = sqlite3.Row  # This enables column access by name
        
        # Test the connection with a simple query
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        
        logger.info("SQLite connection successful")
        return conn
    except Exception as e:
        logger.error(f"SQLite connection error: {str(e)}")
        logger.error(traceback.format_exc())
        return None

def check_sqlite_status():
    """Check if SQLite is accessible and working properly"""
    try:
        # Check if directory exists and is writable
        if not os.path.exists(APP_DATA_DIR):
            try:
                os.makedirs(APP_DATA_DIR, exist_ok=True)
                logger.info(f"Created data directory at {APP_DATA_DIR}")
            except Exception as dir_error:
                logger.error(f"Failed to create data directory: {str(dir_error)}")
                return {
                    "status": "error",
                    "error": f"Cannot create data directory: {str(dir_error)}"
                }
        
        # Check if directory is writable
        if not os.access(APP_DATA_DIR, os.W_OK):
            logger.error(f"Data directory is not writable: {APP_DATA_DIR}")
            return {
                "status": "error",
                "error": f"Data directory is not writable: {APP_DATA_DIR}"
            }
        
        conn = get_sqlite_connection()
        if conn:
            cursor = conn.cursor()
            # Simple query to test connection
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            conn.close()
            
            return {
                "status": "active" if result else "error",
                "error": None,
                "path": DATABASE_PATH
            }
        else:
            return {
                "status": "error",
                "error": "Could not establish connection to SQLite"
            }
    except Exception as e:
        logger.error(f"SQLite health check error: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            "status": "error",
            "error": str(e)
        }

def init_sqlite_db():
    """Initialize the SQLite database with required tables"""
    try:
        conn = get_sqlite_connection()
        if conn:
            cursor = conn.cursor()
            
            # Create words table if it doesn't exist
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS words (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT UNIQUE,
                meaning TEXT,
                type TEXT,
                context TEXT,
                created_at TEXT,
                updated_at TEXT,
                synced_to_mongodb BOOLEAN DEFAULT 0
            )
            ''')
            
            conn.commit()
            logger.info("SQLite database initialized successfully")
            conn.close()
        else:
            logger.error("Failed to initialize SQLite database")
    except Exception as e:
        logger.error(f"SQLite initialization error: {str(e)}")
        logger.error(traceback.format_exc())

# Run database initialization
init_sqlite_db()

def add_word_to_sqlite(word, meaning, word_type, context):
    """Add or update a word in the SQLite database"""
    try:
        conn = get_sqlite_connection()
        if not conn:
            return {"error": "SQLite database connection failed"}, False
        
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        
        # Check if word exists and update or insert accordingly
        cursor.execute("SELECT * FROM words WHERE word = ?", (word,))
        result = cursor.fetchone()
        
        if result:
            # Update existing word
            cursor.execute(
                """UPDATE words 
                SET meaning = ?, type = ?, context = ?, updated_at = ?, synced_to_mongodb = 0
                WHERE word = ?""",
                (meaning, word_type, context, now, word)
            )
        else:
            # Insert new word
            cursor.execute(
                """INSERT INTO words (word, meaning, type, context, created_at, updated_at, synced_to_mongodb)
                VALUES (?, ?, ?, ?, ?, ?, 0)""",
                (word, meaning, word_type, context, now, now)
            )
        
        conn.commit()
        conn.close()
        
        return {
            "success": True, 
            "message": f"Word '{word}' saved to local SQLite database"
        }, True
    except Exception as e:
        logger.error(f"Error saving word to SQLite: {str(e)}")
        logger.error(traceback.format_exc())
        return {"error": f"SQLite error: {str(e)}"}, False

def get_all_words_from_sqlite():
    """Get all words from the SQLite database"""
    try:
        conn = get_sqlite_connection()
        if not conn:
            return {"error": "SQLite database connection failed"}, False
        
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM words ORDER BY created_at DESC")
        rows = cursor.fetchall()
        
        words = []
        for row in rows:
            word_dict = dict(row)  # Convert row to dictionary
            words.append({
                "_id": str(word_dict["id"]),
                "word": word_dict["word"],
                "meaning": word_dict["meaning"],
                "type": word_dict["type"],
                "context": word_dict["context"],
                "created_at": word_dict["created_at"],
                "updated_at": word_dict["updated_at"],
                "synced_to_mongodb": bool(word_dict["synced_to_mongodb"])
            })
            
        conn.close()
        return {"words": words, "source": "sqlite"}, True
    except Exception as e:
        logger.error(f"Error getting words from SQLite: {str(e)}")
        logger.error(traceback.format_exc())
        return {"error": f"SQLite error: {str(e)}"}, False

def get_known_words_from_sqlite():
    """Get list of known words from SQLite database"""
    try:
        conn = get_sqlite_connection()
        if not conn:
            return []
        
        cursor = conn.cursor()
        cursor.execute("SELECT word FROM words")
        rows = cursor.fetchall()
        
        words = [row["word"] for row in rows]
        conn.close()
        return words
    except Exception as e:
        logger.error(f"Error getting known words from SQLite: {str(e)}")
        return []

def get_unsynced_words():
    """Get words that haven't been synced to MongoDB"""
    try:
        conn = get_sqlite_connection()
        if not conn:
            return []
        
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM words WHERE synced_to_mongodb = 0")
        rows = cursor.fetchall()
        
        words = []
        for row in rows:
            words.append({
                "word": row["word"],
                "meaning": row["meaning"],
                "type": row["type"],
                "context": row["context"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"]
            })
            
        conn.close()
        return words
    except Exception as e:
        logger.error(f"Error getting unsynced words: {str(e)}")
        return []

def mark_word_as_synced(word):
    """Mark a word as synced to MongoDB"""
    try:
        conn = get_sqlite_connection()
        if not conn:
            return False
        
        cursor = conn.cursor()
        cursor.execute("UPDATE words SET synced_to_mongodb = 1 WHERE word = ?", (word,))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Error marking word as synced: {str(e)}")
        return False
