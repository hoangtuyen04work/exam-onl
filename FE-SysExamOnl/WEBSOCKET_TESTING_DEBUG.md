# WebSocket Testing & Debugging Guide

## Vấn đề hiện tại

**Triệu chứng**: Khi học sinh thoát fullscreen, giáo viên không nhận được thông báo trên dashboard monitoring.

**Nguyên nhân có thể**:
1. Backend không broadcast message đúng topic
2. Student gửi sai destination
3. Teacher subscribe sai topic
4. Payload format không đúng
5. Authentication/Authorization issues

---

## Kiến trúc WebSocket Flow

```
Student (ExamPage.tsx)
    ↓
useStudentMonitoringWebSocket Hook
    ↓
WebSocket Client (STOMP)
    ↓
Publish to: /app/student/event
    ↓
Backend Controller (@MessageMapping)
    ↓
Process & Broadcast
    ↓
Broadcast to: /topic/exam/{examSessionId}
    ↓
Teacher (ExamMonitoringPage.tsx)
    ↓
Subscribe & Display Update
```

---

## Chi tiết từng bước

### 1. Student Side - Gửi Events

#### File: `ExamPage.tsx`

**WebSocket Hook Usage**:
```typescript
const { sendEvent } = useStudentMonitoringWebSocket(
  examSessionId,      // Số phòng thi
  token,              // JWT token
  isExamStarted,      // true khi đang làm bài
  examSessionStudentId, // ID của student trong exam session
  { id: user?.id, name: user?.name } // Thông tin student
)
```

**Events được gửi**:

| Hành động | Event Type | Được gửi bởi | Note |
|-----------|-----------|--------------|------|
| Bắt đầu thi | `ENTER` | useStudentMonitoringWebSocket | Auto sau khi connect |
| Chuyển tab ra ngoài | `FOCUS_LOST` | useStudentMonitoringWebSocket | Auto detect |
| Quay lại tab | `FOCUS_REGAINED` | useStudentMonitoringWebSocket | Auto detect |
| Thoát fullscreen | `LEAVE` | ExamPage.tsx | Manual call |
| Click nút Thoát | `LEAVE` | ExamPage.tsx | Manual call |
| Nộp bài | `SUBMIT` | ExamPage.tsx | Manual call |
| Đóng browser | `DISCONNECTED` | useStudentMonitoringWebSocket | beforeunload |

**⚠️ ĐÃ SỬA**: Removed duplicate LEAVE/ENTER trong visibilitychange listener vì đã có FOCUS_LOST/FOCUS_REGAINED.

---

### 2. WebSocket Hook - useStudentMonitoringWebSocket

#### File: `useStudentMonitoringWebSocket.ts`

**Connection Setup**:
```typescript
const client = new Client({
  webSocketFactory: () => new SockJS(serverPort + '/ws'),
  connectHeaders: {
    Authorization: `Bearer ${token}`
  },
  reconnectDelay: 5000,
  heartbeatIncoming: 10000,
  heartbeatOutgoing: 10000
})
```

**Publish Destination**: `/app/student/event`

**Payload Format**:
```typescript
{
  examSessionId: number,
  examSessionStudentId?: number,
  studentId?: number,
  studentName?: string,
  event: 'ENTER' | 'LEAVE' | 'FOCUS_LOST' | 'FOCUS_REGAINED' | 'SUBMIT' | 'DISCONNECTED',
  timestamp: string,  // ISO 8601
  deviceInfo: string  // 'Windows', 'Android', 'iOS', etc.
}
```

**Console Logs**:
```
[WS] Initializing WebSocket connection...
[WS] Creating SockJS connection to: http://localhost:8080/ws
✅ WebSocket giám sát đã kết nối
[WS] ✅ Sent event: { event: 'ENTER', examSessionId: 28, ... }
```

---

### 3. Backend (Expected Behavior)

#### Controller (Java)
```java
@MessageMapping("/student/event")
public void handleStudentEvent(
  StudentEvent event,
  @Header("Authorization") String token
) {
  // Validate token & permissions
  // Process event
  // Broadcast to monitoring topic
  messagingTemplate.convertAndSend(
    "/topic/exam/" + event.getExamSessionId(),
    broadcastMessage
  );
}
```

**Expected Topic**: `/topic/exam/{examSessionId}`

