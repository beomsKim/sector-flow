import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const api = axios.create({ baseURL: BASE_URL });

// ── 전역 로딩 카운터 (진행 중인 요청 수)
let _loadingCount = 0;
const _listeners = new Set();

function notifyListeners() {
  _listeners.forEach(fn => fn(_loadingCount > 0));
}

api.interceptors.request.use(config => {
  _loadingCount++;
  notifyListeners();
  return config;
});

api.interceptors.response.use(
  res => { _loadingCount = Math.max(0, _loadingCount - 1); notifyListeners(); return res; },
  err => { _loadingCount = Math.max(0, _loadingCount - 1); notifyListeners(); return Promise.reject(err); }
);

// 전역 로딩 상태 훅
export function useGlobalLoading() {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    _listeners.add(setLoading);
    return () => _listeners.delete(setLoading);
  }, []);
  return loading;
}

// 최근 거래일 계산 (프론트에서도 기본값으로 사용)
export function getDefaultDate() {
  const d = new Date();
  // 오전 9시 이전이거나 주말이면 전날로
  if (d.getHours() < 9) d.setDate(d.getDate() - 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
}

export function formatDateDisplay(yyyymmdd) {
  if (!yyyymmdd) return "";
  return `${yyyymmdd.slice(0,4)}-${yyyymmdd.slice(4,6)}-${yyyymmdd.slice(6,8)}`;
}

export function useTopThemes(market = "kr", top = 10, date = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actualDate, setActualDate] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { market, top };
      if (date) params.date = date;
      const res = await api.get("/api/themes/today", { params });
      setData(res.data.data || []);
      setActualDate(res.data.date);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [market, top, date]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, actualDate, refetch: fetch };
}

export function useThemeRanking(market = "kr", date = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { market };
      if (date) params.date = date;
      const res = await api.get("/api/themes/ranking", { params });
      setData(res.data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [market, date]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

export function useThemeChart(themeName, weeks = 1, market = "kr", date = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!themeName) return;
    setLoading(true);
    setError(null);
    try {
      const params = { weeks, market };
      if (date) params.date = date;
      const res = await api.get(`/api/themes/${encodeURIComponent(themeName)}/chart`, { params });
      setData(res.data.series || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [themeName, weeks, market, date]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

export function useSurgeThemes(threshold = 1.5, date = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { threshold };
      if (date) params.date = date;
      const res = await api.get("/api/themes/surge", { params });
      setData(res.data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [threshold, date]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
