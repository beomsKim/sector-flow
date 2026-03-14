from fastapi import APIRouter, Query, HTTPException
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from data.krx_fetcher import (
    calculate_theme_volume_today,
    calculate_theme_volume_range,
    detect_surge_themes,
    get_default_date,
)
from themes.mapper import get_theme_info

router = APIRouter(prefix="/api")

def format_volume(volume: int) -> str:
    if volume >= 1_000_000_000_000:
        return f"{volume / 1_000_000_000_000:.1f}조"
    elif volume >= 100_000_000:
        return f"{volume / 100_000_000:.0f}억"
    elif volume >= 10_000:
        return f"{volume / 10_000:.0f}만"
    return str(volume)

@router.get("/themes/today")
async def get_today_top_themes(
    market: str = Query("kr"),
    top: int = Query(20),
    date: str = Query(None)
):
    try:
        data, actual_date = calculate_theme_volume_today(date)
        top_themes = data[:top]
        for item in top_themes:
            item["total_volume_formatted"] = format_volume(item["total_volume"])
            # 섹터 평균 등락률 계산
            changes = [s.get("change_pct", 0) for s in item["stocks"] if s.get("change_pct") is not None]
            item["avg_change_pct"] = round(sum(changes) / len(changes), 2) if changes else 0
            for s in item["stocks"]:
                s["volume_formatted"] = format_volume(s["volume"])
        return {"market": market, "date": actual_date, "data": top_themes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/themes/surge")
async def get_surge_themes(
    threshold: float = Query(1.2),
    date: str = Query(None)
):
    try:
        data = detect_surge_themes(threshold_ratio=threshold, date=date)
        for item in data:
            item["today_volume_formatted"] = format_volume(item["today_volume"])
            item["yesterday_volume_formatted"] = format_volume(item["yesterday_volume"])
        return {"threshold": threshold, "date": date or get_default_date(), "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/themes/ranking")
async def get_theme_ranking(
    market: str = Query("kr"),
    date: str = Query(None)
):
    try:
        data, actual_date = calculate_theme_volume_today(date)
        for rank, item in enumerate(data, 1):
            item["rank"] = rank
            item["total_volume_formatted"] = format_volume(item["total_volume"])
            changes = [s.get("change_pct", 0) for s in item["stocks"] if s.get("change_pct") is not None]
            item["avg_change_pct"] = round(sum(changes) / len(changes), 2) if changes else 0
        return {"market": market, "date": actual_date, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/themes/{theme_name}/chart")
async def get_theme_chart(
    theme_name: str,
    weeks: int = Query(1),
    market: str = Query("kr"),
    date: str = Query(None)
):
    try:
        all_series = calculate_theme_volume_range(weeks, end_date=date)
        if theme_name not in all_series:
            raise HTTPException(status_code=404, detail=f"테마 '{theme_name}'를 찾을 수 없습니다")
        return {"theme": theme_name, "weeks": weeks, "series": all_series[theme_name]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/themes/{theme_name}/stocks")
async def get_theme_stocks(
    theme_name: str,
    sort: str = Query("volume"),   # volume | change | name
    order: str = Query("desc"),    # asc | desc
    date: str = Query(None)
):
    info = get_theme_info(theme_name)
    if not info:
        raise HTTPException(status_code=404, detail=f"테마 '{theme_name}'를 찾을 수 없습니다")

    # 오늘 데이터에서 해당 테마 종목 찾기
    try:
        data, actual_date = calculate_theme_volume_today(date)
        theme_data = next((d for d in data if d["theme"] == theme_name), None)
        stocks = theme_data["stocks"] if theme_data else []

        # 정렬
        reverse = (order == "desc")
        if sort == "volume":
            stocks = sorted(stocks, key=lambda x: x.get("volume", 0), reverse=reverse)
        elif sort == "change":
            stocks = sorted(stocks, key=lambda x: x.get("change_pct", 0), reverse=reverse)
        elif sort == "name":
            stocks = sorted(stocks, key=lambda x: x.get("name", ""), reverse=reverse)

        for s in stocks:
            s["volume_formatted"] = format_volume(s.get("volume", 0))

        changes = [s.get("change_pct", 0) for s in stocks if s.get("change_pct") is not None]
        avg_change = round(sum(changes) / len(changes), 2) if changes else 0

    except Exception:
        stocks = info.get("stocks", [])
        avg_change = 0
        actual_date = date or get_default_date()

    return {
        "theme": theme_name,
        "description": info.get("description", ""),
        "date": actual_date,
        "avg_change_pct": avg_change,
        "sort": sort,
        "order": order,
        "stocks": stocks
    }
