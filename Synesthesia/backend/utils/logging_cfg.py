import logging
import os

LOG_DIR=os.path.join(os.path.dirname(__file__),"logs")
os.makedirs(LOG_DIR,exist_ok=True)

LOG_FILE=os.path.join(LOG_DIR,"backend.log")
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",)

logger=logging.getLogger("EmailAgentBackend")
