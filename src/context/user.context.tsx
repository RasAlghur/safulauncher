import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { saveUserLocally, useApiClient, type serverResponse } from "../lib/api";

interface UserContextType {
  user: serverResponse | null;
  saveOrFetchUser: (address: string) => void;
  updateUser: (userData: serverResponse) => void;
}

const UserContext = createContext<UserContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx)
    throw new Error("useTokenContext must be used within TokenProvider");
  return ctx;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<serverResponse | null>(null);

  useEffect(() => {
    const findUserLocally = async () => {
      const findUser = localStorage.getItem("safu_launcher");
      if (!findUser) return setUser(null);
      const user = JSON.parse(findUser);
      setUser(user);
    };

    findUserLocally();
  }, []);

  const saveOrFetchUser = useCallback(
    async (address: string) => {
      const abortController = new AbortController();
      const base = useApiClient();

      if (address === user?.wallet) return;
      try {
        const request = await base.post(
          "user",
          { wallet: address },
          {
            signal: abortController.signal,
          }
        );
        const response = await request.data.data;
        saveUserLocally(response);
        setUser(response);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Failed to save/fetch user:", error);
        }
      }

      return () => {
        // Cleanup function
        abortController.abort();
      };
    },
    [user?.wallet]
  );

  const updateUser = useCallback((userData: serverResponse) => {
    setUser(userData);
    saveUserLocally(userData);
  }, []);

  const value = useMemo(
    () => ({ user, saveOrFetchUser, updateUser }),
    [user, saveOrFetchUser, updateUser]
  );
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};