**Broadcast Payload**:
```json
{
  "userId": 123,
  "username": "student01",
  "event": {
    "examSessionId": 28,
    "event": "LEAVE",
    "timestamp": "2026-01-16T10:30:00.000Z"
  }
}
```

---

### 4. Teacher Side - Nhận Events

#### File: `ExamMonitoringPage.tsx`

**Connection Setup**:
```typescript
const client = new Client({
  webSocketFactory: () => new SockJS(serverPort + '/ws'),
  connectHeaders: {
    Authorization: `Bearer ${token}`
  }
})
```

**Subscribe Topic**: `/topic/exam/{examSessionId}`

**Handler Logic**:
```typescript
client.subscribe(`/topic/exam/${examSessionId}`, (message) => {
  const broadcast: StudentEventBroadcast = JSON.parse(message.body)
  
  // Update student status map
  // Update online/offline set
  // Trigger UI re-render
})
```

**Console Logs** (đã thêm):
```
[Teacher WS] ✅ Connected to WebSocket
[Teacher WS] 📡 Subscribing to: /topic/exam/28
[Teacher WS] 📨 Received message: {...}
[Teacher WS] 📊 Parsed broadcast: {...}
[Teacher WS] 🔄 Updating student: { userId: 123, event: 'LEAVE', ... }
[Teacher WS] 🔴 Student offline: 123
```

---

## Testing Procedure

### Step 1: Open DevTools on Student Page

1. Mở trang học sinh: `/student/exam/{examSessionId}`
2. Mở DevTools (F12)
3. Tab **Console**: Xem WebSocket logs
4. Tab **Network** → Filter **WS**: Xem WebSocket frames

**Expected Console Output (Student)**:
```
[WS] Initializing WebSocket connection...
[WS] Creating SockJS connection to: http://localhost:8080/ws
✅ WebSocket giám sát đã kết nối
[WS] ✅ Sent event: { event: 'ENTER', examSessionId: 28, examSessionStudentId: 456, studentId: 789 }
```

**Network Tab - WebSocket Frames**:
- Click vào connection `/ws/...`
- Tab **Messages** → See outgoing frames

Example Frame:
```json
["SEND\ndestination:/app/student/event\n\n{\"examSessionId\":28,\"event\":\"ENTER\",...}"]
```

---

### Step 2: Open DevTools on Teacher Page

1. Mở trang giáo viên: `/teacher/dashboard/exam/{examSessionId}/monitoring`
2. Mở DevTools (F12)
3. Tab **Console**: Xem WebSocket logs
4. Tab **Network** → Filter **WS**: Xem WebSocket frames

**Expected Console Output (Teacher)**:
```
[Teacher WS] ✅ Connected to WebSocket
[Teacher WS] 📡 Subscribing to: /topic/exam/28
[Teacher WS] 📝 Subscription created: sub-0
```

**Network Tab - WebSocket Frames**:
- Click vào connection `/ws/...`
- Tab **Messages** → See incoming frames

Example Frame (when student sends event):
```json
["MESSAGE\ndestination:/topic/exam/28\n\n{\"userId\":123,\"event\":{\"event\":\"LEAVE\",...}}"]
```

---

### Step 3: Test Fullscreen Exit

#### On Student Side:

1. Bắt đầu làm bài (enter fullscreen)
2. Nhấn **ESC** để thoát fullscreen
3. Quan sát Console

**Expected Logs**:
```
[DEBUG] Fullscreen change detected - isFullscreen: false
[DEBUG] Exited fullscreen (from listener) - sending EXIT event and LEAVE WebSocket
[DEBUG] Sending EXIT event to: http://localhost:8080/api/student/exam/exit
[WS] ✅ Sent event: { event: 'LEAVE', examSessionId: 28, ... }
```

**Network Tab**:
- 1 HTTP POST to `/student/exam/exit` (status 200)
- 1 WebSocket frame with `LEAVE` event

---

#### On Teacher Side:

**Expected Logs**:
```
[Teacher WS] 📨 Received message: {"userId":123,"username":"student01",...}
[Teacher WS] 📊 Parsed broadcast: {...}
[Teacher WS] 🔄 Updating student: { userId: 123, event: 'LEAVE', newStatus: 'LEFT' }
[Teacher WS] 🔴 Student offline: 123
```

