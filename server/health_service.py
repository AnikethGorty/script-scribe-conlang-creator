
import os
import logging
from server.mongodb_client import mongo_client
from server.sqlite_db import check_sqlite_status

logger = logging.getLogger(__name__)

def get_mongodb_status():
    # Check MongoDB connection
    db_status = "connected" if mongo_client else "disconnected"
    mongodb_details = {}
    
    # Get connection details for debugging
    if mongo_client:
        try:
            # Get server info for additional details
            server_info = mongo_client.server_info()
            
            # Get connection string but mask sensitive parts
            conn_string = os.environ.get('STRING', 'Not configured')
            # Show only part of the connection string for security
            if conn_string != 'Not configured' and '@' in conn_string:
                # Mask the password in the connection string
                parts = conn_string.split('@')
                auth_part = parts[0].split('://')
                # Show only hostname, not credentials
                masked_string = f"{auth_part[0]}://***:***@{parts[1]}"
            else:
                masked_string = "mongodb://***:***@hostname"
                
            mongodb_details = {
                "version": server_info.get("version", "unknown"),
                "connection": "successful",
                "connection_string_preview": masked_string,
                "database": os.environ.get('STRING', 'Not configured').split('@')[1] if '@' in os.environ.get('STRING', '') else "localhost"
            }
        except Exception as e:
            mongodb_details = {
                "connection": "failed",
                "error": str(e),
                "connection_string_preview": "Could not retrieve connection string",
                "database": os.environ.get('STRING', 'Not configured').split('@')[1] if '@' in os.environ.get('STRING', '') else "localhost"
            }
    else:
        mongodb_details = {
            "connection": "failed",
            "error": "MongoDB client not initialized",
            "connection_string_preview": "No active connection",
            "database": os.environ.get('STRING', 'Not configured').split('@')[1] if '@' in os.environ.get('STRING', '') else "localhost"
        }
    
    # Add SQLite status
    sqlite_status_result = check_sqlite_status()
    sqlite_status = {
        "status": sqlite_status_result["status"],
        "error": sqlite_status_result.get("error"),
        "location": "server/vocabulary.db",
        "fallback_active": not bool(mongo_client) and sqlite_status_result["status"] == "active"
    }
    
    # Determine overall status
    overall_status = "ok"
    if not mongo_client and sqlite_status_result["status"] != "active":
        overall_status = "critical"  # Both databases unavailable
    elif not mongo_client or sqlite_status_result["status"] != "active":
        overall_status = "degraded"  # One database unavailable
        
    return {
        "status": overall_status,
        "message": f"Flask server is running, MongoDB is {db_status}, SQLite is {sqlite_status_result['status']}",
        "mongodb": mongodb_details,
        "sqlite": sqlite_status,
        "env_vars": {
            "has_string": "STRING" in os.environ,
            "has_password": "PASSWORD" in os.environ
        }
    }
