# WebSocket Event Tracking - Exam Monitoring

## Tổng quan

Hệ thống tracking học sinh trong khi làm bài thi sử dụng **2 kênh song song**:

1. **HTTP REST API** (`/student/exam/exit`) - Ghi log vào database
2. **WebSocket** (STOMP) - Real-time monitoring cho giáo viên

## Kiến trúc Dual-Channel Tracking

```
Student Actions → ExamPage.tsx
                     ↓
        ┌────────────┴────────────┐
        ↓                         ↓
   HTTP REST API            WebSocket STOMP
 (/student/exam/exit)    (/app/student/event)
        ↓                         ↓
   Database Logs          Real-time Dashboard
   (Persistent)           (Live Monitoring)
```

## WebSocket Events - Danh sách đầy đủ

### 1. **ENTER** Event
**Trigger**: Học sinh vào lại tab sau khi chuyển tab
**Payload**:
```typescript
{
  examSessionId: number,
  examSessionStudentId?: number,
  studentId?: number,
  studentName?: string,
  event: 'ENTER',
  timestamp: '2026-01-16T10:30:00.000Z',
  deviceInfo: 'Chrome 120.0 on Windows 10'
}
```
**Use case**: Tracking khi học sinh quay lại làm bài

---

### 2. **LEAVE** Event
**Trigger**: 
- Chuyển tab (tab hidden)
- Thoát fullscreen
- Close/reload browser
- Click nút "Thoát"
- Minimize window (nếu detect được)

**Payload**:
```typescript
{
  examSessionId: number,
  examSessionStudentId?: number,
  studentId?: number,
  studentName?: string,
  event: 'LEAVE',
  timestamp: '2026-01-16T10:35:00.000Z',
  deviceInfo: 'Chrome 120.0 on Windows 10'
}
```
**Use case**: 
- Phát hiện gian lận (chuyển tab để tra cứu)
- Tracking violations
- Real-time alert cho giáo viên

---

### 3. **SUBMIT** Event
**Trigger**: Học sinh nộp bài (FINAL submission)
**Payload**:
```typescript
{
  examSessionId: number,
  examSessionStudentId?: number,
  studentId?: number,
  studentName?: string,
  event: 'SUBMIT',
  timestamp: '2026-01-16T11:00:00.000Z',
  deviceInfo: 'Chrome 120.0 on Windows 10'
}
```
**Use case**: Tracking khi học sinh hoàn thành bài thi

---

### 4. **WAITING** Event (Optional)
**Trigger**: Học sinh đang chờ bắt đầu làm bài
**Use case**: Monitoring số lượng học sinh sẵn sàng

---

## Implementation Details

### File: `ExamPage.tsx`

