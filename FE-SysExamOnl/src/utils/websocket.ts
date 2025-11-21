// src/utils/websocket.ts
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client: Client | null = null;

export const getStompClient = (): Client => {
  if (client) return client;

  const token = localStorage.getItem("authToken"); // Lấy token từ FE

  client = new Client({
    webSocketFactory: () =>
      new SockJS("http://localhost:8888/exam-online-system/ws"),

    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,

    debug: (msg) => console.log("[STOMP]", msg),
  });

  client.activate(); // ⭐ Quan trọng nhất
  return client;
};

export const disconnectStomp = () => {
  if (client) {
    client.deactivate();
  }
  client = null;
};
