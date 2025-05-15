
from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
import sqlite3
import os
import traceback
import logging

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

# Initialize SQLite database
def init_db():
    try:
        conn = sqlite3.connect('vocabulary.db')
        c = conn.cursor()
        c.execute('''
        CREATE TABLE IF NOT EXISTS words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT UNIQUE,
            meaning TEXT,
            type TEXT,
            context TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        logger.error(traceback.format_exc())

# Run database initialization
init_db()

# Get known words from the database
def get_known_words():
    try:
        conn = sqlite3.connect('vocabulary.db')
        c = conn.cursor()
        c.execute("SELECT word FROM words")
        known_words = [row[0] for row in c.fetchall()]
        conn.close()
        return known_words
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
        
        word = data['word']
        meaning = data.get('meaning', '')
        word_type = data.get('type', '')
        context = data.get('context', '')
        
        conn = sqlite3.connect('vocabulary.db')
        c = conn.cursor()
        
        try:
            c.execute(
                "INSERT INTO words (word, meaning, type, context) VALUES (?, ?, ?, ?)",
                (word, meaning, word_type, context)
            )
            conn.commit()
            return jsonify({"success": True, "message": f"Word '{word}' added successfully"})
        except sqlite3.IntegrityError:
            # Word already exists, update it instead
            c.execute(
                "UPDATE words SET meaning = ?, type = ?, context = ? WHERE word = ?",
                (meaning, word_type, context, word)
            )
            conn.commit()
            return jsonify({"success": True, "message": f"Word '{word}' updated successfully"})
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"Error in submit_word: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/get-words', methods=['GET'])
def get_words():
    try:
        conn = sqlite3.connect('vocabulary.db')
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM words ORDER BY created_at DESC")
        words = [dict(row) for row in c.fetchall()]
        conn.close()
        return jsonify({"words": words})
    except Exception as e:
        logger.error(f"Error in get_words: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use PORT from env, fallback to 5000 locally
    app.run(host='0.0.0.0', port=port, debug=True)  # Enable debug mode for development
