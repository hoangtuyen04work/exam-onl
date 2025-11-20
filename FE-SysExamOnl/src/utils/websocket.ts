// src/utils/websocket.ts
import { Client } from '@stomp/stompjs';
import SockJS from "sockjs-client";
let client: Client | null = null;

export const getStompClient = () => {
  if (client) return client;

  client = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8888/exam-online-system/ws"),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: (msg) => console.log("[STOMP]", msg),
  });

  client.activate();
  return client;
};
