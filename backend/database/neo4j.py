from neo4j import GraphDatabase

from backend.config import (
    NEO4J_URI,
    NEO4J_USERNAME,
    NEO4J_PASSWORD,
)


class Neo4jConnection:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            NEO4J_URI,
            auth=(NEO4J_USERNAME, NEO4J_PASSWORD),
        )

    def close(self):
        self.driver.close()

    def verify_connection(self):
        with self.driver.session() as session:
            result = session.run(
                "RETURN 'WEXA Graph Database Connected' AS message"
            )
            return result.single()["message"]


db = Neo4jConnection()