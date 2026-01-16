# WebSocket Event States - Frontend vs Backend Comparison

## Tổng quan

Document này so sánh chi tiết các trạng thái (events) được gửi từ Frontend và các trạng thái mà Backend hỗ trợ.

---

## 1. Frontend - Student Side (Events được GỬI)

### File: `useStudentMonitoringWebSocket.ts`

**Interface Definition**:
```typescript
interface StudentEvent {
  examSessionId: number;
  examSessionStudentId?: number;
  studentId?: number;
  studentName?: string;
  event: 'WAITING' | 'ENTER' | 'LEAVE' | 'TAB_SWITCH' | 'SUBMIT' | 
         'FOCUS_LOST' | 'FOCUS_REGAINED' | 'DISCONNECTED' | 'RECONNECTED';
  timestamp?: string;
  deviceInfo?: string;
}
```

**Destination**: `/app/student/event`

---

### Chi tiết các Events được gửi

| Event Type | Trigger | File | Auto/Manual | Backend Support |
|------------|---------|------|-------------|-----------------|
| `ENTER` | Connect WebSocket thành công | useStudentMonitoringWebSocket.ts | Auto | ✅ YES |
| `LEAVE` | Cleanup WebSocket | useStudentMonitoringWebSocket.ts | Auto | ✅ YES |
| `LEAVE` | beforeunload (close/reload) | ExamPage.tsx | Manual | ✅ YES |
| `LEAVE` | Fullscreen exit | ExamPage.tsx | Manual | ✅ YES |
| `LEAVE` | Click nút "Thoát" | ExamPage.tsx | Manual | ✅ YES |
| `SUBMIT` | Nộp bài (FINAL) | ExamPage.tsx | Manual | ✅ YES |
| `FOCUS_LOST` | Tab hidden (visibilitychange) | useStudentMonitoringWebSocket.ts | Auto | ✅ YES |
| `FOCUS_LOST` | Window blur | useStudentMonitoringWebSocket.ts | Auto | ✅ YES |
| `FOCUS_REGAINED` | Tab visible (visibilitychange) | useStudentMonitoringWebSocket.ts | Auto | ✅ YES |
| `FOCUS_REGAINED` | Window focus | useStudentMonitoringWebSocket.ts | Auto | ✅ YES |
| `DISCONNECTED` | beforeunload warning | useStudentMonitoringWebSocket.ts | Auto | ✅ YES |
| `WAITING` | - | - | ❌ NOT SENT | ✅ YES (Backend has) |
| `TAB_SWITCH` | - | - | ❌ NOT SENT | ✅ YES (Backend has) |
| `RECONNECTED` | - | - | ❌ NOT SENT | ✅ YES (Backend has) |

---

### Phân tích chi tiết

#### ✅ Events ĐANG GỬI (8 events)

1. **ENTER** 
   - Khi: WebSocket connect thành công
   - File: `useStudentMonitoringWebSocket.ts` line 143
   - Code: `sendEvent('ENTER')`
   - Auto: Delay 100ms sau khi connect

2. **LEAVE** (5 triggers)
   - a) WebSocket cleanup: `useStudentMonitoringWebSocket.ts` line 102, 185
   - b) beforeunload: `ExamPage.tsx` line 399
   - c) Fullscreen exit: `ExamPage.tsx` line 438
   - d) Click "Thoát": `ExamPage.tsx` line 618
   - e) handleExit callback: `ExamPage.tsx` line 502

3. **SUBMIT**
   - Khi: Nộp bài FINAL
   - File: `ExamPage.tsx` line 533
   - Code: `sendEvent('SUBMIT')`
   - Manual: User action

4. **FOCUS_LOST** (2 triggers)
   - a) visibilitychange (document.hidden): `useStudentMonitoringWebSocket.ts` line 208
   - b) window blur: `useStudentMonitoringWebSocket.ts` line 221
   - Auto: Browser events

