from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, List
from backend.database.neo4j import db
from pydantic import BaseModel

router = APIRouter(prefix="/projects", tags=["Projects"])

class CreateProjectRequest(BaseModel):
    title: str
    description: str
    domain: str
    skills: List[str]
    technologies: List[str]
    required_members: int
    creator_id: str

@router.get("/")
def get_projects(domain: Optional[str] = None, status: Optional[str] = None, user_id: Optional[str] = None):
    with db.driver.session() as session:
        cypher = """
        MATCH (p:Project)
        WHERE ($domain IS NULL OR EXISTS { MATCH (p)-[:IN_DOMAIN]->(:Domain {name: $domain}) })
          AND ($status IS NULL OR p.status = $status)
          
        RETURN p.id AS id,
               p.title AS title,
               p.description AS description,
               p.status AS status,
               toInteger(coalesce(p.required_members, p.req_members, 3)) AS required_members,
               [(p)<-[:CREATED]-(c:User) | c.id][0] AS creator_id,
               [(p)<-[:CREATED]-(c:User) | c.name][0] AS creator_name,
               [(p)-[:IN_DOMAIN]->(d:Domain) | d.name][0] AS domain,
               [(p)-[:REQUIRES_SKILL]->(s:Skill) | s.name] AS skills,
               [(p)-[:USES_TECH]->(t:Technology) | t.name] AS technologies,
               size([(p)<-[:JOINED]-(m:User) | m]) AS current_members,
               $user_id IS NOT NULL AND EXISTS { MATCH (:User {id: $user_id})-[:JOINED]->(p) } AS joined
        ORDER BY id ASC
        """
        result = session.run(cypher, domain=domain, status=status, user_id=user_id)
        
        projects = []
        for record in result:
            projects.append({
                "id": record["id"],
                "title": record["title"],
                "description": record["description"],
                "status": record["status"] or "Recruiting",
                "required_members": record["required_members"],
                "current_members": record["current_members"] or 0,
                "creator": {
                    "id": record["creator_id"],
                    "name": record["creator_name"]
                } if record["creator_id"] else None,
                "domain": record["domain"] or "Engineering",
                "skills": record["skills"] or [],
                "technologies": record["technologies"] or [],
                "joined": record["joined"]
            })
        return projects

@router.get("/search")
def search_projects(q: str = Query(...), user_id: Optional[str] = None):
    with db.driver.session() as session:
        cypher = """
        MATCH (p:Project)
        // Using CONTAINS for flexible partial matching
        WHERE EXISTS { MATCH (p)-[:REQUIRES_SKILL]->(s:Skill) WHERE toLower(s.name) CONTAINS toLower($q) }
           OR EXISTS { MATCH (p)-[:USES_TECH]->(t:Technology) WHERE toLower(t.name) CONTAINS toLower($q) }
           OR EXISTS { MATCH (p)-[:IN_DOMAIN]->(d:Domain) WHERE toLower(d.name) CONTAINS toLower($q) }
           OR toLower(p.title) CONTAINS toLower($q)

        RETURN p.id AS id,
               p.title AS title,
               p.description AS description,
               p.status AS status,
               toInteger(coalesce(p.required_members, p.req_members, 3)) AS required_members,
               [(p)<-[:CREATED]-(c:User) | c.id][0] AS creator_id,
               [(p)<-[:CREATED]-(c:User) | c.name][0] AS creator_name,
               [(p)-[:IN_DOMAIN]->(d:Domain) | d.name][0] AS domain,
               [(p)-[:REQUIRES_SKILL]->(s:Skill) | s.name] AS skills,
               [(p)-[:USES_TECH]->(t:Technology) | t.name] AS technologies,
               size([(p)<-[:JOINED]-(m:User) | m]) AS current_members,
               $user_id IS NOT NULL AND EXISTS { MATCH (:User {id: $user_id})-[:JOINED]->(p) } AS joined
        ORDER BY id ASC
        """
        result = session.run(cypher, q=q.strip(), user_id=user_id)
        
        projects = []
        for record in result:
            projects.append({
                "id": record["id"],
                "title": record["title"],
                "description": record["description"],
                "status": record["status"] or "Recruiting",
                "required_members": record["required_members"],
                "current_members": record["current_members"] or 0,
                "creator": {
                    "id": record["creator_id"],
                    "name": record["creator_name"]
                } if record["creator_id"] else None,
                "domain": record["domain"] or "Engineering",
                "skills": record["skills"] or [],
                "technologies": record["technologies"] or [],
                "joined": record["joined"]
            })
        return projects

