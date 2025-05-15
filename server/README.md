
# Vocabulary Training Backend

This is a Flask-based backend that supports the vocabulary training feature of the application.

## Setup Instructions

1. Install MongoDB:
   - For macOS: `brew install mongodb-community`
   - For Windows: Download and install from [MongoDB website](https://www.mongodb.com/try/download/community)
   - For Linux: Follow the [MongoDB installation guide](https://docs.mongodb.com/manual/administration/install-on-linux/)

2. Start MongoDB:
   - For macOS/Linux: `mongod --dbpath=/data/db`
   - For Windows: Run MongoDB as a service or use MongoDB Compass

3. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```

4. Start the server:
   ```
   python backend.py
   ```

The server will run on http://localhost:5000 by default.

## Environment Variables

You can configure the MongoDB connection using environment variables:

- `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/`)
- `PORT`: Port for the Flask server (default: 5000)

## API Endpoints

- **POST /parse-sentence**: Analyzes a sentence and returns unknown words
- **POST /submit-word**: Saves word definitions to the database
- **GET /get-words**: Retrieves all saved words

## Database

The application uses MongoDB with a database named `vocabulary_db` and a collection named `words`. The connection will be created automatically when the application starts.
