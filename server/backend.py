
from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
import os
import traceback
import logging
from pymongo import MongoClient
from datetime import datetime
from bson.objectid import ObjectId

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Download necessary NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

app = Flask(__name__)
# Allow cross-origin requests from any origin for development
CORS(app, resources={r"/*": {"origins": "*"}})

# MongoDB connection setup
def get_mongo_client():
    try:
        # Try to get MongoDB URI from environment variable, otherwise use default
        mongo_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
        client = MongoClient(mongo_uri)
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
            logger.info("MongoDB collection already exists")
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

@app.route('/parse-sentence', methods=['POST'])
def parse_sentence():
    try:
        data = request.json
        if not data or 'sentence' not in data:
            return jsonify({"error": "No sentence provided"}), 400
        
        sentence = data['sentence']
        logger.debug(f"Parsing sentence: {sentence}")
        
        # Tokenize the sentence into words
        words = nltk.word_tokenize(sentence)
        # Clean up tokens (remove punctuation as separate tokens, lowercase)
        words = [word.lower() for word in words if word.isalnum()]
        logger.debug(f"Tokenized words: {words}")
        
        # Get known words
        known_words = get_known_words()
        logger.debug(f"Known words: {known_words}")
        
        # Find unknown words
        unknown_words = [word for word in words if word not in known_words]
        # Remove duplicates while preserving order
        unknown_words = list(dict.fromkeys(unknown_words))
        
        logger.debug(f"Unknown words: {unknown_words}")
        return jsonify({"unknown_words": unknown_words})
    except Exception as e:
        logger.error(f"Error in parse_sentence: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/submit-word', methods=['POST'])
def submit_word():
    try:
        data = request.json
        if not data or 'word' not in data:
            return jsonify({"error": "No word provided"}), 400
        
        db = get_db()
        if not db:
            return jsonify({"error": "Database connection failed"}), 500
        
        word = data['word']
        meaning = data.get('meaning', '')
        word_type = data.get('type', '')
        context = data.get('context', '')
        
        try:
            # Try to insert a new document
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
                return jsonify({"success": True, "message": f"Word '{word}' added successfully"})
            else:
                return jsonify({"success": True, "message": f"Word '{word}' updated successfully"})
        except Exception as e:
            logger.error(f"Error saving word: {str(e)}")
            return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Error in submit_word: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/get-words', methods=['GET'])
def get_words():
    try:
        db = get_db()
        if not db:
            return jsonify({"error": "Database connection failed"}), 500
            
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
                
        return jsonify({"words": words})
    except Exception as e:
        logger.error(f"Error in get_words: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    # Check MongoDB connection
    db_status = "connected" if mongo_client else "disconnected"
    return jsonify({
        "status": "ok" if mongo_client else "degraded",
        "message": f"Flask server is running, MongoDB is {db_status}"
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use PORT from env, fallback to 5000 locally
    app.run(host='0.0.0.0', port=port, debug=True)  # Enable debug mode for development