@router.get("/{project_id}")
def get_project(project_id: str, user_id: Optional[str] = None):
    pid = project_id.strip()
    with db.driver.session() as session:
        cypher = """
        MATCH (p:Project {id: $pid})
        RETURN p.id AS id,
               p.title AS title,
               p.description AS description,
               p.status AS status,
               toInteger(coalesce(p.required_members, p.req_members, 3)) AS required_members,
               [(p)<-[:CREATED]-(c:User) | c.id][0] AS creator_id,
               [(p)<-[:CREATED]-(c:User) | c.name][0] AS creator_name,
               [(p)-[:IN_DOMAIN]->(d:Domain) | d.name][0] AS domain,
               [(p)-[:REQUIRES_SKILL]->(s:Skill) | s.name] AS skills,
               [(p)-[:USES_TECH]->(t:Technology) | t.name] AS technologies,
               size([(p)<-[:JOINED]-(m:User) | m]) AS current_members,
               [(p)<-[:JOINED]-(m:User) | {id: m.id, name: m.name, level: m.level}] AS members,
               $user_id IS NOT NULL AND EXISTS { MATCH (:User {id: $user_id})-[:JOINED]->(p) } AS joined
        """
        record = session.run(cypher, pid=pid, user_id=user_id).single()

        if not record or record["id"] is None:
            raise HTTPException(status_code=404, detail="Project not found")

        return {
            "id": record["id"],
            "title": record["title"],
            "description": record["description"],
            "status": record["status"] or "Recruiting",
            "required_members": record["required_members"],
            "current_members": record["current_members"] or 0,
            "creator": {
                "id": record["creator_id"],
                "name": record["creator_name"]
            } if record["creator_id"] else None,
            "domain": record["domain"] or "Engineering",
            "skills": record["skills"] or [],
            "technologies": record["technologies"] or [],
            "members": record["members"] or [],
            "joined": record["joined"]
        }
@router.get("/{project_id}/members")
def get_project_members(project_id: str):
    with db.driver.session() as session:
        cypher = """
        MATCH (p:Project {id: $project_id})<-[:JOINED]-(u:User)
        OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)
        RETURN u.id AS id, u.name AS name, u.level AS level, collect(DISTINCT s.name) AS skills
        """
        result = session.run(cypher, project_id=project_id)
        members = []
        for record in result:
            members.append({
                "id": record["id"],
                "name": record["name"],
                "level": record["level"] or "Fresher",
                "skills": [s for s in record["skills"] if s]
            })
        return members

@router.post("/{project_id}/join")
def join_project(project_id: str, user_id: str):
    pid = project_id.strip()
    uid = user_id.strip()

    with db.driver.session() as session:
        check_cypher = """
        MATCH (p:Project {id: $pid})
        MATCH (u:User {id: $uid})
        RETURN EXISTS { MATCH (u)-[:JOINED]->(p) } AS already_joined,
               size([(p)<-[:JOINED]-(m:User) | m]) AS current_members,
               toInteger(coalesce(p.required_members, p.req_members, 3)) AS required_members
        """
        res = session.run(check_cypher, pid=pid, uid=uid).single()

        if not res:
            raise HTTPException(status_code=404, detail="Project or User not found in database")
        if res["already_joined"]:
            raise HTTPException(status_code=400, detail="You have already joined this project")

        req_members = int(res["required_members"] or 3)
        curr_members = int(res["current_members"] or 0)
        if curr_members >= req_members:
            raise HTTPException(status_code=400, detail="Project team is already full")

        join_cypher = """
        MATCH (p:Project {id: $pid})
        MATCH (u:User {id: $uid})
        MERGE (u)-[:JOINED]->(p)
        WITH p
        WITH p, size([(p)<-[:JOINED]-(m:User) | m]) AS total_members,
             toInteger(coalesce(p.required_members, p.req_members, 3)) AS req
        SET p.status = CASE WHEN total_members >= req THEN 'Active' ELSE 'Recruiting' END
        RETURN p.id AS id, p.status AS status, total_members, req
        """
        updated = session.run(join_cypher, pid=pid, uid=uid).single()

        return {
            "message": "Successfully joined team!",
            "project_id": updated["id"],
            "status": updated["status"],
            "current_members": updated["total_members"],
            "required_members": updated["req"]
        }

