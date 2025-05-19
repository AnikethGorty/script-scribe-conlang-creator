
import logging
import traceback
from datetime import datetime
from server.mongodb_client import get_db, mongo_available
from server.sqlite_db import (
    add_word_to_sqlite, 
    get_all_words_from_sqlite,
    get_known_words_from_sqlite,
    get_unsynced_words,
    mark_word_as_synced,
    check_sqlite_status
)

logger = logging.getLogger(__name__)

# Get known words from the database
def get_known_words():
    try:
        db = get_db()
        if db:
            known_words = [word['word'] for word in db.words.find({}, {'word': 1})]
            return known_words
        else:
            # Fallback to SQLite if MongoDB is unavailable
            logger.info("MongoDB unavailable, falling back to SQLite for known words")
            return get_known_words_from_sqlite()
    except Exception as e:
        logger.error(f"Error getting known words from MongoDB: {str(e)}")
        logger.error(traceback.format_exc())
        # Fallback to SQLite
        return get_known_words_from_sqlite()

# Word management functions
def add_word(word, meaning, word_type, context):
    mongodb_available = mongo_available
    sqlite_status = check_sqlite_status()
    sqlite_available = sqlite_status["status"] == "active"
    
    # If both databases are unavailable, return error
    if not mongodb_available and not sqlite_available:
        logger.critical("Both MongoDB and SQLite are unavailable. Cannot save word data.")
        return {"error": "All database connections failed. Word cannot be saved.", "storage": "none", "supabase_recommended": True}, False
    
    try:
        # First try to connect to MongoDB
        db = get_db()
        if db:
            # MongoDB is available, save to MongoDB
            result = db.words.update_one(
                {"word": word},
                {"$set": {
                    "word": word,
                    "meaning": meaning, 
                    "type": word_type, 
                    "context": context,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }},
                upsert=True
            )
            
            if result.upserted_id:
                return {"success": True, "message": f"Word '{word}' added successfully to MongoDB", "storage": "mongodb", "supabase_recommended": True}, True
            else:
                return {"success": True, "message": f"Word '{word}' updated successfully in MongoDB", "storage": "mongodb", "supabase_recommended": True}, True
        else:
            # MongoDB is unavailable, fallback to SQLite
            logger.info(f"MongoDB unavailable, saving word '{word}' to SQLite")
            if sqlite_available:
                result, success = add_word_to_sqlite(word, meaning, word_type, context)
                
                if success:
                    result["storage"] = "sqlite"
                    result["supabase_recommended"] = True
                
                return result, success
            else:
                return {"error": "SQLite is also unavailable. Cannot save word.", "storage": "none", "supabase_recommended": True}, False
    except Exception as e:
        logger.error(f"Error saving word to MongoDB: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Fallback to SQLite
        if sqlite_available:
            logger.info(f"Falling back to SQLite for saving word '{word}'")
            result, success = add_word_to_sqlite(word, meaning, word_type, context)
            
            if success:
                result["storage"] = "sqlite"
                result["supabase_recommended"] = True
            
            return result, success
        else:
            return {"error": f"Both MongoDB and SQLite failed: {str(e)}", "storage": "none", "supabase_recommended": True}, False

# Get all words from the database
def get_all_words():
    try:
        db = get_db()
        if db:
            # Try to get words from MongoDB
            mongo_words = list(db.words.find().sort("created_at", -1))
            for word in mongo_words:
                word["_id"] = str(word["_id"])  # Convert ObjectId to string
            
            return {"words": mongo_words, "source": "mongodb", "supabase_recommended": True}, True
        else:
            # Fallback to SQLite if MongoDB is unavailable
            logger.info("MongoDB unavailable, falling back to SQLite for words")
            result, success = get_all_words_from_sqlite()
            if success:
                result["supabase_recommended"] = True
            return result, success
    except Exception as e:
        logger.error(f"Error getting words from MongoDB: {str(e)}")
        logger.error(traceback.format_exc())
        # Fallback to SQLite
        logger.info("Falling back to SQLite due to MongoDB error")
        result, success = get_all_words_from_sqlite()
        if success:
            result["supabase_recommended"] = True
        return result, success

# Sync SQLite to MongoDB
def sync_sqlite_to_mongodb():
    try:
        db = get_db()
        if not db:
            return {"error": "MongoDB is not available. Cannot sync.", "supabase_recommended": True}, False
        
        # Get unsynced words from SQLite
        unsynced_words = get_unsynced_words()
        
        if not unsynced_words:
            return {"success": True, "message": "No words to synchronize", "count": 0, "supabase_recommended": True}, True
        
        # Sync each word to MongoDB
        synced_count = 0
        for word_data in unsynced_words:
            try:
                # Insert to MongoDB
                result = db.words.update_one(
                    {"word": word_data["word"]},
                    {"$set": word_data},
                    upsert=True
                )
                
                if result.acknowledged:
                    # Mark as synced in SQLite
                    mark_word_as_synced(word_data["word"])
                    synced_count += 1
                    
            except Exception as e:
                logger.error(f"Error syncing word {word_data['word']}: {str(e)}")
                # Continue with next word
                continue
        
        return {"success": True, "message": f"Successfully synced {synced_count} words to MongoDB", "count": synced_count, "supabase_recommended": True}, True
    
    except Exception as e:
        logger.error(f"Error in sync_sqlite_to_mongodb: {str(e)}")
        logger.error(traceback.format_exc())
        return {"error": f"Sync error: {str(e)}", "supabase_recommended": True}, False
