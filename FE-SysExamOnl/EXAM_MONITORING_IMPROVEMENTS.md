# Cập Nhật Hệ Thống Giám Sát Hành Vi Làm Bài Thi

## Tổng Quan

Document này mô tả các cải tiến đã thực hiện cho hệ thống giám sát hành vi học sinh khi làm bài thi trực tuyến.

---

## 1. Các Vấn Đề Đã Khắc Phục

### 1.1 Duplicate Event Listeners
**Vấn đề**: Cả `ExamPage.tsx` và `useStudentMonitoringWebSocket.ts` đều đăng ký cùng các event listeners (visibilitychange, blur, focus), dẫn đến gửi events trùng lặp.

**Giải pháp**: 
- Thêm option `enableAutoFocusTracking` vào hook để component cha có thể tắt auto tracking
- ExamPage tắt auto tracking và tự quản lý events để có control tốt hơn

### 1.2 Event Types Không Rõ Ràng
**Vấn đề**: Sử dụng LEAVE, FOCUS_LOST chung cho nhiều hành vi khác nhau.

**Giải pháp**: Phân loại rõ ràng các event types:
- `TAB_SWITCH` - Chuyển tab (visibilitychange)
- `FOCUS_LOST` - Chuyển cửa sổ (window blur)
- `FULLSCREEN_EXIT` - Thoát fullscreen
- `WINDOW_RESIZE` - Thay đổi kích thước cửa sổ
- `DISCONNECTED` - Đóng/reload trang

### 1.3 WebSocket Event Queue
**Vấn đề**: Events quan trọng bị mất khi WebSocket chưa connected.

**Giải pháp**: 
- Thêm `pendingEventsRef` để queue events khi chưa connected
- Flush pending events sau khi reconnect thành công
- Thêm `RECONNECTED` event để track reconnection

### 1.4 Debounce Logic
**Vấn đề**: Events được gửi quá nhiều lần trong thời gian ngắn.

**Giải pháp**: 
- Thêm debounce per event type (1.5s cho focus events, 0.5s cho các events khác)
- Track `lastEventTimeRef` để tránh duplicate

---

## 2. Event Types Mới

| Event | Trigger | Mục đích |
|-------|---------|----------|
| `TAB_SWITCH` | `visibilitychange` (document.hidden) | Phát hiện chuyển tab |
| `FOCUS_LOST` | `window.blur` (khi tab visible) | Phát hiện chuyển cửa sổ |
| `FOCUS_REGAINED` | `window.focus` hoặc tab visible | Quay lại trang thi |
| `FULLSCREEN_EXIT` | `fullscreenchange` | Thoát chế độ toàn màn hình |
| `WINDOW_RESIZE` | `resize` (khi size < 80% screen) | Phát hiện minimize/resize |
| `DISCONNECTED` | `beforeunload` | Đóng/reload trang đột ngột |
| `RECONNECTED` | WebSocket reconnect | Kết nối lại sau disconnect |
| `ENTER` | WebSocket first connect | Bắt đầu làm bài |
| `LEAVE` | User exit / cleanup | Thoát bài thi |
| `SUBMIT` | Nộp bài final | Hoàn thành bài thi |

---

## 3. Cấu Trúc Code

### 3.1 useStudentMonitoringWebSocket.ts

```typescript
// Các params mới
export const useStudentMonitoringWebSocket = (
  examSessionId: number | null,
  token: string | null,
  isExamStarted: boolean,
  examSessionStudentId?: number | null,
  studentInfo?: { id?: number; name?: string },
  options: UseStudentMonitoringOptions = {} // NEW: options để control behavior
)

// Interface mới
interface UseStudentMonitoringOptions {
  enableAutoFocusTracking?: boolean; // default: true
}

// Return type mới
return { 
  sendEvent,      // Function để gửi event
  isConnected     // Function để check connection status
}
```

### 3.2 ExamPage.tsx

```typescript
// Sử dụng hook với auto focus tracking disabled
const { sendEvent } = useStudentMonitoringWebSocket(
  examSessionId,
  token,
  isExamStarted,
  examSessionStudentId,
  { id: user?.id, name: user?.name },
  { enableAutoFocusTracking: false } // Tắt để tự quản lý
)

// Tự quản lý các event listeners
// - visibilitychange -> TAB_SWITCH
// - blur/focus -> FOCUS_LOST/FOCUS_REGAINED  
// - fullscreenchange -> FULLSCREEN_EXIT
// - resize -> WINDOW_RESIZE
// - beforeunload -> DISCONNECTED
```

### 3.3 useFullScreen.ts

```typescript
// Thêm exit count tracking
const [exitCount, setExitCount] = useState(0)

// Log khi exit fullscreen
console.log(`[Fullscreen] Exit detected (count: ${exitCount + 1})`)
```

---