@router.post("/{project_id}/leave")
def leave_project(project_id: str, user_id: str):
    pid = project_id.strip()
    uid = user_id.strip()

    with db.driver.session() as session:
        check_cypher = """
MATCH (p:Project {id: $pid})
MATCH (u:User {id: $uid})
RETURN EXISTS { MATCH (u)-[:JOINED]->(p) } AS is_joined,
       [(p)<-[:CREATED]-(c:User) | c.id][0] = $uid AS is_creator
"""
        res = session.run(check_cypher, pid=pid, uid=uid).single()

        if not res:
            raise HTTPException(status_code=404, detail="Project or User not found")
        if res["is_creator"]:
            raise HTTPException(status_code=400, detail="Project creators cannot leave their own project")
        if not res["is_joined"]:
            raise HTTPException(status_code=400, detail="You have not joined this project")

        leave_cypher = """
        MATCH (u:User {id: $uid})-[j:JOINED]->(p:Project {id: $pid})
        DELETE j
        WITH p
        WITH p, size([(p)<-[:JOINED]-(m:User) | m]) AS total_members,
             toInteger(coalesce(p.required_members, p.req_members, 3)) AS req
        SET p.status = CASE WHEN total_members >= req THEN 'Active' ELSE 'Recruiting' END
        RETURN p.id AS id, p.status AS status, total_members, req
        """
        updated = session.run(leave_cypher, pid=pid, uid=uid).single()

        return {
            "message": "You have left the project team.",
            "project_id": updated["id"],
            "status": updated["status"],
            "current_members": updated["total_members"],
            "required_members": updated["req"]
        }
@router.post("/")
def create_project(data: CreateProjectRequest):
    import uuid
    project_id = f"proj_{uuid.uuid4().hex[:8]}"

    with db.driver.session() as session:
        cypher = """
        MATCH (creator:User {id: $creator_id})
        MERGE (d:Domain {name: $domain})
        CREATE (p:Project {
            id: $project_id,
            title: $title,
            description: $description,
            status: 'Recruiting',
            required_members: $required_members
        })
        MERGE (creator)-[:CREATED]->(p)
        MERGE (p)-[:IN_DOMAIN]->(d)
        WITH p
        UNWIND $skills AS skill_name
        MERGE (s:Skill {name: skill_name})
        MERGE (p)-[:REQUIRES_SKILL]->(s)
        WITH p
        UNWIND $technologies AS tech_name
        MERGE (t:Technology {name: tech_name})
        MERGE (p)-[:USES_TECH]->(t)
        RETURN p.id AS id, p.title AS title, p.status AS status
        """
        result = session.run(
            cypher,
            project_id=project_id,
            creator_id=data.creator_id,
            domain=data.domain,
            title=data.title,
            description=data.description,
            required_members=data.required_members,
            skills=data.skills,
            technologies=data.technologies
        ).single()

        if not result:
            raise HTTPException(status_code=400, detail="Could not create project. Verify creator_id.")

        return {
            "id": result["id"],
            "title": result["title"],
            "status": result["status"],
            "message": "Project created successfully in CognoDB graph"
        }
