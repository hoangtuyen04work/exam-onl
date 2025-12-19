// src/hooks/useStudentMonitoringWebSocket.ts
import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface StudentEvent {
  examSessionId: number;
  event: 'ENTER' | 'LEAVE' | 'TAB_SWITCH' | 'SUBMIT' | 'FOCUS_LOST' | 'FOCUS_REGAINED' | 'DISCONNECTED';
}

export const useStudentMonitoringWebSocket = (
  examSessionId: number | null,
  token: string | null,
  isExamStarted: boolean
) => {
  const clientRef = useRef<Client | null>(null);
  const lastFocusState = useRef<boolean>(true);
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

  // Gửi FOCUS_LOST/FOCUS_REGAINED khi người dùng chuyển tab hoặc mất focus
  useEffect(() => {
    if (!isExamStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (lastFocusState.current) {
          sendEvent('FOCUS_LOST');
          lastFocusState.current = false;
          console.warn('⚠️ Cảnh báo: Sinh viên đã rời khỏi trang thi!');
        }
      } else {
        if (!lastFocusState.current) {
          sendEvent('FOCUS_REGAINED');
          lastFocusState.current = true;
          console.info('✅ Sinh viên đã quay lại trang thi');
        }
      }
    };

    const handleBlur = () => {
      if (lastFocusState.current) {
        sendEvent('FOCUS_LOST');
        lastFocusState.current = false;
        console.warn('⚠️ Cảnh báo: Sinh viên đã chuyển tab/cửa sổ!');
      }
    };

    const handleFocus = () => {
      if (!lastFocusState.current) {
        sendEvent('FOCUS_REGAINED');
        lastFocusState.current = true;
        console.info('✅ Sinh viên đã quay lại trang thi');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isExamStarted]);

  // Gửi DISCONNECTED khi thoát trang đột ngột
  useEffect(() => {
    if (!isExamStarted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      sendEvent('DISCONNECTED');
      // Hiển thị cảnh báo khi thoát
      e.preventDefault();
      e.returnValue = 'Bạn có chắc muốn thoát? Bài thi của bạn sẽ bị đánh dấu là thoát đột ngột.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isExamStarted]);

  return { sendEvent };
};