from fastapi import APIRouter, HTTPException
from backend.database.neo4j import db

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/")
def list_users():
    with db.driver.session() as session:
        cypher = """
        MATCH (u:User)
        OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)
        RETURN toString(coalesce(u.id, id(u))) AS id, u.name AS name, u.level AS level, collect(DISTINCT s.name) AS skills
        ORDER BY id ASC
        """
        result = session.run(cypher)
        users = []
        for r in result:
            users.append({
                "id": r["id"],
                "name": r["name"],
                "level": r["level"] or "Fresher",
                "skills": [s for s in r["skills"] if s]
            })
        return users

@router.get("/{user_id}")
def get_user_profile(user_id: str):
    with db.driver.session() as session:
        cypher = """
        MATCH (u:User) WHERE toString(coalesce(u.id, id(u))) = toString($user_id)
        OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)
        OPTIONAL MATCH (u)-[:INTERESTED_IN]->(d:Domain)
        OPTIONAL MATCH (u)-[:CREATED]->(cp:Project)
        OPTIONAL MATCH (u)-[:JOINED]->(jp:Project)
        RETURN toString(coalesce(u.id, id(u))) AS id,
               u.name AS name,
               u.email AS email,
               u.level AS level,
               collect(DISTINCT s.name) AS skills,
               collect(DISTINCT d.name) AS domains,
               collect(DISTINCT {id: toString(coalesce(cp.id, id(cp))), title: cp.title, status: cp.status}) AS created_projects,
               collect(DISTINCT {id: toString(coalesce(jp.id, id(jp))), title: jp.title, status: jp.status}) AS joined_projects
        """
        result = session.run(cypher, user_id=user_id)
        record = result.single()
        if not record or not record["id"]:
            raise HTTPException(status_code=404, detail="User not found")

        created = [p for p in record["created_projects"] if p.get("id")]
        joined = [p for p in record["joined_projects"] if p.get("id")]

        return {
            "id": record["id"],
            "name": record["name"],
            "email": record["email"] or f"{record['name'].replace(' ', '').lower()}@wexa.ai",
            "level": record["level"] or "Fresher Level 1",
            "skills": [s for s in record["skills"] if s],
            "domains": [d for d in record["domains"] if d],
            "created_projects": created,
            "joined_projects": joined
        }
