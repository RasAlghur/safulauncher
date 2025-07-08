import { io } from "socket.io-client";

// Define your server URL. Use a different URL for production.
const URL =
  process.env.NODE_ENV === "production" ? import.meta.env.VITE_ABU : import.meta.env.VITE_ABU ;

export const socket = io(URL, {
  autoConnect: false, // Prevents automatic connection on load
});