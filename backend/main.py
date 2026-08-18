from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NexusGraph API")

# Explicit ga GitHub Pages URL ni allow cheyyali
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://dhanunjayram2004.github.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from backend.routes.health import router as health_router
from backend.routes.projects import router as projects_router
from backend.routes.search import router as search_router
from backend.routes.users import router as users_router

app = FastAPI(title="WEXA Graph App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://dhanunjayram2004.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(projects_router)
app.include_router(search_router)
app.include_router(users_router)


@app.get("/")
def root():
    return {
        "message": "WEXA Graph App is running"
    }
