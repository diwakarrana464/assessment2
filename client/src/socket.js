import { io } from "socket.io-client";

// Connect to backend URL
// autoConnect: false ensures we only connect when the user is actually logged in
export const socket = io("http://localhost:5000", {
  autoConnect: false,
  withCredentials: true // Important for session cookies
});