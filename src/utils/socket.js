import { io } from "socket.io-client";
import { BACKEND_URL } from "./constants.js";

// Extract subpath (e.g., "/kranthi-elevators-crm") to prevent Nginx root path clashes
const url = new URL(BACKEND_URL);
const customPath = url.pathname === "/" ? "" : url.pathname;

// Connect to backend server
export const socket = io(url.origin, {
  autoConnect: true,
  path: `${customPath}/socket.io/`,
});
