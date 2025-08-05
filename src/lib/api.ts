import axios, { type AxiosInstance } from "axios";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { useMemo } from "react";

export const useApiClient = (): AxiosInstance => {
  const { apiBaseUrl } = useNetworkEnvironment();

  return useMemo(() => {
    const client = axios.create({
      baseURL: apiBaseUrl,          // ← dynamic
      timeout: 10_000,
      headers: { "Content-Type": "application/json" },
    });

    client.interceptors.request.use(
      (cfg) => cfg,
      (err) => Promise.reject(err)
    );

    client.interceptors.response.use(
      (res) => res,
      (err) => Promise.reject(err)
    );

    return client;
  }, [apiBaseUrl]);
};

export interface serverResponse {
  id: string;
  wallet: string;
  username?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const saveUserLocally = (user: serverResponse) => {
  const saveUser = JSON.stringify(user);
  return localStorage.setItem("safu_launcher", saveUser);
};


