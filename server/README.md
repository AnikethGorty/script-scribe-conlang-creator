
# Vocabulary Training Backend

This is a Flask-based backend that supports the vocabulary training feature of the application.

## Setup Instructions

1. Set up MongoDB:
   - Option 1: Use MongoDB Atlas (cloud-hosted)
     - Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
     - Set up a cluster and get your connection string
     - Update the `.env` file with your connection details
   
   - Option 2: Install MongoDB locally:
     - For macOS: `brew install mongodb-community`
     - For Windows: Download and install from [MongoDB website](https://www.mongodb.com/try/download/community)
     - For Linux: Follow the [MongoDB installation guide](https://docs.mongodb.com/manual/administration/install-on-linux/)
     - Start MongoDB locally: `mongod --dbpath=/data/db`

2. Configure environment variables:
   - Create a `.env` file in the server directory
   - Add your MongoDB connection string:
     ```
     MONGODB_URI=mongodb+srv://username:<db_password>@cluster.mongodb.net/?retryWrites=true&w=majority
     MONGODB_PASSWORD=your_actual_password
     ```

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

You can configure the application using environment variables:

- `MONGODB_URI`: MongoDB connection string
- `MONGODB_PASSWORD`: Password for MongoDB Atlas connection
- `PORT`: Port for the Flask server (default: 5000)

## API Endpoints

- **POST /parse-sentence**: Analyzes a sentence and returns unknown words
- **POST /submit-word**: Saves word definitions to the database
- **GET /get-words**: Retrieves all saved words
- **GET /health**: Checks the health of the server and database connection

## Database

The application uses MongoDB with a database named `vocabulary_db` and a collection named `words`. The connection will be created automatically when the application starts.
