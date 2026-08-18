from fastapi import APIRouter, HTTPException, Query
from backend.database.neo4j import db

router = APIRouter(prefix="/search", tags=["Search & Recommendations"])

@router.get("/")
def search_projects(q: str = Query(..., min_length=1)):
    """Search across project titles, descriptions, skills, tech, and domains."""
    with db.driver.session() as session:
        cypher = """
        MATCH (p:Project)
        OPTIONAL MATCH (p)-[:IN_DOMAIN]->(d:Domain)
        OPTIONAL MATCH (p)-[:REQUIRES_SKILL]->(s:Skill)
        OPTIONAL MATCH (p)-[:USES_TECH]->(t:Technology)
        OPTIONAL MATCH (p)<-[:CREATED]-(creator:User)
        OPTIONAL MATCH (p)<-[:JOINED]-(member:User)
        WHERE toLower(p.title) CONTAINS toLower($q)
           OR toLower(p.description) CONTAINS toLower($q)
           OR toLower(d.name) CONTAINS toLower($q)
           OR toLower(s.name) CONTAINS toLower($q)
           OR toLower(t.name) CONTAINS toLower($q)
        RETURN p.id AS id,
               p.title AS title,
               p.description AS description,
               p.status AS status,
               p.required_members AS required_members,
               creator.name AS creator_name,
               d.name AS domain,
               collect(DISTINCT s.name) AS skills,
               collect(DISTINCT t.name) AS technologies,
               count(DISTINCT member) AS current_members
        ORDER BY p.id ASC
        """
        result = session.run(cypher, q=q)
        projects = []
        for record in result:
            projects.append({
                "id": record["id"],
                "title": record["title"],
                "description": record["description"],
                "status": record["status"] or "Recruiting",
                "required_members": record["required_members"] or 3,
                "current_members": record["current_members"] or 0,
                "creator_name": record["creator_name"],
                "domain": record["domain"],
                "skills": [s for s in record["skills"] if s],
                "technologies": [t for t in record["technologies"] if t]
            })
        return projects

@router.get("/recommendations/{user_id}")
def get_recommendations(user_id: str):
    with db.driver.session() as session:
        cypher = """
        MATCH (u:User {id: $user_id})
        OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(p:Project)
        OPTIONAL MATCH (u)-[:INTERESTED_IN]->(d:Domain)<-[:IN_DOMAIN]-(p:Project)
        WHERE NOT (u)-[:JOINED]->(p) AND NOT (u)-[:CREATED]->(p)
        WITH u, p,
             collect(DISTINCT s.name) AS matching_skills,
             collect(DISTINCT d.name) AS matching_domains
        WHERE p IS NOT NULL
        OPTIONAL MATCH (p)<-[:CREATED]-(creator:User)
        OPTIONAL MATCH (p)<-[:JOINED]-(member:User)
        OPTIONAL MATCH (p)-[:IN_DOMAIN]->(proj_domain:Domain)
        OPTIONAL MATCH (p)-[:REQUIRES_SKILL]->(req_skill:Skill)
        OPTIONAL MATCH (p)-[:USES_TECH]->(tech:Technology)
        WITH p, creator, proj_domain, matching_skills, matching_domains,
             collect(DISTINCT req_skill.name) AS all_skills,
             collect(DISTINCT tech.name) AS technologies,
             count(DISTINCT member) AS current_members,
             (size(matching_skills) * 3 + size(matching_domains) * 4) AS graph_score
        WHERE graph_score > 0 OR p.status = 'Recruiting'
        RETURN p.id AS id,
               p.title AS title,
               p.description AS description,
               p.status AS status,
               p.required_members AS required_members,
               current_members,
               creator.name AS creator_name,
               proj_domain.name AS domain,
               all_skills AS skills,
               technologies,
               matching_skills,
               matching_domains,
               graph_score
        ORDER BY graph_score DESC, p.status DESC
        """
        result = session.run(cypher, user_id=user_id)
        recs = []
        for record in result:
            m_skills = [s for s in record["matching_skills"] if s]
            m_domains = [d for d in record["matching_domains"] if d]
            
            reasons = []
            if m_skills:
                reasons.append(f"Matches your skill{'s' if len(m_skills) > 1 else ''}: {', '.join(m_skills)}")
            if m_domains:
                reasons.append(f"In your area of interest: {', '.join(m_domains)}")
            if not reasons:
                reasons.append("Actively recruiting freshers with matching foundation")

            recs.append({
                "id": record["id"],
                "title": record["title"],
                "description": record["description"],
                "status": record["status"] or "Recruiting",
                "required_members": record["required_members"] or 3,
                "current_members": record["current_members"] or 0,
                "creator_name": record["creator_name"],
                "domain": record["domain"],
                "skills": record["skills"],
                "technologies": record["technologies"],
                "matching_skills": m_skills,
                "matching_domains": m_domains,
                "graph_score": record["graph_score"],
                "match_reason": " • ".join(reasons)
            })
        return recs
