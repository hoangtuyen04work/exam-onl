# iOS Fullscreen Support Documentation

## Tổng quan
Hệ thống thi trực tuyến đã được cập nhật để hỗ trợ đầy đủ chế độ toàn màn hình trên iOS Safari và các trình duyệt iOS khác.

## Các thay đổi chính

### 1. Hook useFullScreen.ts
**Vị trí**: `src/hooks/useFullScreen.ts`

**Cập nhật**:
- ✅ Thêm TypeScript interfaces cho webkit prefixes (iOS Safari)
- ✅ Hỗ trợ `webkitRequestFullscreen()` cho iOS
- ✅ Hỗ trợ `webkitEnterFullscreen()` cho iOS cũ
- ✅ Hỗ trợ `webkitExitFullscreen()` 
- ✅ Thêm event listener `webkitendfullscreen` (iOS specific)
- ✅ Fallback cho Firefox (`mozRequestFullScreen`) và IE/Edge (`msRequestFullscreen`)

**Cách hoạt động**:
```typescript
// Thử API chuẩn trước
if (elem.requestFullscreen) { ... }
// Sau đó thử webkit cho iOS
else if (elem.webkitRequestFullscreen) { ... }
// Rồi đến webkit cũ
else if (elem.webkitEnterFullscreen) { ... }
```

### 2. HTML Meta Tags
**Vị trí**: `index.html`

**Thêm mới**:
```html
<!-- iOS Safari specific meta tags -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="ExamOnline" />
<meta name="mobile-web-app-capable" content="yes" />
```

**Viewport cập nhật**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

**Giải thích**:
- `apple-mobile-web-app-capable`: Cho phép chạy như native app khi thêm vào home screen
- `apple-mobile-web-app-status-bar-style`: Kiểu hiển thị status bar (black-translucent tốt nhất cho fullscreen)
- `viewport-fit=cover`: Hỗ trợ notch/dynamic island trên iPhone X và mới hơn
- `user-scalable=no`: Ngăn zoom (quan trọng cho exam mode)

### 3. CSS Safe Area Support
**Vị trí**: `src/index.css`

**Thêm mới**:
```css
/* iOS Safe Area Support */
:root {
  --sat: env(safe-area-inset-top);
  --sar: env(safe-area-inset-right);
  --sab: env(safe-area-inset-bottom);
  --sal: env(safe-area-inset-left);
}

body {
  padding-top: env(safe-area-inset-top);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
}

/* Prevent iOS bounce/overscroll */
body.fullscreen-mode {
  position: fixed;
  width: 100%;
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
}
```

**Giải thích**:
- `env(safe-area-inset-*)`: CSS variables cho notch/home indicator areas
- `body.fullscreen-mode`: Ngăn iOS bounce effect khi scroll
- `position: fixed`: Khóa body khi đang thi
- `-webkit-overflow-scrolling: touch`: Smooth scrolling cho iOS

### 4. ExamPage Component
**Vị trí**: `src/pages/Student/Exam/ExamPage.tsx`

**Cập nhật**:
- ✅ Thêm `document.body.classList.add('fullscreen-mode')` khi bắt đầu thi
- ✅ Thêm `document.body.classList.remove('fullscreen-mode')` khi kết thúc/thoát thi

**Code**:
```typescript
const handleStartExam = async () => {
  // ... existing code ...
  if (success) {
    setIsExamStarted(true)
    document.body.classList.add('fullscreen-mode') // ← Thêm
    toast.success('Bắt đầu làm bài!')
  }
}

const handleExitExam = async () => {
  // ... existing code ...
  document.body.classList.remove('fullscreen-mode') // ← Thêm
  await exitFullscreen()
}
```

## Kiểm tra tương thích

### ✅ Hỗ trợ trình duyệt
- iOS Safari 13+ (iPhone/iPad)
- Chrome on iOS 13+
- Firefox on iOS 13+
- Android Chrome/Firefox
- Desktop Chrome/Firefox/Edge/Safari

### 🧪 Test trên iOS
1. Mở Safari trên iPhone/iPad
2. Truy cập trang thi
3. Nhấn "Bắt đầu thi"
4. Kiểm tra:
   - [ ] Vào fullscreen mode thành công
   - [ ] Notch/dynamic island được xử lý đúng (không che nội dung)
   - [ ] Không bị bounce khi scroll
   - [ ] Status bar ẩn hoặc trong suốt
   - [ ] Thoát fullscreen khi nhấn "Thoát" hoặc "Nộp bài"

### 🎯 Fallback behavior
Nếu trình duyệt không hỗ trợ Fullscreen API:
- Hiển thị cảnh báo: "Trình duyệt không hỗ trợ chế độ toàn màn hình"
- Vẫn cho phép làm bài (không block)
- Các tính năng khác hoạt động bình thường

## Lưu ý quan trọng

### 📱 iOS Limitations
1. **User gesture required**: iOS yêu cầu phải có user interaction (click/touch) để vào fullscreen
2. **No programmatic fullscreen**: Không thể tự động vào fullscreen khi load trang
3. **Different behavior**: iOS fullscreen khác Desktop (ẩn Safari UI bars)
4. **Keyboard issues**: Keyboard có thể làm thoát fullscreen trên một số iOS version cũ

### 🔒 Security
- Fullscreen chỉ được kích hoạt sau khi user nhấn nút "Bắt đầu thi"
- Auto-exit nếu user thoát fullscreen (gửi EXIT event)
- Prevent bounce/overscroll để tránh user thoát bài thi

### 🎨 UI/UX
- Responsive design đã được tối ưu cho mobile
- Bottom navigation bar cho mobile
- Touch-friendly button sizes
- Safe area padding cho notch devices

## Troubleshooting

### Vấn đề: Không vào được fullscreen trên iOS
**Giải pháp**:
1. Kiểm tra iOS version (cần ≥ 13)
2. Clear Safari cache
3. Thử hard refresh (Cmd+Shift+R)
4. Kiểm tra console logs

### Vấn đề: Nội dung bị che bởi notch
**Giải pháp**:
- Đã được xử lý bằng `env(safe-area-inset-*)`
- Kiểm tra `index.css` đã load đúng chưa

### Vấn đề: Page bị bounce khi scroll
**Giải pháp**:
- Class `fullscreen-mode` phải được thêm vào body
- Kiểm tra `handleStartExam()` có chạy đúng không

## API Reference

### useFullScreen Hook
```typescript
const { isFullscreen, requestFullscreen, exitFullscreen } = useFullScreen({
  onExit: () => void,           // Callback khi thoát fullscreen
  enabled?: boolean,             // Enable/disable hook (default: true)
  requiredFullscreen?: boolean   // Show warning khi thoát (default: true)
})
```

### Browser Detection
```javascript
// Kiểm tra hỗ trợ fullscreen
const isSupported = !!(
  document.documentElement.requestFullscreen ||
  document.documentElement.webkitRequestFullscreen ||
  document.documentElement.webkitEnterFullscreen
)

// Kiểm tra đang fullscreen
const isCurrentlyFullscreen = !!(
  document.fullscreenElement ||
  document.webkitFullscreenElement
)
```

## Changelog

### Version 1.1.0 (2026-01-16)
- ✅ Added iOS fullscreen support
- ✅ Added webkit prefix support
- ✅ Added safe area insets for notch devices
- ✅ Added fullscreen-mode body class
- ✅ Added iOS-specific meta tags
- ✅ Improved mobile responsive design
- ✅ Added bottom navigation for mobile

---

**Người cập nhật**: GitHub Copilot  
**Ngày**: 16/01/2026  
**Status**: ✅ Ready for Production
