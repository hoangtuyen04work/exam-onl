// src/hooks/useStudentMonitoringWebSocket.ts
import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface StudentEvent {
  examSessionId: number;
  examSessionStudentId?: number; // Thêm để tracking chính xác student nào
  studentId?: number; // ID của student
  studentName?: string; // Tên của student
  event: 'WAITING' | 'ENTER' | 'LEAVE' | 'TAB_SWITCH' | 'SUBMIT' | 'FOCUS_LOST' | 'FOCUS_REGAINED' | 'DISCONNECTED' | 'RECONNECTED';
  timestamp?: string; // Thời gian event xảy ra
  deviceInfo?: string; // Thông tin thiết bị
}

export const useStudentMonitoringWebSocket = (
  examSessionId: number | null,
  token: string | null,
  isExamStarted: boolean,
  examSessionStudentId?: number | null, // Thêm param này
  studentInfo?: { id?: number; name?: string } // Thêm thông tin student
) => {
  const clientRef = useRef<Client | null>(null);
  const lastFocusState = useRef<boolean>(true);
  const isConnectedRef = useRef<boolean>(false);
  const serverPort = (import.meta.env.VITE_SERVER_PORT_EXPOSE as string | undefined)?.replace(/\/+$/, '') || '';

  // Lấy thông tin thiết bị
  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'Android';
    if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Mac/.test(ua)) return 'MacOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown';
  };

  const sendEvent = (event: StudentEvent['event']) => {
    // Kiểm tra kỹ trước khi gửi
    if (!clientRef.current?.connected) {
      console.warn('[WS] Cannot send event - not connected:', event);
      return;
    }
    
    if (!examSessionId) {
      console.warn('[WS] Cannot send event - no examSessionId:', event);
      return;
    }

    const eventData: StudentEvent = {
      examSessionId,
      event,
      timestamp: new Date().toISOString(),
      deviceInfo: getDeviceInfo(),
    };

    // Thêm examSessionStudentId nếu có
    if (examSessionStudentId) {
      eventData.examSessionStudentId = examSessionStudentId;
    }

    // Thêm thông tin student nếu có
    if (studentInfo?.id) {
      eventData.studentId = studentInfo.id;
    }
    if (studentInfo?.name) {
      eventData.studentName = studentInfo.name;
    }

    try {
      clientRef.current.publish({
        destination: '/app/student/event',
        body: JSON.stringify(eventData),
      });

      console.log('[WS] ✅ Sent event:', {
        event,
        examSessionId,
        examSessionStudentId,
        studentId: studentInfo?.id,
        timestamp: eventData.timestamp,
      });
    } catch (error) {
      console.error('[WS] ❌ Failed to send event:', error);
    }
  };

  useEffect(() => {
    // Kiểm tra các điều kiện cần thiết
    if (!token || !examSessionId || !isExamStarted) {
      console.log('[WS] Connection conditions not met:', {
        hasToken: !!token,
        hasExamSessionId: !!examSessionId,
        isExamStarted,
      });
      
      // Ngắt kết nối nếu chưa bắt đầu thi
      if (clientRef.current) {
        console.log('[WS] Disconnecting...');
        if (clientRef.current.connected) {
          sendEvent('LEAVE');
        }
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      return;
    }

    console.log('[WS] Initializing WebSocket connection...', {
      examSessionId,
      examSessionStudentId,
      studentId: studentInfo?.id,
      studentName: studentInfo?.name,
    });

    const client = new Client({
      webSocketFactory: () => {
        const socket = new SockJS(serverPort + '/ws');
        console.log('[WS] Creating SockJS connection to:', serverPort + '/ws');
        return socket;
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        // Chỉ log những message quan trọng
        if (str.includes('ERROR') || str.includes('CONNECTED') || str.includes('DISCONNECT')) {
          console.log('[WS Debug]', str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      console.log('✅ WebSocket giám sát đã kết nối');
      isConnectedRef.current = true;
      
      // Gửi ENTER ngay khi kết nối thành công
      setTimeout(() => {
        sendEvent('ENTER');
      }, 100); // Delay nhỏ để đảm bảo connection ổn định
    };

    client.onDisconnect = () => {
      console.warn('⚠️ WebSocket đã ngắt kết nối');
      isConnectedRef.current = false;
    };

    client.onStompError = (frame) => {
      console.error('❌ STOMP Error:', frame.headers['message'], frame.body);
      isConnectedRef.current = false;
    };

    client.onWebSocketClose = () => {
      console.warn('⚠️ WebSocket closed');
      isConnectedRef.current = false;
    };

    client.onWebSocketError = (error) => {
      console.error('❌ WebSocket error:', error);
      isConnectedRef.current = false;
    };

    // Xử lý reconnect
    client.beforeConnect = () => {
      console.log('[WS] Attempting to connect...');
    };

    try {
      client.activate();
      clientRef.current = client;
      console.log('[WS] Client activated');
    } catch (error) {
      console.error('[WS] Failed to activate client:', error);
    }

    return () => {
      console.log('[WS] Cleanup - disconnecting...');
      // Gửi LEAVE khi rời trang
      if (client.connected) {
        try {
          sendEvent('LEAVE');
          // Đợi một chút để event được gửi trước khi disconnect
          setTimeout(() => {
            client.deactivate();
          }, 200);
        } catch (error) {
          console.error('[WS] Error during cleanup:', error);
          client.deactivate();
        }
      } else {
        client.deactivate();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examSessionId, token, isExamStarted, examSessionStudentId, serverPort]);

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
      } else if (!lastFocusState.current) {
        sendEvent('FOCUS_REGAINED');
        lastFocusState.current = true;
        console.info('✅ Sinh viên đã quay lại trang thi');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExamStarted]);

  // Gửi DISCONNECTED khi thoát trang đột ngột
  useEffect(() => {
    if (!isExamStarted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      sendEvent('DISCONNECTED');
      // Hiển thị cảnh báo khi thoát
      e.preventDefault();
      // Note: returnValue is deprecated but still needed for some browsers
      const message = 'Bạn có chắc muốn thoát? Bài thi của bạn sẽ bị đánh dấu là thoát đột ngột.';
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExamStarted]);

  return { sendEvent };
};