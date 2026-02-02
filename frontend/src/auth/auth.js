import API from "../api/api";

export const signup = (data) => API.post("/auth/signup/request-otp", data);
export const login = (data) => API.post("/auth/login", data);
export const getMe = () => API.get("/me");
