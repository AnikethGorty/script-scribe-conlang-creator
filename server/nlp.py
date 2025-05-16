
import nltk
import logging
import traceback

logger = logging.getLogger(__name__)

# Download necessary NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

def tokenize_sentence(sentence):
    try:
        # Tokenize the sentence into words
        words = nltk.word_tokenize(sentence)
        # Clean up tokens (remove punctuation as separate tokens, lowercase)
        words = [word.lower() for word in words if word.isalnum()]
        logger.debug(f"Tokenized words: {words}")
        return words
    except Exception as e:
        logger.error(f"Error tokenizing sentence: {str(e)}")
        logger.error(traceback.format_exc())
        return []