5. **FOCUS_REGAINED** (2 triggers)
   - a) visibilitychange (!document.hidden): `useStudentMonitoringWebSocket.ts` line 213
   - b) window focus: `useStudentMonitoringWebSocket.ts` line 229
   - Auto: Browser events

6. **DISCONNECTED**
   - Khi: beforeunload (thoát đột ngột)
   - File: `useStudentMonitoringWebSocket.ts` line 252
   - Auto: Browser event

---

#### ❌ Events KHÔNG GỬI nhưng Backend hỗ trợ (3 events)

1. **WAITING**
   - Backend: ✅ Có trong `StudentEventEnum`
   - Frontend: ❌ Không gửi
   - Recommendation: Có thể gửi khi student ở màn hình pre-exam (chưa start)

2. **TAB_SWITCH**
   - Backend: ✅ Có trong `StudentEventEnum`
   - Frontend: ❌ Không gửi
   - Current: Dùng `FOCUS_LOST` thay thế
   - Recommendation: Có thể gửi riêng để phân biệt với window blur

3. **RECONNECTED**
   - Backend: ✅ Có trong `StudentEventEnum`
   - Frontend: ❌ Không gửi
   - Current: Khi reconnect, gửi `ENTER` thay thế
   - Recommendation: Có thể gửi để track reconnection events

---

## 2. Frontend - Teacher Side (Events có thể NHẬN)

### File: `ExamMonitoringPage.tsx`

**Interface Definition**:
```typescript
interface StudentEvent {
  examSessionId: number
  event: 'WAITING' | 'ENTER' | 'LEAVE' | 'FOCUS_LOST' | 'FOCUS_REGAINED' | 
         'SUBMIT' | 'TAB_SWITCH' | 'DISCONNECTED' | 'RECONNECTED'
}

interface StudentEventBroadcast {
  userId: number
  username: string
  event: StudentEvent
}
```

**Subscription Topic**: `/topic/exam/{examSessionId}`

---

### Event → Status Mapping

| Received Event | UI Status | Badge Color | Online? | Note |
|----------------|-----------|-------------|---------|------|
| `WAITING` | WAITING | Purple 🟣 | Offline | Đang chờ vào |
| `ENTER` | IN_PROGRESS | Green 🟢 | Online | Đang làm bài |
| `LEAVE` | LEFT | Red 🔴 | Offline | Đã rời phòng |
| `FOCUS_LOST` | FOCUS_LOST | Yellow ⚠️ | Online | Mất tập trung |
| `FOCUS_REGAINED` | IN_PROGRESS | Green 🟢 | Online | Quay lại làm bài |
| `SUBMIT` | COMPLETED | Blue ✅ | Offline | Đã hoàn thành |
| `DISCONNECTED` | DISCONNECTED | Orange 🟠 | Offline | Mất kết nối |
| `RECONNECTED` | IN_PROGRESS | Green 🟢 | Online | Kết nối lại |
| `TAB_SWITCH` | IN_PROGRESS | Green 🟢 | Online | (Fallback status) |

**Code Location**: `ExamMonitoringPage.tsx` lines 189-217

---

## 3. Backend Support

### File: `StudentEventEnum.java`

```java
public enum StudentEventEnum {
    WAITING,           // ✅ Supported
    ENTER,             // ✅ Supported
    LEAVE,             // ✅ Supported
    FOCUS_LOST,        // ✅ Supported
    FOCUS_REGAINED,    // ✅ Supported
    TAB_SWITCH,        // ✅ Supported
    SUBMIT,            // ✅ Supported
    DISCONNECTED,      // ✅ Supported
    RECONNECTED        // ✅ Supported
}
```

**Location**: `src/main/java/edu/exam_online/exam_online_system/commons/constant/StudentEventEnum.java`

---

### File: `StudentEvent.java`

