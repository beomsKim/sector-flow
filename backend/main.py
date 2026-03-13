from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5173",
#         "https://your-vercel-app.vercel.app",  # Vercel 도메인
#         "*"  # 개발 중엔 임시로
#     ],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

app.include_router(router)
app.include_router(admin_router)

@app.get("/")
async def root():
    return {"service": "SectorFlow API", "status": "ok"}
