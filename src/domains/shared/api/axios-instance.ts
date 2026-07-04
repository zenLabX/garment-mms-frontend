import axios from "axios";

const TOKEN_KEY = "auth_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  timeout: 30_000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401：登入態已失效，清 token 並導回登入頁（不可只清 token 造成「假登入」）
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
