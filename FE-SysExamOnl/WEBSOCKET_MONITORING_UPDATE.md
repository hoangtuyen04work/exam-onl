# WebSocket Monitoring - Cập Nhật Đầy Đủ Thông Tin

## 📋 Tổng Quan

Đã cập nhật hook `useStudentMonitoringWebSocket` để gửi đầy đủ thông tin tracking học sinh khi làm bài thi, bao gồm:

- ✅ `examSessionId` - ID của phiên thi
- ✅ `examSessionStudentId` - ID của phiên thi của học sinh cụ thể
- ✅ `studentId` - ID của học sinh
- ✅ `studentName` - Tên của học sinh
- ✅ `timestamp` - Thời gian event xảy ra
- ✅ `deviceInfo` - Thông tin thiết bị (Desktop/Mobile/OS)

## 🔧 Thay Đổi Kỹ Thuật

### 1. Hook `useStudentMonitoringWebSocket.ts`

#### Before (Thiếu thông tin):
```typescript
interface StudentEvent {
  examSessionId: number;
  event: 'WAITING' | 'ENTER' | 'LEAVE' | ...;
}

export const useStudentMonitoringWebSocket = (
  examSessionId: number | null,
  token: string | null,
  isExamStarted: boolean
) => {
  const sendEvent = (event) => {
    // Chỉ gửi examSessionId và event
    client.publish({
      destination: '/app/student/event',
      body: JSON.stringify({ examSessionId, event })
    });
  };
}
```

#### After (Đầy đủ thông tin):
```typescript
interface StudentEvent {
  examSessionId: number;
  examSessionStudentId?: number; // ✅ Thêm
  studentId?: number; // ✅ Thêm
  studentName?: string; // ✅ Thêm
  event: 'WAITING' | 'ENTER' | 'LEAVE' | ...;
  timestamp?: string; // ✅ Thêm
  deviceInfo?: string; // ✅ Thêm
}

export const useStudentMonitoringWebSocket = (
  examSessionId: number | null,
  token: string | null,
  isExamStarted: boolean,
  examSessionStudentId?: number | null, // ✅ Thêm param
  studentInfo?: { id?: number; name?: string } // ✅ Thêm param
) => {
  const sendEvent = (event) => {
    // ✅ Check kỹ trước khi gửi
    if (!client?.connected || !examSessionId) {
      console.warn('[WS] Cannot send event');
      return;
    }

    // ✅ Tạo event data đầy đủ
    const eventData: StudentEvent = {
      examSessionId,
      event,
      timestamp: new Date().toISOString(),
      deviceInfo: getDeviceInfo(),
    };

    // ✅ Thêm thông tin nếu có
    if (examSessionStudentId) {
      eventData.examSessionStudentId = examSessionStudentId;
    }
    if (studentInfo?.id) {
      eventData.studentId = studentInfo.id;
    }
    if (studentInfo?.name) {
      eventData.studentName = studentInfo.name;
    }

    client.publish({
      destination: '/app/student/event',
      body: JSON.stringify(eventData)
    });
  };
}
```

### 2. Device Detection

Thêm function detect thiết bị:

```typescript
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'Android';
  if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac/.test(ua)) return 'MacOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown';
};
```

### 3. Connection Handling Improvements

#### Better Logging:
```typescript
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
```

#### Heartbeat Configuration:
```typescript
const client = new Client({
  webSocketFactory: () => new SockJS(serverPort + '/ws'),
  connectHeaders: {
    Authorization: `Bearer ${token}`,
  },
  reconnectDelay: 5000,
  heartbeatIncoming: 10000, // ✅ Thêm heartbeat
  heartbeatOutgoing: 10000, // ✅ Thêm heartbeat
});
```

### 4. Usage in ExamPage.tsx

#### Before:
```typescript
const { sendEvent } = useStudentMonitoringWebSocket(
  examSessionId, 
  token, 
  isExamStarted
);
```

