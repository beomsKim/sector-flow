"""
테마/섹터 관리 API
- GET  /api/admin/themes          전체 테마 목록
- POST /api/admin/themes          새 테마 추가
- PUT  /api/admin/themes/{name}   테마 수정
- DELETE /api/admin/themes/{name} 테마 삭제
- POST /api/admin/themes/{name}/stocks  종목 추가
- DELETE /api/admin/themes/{name}/stocks/{code}  종목 삭제
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import sys, os, json

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from themes.mapper import THEME_STOCK_MAP, get_merged_theme_map

router = APIRouter(prefix="/api/admin")

# ── 저장 경로 (mapper.py 옆에 custom_themes.json 저장)
CUSTOM_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "themes", "custom_themes.json")

def load_custom() -> dict:
    if os.path.exists(CUSTOM_FILE):
        try:
            with open(CUSTOM_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_custom(data: dict):
    with open(CUSTOM_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_all_themes() -> dict:
    """기본 테마 + 커스텀 테마 합산 (mapper의 get_merged_theme_map 사용)"""
    return get_merged_theme_map()

# ── 모델
class StockItem(BaseModel):
    code: str
    name: str

class ThemeCreate(BaseModel):
    name: str
    description: str = ""
    stocks: List[StockItem] = []

class ThemeUpdate(BaseModel):
    description: str = ""
    stocks: List[StockItem] = []

# ── 엔드포인트

@router.get("/themes")
async def list_themes():
    all_themes = get_all_themes()
    result = []
    for name, data in all_themes.items():
        result.append({
            "name": name,
            "description": data.get("description", ""),
            "stocks": data.get("stocks", []),
            "stock_count": len(data.get("stocks", [])),
            "is_custom": name in load_custom()
        })
    return {"themes": result, "total": len(result)}

@router.post("/themes")
async def create_theme(body: ThemeCreate):
    custom = load_custom()
    all_themes = get_all_themes()
    if body.name in all_themes:
        raise HTTPException(status_code=409, detail=f"테마 '{body.name}' 이미 존재합니다")
    custom[body.name] = {
        "description": body.description,
        "stocks": [s.dict() for s in body.stocks]
    }
    save_custom(custom)
    return {"ok": True, "name": body.name}

@router.put("/themes/{theme_name}")
async def update_theme(theme_name: str, body: ThemeUpdate):
    custom = load_custom()
    all_themes = get_all_themes()
    if theme_name not in all_themes:
        raise HTTPException(status_code=404, detail="테마를 찾을 수 없습니다")
    # 기본 테마도 커스텀으로 오버라이드 가능
    custom[theme_name] = {
        "description": body.description,
        "stocks": [s.dict() for s in body.stocks]
    }
    save_custom(custom)
    return {"ok": True}

@router.delete("/themes/{theme_name}")
async def delete_theme(theme_name: str):
    custom = load_custom()
    if theme_name not in custom:
        raise HTTPException(status_code=400, detail="기본 테마는 삭제할 수 없습니다 (커스텀 테마만 삭제 가능)")
    del custom[theme_name]
    save_custom(custom)
    return {"ok": True}

@router.post("/themes/{theme_name}/stocks")
async def add_stock(theme_name: str, stock: StockItem):
    custom = load_custom()
    all_themes = get_all_themes()
    if theme_name not in all_themes:
        raise HTTPException(status_code=404, detail="테마를 찾을 수 없습니다")
    theme_data = dict(all_themes[theme_name])
    stocks = list(theme_data.get("stocks", []))
    if any(s["code"] == stock.code for s in stocks):
        raise HTTPException(status_code=409, detail="이미 추가된 종목입니다")
    stocks.append(stock.dict())
    custom[theme_name] = {"description": theme_data.get("description",""), "stocks": stocks}
    save_custom(custom)
    return {"ok": True}

@router.delete("/themes/{theme_name}/stocks/{code}")
async def remove_stock(theme_name: str, code: str):
    custom = load_custom()
    all_themes = get_all_themes()
    if theme_name not in all_themes:
        raise HTTPException(status_code=404, detail="테마를 찾을 수 없습니다")
    theme_data = dict(all_themes[theme_name])
    stocks = [s for s in theme_data.get("stocks", []) if s["code"] != code]
    custom[theme_name] = {"description": theme_data.get("description",""), "stocks": stocks}
    save_custom(custom)
    return {"ok": True}
