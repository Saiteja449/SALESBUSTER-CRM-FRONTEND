import { io } from "socket.io-client";
import { BACKEND_URL } from "./constants.js";

// Extract subpath to prevent Nginx root path clashes
const url = new URL(BACKEND_URL);
const customPath = url.pathname === "/" ? "" : url.pathname;

// Connect to backend server with authentication token
export const socket = io(url.origin, {
  autoConnect: true,
  path: `${customPath}/socket.io/`,
  // Skip HTTP long-polling and go straight to WebSocket.
  // This eliminates the polling upgrade handshake, reducing startup latency
  // and keeping all frames (including voice audio) on the raw WS channel.
  transports: ["websocket"],
  auth: (cb) => {
    const token =
      localStorage.getItem("salesbuster_token") ||
      localStorage.getItem("kranthi_token") ||
      localStorage.getItem("token");
    cb({ token: token || "" });
  },
});