**UI Changes**:
- Student card badge: `🔴 Đã rời phòng`
- Background color: từ green → orange
- Online count: giảm 1

---

### Step 4: Test Tab Switch

#### On Student Side:

1. Đang làm bài (focus on tab)
2. Chuyển sang tab khác (Alt+Tab hoặc click tab khác)
3. Quan sát Console

**Expected Logs**:
```
[DEBUG] Tab hidden detected - sending EXIT event (HTTP only)
[DEBUG] Sending EXIT event to: http://localhost:8080/api/student/exam/exit
⚠️ Cảnh báo: Sinh viên đã rời khỏi trang thi!
[WS] ✅ Sent event: { event: 'FOCUS_LOST', examSessionId: 28, ... }
```

**Network Tab**:
- 1 HTTP POST to `/student/exam/exit`
- 1 WebSocket frame với `FOCUS_LOST` event

---

#### On Teacher Side:

**Expected Logs**:
```
[Teacher WS] 📨 Received message: {"userId":123,"event":{"event":"FOCUS_LOST",...}}
[Teacher WS] 🔄 Updating student: { userId: 123, event: 'FOCUS_LOST', newStatus: 'FOCUS_LOST' }
```

**UI Changes**:
- Student card badge: `⚠️ Mất tập trung`
- Background color: Yellow
- Vẫn trong danh sách online

---

### Step 5: Test Submit Exam

#### On Student Side:

1. Click nút **"Nộp bài"**
2. Quan sát Console

**Expected Logs**:
```
[WS] ✅ Sent event: { event: 'SUBMIT', examSessionId: 28, ... }
Nộp bài thành công!
```

---

#### On Teacher Side:

**Expected Logs**:
```
[Teacher WS] 📨 Received message: {"userId":123,"event":{"event":"SUBMIT",...}}
[Teacher WS] 🔄 Updating student: { userId: 123, event: 'SUBMIT', newStatus: 'COMPLETED' }
[Teacher WS] 🔴 Student offline: 123
```

**UI Changes**:
- Student card badge: `✅ Đã hoàn thành`
- Background color: Blue
- Online count: giảm 1

---

## Debugging Checklist

### ❌ Nếu Student không connect được WebSocket

**Check Console for**:
```
[WS] Connection conditions not met
❌ WebSocket error: ...
❌ STOMP Error: ...
```

**Possible Issues**:
- [ ] `token` null hoặc invalid
- [ ] `examSessionId` null
- [ ] `isExamStarted` = false
- [ ] Backend `/ws` endpoint không accessible
- [ ] CORS issues
- [ ] Wrong serverPort config

**Solutions**:
1. Check `localStorage.getItem('authToken')`
2. Verify `examSessionId` from URL params
3. Ensure `handleStartExam` được gọi
4. Check backend logs for connection attempts
5. Verify VITE_SERVER_PORT_EXPOSE in `.env`

---

### ❌ Nếu Student connect nhưng không gửi được events

**Check Console for**:
```
[WS] Cannot send event - not connected: LEAVE
[WS] Cannot send event - no examSessionId: LEAVE
```

**Possible Issues**:
- [ ] Connection chưa hoàn thành (onConnect chưa fire)
- [ ] `examSessionId` lost/null
- [ ] `sendEvent` được gọi trước khi connect

**Solutions**:
1. Add delay trước khi gửi event đầu tiên
2. Check `clientRef.current?.connected` before sending
3. Ensure WebSocket connection ổn định

---

### ❌ Nếu Teacher không nhận được messages

**Check Console for**:
```
[Teacher WS] ⚠️ WebSocket closed
[Teacher WS] ❌ STOMP Error: ...
No logs about received messages
```

**Possible Issues**:
- [ ] Backend không broadcast đúng topic
- [ ] Teacher subscribe sai topic
- [ ] Payload format không match
- [ ] Backend filter/reject message

**Solutions**:

#### 1. Verify Backend Topic
```java
// Backend MUST broadcast to:
messagingTemplate.convertAndSend(
  "/topic/exam/" + examSessionId,  // ← Exactly this format
  broadcastMessage
);
```

#### 2. Verify Teacher Subscribe Topic
```typescript
// Frontend MUST subscribe to:
client.subscribe(`/topic/exam/${examSessionId}`, ...)
// ← Same format as backend broadcast
```

