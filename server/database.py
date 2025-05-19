
import os
import traceback
import logging
from pymongo import MongoClient
from datetime import datetime
from server.config import Config
from server.sqlite_db import (
    add_word_to_sqlite, 
    get_all_words_from_sqlite,
    get_known_words_from_sqlite,
    get_unsynced_words,
    mark_word_as_synced,
    check_sqlite_status
)

logger = logging.getLogger(__name__)

# MongoDB connection setup
def get_mongo_client():
    try:
        # Try to get connection string directly
        mongo_uri = Config.MONGODB_STRING
        
        # If not available, try to build it using separate credentials
        if not mongo_uri:
            base_uri = Config.MONGODB_URI
            password = Config.MONGODB_PASSWORD
            
            # If we have a password, replace the placeholder in the URI
            if '<db_password>' in base_uri and password:
                mongo_uri = base_uri.replace('<db_password>', password)
            elif password:
                # Try to extract username and host from URI format
                logger.info("Building connection string from separate credentials")
                parts = base_uri.split('@')
                if len(parts) > 1:
                    user_part = parts[0].split('://')
                    if len(user_part) > 1:
                        protocol = user_part[0]
                        username = user_part[1].split(':')[0]
                        mongo_uri = f"{protocol}://{username}:{password}@{parts[1]}"
                else:
                    mongo_uri = base_uri
            else:
                mongo_uri = base_uri
                
        # Log connection attempt (redact password for security)
        safe_uri = mongo_uri.split('@')[-1] if '@' in mongo_uri else mongo_uri.replace("mongodb://", "")
        logger.info(f"Attempting MongoDB connection to: {safe_uri}")
        
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        # Test the connection
        client.admin.command('ping')
        logger.info("MongoDB connected successfully")
        return client
    except Exception as e:
        logger.error(f"MongoDB connection error: {str(e)}")
        logger.error(traceback.format_exc())
        return None

# Get MongoDB client
mongo_client = get_mongo_client()
mongo_available = mongo_client is not None

# ... keep existing code for get_db(), init_db()

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
    mongodb_available = mongo_client is not None
    sqlite_status = check_sqlite_status()
    sqlite_available = sqlite_status["status"] == "active"
    
    # If both databases are unavailable, return error
    if not mongodb_available and not sqlite_available:
        logger.critical("Both MongoDB and SQLite are unavailable. Cannot save word data.")
        return {"error": "All database connections failed. Word cannot be saved.", "storage": "none"}, False
    
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
                return {"success": True, "message": f"Word '{word}' added successfully to MongoDB", "storage": "mongodb"}, True
            else:
                return {"success": True, "message": f"Word '{word}' updated successfully in MongoDB", "storage": "mongodb"}, True
        else:
            # MongoDB is unavailable, fallback to SQLite
            logger.info(f"MongoDB unavailable, saving word '{word}' to SQLite")
            if sqlite_available:
                result, success = add_word_to_sqlite(word, meaning, word_type, context)
                
                if success:
                    result["storage"] = "sqlite"
                
                return result, success
            else:
                return {"error": "SQLite is also unavailable. Cannot save word.", "storage": "none"}, False
    except Exception as e:
        logger.error(f"Error saving word to MongoDB: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Fallback to SQLite
        if sqlite_available:
            logger.info(f"Falling back to SQLite for saving word '{word}'")
            result, success = add_word_to_sqlite(word, meaning, word_type, context)
            
            if success:
                result["storage"] = "sqlite"
            
            return result, success
        else:
            return {"error": f"Both MongoDB and SQLite failed: {str(e)}", "storage": "none"}, False

# ... keep existing code for get_all_words(), sync_sqlite_to_mongodb()

def get_mongodb_status():
    # Check MongoDB connection
    db_status = "connected" if mongo_client else "disconnected"
    mongodb_details = {}
    
    # Get connection details for debugging
    if mongo_client:
        try:
            # Get server info for additional details
            server_info = mongo_client.server_info()
            
            # Get connection string but mask sensitive parts
            conn_string = os.environ.get('STRING', 'Not configured')
            # Show only part of the connection string for security
            if conn_string != 'Not configured' and '@' in conn_string:
                # Mask the password in the connection string
                parts = conn_string.split('@')
                auth_part = parts[0].split('://')
                # Show only hostname, not credentials
                masked_string = f"{auth_part[0]}://***:***@{parts[1]}"
            else:
                masked_string = "mongodb://***:***@hostname"
                
            mongodb_details = {
                "version": server_info.get("version", "unknown"),
                "connection": "successful",
                "connection_string_preview": masked_string,
                "database": os.environ.get('STRING', 'Not configured').split('@')[1] if '@' in os.environ.get('STRING', '') else "localhost"
            }
        except Exception as e:
            mongodb_details = {
                "connection": "failed",
                "error": str(e),
                "connection_string_preview": "Could not retrieve connection string",
                "database": os.environ.get('STRING', 'Not configured').split('@')[1] if '@' in os.environ.get('STRING', '') else "localhost"
            }
    else:
        mongodb_details = {
            "connection": "failed",
            "error": "MongoDB client not initialized",
            "connection_string_preview": "No active connection",
            "database": os.environ.get('STRING', 'Not configured').split('@')[1] if '@' in os.environ.get('STRING', '') else "localhost"
        }
    
    # Add SQLite status
    sqlite_status_result = check_sqlite_status()
    sqlite_status = {
        "status": sqlite_status_result["status"],
        "error": sqlite_status_result.get("error"),
        "location": "server/vocabulary.db",
        "fallback_active": not bool(mongo_client) and sqlite_status_result["status"] == "active"
    }
    
    # Determine overall status
    overall_status = "ok"
    if not mongo_client and sqlite_status_result["status"] != "active":
        overall_status = "critical"  # Both databases unavailable
    elif not mongo_client or sqlite_status_result["status"] != "active":
        overall_status = "degraded"  # One database unavailable
        
    return {
        "status": overall_status,
        "message": f"Flask server is running, MongoDB is {db_status}, SQLite is {sqlite_status_result['status']}",
        "mongodb": mongodb_details,
        "sqlite": sqlite_status,
        "env_vars": {
            "has_string": "STRING" in os.environ,
            "has_password": "PASSWORD" in os.environ
        }
    }
