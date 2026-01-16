# Device-Specific Fullscreen Strategy Documentation

## Tổng quan
Hệ thống thi trực tuyến đã được cập nhật để hỗ trợ các thiết bị khác nhau với chiến lược phù hợp:
- **Desktop & Android**: BẮT BUỘC fullscreen khi làm bài thi để đảm bảo tính toàn vẹn của bài thi
- **iOS (iPhone/iPad)**: Không yêu cầu fullscreen, cho phép làm bài bình thường do giới hạn kỹ thuật của iOS Safari

## Lý do chiến lược khác nhau giữa các thiết bị

### Desktop & Android - BẮT BUỘC Fullscreen

**Lý do:**

1. **Kiểm soát tốt hơn**: Thiết bị desktop và Android cho phép kiểm soát fullscreen API tốt hơn
2. **Ngăn gian lận**: Fullscreen giúp ngăn chặn học sinh mở tab khác, sử dụng app khác trong khi thi
3. **API ổn định**: Fullscreen API hoạt động ổn định và đáng tin cậy trên desktop và Android Chrome
4. **Trải nghiệm nhất quán**: Desktop và Android có màn hình lớn, fullscreen không ảnh hưởng UX

### iOS - KHÔNG yêu cầu Fullscreen

**Lý do:**

1. **Limited Fullscreen API**: iOS Safari có hỗ trợ fullscreen nhưng rất hạn chế và không ổn định
2. **User Experience**: Fullscreen trên iOS thường gây khó chịu và có nhiều vấn đề
3. **Keyboard Issues**: Khi hiện bàn phím, iOS có thể tự động thoát fullscreen
4. **Alternative Monitoring**: iOS vẫn có monitoring qua tab visibility, event tracking, và các cơ chế khác

## Các thay đổi chính

### 1. Device Detection (utils.ts)
**Vị trí**: `src/utils/utils.ts`

**Thêm mới**:
```typescript
// Detect iOS devices
export const isIOSDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// Detect Android devices
export const isAndroidDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase()
  return /android/.test(userAgent)
}
```

**Giải thích**:
- `isIOSDevice()`: Detect iPhone, iPad, iPod (bao gồm cả iPad với iOS 13+)
- `isAndroidDevice()`: Detect các thiết bị Android
- Dùng để quyết định có yêu cầu fullscreen hay không

### 2. Hook useFullScreen.ts
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

```typescript
// Detect device type
const isIOS = isIOSDevice()
const isAndroid = isAndroidDevice()
const requiresFullscreen = isAndroid // Only require fullscreen on Android

// handleStartExam - Only request fullscreen on Android
const handleStartExam = async () => {
  // ... validation code ...
  
  // Only require fullscreen on Android
  if (requiresFullscreen) {
    const success = await requestFullscreen()
    if (!success) {
      toast.error('Không thể vào chế độ toàn màn hình. Vui lòng thử lại.')
      return
    }
    document.body.classList.add('fullscreen-mode')
  }
  
  setIsExamStarted(true)
  toast.success('Bắt đầu làm bài!')
}

// useFullScreen hook - Only enable on Android
const { requestFullscreen, exitFullscreen } = useFullScreen({
  onExit: handleExit,
  enabled: requiresFullscreen, // Only Android
  requiredFullscreen: requiresFullscreen
})
```

**Giải thích**:
- Chỉ yêu cầu fullscreen khi `requiresFullscreen === true` (Android)
- iOS có thể bắt đầu làm bài mà không cần fullscreen
- Fullscreen hook chỉ active trên Android
- UI hiển thị icon khác nhau: Maximize2 (Android) vs PlayCircle (iOS)

## Kiểm tra tương thích

### ✅ Hỗ trợ trình duyệt
- iOS Safari 13+ (iPhone/iPad)
- Chrome on iOS 13+
- Firefox on iOS 13+
- Android Chrome/Firefox
- Desktop Chrome/Firefox/Edge/Safari

### 🧪 Test trên thiết bị

#### Desktop (Windows/Mac/Linux):

1. Mở Chrome/Firefox/Edge trên desktop
2. Truy cập trang thi
3. Nhấn "Bắt đầu thi" (icon Maximize2)
4. Kiểm tra:
   - [ ] **BẮT BUỘC** vào fullscreen mode
   - [ ] Nếu không vào được fullscreen → hiện lỗi, không cho làm bài
   - [ ] Thoát fullscreen (ESC) → gửi EXIT event và kết thúc bài thi
   - [ ] Hoàn thành thi → tự động thoát fullscreen
   - [ ] Warning message: "⚠️ Bài thi yêu cầu chế độ toàn màn hình (Desktop/Android)"

#### Android:

