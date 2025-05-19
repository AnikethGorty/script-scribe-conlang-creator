
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
mongo_available = mongo_client is not None

# Get MongoDB database
def get_db():
    if mongo_client:
        return mongo_client.vocabulary
    return None

# Initialize MongoDB database
def init_db():
    try:
        db = get_db()
        if db:
            # Create a collection for words
            if "words" not in db.list_collection_names():
                db.create_collection("words")
                db.words.create_index("word", unique=True)
                logger.info("MongoDB collection 'words' created with index")
            return True
        return False
    except Exception as e:
        logger.error(f"MongoDB initialization error: {str(e)}")
        logger.error(traceback.format_exc())
        return False
