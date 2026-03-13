"""
테마 자금 흐름 분석 서비스 - FastAPI 백엔드
실행: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI(
    title="테마 자금 흐름 분석 API",
    description="주식 시장에서 테마 단위로 자금 흐름을 분석하는 서비스",
    version="1.0.0"
)

# CORS 설정 (프론트엔드 개발서버 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite 개발서버
        "http://localhost:3000",   # CRA 개발서버
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(router)


@app.get("/")
async def root():
    return {
        "service": "테마 자금 흐름 분석 서비스",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}
