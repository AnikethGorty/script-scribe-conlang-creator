
from flask import Flask
from flask_cors import CORS
from server.routes import register_routes
from server.config import Config

def create_app():
    app = Flask(__name__)
    # Allow cross-origin requests from any origin for development
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Register routes
    register_routes(app)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)

