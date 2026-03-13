"""
API 라우터
- GET /api/themes/today          : 오늘 테마별 거래대금 TOP10
- GET /api/themes/ranking        : 전체 테마 랭킹
- GET /api/themes/{name}/stocks  : 테마별 종목 리스트
- GET /api/themes/{name}/chart   : 테마 거래대금 차트 데이터
- GET /api/themes/surge          : 거래대금 급증 테마
- GET /api/market                : 현재 마켓 선택 (kr / us)
"""

from fastapi import APIRouter, Query, HTTPException
from data.krx_fetcher import (
    calculate_theme_volume_today as kr_today,
    calculate_theme_volume_range as kr_range,
    detect_surge_themes as kr_surge,
    get_recent_trading_date,
)
from data.us_fetcher import (
    calculate_us_theme_volume_today as us_today,
    fetch_us_theme_timeseries as us_range,
)
from themes.mapper import THEME_STOCK_MAP, get_theme_info

router = APIRouter(prefix="/api")

# ───────────────────────────────────────────
# 공통 헬퍼
# ───────────────────────────────────────────

def format_volume(volume: int) -> str:
    """거래대금 가독성 포맷 (억 단위)"""
    if volume >= 1_0000_0000:
        return f"{volume / 1_0000_0000:.1f}억"
    elif volume >= 1_0000:
        return f"{volume / 1_0000:.0f}만"
    return str(volume)


# ───────────────────────────────────────────
# 한국 시장 엔드포인트
# ───────────────────────────────────────────

@router.get("/themes/today")
async def get_today_top_themes(
    market: str = Query("kr", description="kr 또는 us"),
    top: int = Query(10, description="상위 N개")
):
    """오늘 자금 유입 테마 TOP N"""
    try:
        if market == "us":
            data = us_today()
        else:
            data = kr_today()

        top_themes = data[:top]

        # 포맷 추가
        for item in top_themes:
            item["total_volume_formatted"] = format_volume(item["total_volume"])
            for s in item["stocks"]:
                s["volume_formatted"] = format_volume(s["volume"])

        return {
            "market": market,
            "date": get_recent_trading_date(),
            "data": top_themes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/themes/ranking")
async def get_theme_ranking(
    market: str = Query("kr", description="kr 또는 us")
):
    """전체 테마 거래대금 랭킹"""
    try:
        if market == "us":
            data = us_today()
        else:
            data = kr_today()

        for rank, item in enumerate(data, 1):
            item["rank"] = rank
            item["total_volume_formatted"] = format_volume(item["total_volume"])

        return {
            "market": market,
            "date": get_recent_trading_date(),
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/themes/{theme_name}/stocks")
async def get_theme_stocks(theme_name: str):
    """테마별 포함 종목 리스트"""
    info = get_theme_info(theme_name)
    if not info:
        raise HTTPException(status_code=404, detail=f"테마 '{theme_name}'를 찾을 수 없습니다")

    return {
        "theme": theme_name,
        "description": info.get("description", ""),
        "stocks": info.get("stocks", [])
    }


@router.get("/themes/{theme_name}/chart")
async def get_theme_chart(
    theme_name: str,
    weeks: int = Query(1, description="1, 4, 12"),
    market: str = Query("kr", description="kr 또는 us")
):
    """테마 자금 흐름 차트 데이터"""
    try:
        if market == "us":
            all_series = us_range(weeks)
        else:
            all_series = kr_range(weeks)

        if theme_name not in all_series:
            raise HTTPException(status_code=404, detail=f"테마 '{theme_name}'를 찾을 수 없습니다")

        series = all_series[theme_name]
        return {
            "theme": theme_name,
            "weeks": weeks,
            "market": market,
            "series": series
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/themes/surge")
async def get_surge_themes(
    threshold: float = Query(1.5, description="급증 기준 배율 (기본 1.5배)")
):
    """거래대금 급증 테마 감지 (한국 시장)"""
    try:
        data = kr_surge(threshold_ratio=threshold)
        for item in data:
            item["today_volume_formatted"] = format_volume(item["today_volume"])
            item["yesterday_volume_formatted"] = format_volume(item["yesterday_volume"])
        return {
            "threshold": threshold,
            "date": get_recent_trading_date(),
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/themes/chart/all")
async def get_all_themes_chart(
    weeks: int = Query(1, description="1, 4, 12"),
    market: str = Query("kr")
):
    """전체 테마 시계열 (차트 비교용)"""
    try:
        if market == "us":
            data = us_range(weeks)
        else:
            data = kr_range(weeks)
        return {"weeks": weeks, "market": market, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
