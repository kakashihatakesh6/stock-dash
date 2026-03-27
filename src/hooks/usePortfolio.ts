import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

export interface LiveQuote {
  symbol: string;
  cmp: number;
  change: number;
  changePct: string;
  prevClose: number | string;
  volume: string;
}

interface PortfolioResponse {
  success: boolean;
  data: LiveQuote[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function usePortfolio() {
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const isFirstLoad = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/portfolio`);
      setData(res.data);
      setError(null);
      setLastRefreshed(new Date());
    } catch {
      setError('Failed to fetch stock prices from server.');
    } finally {
      if (isFirstLoad.current) {
        setLoading(false);
        isFirstLoad.current = false;
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, lastRefreshed, refetch: fetchData };
}
