import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import SecureLS from "secure-ls";

import { host } from "../../../Api/host";

const ls = new SecureLS({ encodingType: "aes" });

const checkIsAdmin = (auth) => {
  const roleName = auth?.role?.roleName ?? auth?.role?.name ?? "";
  return String(roleName).toLowerCase() === "admin";
};

const getStoredAuthUser = () => {
  try {
    const userId = ls.get("id");
    const name = ls.get("name");
    const email = ls.get("email");

    return {
      id: Number.isFinite(Number(userId)) ? Number(userId) : undefined,
      name: typeof name === "string" ? name : undefined,
      email: typeof email === "string" ? email : undefined,
    };
  } catch {
    return {};
  }
};

const getUserLabel = (user) =>
  user?.name ||
  user?.fullName ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.email ||
  `Kullanıcı #${user?.id}`;

export default function useExpenseUsers() {
  const auth = useSelector((state) => state.Auth);
  const isAdmin = checkIsAdmin(auth);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const accessToken = auth?.accessToken;
  const storedAuthUser = getStoredAuthUser();
  const currentUserId =
    storedAuthUser.id ?? auth?.id ?? auth?.Id ?? undefined;
  const currentUserLabel =
    storedAuthUser.name ||
    storedAuthUser.email ||
    auth?.name ||
    auth?.fullName ||
    auth?.email ||
    (currentUserId ? `Kullanıcı #${currentUserId}` : undefined);
  const token = accessToken || localStorage.getItem("token");
  const axiosAuth = useMemo(
    () =>
      axios.create({
        baseURL: host,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    [token]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      // admin değilse user listesi endpoint'ine hiç gitme (worker-outsource/user'da 401/403 console kirletiyor)
      if (!isAdmin) {
        if (isMounted) {
          setUsers([]);
          setLoadingUsers(false);
        }
        return;
      }
      if (!token) {
        if (isMounted) {
          setUsers([]);
          setLoadingUsers(false);
        }
        return;
      }

      try {
        setLoadingUsers(true);
        const userResponse = await axiosAuth.get("/api/Users/getuserlist");
        const userData = userResponse?.data?.data || userResponse?.data || [];

        if (isMounted) {
          setUsers(Array.isArray(userData) ? userData : []);
        }
      } catch (error) {
        if (isMounted) {
          if (error?.response?.status === 403) {
            setUsers([]);
          } else {
            console.error("Kullanıcı listesi getirilemedi:", error);
            setUsers([]);
          }
        }
      } finally {
        if (isMounted) {
          setLoadingUsers(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [axiosAuth, token, isAdmin]);

  const userOptions = useMemo(
    () =>
      users
        .filter((user) => user?.id !== undefined && user?.id !== null)
        .map((user) => ({
          label: getUserLabel(user),
          value: user.id,
        })),
    [users]
  );

  const mergedUserOptions = useMemo(() => {
    if (!currentUserId || !currentUserLabel) {
      return userOptions;
    }

    const hasCurrentUser = userOptions.some(
      (userOption) => Number(userOption.value) === Number(currentUserId)
    );

    if (hasCurrentUser) {
      return userOptions;
    }

    return [
      {
        label: currentUserLabel,
        value: currentUserId,
      },
      ...userOptions,
    ];
  }, [currentUserId, currentUserLabel, userOptions]);

  return {
    currentUserId,
    loadingUsers,
    userOptions: mergedUserOptions,
    isAdmin,
  };
}