## 4. Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXAM PAGE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────────────────────────────┐  │
│  │ Start Exam   │────>│ Request Fullscreen (Desktop/Android) │  │
│  └──────────────┘     └──────────────────────────────────────┘  │
│         │                                                        │
│         v                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              WebSocket Connect                            │   │
│  │              sendEvent('ENTER')                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                                                        │
│         v                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Event Monitoring                             │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ visibilitychange -> TAB_SWITCH / FOCUS_REGAINED   │  │   │
│  │  │ window.blur -> FOCUS_LOST                         │  │   │
│  │  │ window.focus -> FOCUS_REGAINED                    │  │   │
│  │  │ fullscreenchange -> FULLSCREEN_EXIT               │  │   │
│  │  │ resize -> WINDOW_RESIZE                           │  │   │
│  │  │ beforeunload -> DISCONNECTED                      │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                                                        │
│         v                                                        │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │ Submit Exam  │────>│ sendEvent    │────>│ Exit Fullscreen│   │
│  │              │     │ ('SUBMIT')   │     │ Navigate away  │   │
│  └──────────────┘     └──────────────┘     └──────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Event Payload Structure

```typescript
interface StudentEvent {
  examSessionId: number;           // ID của phiên thi
  examSessionStudentId?: number;   // ID của thí sinh trong phiên
  studentId?: number;              // ID của student
  studentName?: string;            // Tên student
  event: EventType;                // Loại event
  timestamp?: string;              // ISO 8601 timestamp
  deviceInfo?: string;             // Device info (vd: "Windows (1920x1080)")
  additionalInfo?: string;         // Thông tin bổ sung (vd: screen size khi resize)
}
```

---

## 6. Best Practices

### 6.1 Debounce Events
```typescript
// Tránh gửi events quá nhiều lần
const debounceTime = ['FOCUS_LOST', 'FOCUS_REGAINED', 'WINDOW_RESIZE', 'TAB_SWITCH']
  .includes(event) ? 1500 : 500;

if (now - lastTime < debounceTime) {
  return; // Skip duplicate event
}
```

### 6.2 Queue Important Events
```typescript
// Queue events khi chưa connected
const importantEvents = ['ENTER', 'LEAVE', 'SUBMIT', 'DISCONNECTED', 'FULLSCREEN_EXIT'];
if (importantEvents.includes(event)) {
  pendingEventsRef.current.push(event);
}
```

### 6.3 Distinguish Tab Switch vs Window Blur
```typescript
// Tab switch (visibilitychange)
if (document.hidden) {
  sendEvent('TAB_SWITCH', 'Tab hidden');
}

// Window blur (but tab still visible)
if (!document.hidden) {
  sendEvent('FOCUS_LOST', 'Window blur');
}
```

---

## 7. Testing Checklist

### Desktop (Chrome/Firefox/Edge)
- [ ] Bắt đầu thi -> ENTER event
- [ ] Chuyển tab -> TAB_SWITCH event  
- [ ] Chuyển cửa sổ -> FOCUS_LOST event
- [ ] Quay lại -> FOCUS_REGAINED event
- [ ] Thoát fullscreen (ESC) -> FULLSCREEN_EXIT event
- [ ] Resize window -> WINDOW_RESIZE event (if < 80%)
- [ ] Đóng tab -> DISCONNECTED event
- [ ] Nộp bài -> SUBMIT event

### Android (Chrome)
- [ ] Bắt đầu thi -> ENTER event
- [ ] Chuyển app -> TAB_SWITCH event
- [ ] Quay lại -> FOCUS_REGAINED event
- [ ] Thoát fullscreen -> FULLSCREEN_EXIT event
- [ ] Nộp bài -> SUBMIT event

### iOS (Safari)
- [ ] Bắt đầu thi -> ENTER event (không fullscreen)
- [ ] Chuyển app -> TAB_SWITCH event
- [ ] Quay lại -> FOCUS_REGAINED event
- [ ] Nộp bài -> SUBMIT event

---

## 8. Troubleshooting

### Events không được gửi
1. Check WebSocket connection status: `isConnected()`
2. Check console log: `[WS] Event queued (not connected)`
3. Verify examSessionId và token có giá trị

### Duplicate events
1. Check debounce time trong console: `[WS] Event X debounced`
2. Verify `enableAutoFocusTracking: false` nếu tự xử lý

### Fullscreen không hoạt động
1. Check device type: iOS không hỗ trợ fullscreen trên Safari
2. Verify `requiresFullscreen` flag
3. Check browser permissions

---

## 9. Future Improvements

1. **Violation Counting**: Backend track số lần vi phạm mỗi loại
2. **Screenshot on Violation**: Chụp màn hình khi có hành vi nghi ngờ  
3. **AI Detection**: Phát hiện pattern gian lận
4. **Real-time Alerts**: Cảnh báo giáo viên ngay lập tức
5. **Session Recording**: Ghi lại toàn bộ session để review sau
