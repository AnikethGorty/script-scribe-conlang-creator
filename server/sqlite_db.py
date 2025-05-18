
import os
import sqlite3
import logging
import traceback
from datetime import datetime
import json

logger = logging.getLogger(__name__)

# SQLite database setup
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'vocabulary.db')

def get_sqlite_connection():
    """Get a connection to the SQLite database"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row  # This enables column access by name
        return conn
    except Exception as e:
        logger.error(f"SQLite connection error: {str(e)}")
        logger.error(traceback.format_exc())
        return None

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
        for row in dict(row) for row in rows:
            words.append({
                "_id": str(row["id"]),
                "word": row["word"],
                "meaning": row["meaning"],
                "type": row["type"],
                "context": row["context"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
                "synced_to_mongodb": bool(row["synced_to_mongodb"])
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
