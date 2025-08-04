import axios from "axios";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";


const networkInfo = useNetworkEnvironment();

export const base = axios.create({
  baseURL: networkInfo.apiBaseUrl || "",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

base.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    // Handle request errors
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

base.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        return Promise.reject(error);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

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