```java
@Getter
@Setter
@Builder
public class StudentEvent {
    @NotBlank(message = "ExamSessionId is required")
    private Long examSessionId;

    @NotBlank(message = "Type is required")
    private StudentEventEnum event;
}
```

**Issues**:
- ❌ Không có field `examSessionStudentId` (Frontend gửi nhưng Backend không nhận)
- ❌ Không có field `studentId` (Frontend gửi nhưng Backend không nhận)
- ❌ Không có field `studentName` (Frontend gửi nhưng Backend không nhận)
- ❌ Không có field `timestamp` (Frontend gửi nhưng Backend không nhận)
- ❌ Không có field `deviceInfo` (Frontend gửi nhưng Backend không nhận)

**Location**: `src/main/java/edu/exam_online/exam_online_system/dto/request/websocket/StudentEvent.java`

---

### File: `ClassEventHandlingController.java`

```java
@MessageMapping("/student/event")
public void handleStudentEvent(
    Principal principal,
    @Payload StudentEvent event,
    @Header("simpSessionId") String sessionId
) {
    Long userId = Long.parseLong(principal.getName());
    
    User user = studentMonitoringService.handleStudentEvent(principal, event, sessionId);
    
    messagingTemplate.convertAndSend(
        "/topic/exam/" + event.getExamSessionId(),
        StudentEventBroadcast.builder()
            .userId(userId)
            .username(user.getUsername())
            .event(event)
            .build()
    );
}
```

**Message Flow**:
1. ✅ Receives from `/app/student/event`
2. ✅ Processes event via `studentMonitoringService`
3. ✅ Broadcasts to `/topic/exam/{examSessionId}`
4. ✅ Includes `userId` and `username`

**Location**: `src/main/java/edu/exam_online/exam_online_system/controller/websocket/ClassEventHandlingController.java`

---

## 4. Status Comparison Matrix

### Frontend (Gửi) vs Backend (Nhận)

| Event | Frontend Send | Backend Receive | Backend Enum | Broadcast to Teacher | Teacher Display |
|-------|---------------|-----------------|--------------|---------------------|-----------------|
| WAITING | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| ENTER | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| LEAVE | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| FOCUS_LOST | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| FOCUS_REGAINED | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| TAB_SWITCH | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| SUBMIT | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| DISCONNECTED | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| RECONNECTED | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

**Summary**:
- ✅ Fully Implemented: 6 events (ENTER, LEAVE, FOCUS_LOST, FOCUS_REGAINED, SUBMIT, DISCONNECTED)
- ⚠️ Backend Ready but Frontend Not Sending: 3 events (WAITING, TAB_SWITCH, RECONNECTED)

---

## 5. Payload Field Comparison

### Frontend Payload (Sent)

```typescript
{
  examSessionId: number,           // ✅ Backend receives
  examSessionStudentId?: number,   // ❌ Backend ignores
  studentId?: number,               // ❌ Backend ignores
  studentName?: string,             // ❌ Backend ignores
  event: StudentEventEnum,         // ✅ Backend receives
  timestamp?: string,               // ❌ Backend ignores
  deviceInfo?: string               // ❌ Backend ignores
}
```

### Backend DTO (Expected)

```java
{
  examSessionId: Long,  // ✅ Required
  event: StudentEventEnum  // ✅ Required
  // Missing fields: examSessionStudentId, studentId, studentName, timestamp, deviceInfo
}
```

### Backend Broadcast (Sent to Teacher)

```java
{
  userId: Long,           // From Principal
  username: String,       // From User entity
  event: StudentEvent     // Original event object (only has examSessionId + event)
}
```

---

## 6. Issues & Recommendations

### 🔴 Critical Issues

#### Issue 1: Backend DTO thiếu fields
**Problem**: Frontend gửi nhiều thông tin nhưng Backend không nhận
**Impact**: Mất thông tin tracking quan trọng (examSessionStudentId, timestamp, deviceInfo)
**Solution**: Update `StudentEvent.java`

