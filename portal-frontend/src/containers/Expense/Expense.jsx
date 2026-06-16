import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import ExpenseAdmin from "./ExpenseAdmin";
import ExpenseWorker from "./ExpenseWorker";

const isAdminRole = (role) =>
  String(role ?? "").toLowerCase() === "admin";

const STORAGE_KEY = "expense:viewMode";

const safeGetStoredViewMode = () => {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "worker" || raw === "admin" ? raw : null;
  } catch {
    return null;
  }
};

const safeSetStoredViewMode = (mode) => {
  try {
    if (typeof window === "undefined") return;
    if (mode !== "worker" && mode !== "admin") return;
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
};

const Expense = () => {
  const userRole = useSelector((state) => state.Auth.role?.roleName);
  const [viewMode, setViewMode] = useState(() => {
    const admin = isAdminRole(userRole);
    if (!admin) return "worker";
    // Admin kullanıcı “Çalışan görünümü”ne geçtiyse refresh sonrası da orada kalsın.
    return safeGetStoredViewMode() ?? "admin";
  });

  useEffect(() => {
    // Admin değilse her zaman worker görünümü.
    // Admin ise, daha önce seçilen görünümü koru (localStorage).
    if (!isAdminRole(userRole)) {
      setViewMode("worker");
      return;
    }

    setViewMode((prev) => safeGetStoredViewMode() ?? prev ?? "admin");
  }, [userRole]);

  if (isAdminRole(userRole)) {
    return viewMode === "worker" ? (
      <ExpenseWorker
        onReturnToAdmin={() => {
          safeSetStoredViewMode("admin");
          setViewMode("admin");
        }}
      />
    ) : (
      <ExpenseAdmin
        onSwitchToWorker={() => {
          safeSetStoredViewMode("worker");
          setViewMode("worker");
        }}
      />
    );
  }

  return <ExpenseWorker />;
};

export default Expense;
