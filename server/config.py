
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Print MongoDB connection string for debugging
print("MongoDB STRING:", os.getenv("STRING"))

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class Config:
    PORT = int(os.environ.get('PORT', 5000))
    DEBUG = True
    MONGODB_STRING = os.environ.get('STRING')
    MONGODB_PASSWORD = os.environ.get('PASSWORD')
    MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')

