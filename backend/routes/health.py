from fastapi import APIRouter

from backend.database.neo4j import db

router = APIRouter()


@router.get("/health")
def health_check():
    try:
        message = db.verify_connection()

        return {
            "status": "ok",
            "database": message,
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
        }