```java
@Getter
@Setter
@Builder
public class StudentEvent {
    @NotBlank(message = "ExamSessionId is required")
    private Long examSessionId;
    
    private Long examSessionStudentId;  // ✅ Add
    private Long studentId;              // ✅ Add
    private String studentName;          // ✅ Add
    
    @NotBlank(message = "Type is required")
    private StudentEventEnum event;
    
    private String timestamp;            // ✅ Add
    private String deviceInfo;           // ✅ Add
}
```

---

#### Issue 2: Frontend không gửi WAITING event
**Problem**: Không track được khi student ở màn hình chờ
**Impact**: Teacher không biết có bao nhiêu student đang chờ vào thi
**Solution**: Thêm logic gửi WAITING

**File**: `ExamPage.tsx`
```typescript
// Khi ở màn hình pre-exam (!isExamStarted)
useEffect(() => {
  if (!isExamStarted && examSessionId && token) {
    // Connect WebSocket và gửi WAITING
    sendEvent('WAITING')
  }
}, [isExamStarted, examSessionId, token])
```

---

#### Issue 3: Frontend không gửi RECONNECTED
**Problem**: Không phân biệt giữa first connect và reconnect
**Impact**: Khó track network stability của student
**Solution**: Track reconnection state

**File**: `useStudentMonitoringWebSocket.ts`
```typescript
const isFirstConnect = useRef(true)

client.onConnect = () => {
  if (isFirstConnect.current) {
    sendEvent('ENTER')
    isFirstConnect.current = false
  } else {
    sendEvent('RECONNECTED')  // ✅ Add
  }
}
```

---

#### Issue 4: Frontend không gửi TAB_SWITCH riêng
**Problem**: Dùng FOCUS_LOST cho cả tab switch và window blur
**Impact**: Không phân biệt được student chuyển tab hay minimize window
**Solution**: Separate events

**File**: `useStudentMonitoringWebSocket.ts`
```typescript
const handleVisibilityChange = () => {
  if (document.hidden) {
    sendEvent('TAB_SWITCH')  // ✅ More specific
  } else {
    sendEvent('FOCUS_REGAINED')
  }
}

const handleBlur = () => {
  sendEvent('FOCUS_LOST')  // ✅ Only for window blur
}
```

---

### ⚠️ Minor Issues

#### Issue 5: Teacher timestamp không từ event
**Problem**: Teacher tự tạo timestamp khi nhận message
**Impact**: Có độ trễ nhỏ (~10-50ms)
**Current**:
```typescript
timestamp: new Date().toISOString() // Teacher creates
```
**Better**:
```typescript
timestamp: broadcast.event.timestamp || new Date().toISOString()
```

---

#### Issue 6: Violation count không được track
**Problem**: Teacher interface có `focusLostCount` và `tabSwitchCount` nhưng không update
**Impact**: Không đếm được số lần vi phạm
**Solution**: Backend cần track và broadcast count

**Teacher Interface**:
```typescript
type StudentDetail = {
  // ...
  focusLostCount?: number  // ❌ Not updated
  tabSwitchCount?: number  // ❌ Not updated
}
```

**Backend Should Broadcast**:
```java
{
  userId: Long,
  username: String,
  event: StudentEvent,
  violationCount: Integer,  // ✅ Add total violations
  focusLostCount: Integer,  // ✅ Add
  tabSwitchCount: Integer   // ✅ Add
}
```

---

## 7. Recommended Changes

### Priority 1: Backend DTO Update (CRITICAL)

**File**: `StudentEvent.java`
```java
@Getter
@Setter
@Builder
public class StudentEvent {
    @NotNull(message = "ExamSessionId is required")
    private Long examSessionId;
    
    // ✅ Add these fields
    private Long examSessionStudentId;
    private Long studentId;
    private String studentName;
    
    @NotNull(message = "Event type is required")
    private StudentEventEnum event;
    
    // ✅ Add these fields
    private String timestamp;  // ISO 8601 format
    private String deviceInfo; // "Windows", "Android", "iOS", etc.
}
```