#### After:
```typescript
const { sendEvent } = useStudentMonitoringWebSocket(
  examSessionId,
  token,
  isExamStarted,
  examSessionStudentId, // ✅ Thêm
  { id: user?.id, name: user?.name } // ✅ Thêm thông tin student
);
```

### 5. Event Tracking

Đã thêm event tracking khi submit bài:

```typescript
const submitExam = useCallback((state: 'DRAFT' | 'FINAL') => {
  // ... existing code ...
  
  if (state === 'FINAL') {
    // ✅ Gửi WebSocket event SUBMIT khi nộp bài
    sendEvent('SUBMIT');
    
    // ... navigate to result ...
  }
}, [examSessionId, navigate, submitMutation, sendEvent]);
```

## 📊 Event Types

Các event được gửi qua WebSocket:

| Event | Khi Nào | Thông Tin Gửi |
|-------|---------|---------------|
| **ENTER** | Bắt đầu thi | examSessionId, studentId, studentName, deviceInfo, timestamp |
| **LEAVE** | Thoát thi/Đóng tab | examSessionId, studentId, studentName, deviceInfo, timestamp |
| **FOCUS_LOST** | Chuyển tab/window | examSessionId, studentId, deviceInfo, timestamp |
| **FOCUS_REGAINED** | Quay lại tab thi | examSessionId, studentId, deviceInfo, timestamp |
| **SUBMIT** | Nộp bài (FINAL) | examSessionId, studentId, studentName, deviceInfo, timestamp |
| **DISCONNECTED** | Đóng trình duyệt | examSessionId, studentId, deviceInfo, timestamp |

## 🔍 Validation & Error Handling

### Check Before Send:
```typescript
const sendEvent = (event) => {
  // ✅ Kiểm tra connection
  if (!clientRef.current?.connected) {
    console.warn('[WS] Cannot send event - not connected:', event);
    return;
  }
  
  // ✅ Kiểm tra examSessionId
  if (!examSessionId) {
    console.warn('[WS] Cannot send event - no examSessionId:', event);
    return;
  }

  // ✅ Gửi với try-catch
  try {
    clientRef.current.publish({
      destination: '/app/student/event',
      body: JSON.stringify(eventData),
    });
    console.log('[WS] ✅ Sent event:', { event, examSessionId, studentId });
  } catch (error) {
    console.error('[WS] ❌ Failed to send event:', error);
  }
};
```

## 📝 Logging

### Console Logs:

**Connection:**
```
[WS] Connection conditions not met: { hasToken: true, hasExamSessionId: true, isExamStarted: true }
[WS] Initializing WebSocket connection...
[WS] Creating SockJS connection to: http://localhost:8080/ws
[WS] Attempting to connect...
✅ WebSocket giám sát đã kết nối
```

**Events:**
```
[WS] ✅ Sent event: {
  event: 'ENTER',
  examSessionId: 123,
  examSessionStudentId: 456,
  studentId: 789,
  timestamp: '2026-01-16T10:30:00.000Z'
}
⚠️ Cảnh báo: Sinh viên đã rời khỏi trang thi!
[WS] ✅ Sent event: { event: 'FOCUS_LOST', ... }
✅ Sinh viên đã quay lại trang thi
[WS] ✅ Sent event: { event: 'FOCUS_REGAINED', ... }
```

**Errors:**
```
[WS] Cannot send event - not connected: ENTER
[WS] Cannot send event - no examSessionId: LEAVE
❌ STOMP Error: Connection lost
⚠️ WebSocket đã ngắt kết nối
```

## 🚀 Backend Integration

### Expected Endpoint:

**WebSocket:** `ws://localhost:8080/ws` (hoặc từ `VITE_SERVER_PORT_EXPOSE`)

**Destination:** `/app/student/event`

