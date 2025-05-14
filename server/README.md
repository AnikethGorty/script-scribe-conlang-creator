
# Vocabulary Training Backend

This is a Flask-based backend that supports the vocabulary training feature of the application.

## Setup Instructions

1. Install the required Python packages:
   ```
   pip install flask flask-cors nltk
   ```

2. Start the server:
   ```
   python backend.py
   ```

The server will run on http://localhost:5000 by default.

## API Endpoints

- **POST /parse-sentence**: Analyzes a sentence and returns unknown words
- **POST /submit-word**: Saves word definitions to the database
- **GET /get-words**: Retrieves all saved words

## Database

The application uses a SQLite database (`vocabulary.db`) that will be created automatically in the same directory as the script. No additional setup is required.
