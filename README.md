# 🕸️ NexusGraph: Collaboration & Resource Network

![Python](https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688?style=for-the-badge&logo=fastapi)
![Neo4j](https://img.shields.io/badge/Neo4j-Driver-418EA4?style=for-the-badge&logo=neo4j)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react)

A full-stack web application backed by **CognoDB**, designed to demonstrate the power of graph databases in uncovering complex relationships and multi-hop data traversals. 

This repository was created as a submission for the Wexa AI Graph Database Application assignment.

> **Live Demo:** https://dhanunjayram2004.github.io/NexusGraph/

---

## 🎯 The Use Case: Team & Project Resource Routing

NexusGraph models the complex relationships between engineering personnel, software projects, and technical skills. The application efficiently identifies hidden collaboration opportunities, finds resource bottlenecks (e.g., a critical skill concentrated in only one overloaded user), and recommends the best developers for new projects based on their indirect network connections.

### Why a Graph Database?
In a traditional relational database, querying deep, multi-layered relationships—such as finding "Developers who have worked on past projects with User A, who also possess Skill B, and are currently assigned to fewer than 2 active projects"—requires expensive, computationally heavy, and slow SQL `JOIN` operations. 

A graph database treats relationships as first-class entities. By using **CognoDB** and openCypher, we can perform complex multi-hop traversals naturally and efficiently. This allows the application to instantly find indirect connections and patterns that would be highly unperformant and difficult to maintain in a standard relational schema.

## 📊 Graph Data Model

![Data Model Diagram](./docs/model_diagram.png) 
*(Evaluator Note: The diagram above illustrates our labeled nodes, typed relationships, and properties.)*

*   **Nodes:** 
    *   `User` (Properties: id, name)
    *   `Project` (Properties: id, name, status)
    *   `Skill` (Properties: id, name)
*   **Relationships:** 
    *   `(User)-[:WORKS_ON]->(Project)`
    *   `(Project)-[:REQUIRES_SKILL]->(Skill)`
    *   `(User)-[:HAS_SKILL]->(Skill)`

## 🧠 Key Cypher Queries

### 1. Multi-hop Traversal: The "Colleague of a Colleague" Finder
This query finds indirect professional connections. It traverses **two hops** to find developers who have not worked with a specific user directly, but share a mutual former teammate, making them great culture-fit candidates for future projects.
```cypher
MATCH (target:User {id: $user_id})-[:WORKS_ON]->(:Project)<-[:WORKS_ON]-(mutual:User)-[:WORKS_ON]->(:Project)<-[:WORKS_ON]-(recommendation:User)
WHERE target <> recommendation 
  AND NOT (target)-[:WORKS_ON]->(:Project)<-[:WORKS_ON]-(recommendation)
RETURN recommendation.name AS recommended_colleague, count(mutual) as shared_connections
ORDER BY shared_connections DESC
LIMIT 5
