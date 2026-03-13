# 테마 → 종목 매핑 데이터
# 실제 서비스에서는 DB에서 관리하거나 외부 데이터소스 연동 권장
# 종목코드는 KRX 6자리 코드 기준

THEME_STOCK_MAP = {
    "반도체": {
        "description": "반도체 설계·제조·장비·소재 관련 종목",
        "stocks": [
            {"code": "005930", "name": "삼성전자"},
            {"code": "000660", "name": "SK하이닉스"},
            {"code": "035740", "name": "카카오"},  # 예시용 (실제론 반도체 종목으로 교체)
            {"code": "042700", "name": "한미반도체"},
            {"code": "091990", "name": "셀트리온헬스케어"},
            {"code": "357780", "name": "솔브레인"},
            {"code": "240810", "name": "원익IPS"},
            {"code": "104830", "name": "원익머트리얼즈"},
        ]
    },
    "2차전지": {
        "description": "배터리 셀·소재·장비 관련 종목",
        "stocks": [
            {"code": "373220", "name": "LG에너지솔루션"},
            {"code": "006400", "name": "삼성SDI"},
            {"code": "051910", "name": "LG화학"},
            {"code": "247540", "name": "에코프로비엠"},
            {"code": "086520", "name": "에코프로"},
            {"code": "068760", "name": "셀루메드"},
            {"code": "196170", "name": "알테오젠"},
            {"code": "278280", "name": "천보"},
        ]
    },
    "AI·소프트웨어": {
        "description": "인공지능·클라우드·SW 플랫폼 관련 종목",
        "stocks": [
            {"code": "035420", "name": "NAVER"},
            {"code": "035720", "name": "카카오"},
            {"code": "259960", "name": "크래프톤"},
            {"code": "036570", "name": "엔씨소프트"},
            {"code": "112040", "name": "위메이드"},
            {"code": "950130", "name": "엑스플러스"},
            {"code": "377300", "name": "카카오페이"},
            {"code": "293490", "name": "카카오게임즈"},
        ]
    },
    "바이오·헬스케어": {
        "description": "제약·바이오·의료기기 관련 종목",
        "stocks": [
            {"code": "068270", "name": "셀트리온"},
            {"code": "207940", "name": "삼성바이오로직스"},
            {"code": "128940", "name": "한미약품"},
            {"code": "326030", "name": "SK바이오팜"},
            {"code": "145020", "name": "휴젤"},
            {"code": "214450", "name": "파마리서치"},
            {"code": "183490", "name": "엔지켐생명과학"},
            {"code": "009420", "name": "한올바이오파마"},
        ]
    },
    "자동차·전기차": {
        "description": "완성차·부품·전기차 관련 종목",
        "stocks": [
            {"code": "005380", "name": "현대차"},
            {"code": "000270", "name": "기아"},
            {"code": "012330", "name": "현대모비스"},
            {"code": "011210", "name": "현대위아"},
            {"code": "161390", "name": "한국타이어앤테크놀로지"},
            {"code": "004770", "name": "써니전자"},
            {"code": "025900", "name": "동화기업"},
            {"code": "064350", "name": "현대로템"},
        ]
    },
    "방산·우주": {
        "description": "방위산업·항공우주 관련 종목",
        "stocks": [
            {"code": "012450", "name": "한화에어로스페이스"},
            {"code": "047810", "name": "한국항공우주"},
            {"code": "064550", "name": "한화시스템"},
            {"code": "010780", "name": "아이에스동서"},
            {"code": "042670", "name": "HD현대인프라코어"},
            {"code": "000880", "name": "한화"},
            {"code": "272210", "name": "한화에너지"},
            {"code": "105560", "name": "KB금융"},
        ]
    },
    "금융·핀테크": {
        "description": "은행·보험·증권·핀테크 관련 종목",
        "stocks": [
            {"code": "105560", "name": "KB금융"},
            {"code": "055550", "name": "신한지주"},
            {"code": "086790", "name": "하나금융지주"},
            {"code": "316140", "name": "우리금융지주"},
            {"code": "024110", "name": "기업은행"},
            {"code": "139480", "name": "이마트"},
            {"code": "377300", "name": "카카오페이"},
            {"code": "403550", "name": "쏘카"},
        ]
    },
    "엔터·콘텐츠": {
        "description": "엔터테인먼트·미디어·게임 관련 종목",
        "stocks": [
            {"code": "041510", "name": "에스엠"},
            {"code": "035900", "name": "JYP Ent."},
            {"code": "122870", "name": "YG엔터테인먼트"},
            {"code": "352820", "name": "하이브"},
            {"code": "036570", "name": "엔씨소프트"},
            {"code": "259960", "name": "크래프톤"},
            {"code": "112040", "name": "위메이드"},
            {"code": "293490", "name": "카카오게임즈"},
        ]
    },
    "신재생에너지": {
        "description": "태양광·풍력·수소·에너지 관련 종목",
        "stocks": [
            {"code": "010120", "name": "LS ELECTRIC"},
            {"code": "096770", "name": "SK이노베이션"},
            {"code": "267260", "name": "HD현대일렉트릭"},
            {"code": "298040", "name": "효성중공업"},
            {"code": "015260", "name": "유비쿼스"},
            {"code": "009830", "name": "한화솔루션"},
            {"code": "034220", "name": "LG디스플레이"},
            {"code": "285130", "name": "SK케미칼"},
        ]
    },
    "로봇·자동화": {
        "description": "산업용 로봇·자동화·스마트팩토리 관련 종목",
        "stocks": [
            {"code": "215600", "name": "신라젠"},
            {"code": "079550", "name": "LIG넥스원"},
            {"code": "090430", "name": "아모레퍼시픽"},
            {"code": "006360", "name": "GS건설"},
            {"code": "042700", "name": "한미반도체"},
            {"code": "238490", "name": "힘스"},
            {"code": "336570", "name": "원익피앤이"},
            {"code": "348210", "name": "넥스틴"},
        ]
    },
}


def get_all_themes():
    """전체 테마 목록 반환"""
    return list(THEME_STOCK_MAP.keys())


def get_stocks_by_theme(theme_name: str):
    """테마별 종목 리스트 반환"""
    theme = THEME_STOCK_MAP.get(theme_name)
    if not theme:
        return []
    return theme["stocks"]


def get_all_stock_codes():
    """전체 종목코드 중복 제거 후 반환"""
    codes = set()
    for theme_data in THEME_STOCK_MAP.values():
        for stock in theme_data["stocks"]:
            codes.add(stock["code"])
    return list(codes)


def get_theme_info(theme_name: str):
    """테마 상세 정보 반환"""
    return THEME_STOCK_MAP.get(theme_name, {})
