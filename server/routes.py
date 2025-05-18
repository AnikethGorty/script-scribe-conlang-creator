
from flask import request, jsonify
import logging
import traceback
from server.database import get_known_words, add_word, get_all_words, get_mongodb_status, sync_sqlite_to_mongodb
from server.nlp import tokenize_sentence

logger = logging.getLogger(__name__)

def register_routes(app):
    @app.route('/parse-sentence', methods=['POST'])
    def parse_sentence():
        try:
            data = request.json
            if not data or 'sentence' not in data:
                return jsonify({"error": "No sentence provided"}), 400
            
            sentence = data['sentence']
            logger.debug(f"Parsing sentence: {sentence}")
            
            # Tokenize the sentence
            words = tokenize_sentence(sentence)
            
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
            
            result, success = add_word(word, meaning, word_type, context)
            
            if success:
                return jsonify(result)
            else:
                return jsonify(result), 500
        except Exception as e:
            logger.error(f"Error in submit_word: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({"error": f"Server error: {str(e)}"}), 500

    @app.route('/get-words', methods=['GET'])
    def get_words():
        result, success = get_all_words()
        
        if success:
            return jsonify(result)
        else:
            return jsonify(result), 500

    @app.route('/sync-to-mongodb', methods=['POST'])
    def sync_to_mongodb():
        """Endpoint to manually trigger synchronization from SQLite to MongoDB"""
        result, success = sync_sqlite_to_mongodb()
        
        if success:
            return jsonify(result)
        else:
            return jsonify(result), 500

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify(get_mongodb_status()), 200
