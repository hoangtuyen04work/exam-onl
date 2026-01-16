// src/hooks/useStudentMonitoringWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export type EventType = 'WAITING' | 'ENTER' | 'LEAVE' | 'TAB_SWITCH' | 'SUBMIT' | 'FOCUS_LOST' | 'FOCUS_REGAINED' | 'DISCONNECTED' | 'RECONNECTED' | 'FULLSCREEN_EXIT' | 'WINDOW_RESIZE';

interface StudentEvent {
  examSessionId: number;
  examSessionStudentId?: number;
  studentId?: number;
  studentName?: string;
  event: EventType;
  timestamp?: string;
  deviceInfo?: string;
  additionalInfo?: string;
}

interface UseStudentMonitoringOptions {
  enableAutoFocusTracking?: boolean; // Cho phép component cha tắt focus tracking tự động
}

export const useStudentMonitoringWebSocket = (
  examSessionId: number | null,
  token: string | null,
  isExamStarted: boolean,
  examSessionStudentId?: number | null,
  studentInfo?: { id?: number; name?: string },
  options: UseStudentMonitoringOptions = {}
) => {
  const { enableAutoFocusTracking = true } = options;
  
  const clientRef = useRef<Client | null>(null);
  const lastFocusState = useRef<boolean>(true);
  const isConnectedRef = useRef<boolean>(false);
  const pendingEventsRef = useRef<EventType[]>([]);
  const lastEventTimeRef = useRef<Record<string, number>>({});
  const isFirstConnectRef = useRef<boolean>(true);
  const serverPort = (import.meta.env.VITE_SERVER_PORT_EXPOSE as string | undefined)?.replace(/\/+$/, '') || '';

  // Store refs để có thể access trong callbacks
  const examSessionIdRef = useRef(examSessionId);
  const examSessionStudentIdRef = useRef(examSessionStudentId);
  const studentInfoRef = useRef(studentInfo);
  const isExamStartedRef = useRef(isExamStarted);

  // Update refs khi props thay đổi
  useEffect(() => {
    examSessionIdRef.current = examSessionId;
    examSessionStudentIdRef.current = examSessionStudentId;
    studentInfoRef.current = studentInfo;
    isExamStartedRef.current = isExamStarted;
  }, [examSessionId, examSessionStudentId, studentInfo, isExamStarted]);

  // Lấy thông tin thiết bị chi tiết
  const getDeviceInfo = useCallback(() => {
    const ua = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
    
    let device = 'Unknown';
    if (/android/i.test(ua)) device = isMobile && !isTablet ? 'Android Mobile' : 'Android Tablet';
    else if (/iPad/.test(ua)) device = 'iPad';
    else if (/iPhone|iPod/.test(ua)) device = 'iPhone';
    else if (/Windows/.test(ua)) device = 'Windows';
    else if (/Mac/.test(ua)) device = 'MacOS';
    else if (/Linux/.test(ua)) device = 'Linux';
    
    return `${device} (${window.innerWidth}x${window.innerHeight})`;
  }, []);

  // Gửi event với debounce và retry logic
  const sendEvent = useCallback((event: EventType, additionalInfo?: string) => {
    const currentExamSessionId = examSessionIdRef.current;
    const currentExamSessionStudentId = examSessionStudentIdRef.current;
    const currentStudentInfo = studentInfoRef.current;

    if (!currentExamSessionId) {
      console.warn('[WS] Cannot send event - no examSessionId:', event);
      return;
    }

    // Debounce: Tránh gửi cùng loại event quá nhiều lần trong 1 giây
    const now = Date.now();
    const lastTime = lastEventTimeRef.current[event] || 0;
    if (now - lastTime < 1000 && ['FOCUS_LOST', 'FOCUS_REGAINED', 'WINDOW_RESIZE'].includes(event)) {
      console.log(`[WS] Event ${event} debounced (${now - lastTime}ms since last)`);
      return;
    }
    lastEventTimeRef.current[event] = now;

    const eventData: StudentEvent = {
      examSessionId: currentExamSessionId,
      event,
      timestamp: new Date().toISOString(),
      deviceInfo: getDeviceInfo(),
    };

    if (currentExamSessionStudentId) {
      eventData.examSessionStudentId = currentExamSessionStudentId;
    }
    if (currentStudentInfo?.id) {
      eventData.studentId = currentStudentInfo.id;
    }
    if (currentStudentInfo?.name) {
      eventData.studentName = currentStudentInfo.name;
    }
    if (additionalInfo) {
      eventData.additionalInfo = additionalInfo;
    }

    // Nếu chưa connected, queue lại event quan trọng
    if (!clientRef.current?.connected) {
      if (['ENTER', 'LEAVE', 'SUBMIT', 'DISCONNECTED'].includes(event)) {
        pendingEventsRef.current.push(event);
        console.warn('[WS] Event queued (not connected):', event);
      } else {
        console.warn('[WS] Cannot send event - not connected:', event);
      }
      return;
    }

    try {
      clientRef.current.publish({
        destination: '/app/student/event',
        body: JSON.stringify(eventData),
      });

      console.log('[WS] ✅ Sent event:', {
        event,
        examSessionId: currentExamSessionId,
        examSessionStudentId: currentExamSessionStudentId,
        studentId: currentStudentInfo?.id,
        timestamp: eventData.timestamp,
      });
    } catch (error) {
      console.error('[WS] ❌ Failed to send event:', error);
      // Queue lại event quan trọng để retry
      if (['LEAVE', 'SUBMIT', 'DISCONNECTED'].includes(event)) {
        pendingEventsRef.current.push(event);
      }
    }
  }, [getDeviceInfo]);

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
      
      // Gửi ENTER hoặc RECONNECTED tùy theo lần connect
      setTimeout(() => {
        if (isFirstConnectRef.current) {
          sendEvent('ENTER');
          isFirstConnectRef.current = false;
        } else {
          sendEvent('RECONNECTED');
        }
        
        // Flush pending events
        if (pendingEventsRef.current.length > 0) {
          console.log('[WS] Flushing pending events:', pendingEventsRef.current);
          const events = [...pendingEventsRef.current];
          pendingEventsRef.current = [];
          events.forEach(e => {
            if (e !== 'ENTER') sendEvent(e);
          });
        }
      }, 100);
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
          // Gửi LEAVE event trực tiếp qua client instance thay vì sendEvent
          // để tránh vấn đề với ref không được cập nhật
          const currentExamSessionId = examSessionIdRef.current;
          const currentExamSessionStudentId = examSessionStudentIdRef.current;
          const currentStudentInfo = studentInfoRef.current;
          
          if (currentExamSessionId) {
            const leaveEventData = {
              examSessionId: currentExamSessionId,
              event: 'LEAVE',
              timestamp: new Date().toISOString(),
              deviceInfo: `Cleanup disconnect`,
              examSessionStudentId: currentExamSessionStudentId,
              studentId: currentStudentInfo?.id,
              studentName: currentStudentInfo?.name,
            };
            
            client.publish({
              destination: '/app/student/event',
              body: JSON.stringify(leaveEventData),
            });
            console.log('[WS] ✅ Sent LEAVE event during cleanup:', leaveEventData);
          }
          
          // Đợi lâu hơn để đảm bảo event được gửi trước khi disconnect
          setTimeout(() => {
            client.deactivate();
          }, 500);
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
    if (!isExamStarted || !enableAutoFocusTracking) return;

    const handleVisibilityChange = () => {
      if (!isExamStartedRef.current) return;
      
      if (document.hidden) {
        if (lastFocusState.current) {
          sendEvent('TAB_SWITCH', 'Tab hidden via visibilitychange');
          lastFocusState.current = false;
          console.warn('⚠️ [Monitor] Sinh viên đã rời khỏi tab thi!');
        }
      } else if (!lastFocusState.current) {
        sendEvent('FOCUS_REGAINED', 'Tab visible via visibilitychange');
        lastFocusState.current = true;
        console.info('✅ [Monitor] Sinh viên đã quay lại tab thi');
      }
    };

    const handleBlur = () => {
      if (!isExamStartedRef.current) return;
      
      // Chỉ gửi FOCUS_LOST nếu tab vẫn visible (chuyển window, không phải chuyển tab)
      if (lastFocusState.current && !document.hidden) {
        sendEvent('FOCUS_LOST', 'Window blur detected');
        lastFocusState.current = false;
        console.warn('⚠️ [Monitor] Sinh viên đã chuyển cửa sổ!');
      }
    };

    const handleFocus = () => {
      if (!isExamStartedRef.current) return;
      
      if (!lastFocusState.current) {
        sendEvent('FOCUS_REGAINED', 'Window focus regained');
        lastFocusState.current = true;
        console.info('✅ [Monitor] Sinh viên đã quay lại trang thi');
      }
    };

    // Reset focus state
    lastFocusState.current = true;

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isExamStarted, enableAutoFocusTracking, sendEvent]);

  // Gửi DISCONNECTED khi thoát trang đột ngột
  useEffect(() => {
    if (!isExamStarted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      sendEvent('DISCONNECTED', 'Page unload detected');
      // Hiển thị cảnh báo khi thoát
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isExamStarted, sendEvent]);

  // Expose connection state
  const isConnected = useCallback(() => isConnectedRef.current, []);

  return { sendEvent, isConnected };
};