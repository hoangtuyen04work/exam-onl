// src/hooks/useStudentMonitoringWebSocket.ts
import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface StudentEvent {
  examSessionId: number;
  event: 'ENTER' | 'LEAVE' | 'TAB_SWITCH' | 'SUBMIT';
}

export const useStudentMonitoringWebSocket = (
  examSessionId: number | null,
  token: string | null,
  isExamStarted: boolean
) => {
  const clientRef = useRef<Client | null>(null);
  const baseURL = (import.meta.env.VITE_API_BASE_EXPOSE as string | undefined)?.replace(/\/+$/, '') || '';
  const serverPort = (import.meta.env.VITE_SERVER_PORT_EXPOSE as string | undefined)?.replace(/\/+$/, '') || '';


  const sendEvent = (event: StudentEvent['event']) => {
    if (!clientRef.current?.connected || !examSessionId) return;

    clientRef.current.publish({
      destination: '/app/student/event',
      body: JSON.stringify({
        examSessionId,
        event,
      } as StudentEvent),
    });

    console.log('[WS] Sent event:', event);
  };

  useEffect(() => {
    if (!token || !examSessionId || !isExamStarted) {
      // Ngắt kết nối nếu chưa bắt đầu thi
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(serverPort + '/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log('[WS Debug]', str);
      },
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      console.log('✅ WebSocket giám sát đã kết nối');
      // Gửi ENTER ngay khi kết nối thành công
      sendEvent('ENTER');
    };

    client.onStompError = (frame) => {
      console.error('STOMP Error:', frame);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      // Gửi LEAVE khi rời trang
      if (client.connected) {
        sendEvent('LEAVE');
      }
      client.deactivate();
    };
  }, [examSessionId, token, isExamStarted]);

  // Gửi TAB_SWITCH khi người dùng chuyển tab
  useEffect(() => {
    if (!isExamStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendEvent('TAB_SWITCH');
        console.warn('Cảnh báo: Sinh viên đã chuyển tab!');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isExamStarted]);

  // Gửi LEAVE khi thoát trang
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendEvent('LEAVE');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isExamStarted]);

  return { sendEvent };
};