---

### Priority 2: Frontend - Add Missing Events

#### 2a. Send WAITING event
**File**: `ExamPage.tsx` or `useStudentMonitoringWebSocket.ts`

```typescript
// Option 1: In ExamPage before exam starts
useEffect(() => {
  if (!isExamStarted && examSessionId && token && expiredAt) {
    // User is waiting to start
    sendEvent('WAITING')
  }
}, [isExamStarted, examSessionId, token, expiredAt])

// Option 2: In hook when connecting before exam
if (!isExamStarted) {
  setTimeout(() => sendEvent('WAITING'), 100)
} else {
  setTimeout(() => sendEvent('ENTER'), 100)
}
```

---

#### 2b. Send RECONNECTED event
**File**: `useStudentMonitoringWebSocket.ts`

```typescript
const isFirstConnect = useRef(true)
const wasConnected = useRef(false)

client.onConnect = () => {
  console.log('✅ WebSocket connected')
  isConnectedRef.current = true
  
  setTimeout(() => {
    if (isFirstConnect.current) {
      sendEvent(isExamStarted ? 'ENTER' : 'WAITING')
      isFirstConnect.current = false
      wasConnected.current = true
    } else if (wasConnected.current) {
      sendEvent('RECONNECTED')  // ✅ Add
      wasConnected.current = true
    }
  }, 100)
}

client.onDisconnect = () => {
  wasConnected.current = false
  isConnectedRef.current = false
}
```

---

#### 2c. Send TAB_SWITCH separately
**File**: `useStudentMonitoringWebSocket.ts`

```typescript
// Separate visibilitychange (tab switch) from blur (window minimize)
const handleVisibilityChange = () => {
  if (document.hidden) {
    sendEvent('TAB_SWITCH')        // ✅ Specific for tab
    lastFocusState.current = false
  } else {
    sendEvent('FOCUS_REGAINED')
    lastFocusState.current = true
  }
}

const handleBlur = () => {
  // Only send FOCUS_LOST if not already sent by visibilitychange
  if (lastFocusState.current && !document.hidden) {
    sendEvent('FOCUS_LOST')        // ✅ Only for window blur
    lastFocusState.current = false
  }
}
```

---

### Priority 3: Backend - Add Violation Tracking

**File**: `StudentMonitoringService.java` or similar

```java
@Service
public class StudentMonitoringServiceImpl {
    
    // In-memory or database tracking
    private Map<String, ViolationCount> violations = new ConcurrentHashMap<>();
    
    public User handleStudentEvent(Principal principal, StudentEvent event, String sessionId) {
        String key = event.getExamSessionId() + "_" + principal.getName();
        
        ViolationCount count = violations.getOrDefault(key, new ViolationCount());
        
        // Increment counts
        switch (event.getEvent()) {
            case FOCUS_LOST:
                count.incrementFocusLost();
                break;
            case TAB_SWITCH:
                count.incrementTabSwitch();
                break;
            case LEAVE:
                count.incrementLeave();
                break;
            // ... other events
        }
        
        violations.put(key, count);
        
        // ... rest of logic
    }
    
    public ViolationCount getViolationCount(Long examSessionId, Long userId) {
        String key = examSessionId + "_" + userId;
        return violations.getOrDefault(key, new ViolationCount());
    }
}
```

---

### Priority 4: Backend - Broadcast with Violation Count

**File**: `ClassEventHandlingController.java`

