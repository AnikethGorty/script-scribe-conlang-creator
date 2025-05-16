
# This file is kept for backwards compatibility
# It now imports and runs the refactored application

from server.app import create_app

app = create_app()

if __name__ == '__main__':
    from server.config import Config
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)

