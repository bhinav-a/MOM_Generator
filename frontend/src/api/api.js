import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const deleteMom = (id) => {
  return API.delete(`/mom/${id}`);
};

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;

