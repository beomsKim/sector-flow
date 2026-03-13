import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const api = axios.create({ baseURL: BASE_URL });

export function getDefaultDate() {
  const now = new Date();
  const hour = now.getHours();

  // 오후 4시 이전이면 전 거래일, 이후면 당일
  const base = new Date(now);
  if (hour < 16) {
    base.setDate(base.getDate() - 1);
  }

  // 주말이면 금요일로
  while (base.getDay() === 0 || base.getDay() === 6) {
    base.setDate(base.getDate() - 1);
  }

  return base.toISOString().slice(0, 10).replace(/-/g, "");
}

export function formatDateDisplay(yyyymmdd) {
  if (!yyyymmdd) return "";
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
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
    if (!themeName) { setLoading(false); return; }
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