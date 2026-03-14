import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from api.routes import router
from api.admin_routes import router as admin_router
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="SectorFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# UptimeRobot HEAD 요청 허용
@app.head("/")
async def head_root():
    return Response(status_code=200)

@app.get("/")
async def root():
    return {"service": "SectorFlow API", "status": "ok"}

app.include_router(router)
app.include_router(admin_router)
