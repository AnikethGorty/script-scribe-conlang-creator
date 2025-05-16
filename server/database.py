
import os
import traceback
import logging
from pymongo import MongoClient
from datetime import datetime
from server.config import Config

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

# Get database and collection
def get_db():
    if mongo_client:
        db = mongo_client['vocabulary_db']
        return db
    return None

# Initialize database
def init_db():
    try:
        db = get_db()
        if db and 'words' not in db.list_collection_names():
            # Create an index on the word field
            db.words.create_index('word', unique=True)
            logger.info("MongoDB initialized successfully")
        else:
            logger.info("MongoDB collection already exists or could not be created")
    except Exception as e:
        logger.error(f"MongoDB initialization error: {str(e)}")
        logger.error(traceback.format_exc())

# Run database initialization
if mongo_client:
    init_db()
else:
    logger.error("Failed to connect to MongoDB. Application may not function correctly.")

# Get known words from the database
def get_known_words():
    try:
        db = get_db()
        if db:
            known_words = [word['word'] for word in db.words.find({}, {'word': 1})]
            return known_words
        return []
    except Exception as e:
        logger.error(f"Error getting known words: {str(e)}")
        logger.error(traceback.format_exc())
        return []

# Word management functions
def add_word(word, meaning, word_type, context):
    try:
        db = get_db()
        if not db:
            return {"error": "Database connection failed"}, False
        
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
            return {"success": True, "message": f"Word '{word}' added successfully"}, True
        else:
            return {"success": True, "message": f"Word '{word}' updated successfully"}, True
    except Exception as e:
        logger.error(f"Error saving word: {str(e)}")
        return {"error": f"Database error: {str(e)}"}, False

def get_all_words():
    try:
        db = get_db()
        if not db:
            return {"error": "Database connection failed"}, False
            
        # Get all words and sort by created_at in descending order
        words = list(db.words.find().sort("created_at", -1))
        
        # Convert ObjectId to string for JSON serialization
        for word in words:
            word['_id'] = str(word['_id'])
            # Convert datetime objects to ISO format strings
            if 'created_at' in word:
                word['created_at'] = word['created_at'].isoformat()
            if 'updated_at' in word:
                word['updated_at'] = word['updated_at'].isoformat()
                
        return {"words": words}, True
    except Exception as e:
        logger.error(f"Error in get_words: {str(e)}")
        logger.error(traceback.format_exc())
        return {"error": f"Server error: {str(e)}"}, False

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
    
    return {
        "status": "ok" if mongo_client else "degraded",
        "message": f"Flask server is running, MongoDB is {db_status}",
        "mongodb": mongodb_details,
        "env_vars": {
            "has_string": "STRING" in os.environ,
            "has_password": "PASSWORD" in os.environ
        }
    }

