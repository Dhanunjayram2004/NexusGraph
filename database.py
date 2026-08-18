import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

URI = os.getenv("NEO4J_URI")
USERNAME = os.getenv("NEO4J_USERNAME")
PASSWORD = os.getenv("NEO4J_PASSWORD")

driver = GraphDatabase.driver(
    URI,
    auth=(USERNAME, PASSWORD)
)

def test_connection():
    with driver.session() as session:
        result = session.run("RETURN 'CognoDB connected!' AS message")
        return result.single()["message"]


if __name__ == "__main__":
    print(test_connection())
    