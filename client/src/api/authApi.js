import axios from "axios";

// Talks to the Next.js BFF routes (src/app/api/auth/*), which set/clear the cookies
export const authApi = axios.create({
    baseURL: "/api/auth",
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});
