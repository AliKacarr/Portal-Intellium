import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { host } from "../../../Api/host";

const getResponseList = (response) => {
  const raw = response?.data?.data ?? response?.data;
  return Array.isArray(raw) ? raw : [];
};

/**
 * GET /api/expense/currencies → { code, nameTr, symbol }
 * İlk seçenek TRY; liste API + TRY birleşimi.
 */
export default function useExpenseCurrencies() {
  const accessToken = useSelector((state) => state.Auth?.accessToken);
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!accessToken) {
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get(`${host}/api/expense/currencies`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 15000,
        });
        if (!cancelled) {
          setRaw(getResponseList(res));
        }
      } catch {
        if (!cancelled) {
          setRaw([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const { currencyOptions, allowedCodes } = useMemo(() => {
    const normalized = (raw || [])
      .map((row) => ({
        code: String(row.code || "")
          .trim()
          .toUpperCase(),
        nameTr: row.nameTr || row.name || row.code || "",
        symbol: row.symbol != null ? String(row.symbol) : "",
      }))
      .filter((row) => /^[A-Z]{3}$/.test(row.code));

    const byCode = new Map(normalized.map((row) => [row.code, row]));
    const tryFallback = {
      code: "TRY",
      nameTr: "Türk Lirası",
      symbol: "₺",
    };

    const tryRow = byCode.get("TRY") || tryFallback;
    const others = normalized
      .filter((row) => row.code !== "TRY")
      .sort((a, b) => a.code.localeCompare(b.code));

    const orderedRows = [tryRow, ...others];

    const options = orderedRows.map((row) => ({
      value: row.code,
      label: [row.symbol, row.nameTr].filter(Boolean).join(" ").trim() || row.code,
    }));

    return {
      currencyOptions: options,
      allowedCodes: new Set(options.map((o) => o.value)),
    };
  }, [raw]);

  return { currencyOptions, allowedCodes, loading };
}