#### 3. Check Backend Logs
```
Received message from student: {...}
Broadcasting to topic: /topic/exam/28
Subscribers count: 1
```

#### 4. Check Payload Format
Backend broadcast MUST include:
```json
{
  "userId": number,
  "username": string,
  "event": {
    "examSessionId": number,
    "event": string,
    ...
  }
}
```

Frontend expects `StudentEventBroadcast` type.

---

### ❌ Nếu nhận được message nhưng UI không update

**Check Console for**:
```
[Teacher WS] 📨 Received message: {...}
[Teacher WS] ❌ Parse error: ...
```

**Possible Issues**:
- [ ] JSON parse error
- [ ] Missing fields in broadcast
- [ ] React state update không trigger re-render

**Solutions**:

#### 1. Verify Payload Structure
```typescript
// Must match this interface:
interface StudentEventBroadcast {
  userId: number
  username: string
  event: {
    examSessionId: number
    event: 'LEAVE' | 'ENTER' | ...
  }
}
```

#### 2. Check State Updates
```typescript
setStudentDetails(prev => {
  const newMap = new Map(prev)
  // ... mutations
  return newMap  // ← MUST return new Map
})
```

#### 3. Verify React Hooks Dependencies
```typescript
useEffect(() => {
  // ... subscription logic
}, [token, examSessionId, serverPort])
// ← All used variables must be in deps
```

---

## Common Issues & Fixes

### Issue 1: "Duplicate events được gửi"

**Symptom**: Mỗi action gửi 2-3 events cùng lúc

**Root Cause**: 
- useStudentMonitoringWebSocket đã có auto tracking
- ExamPage.tsx lại gửi thêm events manual

**Fix**: ✅ Đã sửa - Removed duplicate `LEAVE`/`ENTER` trong visibilitychange

---

### Issue 2: "Teacher không thấy student online ngay khi bắt đầu thi"

**Symptom**: Student vào thi nhưng teacher dashboard vẫn hiển thị "Chưa vào phòng"

**Root Cause**:
- Initial fetch participants không sync với WebSocket updates
- Timing issue: fetch slow, WebSocket fast

**Fix**:
```typescript
// In ExamMonitoringPage.tsx
useEffect(() => {
  fetchParticipants()
  const interval = setInterval(fetchParticipants, 30000) // Refresh every 30s
  return () => clearInterval(interval)
}, [])
```

---

### Issue 3: "WebSocket disconnect sau vài phút"

**Symptom**: Connection lost sau 5-10 phút

**Root Cause**:
- Heartbeat timeout
- Network idle timeout
- Server config issue

**Fix**:
```typescript
// Increase heartbeat intervals
heartbeatIncoming: 10000,  // 10s
heartbeatOutgoing: 10000,  // 10s

// Enable auto-reconnect
reconnectDelay: 5000,
```

---

### Issue 4: "CORS errors khi connect WebSocket"

**Symptom**:
```
Access to XMLHttpRequest at 'http://localhost:8080/ws' has been blocked by CORS policy
```

**Root Cause**: Backend CORS config không allow WebSocket

**Fix** (Backend):
```java
@Configuration
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws")
      .setAllowedOriginPatterns("*")  // ← Allow CORS
      .withSockJS();
  }
}
```

---

## Network Inspection

### Chrome DevTools - WebSocket Tab

1. F12 → **Network** tab
2. Filter: **WS** (WebSocket)
3. Click on connection (e.g., `/ws/123/abc/websocket`)
4. Tab: **Messages**

**Outgoing Frames** (Student sends):
```
SEND
destination:/app/student/event

{"examSessionId":28,"event":"LEAVE",...}
```

**Incoming Frames** (Teacher receives):
```
MESSAGE
destination:/topic/exam/28
subscription:sub-0

{"userId":123,"username":"student01","event":{...}}
```

### Verify Frame Timestamps

- Student sends LEAVE at `10:30:15.234`
- Teacher receives MESSAGE at `10:30:15.245`
- Latency: ~11ms (normal)

If latency > 1s → Network/Backend issue

---

## Backend Verification

### Check Backend Logs

**Expected Logs**:
```
INFO: WebSocket connection established: user=student01
INFO: Received StudentEvent: {examSessionId=28, event=LEAVE, ...}
INFO: Broadcasting to topic: /topic/exam/28
INFO: Active subscriptions: 2
```