```java
@MessageMapping("/student/event")
public void handleStudentEvent(
    Principal principal,
    @Payload StudentEvent event,
    @Header("simpSessionId") String sessionId
) {
    Long userId = Long.parseLong(principal.getName());
    
    User user = studentMonitoringService.handleStudentEvent(principal, event, sessionId);
    ViolationCount violations = studentMonitoringService.getViolationCount(
        event.getExamSessionId(), 
        userId
    );
    
    messagingTemplate.convertAndSend(
        "/topic/exam/" + event.getExamSessionId(),
        StudentEventBroadcast.builder()
            .userId(userId)
            .username(user.getUsername())
            .event(event)
            .violationCount(violations.getTotal())      // ✅ Add
            .focusLostCount(violations.getFocusLost())  // ✅ Add
            .tabSwitchCount(violations.getTabSwitch())  // ✅ Add
            .build()
    );
}
```

---

## 8. Implementation Checklist

### Backend Changes

- [ ] **Update StudentEvent.java**
  - [ ] Add `examSessionStudentId` field
  - [ ] Add `studentId` field
  - [ ] Add `studentName` field
  - [ ] Add `timestamp` field
  - [ ] Add `deviceInfo` field

- [ ] **Update StudentEventBroadcast.java**
  - [ ] Add `violationCount` field
  - [ ] Add `focusLostCount` field
  - [ ] Add `tabSwitchCount` field
  - [ ] Add `timestamp` field (from event)

- [ ] **Implement Violation Tracking**
  - [ ] Create `ViolationCount` class
  - [ ] Add tracking logic in `StudentMonitoringService`
  - [ ] Broadcast counts with events

- [ ] **Testing**
  - [ ] Test all 9 event types
  - [ ] Verify broadcast format
  - [ ] Test violation counting

---

### Frontend Changes

- [ ] **Add WAITING event**
  - [ ] Send when student is on pre-exam screen
  - [ ] Update hook to handle pre-exam state

- [ ] **Add RECONNECTED event**
  - [ ] Track first connect vs reconnect
  - [ ] Send RECONNECTED on subsequent connects

- [ ] **Separate TAB_SWITCH from FOCUS_LOST**
  - [ ] Use TAB_SWITCH for visibilitychange
  - [ ] Use FOCUS_LOST only for window blur

- [ ] **Update Teacher UI**
  - [ ] Display violation counts
  - [ ] Show timestamp from event (not generated)
  - [ ] Add filters/alerts for high violation counts

- [ ] **Testing**
  - [ ] Test all event triggers
  - [ ] Verify teacher receives all events
  - [ ] Test UI updates correctly

---

## 9. Summary

### ✅ Currently Working (6/9 events)

1. **ENTER** - ✅ Fully implemented
2. **LEAVE** - ✅ Fully implemented  
3. **FOCUS_LOST** - ✅ Implemented (combined with TAB_SWITCH)
4. **FOCUS_REGAINED** - ✅ Fully implemented
5. **SUBMIT** - ✅ Fully implemented
6. **DISCONNECTED** - ✅ Fully implemented

### ⚠️ Partially Working (3/9 events)

7. **WAITING** - Backend ready, Frontend not sending
8. **TAB_SWITCH** - Backend ready, Frontend using FOCUS_LOST instead
9. **RECONNECTED** - Backend ready, Frontend using ENTER instead

### 🔴 Missing Features

- Backend không nhận đầy đủ payload fields (examSessionStudentId, timestamp, deviceInfo)
- Violation counting không được implement
- Teacher UI không hiển thị violation counts

### 📊 Compatibility Status

| Component | Status | Note |
|-----------|--------|------|
| Frontend Event Sending | 🟢 Good | Gửi đầy đủ payload |
| Backend Event Receiving | 🟡 Partial | Chỉ nhận examSessionId + event |
| Backend Event Broadcasting | 🟢 Good | Broadcast đúng topic |
| Teacher Event Receiving | 🟢 Good | Nhận và display đúng |
| Event Coverage | 🟡 Partial | 6/9 events active |
| Payload Completeness | 🔴 Poor | Backend bỏ qua nhiều fields |

---

**Recommendation**: Ưu tiên update Backend DTO trước để nhận đầy đủ thông tin từ Frontend, sau đó implement các events còn thiếu và violation tracking.
