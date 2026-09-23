import { io } from "socket.io-client";
import { BACKEND_URL } from "./constants.js";

// Extract subpath to prevent Nginx root path clashes
const url = new URL(BACKEND_URL);
const customPath = url.pathname === "/" ? "" : url.pathname;

// Connect to backend server with authentication token
export const socket = io(url.origin, {
  autoConnect: true,
  path: `${customPath}/socket.io/`,
  auth: (cb) => {
    const token =
      localStorage.getItem("salesbuster_token") ||
      localStorage.getItem("kranthi_token") ||
      localStorage.getItem("token");
    cb({ token: token || "" });
  },
});