### Check Message Mapping

```java
@MessageMapping("/student/event")
public void handleStudentEvent(StudentEvent event) {
  log.info("Received: {}", event);
  
  // Transform to broadcast format
  StudentEventBroadcast broadcast = new StudentEventBroadcast();
  broadcast.setUserId(getCurrentUserId());
  broadcast.setUsername(getCurrentUsername());
  broadcast.setEvent(event);
  
  // Broadcast
  String topic = "/topic/exam/" + event.getExamSessionId();
  messagingTemplate.convertAndSend(topic, broadcast);
  
  log.info("Broadcasted to: {}", topic);
}
```

### Check Subscribers

```java
// In WebSocket config or separate component
@EventListener
public void handleSubscribeEvent(SessionSubscribeEvent event) {
  String destination = SimpMessageHeaderAccessor
    .wrap(event.getMessage())
    .getDestination();
  log.info("New subscription: {}", destination);
}
```

Expected:
```
New subscription: /topic/exam/28
```

---

## Summary - Testing Steps

### Quick Test Protocol (5 minutes)

1. **✅ Student Connect**
   - Open student page
   - Console: `✅ WebSocket giám sát đã kết nối`
   - Console: `[WS] ✅ Sent event: { event: 'ENTER' }`

2. **✅ Teacher Connect**
   - Open teacher page
   - Console: `[Teacher WS] ✅ Connected`
   - Console: `[Teacher WS] 📡 Subscribing to: /topic/exam/28`

3. **✅ Student Action**
   - Student: Nhấn ESC (exit fullscreen)
   - Student Console: `[WS] ✅ Sent event: { event: 'LEAVE' }`

4. **✅ Teacher Receive**
   - Teacher Console: `[Teacher WS] 📨 Received message`
   - Teacher Console: `[Teacher WS] 🔄 Updating student`
   - Teacher UI: Badge changes to `🔴 Đã rời phòng`

5. **✅ Verify All Events**
   - Tab switch → `FOCUS_LOST`
   - Return to tab → `FOCUS_REGAINED`
   - Submit → `SUBMIT`
   - Each event should appear in Teacher console + UI

---

## Monitoring Dashboard UI States

| Event | Badge | Color | Online Status |
|-------|-------|-------|--------------|
| WAITING | 🟣 Đang chờ vào | Purple | Offline |
| ENTER | 🟢 Đang làm bài | Green | Online |
| FOCUS_LOST | ⚠️ Mất tập trung | Yellow | Online |
| FOCUS_REGAINED | 🟢 Đang làm bài | Green | Online |
| LEAVE | 🔴 Đã rời phòng | Red | Offline |
| SUBMIT | ✅ Đã hoàn thành | Blue | Offline |
| DISCONNECTED | 🟠 Mất kết nối | Orange | Offline |

---

## Files Changed Summary

### 1. `ExamPage.tsx`
**Change**: Removed duplicate WebSocket events trong visibilitychange
```typescript
// BEFORE: Gửi cả LEAVE và FOCUS_LOST
sendEvent('LEAVE')
sendEventLog('EXIT')

// AFTER: Chỉ gửi HTTP log, WebSocket auto handle
sendEventLog('EXIT')
// FOCUS_LOST được gửi bởi useStudentMonitoringWebSocket
```

### 2. `ExamMonitoringPage.tsx`
**Changes**:
- ✅ Added detailed console logging
- ✅ Added subscription ID logging
- ✅ Update timestamp when receiving events
- ✅ Better error messages
- ✅ Fixed dependency array (added serverPort)

---

## Next Steps

1. **Test trên production/staging**:
   - Verify serverPort config
   - Check firewall rules for WebSocket
   - Test với multiple students simultaneously

2. **Backend verification**:
   - Ensure backend broadcast đúng topic format
   - Check payload structure matches frontend expectations
   - Verify authorization/authentication

3. **Performance monitoring**:
   - Track WebSocket connection stability
   - Monitor event latency
   - Check memory leaks in long sessions

4. **Error handling improvements**:
   - Auto-reconnect khi mất kết nối
   - Fallback mechanism (polling?) nếu WebSocket fail
   - User notification khi connection lost
