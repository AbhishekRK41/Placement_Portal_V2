// Base URL of the Flask backend
const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ppa_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("ppa_token");
      localStorage.removeItem("ppa_user");
      localStorage.removeItem("ppa_profile");
      if (window.location.hash !== "#/login") {
        window.location.hash = "#/login";
      }
    }
    return Promise.reject(error);
  }
);
