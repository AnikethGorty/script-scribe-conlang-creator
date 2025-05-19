
# This file now just re-exports functions from the more specialized modules
from server.mongodb_client import (
    get_mongo_client,
    get_db,
    init_db,
    mongo_client,
    mongo_available
)

from server.word_repository import (
    get_known_words,
    add_word,
    get_all_words,
    sync_sqlite_to_mongodb
)

from server.health_service import get_mongodb_status

# Initialize MongoDB when this module is imported
init_db()