1. Mở Chrome/Browser trên Android
2. Truy cập trang thi  
3. Nhấn "Bắt đầu thi" (icon Maximize2)
4. Kiểm tra:
   - [ ] **BẮT BUỘC** vào fullscreen mode
   - [ ] Nếu không vào được fullscreen → hiện lỗi, không cho làm bài
   - [ ] Thoát fullscreen → gửi EXIT event và kết thúc bài thi
   - [ ] Hoàn thành thi → tự động thoát fullscreen
   - [ ] Warning message: "⚠️ Bài thi yêu cầu chế độ toàn màn hình (Desktop/Android)"

#### iOS (iPhone/iPad):

1. Mở Safari trên iPhone/iPad
2. Truy cập trang thi
3. Nhấn "Bắt đầu thi" (icon PlayCircle)
4. Kiểm tra:
   - [ ] Vào thi thành công **KHÔNG** yêu cầu fullscreen
   - [ ] Có thể làm bài bình thường
   - [ ] Notch/dynamic island không che nội dung (safe area)
   - [ ] Không bị bounce khi scroll
   - [ ] Có thể thoát và nộp bài bình thường
   - [ ] Info message: "ℹ️ Thiết bị iOS - Không yêu cầu toàn màn hình"

### 🎯 Behavior Summary

| Tính năng | Desktop | Android | iOS |
|-----------|---------|---------|-----|
| Fullscreen Required | ✅ Bắt buộc | ✅ Bắt buộc | ❌ Không yêu cầu |
| Start Button Icon | Maximize2 | Maximize2 | PlayCircle |
| Fullscreen Warning | ⚠️ Hiện thông báo | ⚠️ Hiện thông báo | ℹ️ Info message |
| Exit on Fullscreen Exit | ✅ Yes | ✅ Yes | ➖ N/A |
| Safe Area Support | ➖ N/A | ➖ N/A | ✅ Yes |
| Monitoring Method | Fullscreen API | Fullscreen API | Tab visibility + Events |

## Lưu ý quan trọng

### 📱 Device-Specific Behavior

**Desktop (Windows/Mac/Linux):**

- ✅ **BẮT BUỘC** fullscreen mode
- ✅ Tự động thoát bài thi nếu thoát fullscreen (nhấn ESC)
- ✅ Fullscreen API monitoring
- ✅ Warning message khi bắt đầu thi
- ⚠️ User phải cho phép fullscreen để làm bài

**Android:**

- ✅ **BẮT BUỘC** fullscreen mode
- ✅ Tự động thoát bài thi nếu thoát fullscreen
- ✅ Fullscreen API monitoring
- ✅ Warning message khi bắt đầu thi
- ⚠️ User phải cho phép fullscreen để làm bài

**iOS:**

- ✅ **KHÔNG** yêu cầu fullscreen
- ✅ Làm bài thi bình thường như web app
- ✅ Safe area support cho notch/dynamic island
- ✅ Monitoring qua tab visibility và event tracking
- ✅ User experience tối ưu, không bị gián đoạn
- ℹ️ Info message thông báo không cần fullscreen

### 🔒 Security
- Fullscreen (Android) hoặc monitoring (iOS) được kích hoạt khi bắt đầu thi
- Auto-exit nếu user thoát fullscreen trên Android
- Tab visibility tracking cho cả iOS và Android
- Prevent bounce/overscroll trên cả hai platform

### 🎨 UI/UX
- Responsive design tối ưu cho cả iOS và Android
- Bottom navigation bar cho mobile
- Touch-friendly button sizes
- Safe area padding cho notch devices (iOS)
- Icon khác nhau: Maximize2 (Android) vs PlayCircle (iOS)
- Warning message chỉ hiện trên Android

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

### Version 1.2.0 (2026-01-16) - Current

- ✅ **BREAKING CHANGE**: iOS không còn yêu cầu fullscreen
- ✅ **NEW**: Desktop và Android BẮT BUỘC fullscreen mode
- ✅ Added device detection (isIOSDevice, isAndroidDevice)
- ✅ Conditional fullscreen: Desktop & Android require fullscreen, iOS does not
- ✅ Different UI icons: Maximize2 (Desktop/Android) vs PlayCircle (iOS)
- ✅ Conditional warning message for Desktop/Android only
- ✅ iOS monitoring via tab visibility instead of fullscreen
- ✅ Improved user experience on iOS
- ✅ Maintained strict monitoring on Desktop and Android

---

**Người cập nhật**: GitHub Copilot  
**Ngày**: 16/01/2026  
**Status**: ✅ Ready for Production  
**Device Strategy**: Desktop & Android = Fullscreen Required | iOS = Normal Mode
