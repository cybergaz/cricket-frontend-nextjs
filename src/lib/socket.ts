import { io } from "socket.io-client";

// Connect to the WebSocket server
const socket = io(process.env.NEXT_PUBLIC_BACKEND_SOCKET);

// Listen for initial match data
socket.on("initial_matches", (matches) => {
  console.log("Received initial matches:", matches);
  // Update your UI with the matches data
});

// Listen for match updates
socket.on("match_update", (matchData) => {
  console.log("Match update received:", matchData);
  // Update your UI with the new match data
});