### Payload Format:
```json
{
  "examSessionId": 123,
  "examSessionStudentId": 456,
  "studentId": 789,
  "studentName": "Nguyễn Văn A",
  "event": "ENTER",
  "timestamp": "2026-01-16T10:30:00.000Z",
  "deviceInfo": "Windows"
}
```

### Backend Controller (Expected):
```java
@MessageMapping("/student/event")
@SendTo("/topic/monitoring/{examSessionId}")
public StudentEventResponse handleStudentEvent(StudentEvent event) {
    // Validate event
    // Save to database
    // Broadcast to monitoring clients
    return new StudentEventResponse(event);
}
```

## ✅ Testing Checklist

### Connection:
- [ ] WebSocket kết nối thành công khi bắt đầu thi
- [ ] Gửi ENTER event ngay sau khi connect
- [ ] Reconnect tự động khi mất kết nối
- [ ] Heartbeat hoạt động (ping/pong mỗi 10s)

### Events:
- [ ] ENTER: Gửi khi vào thi
- [ ] LEAVE: Gửi khi thoát thi
- [ ] FOCUS_LOST: Gửi khi chuyển tab
- [ ] FOCUS_REGAINED: Gửi khi quay lại
- [ ] SUBMIT: Gửi khi nộp bài
- [ ] DISCONNECTED: Gửi khi đóng trình duyệt

### Data:
- [ ] examSessionId có trong mọi event
- [ ] examSessionStudentId có khi đã load exam
- [ ] studentId và studentName có từ user info
- [ ] timestamp đúng định dạng ISO
- [ ] deviceInfo detect đúng (Windows/Mac/Android/iOS)

### Error Handling:
- [ ] Không crash khi WebSocket disconnect
- [ ] Không gửi event khi chưa connect
- [ ] Log error rõ ràng khi fail
- [ ] Retry connection tự động

## 📚 Files Changed

1. **`src/hooks/useStudentMonitoringWebSocket.ts`**
   - Thêm params: `examSessionStudentId`, `studentInfo`
   - Thêm fields: `timestamp`, `deviceInfo`, `studentId`, `studentName`
   - Cải thiện error handling
   - Thêm logging chi tiết
   - Thêm heartbeat config

2. **`src/pages/Student/Exam/ExamPage.tsx`**
   - Cập nhật cách gọi hook với đủ params
   - Thêm sendEvent('SUBMIT') khi nộp bài FINAL

3. **`WEBSOCKET_MONITORING_UPDATE.md`** (New)
   - Documentation đầy đủ về WebSocket monitoring

## 🐛 Known Issues

1. **returnValue deprecated**: 
   - Warning về `e.returnValue` trong beforeunload
   - Vẫn cần thiết cho compatibility với một số browsers
   - TODO: Tìm alternative approach

2. **ESLint warnings**:
   - Một số nested ternary operators
   - Cognitive complexity cao
   - TODO: Refactor khi có thời gian

## 🔄 Migration Guide

### Cập nhật Backend:

1. **Update DTO**:
```java
public class StudentEvent {
    private Long examSessionId;
    private Long examSessionStudentId; // ✅ Thêm
    private Long studentId; // ✅ Thêm
    private String studentName; // ✅ Thêm
    private String event;
    private String timestamp; // ✅ Thêm
    private String deviceInfo; // ✅ Thêm
}
```

2. **Update Service**:
```java
@Service
public class MonitoringService {
    public void handleStudentEvent(StudentEvent event) {
        // Validate examSessionStudentId
        // Save event with full info
        // Broadcast to monitoring clients
    }
}
```

3. **Update Database**:
```sql
ALTER TABLE student_events 
ADD COLUMN exam_session_student_id BIGINT,
ADD COLUMN student_id BIGINT,
ADD COLUMN student_name VARCHAR(255),
ADD COLUMN timestamp TIMESTAMP,
ADD COLUMN device_info VARCHAR(50);
```

---

**Version**: 1.0.0  
**Last Updated**: 16/01/2026  
**Status**: ✅ Ready for Testing