#### 1. Visibility Change (Tab Switch)
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden && isExamStartedRef.current) {
      sendEventLog('EXIT')     // HTTP API
      sendEvent('LEAVE')        // WebSocket ✅
    } else if (!document.hidden && isExamStartedRef.current) {
      sendEvent('ENTER')        // WebSocket ✅
    }
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [sendEventLog, sendEvent])
```

**Scenarios**:
- User chuyển sang tab khác: `LEAVE` event
- User quay lại tab bài thi: `ENTER` event
- Giáo viên nhìn thấy real-time khi học sinh chuyển tab

---

#### 2. Before Unload (Close/Reload Browser)
```typescript
useEffect(() => {
  const handleBeforeUnload = () => {
    if (isExamStartedRef.current) {
      sendEventLog('SUBMIT_DRAFT') // HTTP API - Save answers
      sendEventLog('EXIT')          // HTTP API - Log exit
      sendEvent('LEAVE')            // WebSocket ✅
    }
  }
  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [examSessionId, sendEventLog, sendEvent])
```

**Scenarios**:
- User đóng tab/browser: `LEAVE` event
- User reload trang: `LEAVE` event
- Automatic draft save trước khi thoát

---

#### 3. Fullscreen Exit
```typescript
useEffect(() => {
  const handleFullscreenChange = () => {
    const isFullscreen = !!document.fullscreenElement
    if (!isFullscreen && isExamStartedRef.current) {
      sendEventLog('EXIT')     // HTTP API
      sendEvent('LEAVE')        // WebSocket ✅
    }
  }
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  // ... other vendors (webkit, moz, ms)
}, [isExamStarted, sendEventLog, sendEvent])
```

**Scenarios**:
- User nhấn ESC để thoát fullscreen: `LEAVE` event
- User dùng F11 để thoát: `LEAVE` event
- Desktop/Android only (iOS không require fullscreen)

---

#### 4. Exit Button Click
```typescript
const handleExitExam = useCallback(async () => {
  sendEvent('LEAVE')        // WebSocket ✅
  sendEventLog('EXIT')      // HTTP API
  sendEventLog('SUBMIT_DRAFT') // HTTP API
  
  // ... cleanup and navigate
}, [sendEvent, sendEventLog])
```

**Scenarios**:
- User click nút "Thoát" intentionally
- Clean exit với draft save

---

#### 5. Submit Exam (Final)
```typescript
const submitExam = useCallback((state: 'DRAFT' | 'FINAL') => {
  // ... submit logic
  if (state === 'FINAL') {
    sendEvent('SUBMIT')  // WebSocket ✅
    // ... navigate to results
  }
}, [sendEvent])
```

**Scenarios**:
- User nộp bài thành công: `SUBMIT` event
- Giáo viên thấy real-time khi học sinh nộp bài

---

## WebSocket Hook Integration

### File: `useStudentMonitoringWebSocket.ts`

```typescript
const { sendEvent } = useStudentMonitoringWebSocket(
  examSessionId,
  token,
  isExamStarted,
  examSessionStudentId,
  { id: user?.id, name: user?.name }
)

// Usage:
sendEvent('ENTER')   // Vào tab
sendEvent('LEAVE')   // Rời tab/fullscreen/close
sendEvent('SUBMIT')  // Nộp bài
```

**Payload Structure**:
```typescript
interface StudentEvent {
  examSessionId: number;
  examSessionStudentId?: number;  // ✅ Added
  studentId?: number;              // ✅ Added
  studentName?: string;            // ✅ Added
  event: 'WAITING' | 'ENTER' | 'LEAVE' | 'SUBMIT';
  timestamp?: string;              // ✅ Added
  deviceInfo?: string;             // ✅ Added
}
```

---

## Event Flow Diagram

### Scenario 1: Tab Switch (Chuyển tab)
```
1. User đang làm bài (tab focused)
2. User click vào tab khác → document.hidden = true
3. ✅ sendEvent('LEAVE') → WebSocket → Teacher dashboard updates
4. ✅ sendEventLog('EXIT') → HTTP API → Database log
5. User click lại tab bài thi → document.hidden = false
6. ✅ sendEvent('ENTER') → WebSocket → Teacher sees student back
```

### Scenario 2: Fullscreen Exit (Thoát toàn màn hình)
```
1. User đang làm bài (fullscreen mode - Desktop/Android)
2. User nhấn ESC → fullscreenchange event
3. ✅ sendEvent('LEAVE') → WebSocket → Real-time alert
4. ✅ sendEventLog('EXIT') → HTTP API → Database log
5. Toast error: "Thoát toàn màn hình — bài thi kết thúc!"
6. Navigate to /student after 1.5s
```

### Scenario 3: Close Browser (Đóng tab/browser)
```
1. User đang làm bài
2. User click X (close tab) → beforeunload event
3. ✅ sendEvent('LEAVE') → WebSocket (keepalive: true)
4. ✅ sendEventLog('EXIT') → HTTP API (keepalive: true)
5. ✅ sendEventLog('SUBMIT_DRAFT') → Save answers
6. Tab/browser closes
```

### Scenario 4: Submit Exam (Nộp bài)
```
1. User click nút "Nộp bài"
2. submitExam('FINAL') called
3. Submit answers to backend
4. ✅ sendEvent('SUBMIT') → WebSocket → Teacher sees completion
5. Navigate to /student/exam/{id}/result
```

---

## Backend Integration Requirements

### WebSocket Endpoint
**Destination**: `/app/student/event`

**Expected Payload**:
```json
{
  "examSessionId": 123,
  "examSessionStudentId": 456,
  "studentId": 789,
  "studentName": "Nguyễn Văn A",
  "event": "LEAVE",
  "timestamp": "2026-01-16T10:35:00.000Z",
  "deviceInfo": "Chrome 120.0 on Windows 10"
}
```

**Backend Actions**:
1. Broadcast to `/topic/exam/{examSessionId}/monitoring`
2. Update student status in memory (optional)
3. Log to database (optional, if duplicate logging needed)

---

### Subscription for Teachers
**Topic**: `/topic/exam/{examSessionId}/monitoring`

**Message Format**:
```json
{
  "examSessionStudentId": 456,
  "studentId": 789,
  "studentName": "Nguyễn Văn A",
  "event": "LEAVE",
  "timestamp": "2026-01-16T10:35:00.000Z",
  "deviceInfo": "Chrome 120.0 on Windows 10",
  "violationCount": 3
}
```

**Teacher Dashboard Updates**:
- Real-time student status badges
- Violation counters
- Alert notifications for suspicious behavior

---

## Event Tracking Coverage

| Scenario | HTTP API | WebSocket | Notes |
|----------|----------|-----------|-------|
| **Chuyển tab** | ✅ EXIT | ✅ LEAVE + ENTER | Phát hiện tra cứu |
| **Thoát fullscreen** | ✅ EXIT | ✅ LEAVE | Desktop/Android only |
| **Close/Reload tab** | ✅ EXIT + DRAFT | ✅ LEAVE | keepalive: true |
| **Click nút Thoát** | ✅ EXIT + DRAFT | ✅ LEAVE | Clean exit |
| **Nộp bài** | ✅ SUBMIT API | ✅ SUBMIT | Completion tracking |
| **Quay lại tab** | ❌ | ✅ ENTER | Real-time only |
| **Minimize window** | ✅ EXIT | ❌ | Best effort detection |

---

## Testing Checklist

### ✅ Test Cases

#### TC1: Tab Switch Detection
```
Steps:
1. Bắt đầu làm bài
2. Mở DevTools → Network → WS filter
3. Chuyển sang tab khác
4. Chuyển lại tab bài thi

Expected WebSocket Messages:
- LEAVE event (khi chuyển đi)
- ENTER event (khi quay lại)
```

#### TC2: Fullscreen Exit (Desktop/Android)
```
Steps:
1. Bắt đầu làm bài (fullscreen)
2. Nhấn ESC
3. Quan sát WebSocket

Expected:
- LEAVE event sent
- Toast error hiển thị
- Navigate to /student
```

#### TC3: Close Browser
```
Steps:
1. Bắt đầu làm bài
2. Click X để đóng tab
3. Check backend logs

Expected:
- LEAVE event sent (beforeunload)
- EXIT HTTP API called
- SUBMIT_DRAFT HTTP API called
```

#### TC4: Submit Exam
```
Steps:
1. Làm bài và trả lời câu hỏi
2. Click "Nộp bài"
3. Quan sát WebSocket

Expected:
- SUBMIT event sent
- Navigate to result page
```

#### TC5: Teacher Dashboard Real-time Update
```
Steps:
1. Giáo viên mở monitoring dashboard
2. Học sinh bắt đầu làm bài
3. Học sinh chuyển tab
4. Giáo viên quan sát dashboard

Expected:
- Dashboard hiển thị LEAVE event
- Violation counter tăng
- Student status badge updates
```

---

## Browser Compatibility

### WebSocket Support
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & iOS)
- ✅ Samsung Internet (Android)

### Event Listeners
| Event | Chrome | Firefox | Safari | Edge |
|-------|--------|---------|--------|------|
| visibilitychange | ✅ | ✅ | ✅ | ✅ |
| beforeunload | ✅ | ✅ | ✅ | ✅ |
| fullscreenchange | ✅ | ✅ | ⚠️ iOS limited | ✅ |

**Notes**:
- iOS Safari: Limited fullscreen API, không require fullscreen
- keepalive: true - Works on modern browsers for beforeunload

---

## Performance Considerations

### Debouncing
```typescript
const lastExitEventTimeRef = useRef<number>(0)

// Trong sendEventLog:
if (timeSinceLastExit < 2000 && lastExitEventTimeRef.current > 0) {
  console.log('EXIT event debounced, skipping')
  return
}
```

**Reason**: Tránh spam events khi user switch tab nhanh

### WebSocket Connection Management
- Auto-reconnect on disconnect
- Connection status monitoring
- Graceful degradation nếu WebSocket fail

### Network Efficiency
- Payload size: ~200-300 bytes per event
- Compression: STOMP protocol built-in
- Bandwidth: Minimal (<1KB/minute active tracking)

---

## Security Considerations

### Authorization
```typescript
// WebSocket header
headers: {
  'Authorization': `Bearer ${token}`
}
```

**Backend Validation**:
- Verify JWT token
- Check examSessionStudentId belongs to user
- Validate examSessionId access

### Event Validation
**Backend checks**:
- Student is registered for exam
- Exam is currently active
- Event timestamp is reasonable (not future/too old)

### Rate Limiting
**Suggested limits**:
- Max 10 events per minute per student
- Block if violation count > threshold
- Alert admin for suspicious patterns

---

## Monitoring & Debugging

### Console Logs
```typescript
console.log('[DEBUG] Tab hidden detected - sending LEAVE WebSocket')
console.log('[DEBUG] Exited fullscreen - sending LEAVE WebSocket')
console.log('[DEBUG] Sending SUBMIT event')
```

**Production**: Remove hoặc chuyển sang proper logging service

### WebSocket DevTools
**Chrome DevTools** → Network → WS:
- See all WebSocket frames
- Inspect payloads
- Monitor connection status

### Backend Logging
**Recommend logging**:
- All student events with timestamp
- Connection/disconnection events
- Error messages and failures

---

## Future Enhancements

### 1. Advanced Violation Detection
```typescript
sendEvent('VIOLATION', {
  type: 'MULTIPLE_TAB_SWITCHES',
  count: 5,
  timeWindow: '60s'
})
```

### 2. Screen Recording
```typescript
sendEvent('SCREEN_CAPTURE', {
  screenshotUrl: 'base64...',
  timestamp: '...'
})
```

### 3. Mouse/Keyboard Activity
```typescript
sendEvent('ACTIVITY', {
  mouseClicks: 150,
  keystrokes: 2000,
  timeWindow: '5m'
})
```

### 4. AI Behavior Analysis
- Pattern detection for cheating
- Anomaly detection
- Risk scoring per student

---

## Summary

### Đã implement
✅ **ENTER** event - Khi quay lại tab  
✅ **LEAVE** event - Chuyển tab, thoát fullscreen, close browser, click Thoát  
✅ **SUBMIT** event - Nộp bài thành công  
✅ Dual-channel tracking (HTTP + WebSocket)  
✅ Device info và timestamp trong payload  
✅ Debouncing để tránh spam  
✅ keepalive cho beforeunload  

### Coverage
- ✅ Tab switch: HTTP + WebSocket
- ✅ Fullscreen exit: HTTP + WebSocket
- ✅ Browser close: HTTP + WebSocket
- ✅ Submit exam: HTTP + WebSocket
- ✅ Return to tab: WebSocket only (ENTER)

### Backend cần làm
- Update StudentEvent DTO để nhận các field mới
- Broadcast events to teacher dashboard topic
- Optional: Database logging for WebSocket events
- Rate limiting và validation

**Files changed**:
- `src/pages/Student/Exam/ExamPage.tsx` (3 useEffect updates)
  - visibilitychange: Added sendEvent('LEAVE') + sendEvent('ENTER')
  - beforeunload: Added sendEvent('LEAVE')
  - fullscreenchange: Added sendEvent('LEAVE')
