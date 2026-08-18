from backend.database.neo4j import db

def seed_database():
    constraints = [
        """
        CREATE CONSTRAINT user_id IF NOT EXISTS
        FOR (u:User) REQUIRE u.id IS UNIQUE
        """,
        """
        CREATE CONSTRAINT project_id IF NOT EXISTS
        FOR (p:Project) REQUIRE p.id IS UNIQUE
        """,
        """
        CREATE CONSTRAINT skill_name IF NOT EXISTS
        FOR (s:Skill) REQUIRE s.name IS UNIQUE
        """,
        """
        CREATE CONSTRAINT domain_name IF NOT EXISTS
        FOR (d:Domain) REQUIRE d.name IS UNIQUE
        """,
        """
        CREATE CONSTRAINT technology_name IF NOT EXISTS
        FOR (t:Technology) REQUIRE t.name IS UNIQUE
        """,
    ]

    seed_query = """
    // Users
    MERGE (u1:User {id: "u1"})
    SET u1.name = "Arjun Rao", u1.level = "Experienced"
    MERGE (u2:User {id: "u2"})
    SET u2.name = "Meera Sharma", u2.level = "Intermediate"
    MERGE (u3:User {id: "u3"})
    SET u3.name = "Rohan Kumar", u3.level = "Beginner"
    MERGE (u4:User {id: "u4"})
    SET u4.name = "Priya Nair", u4.level = "Intermediate"

    // Domains
    MERGE (d1:Domain {name: "Artificial Intelligence"})
    MERGE (d2:Domain {name: "Computer Vision"})
    MERGE (d3:Domain {name: "Game Development"})
    MERGE (d4:Domain {name: "VLSI"})

    // Skills
    MERGE (s1:Skill {name: "Python"})
    MERGE (s2:Skill {name: "Machine Learning"})
    MERGE (s3:Skill {name: "Computer Vision"})
    MERGE (s4:Skill {name: "React"})
    MERGE (s5:Skill {name: "Digital Design"})
    MERGE (s6:Skill {name: "Verilog"})
    MERGE (s7:Skill {name: "Game Development"})

    // Technologies
    MERGE (t1:Technology {name: "YOLO"})
    MERGE (t2:Technology {name: "PyTorch"})
    MERGE (t3:Technology {name: "React"})
    MERGE (t4:Technology {name: "Verilog"})
    MERGE (t5:Technology {name: "Unity"})

    // Projects
    MERGE (p1:Project {id: "p1"})
    SET p1.title = "Smart Traffic Management System", p1.req_members = 3, p1.status = "Recruiting"
    MERGE (p2:Project {id: "p2"})
    SET p2.title = "Shadow Rift: 2D Tactical Arena", p2.req_members = 4, p2.status = "Recruiting"
    MERGE (p3:Project {id: "p3"})
    SET p3.title = "VLSI Thermal Map Predictor", p3.req_members = 2, p3.status = "Recruiting"

    // Relationships
    MERGE (u1)-[:CREATED]->(p1)
    MERGE (u2)-[:CREATED]->(p2)
    MERGE (u4)-[:CREATED]->(p3)

    MERGE (p1)-[:IN_DOMAIN]->(d2)
    MERGE (p2)-[:IN_DOMAIN]->(d3)
    MERGE (p3)-[:IN_DOMAIN]->(d4)

    MERGE (p1)-[:REQUIRES_SKILL]->(s1)
    MERGE (p1)-[:REQUIRES_SKILL]->(s2)
    MERGE (p1)-[:REQUIRES_SKILL]->(s3)
    MERGE (p2)-[:REQUIRES_SKILL]->(s4)
    MERGE (p2)-[:REQUIRES_SKILL]->(s7)
    MERGE (p3)-[:REQUIRES_SKILL]->(s1)
    MERGE (p3)-[:REQUIRES_SKILL]->(s5)
    MERGE (p3)-[:REQUIRES_SKILL]->(s6)

    MERGE (p1)-[:USES_TECH]->(t1)
    MERGE (p1)-[:USES_TECH]->(t2)
    MERGE (p2)-[:USES_TECH]->(t3)
    MERGE (p2)-[:USES_TECH]->(t5)
    MERGE (p3)-[:USES_TECH]->(t4)

    MERGE (u1)-[:HAS_SKILL]->(s1)
    MERGE (u1)-[:HAS_SKILL]->(s2)
    MERGE (u1)-[:HAS_SKILL]->(s3)
    MERGE (u2)-[:HAS_SKILL]->(s4)
    MERGE (u2)-[:HAS_SKILL]->(s7)
    MERGE (u3)-[:HAS_SKILL]->(s1)
    MERGE (u3)-[:HAS_SKILL]->(s6)
    MERGE (u4)-[:HAS_SKILL]->(s5)
    MERGE (u4)-[:HAS_SKILL]->(s6)

    MERGE (u1)-[:INTERESTED_IN]->(d2)
    MERGE (u2)-[:INTERESTED_IN]->(d3)
    MERGE (u3)-[:INTERESTED_IN]->(d1)
    MERGE (u4)-[:INTERESTED_IN]->(d4)
    """

    with db.driver.session() as session:
        for query in constraints:
            session.run(query)
        session.run(seed_query)

    print("Graph seed data created successfully.")

if __name__ == "__main__":
    seed_database()