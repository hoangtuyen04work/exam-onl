# Chiến Lược Fullscreen Theo Thiết Bị

## 📋 Tóm Tắt

Hệ thống thi trực tuyến đã được cập nhật với chiến lược fullscreen phù hợp cho từng loại thiết bị:

| Thiết Bị | Fullscreen Required | Icon | Lý Do |
|----------|---------------------|------|-------|
| **Desktop** (Windows/Mac/Linux) | ✅ Bắt buộc | Maximize2 | Kiểm soát tốt, API ổn định, ngăn gian lận |
| **Android** | ✅ Bắt buộc | Maximize2 | API hỗ trợ tốt, đảm bảo tính toàn vẹn bài thi |
| **iOS** (iPhone/iPad) | ❌ Không yêu cầu | PlayCircle | API giới hạn, UX tốt hơn khi không fullscreen |

## 🎯 Mục Tiêu

1. **Desktop & Android**: Tối đa hóa kiểm soát và bảo mật bằng fullscreen mode bắt buộc
2. **iOS**: Tối ưu trải nghiệm người dùng, vẫn giữ monitoring qua các phương pháp khác
3. **Nhất quán**: Hệ thống monitoring hoạt động trên tất cả nền tảng

## 🔧 Thay Đổi Kỹ Thuật

### 1. Device Detection (`utils.ts`)

```typescript
// Detect iOS devices (iPhone, iPad, iPod)
export const isIOSDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}
```

### 2. Conditional Fullscreen Logic (`ExamPage.tsx`)

```typescript
// Chỉ iOS KHÔNG cần fullscreen
const isIOS = isIOSDevice()
const requiresFullscreen = !isIOS // Desktop & Android = true, iOS = false

// Bắt đầu thi
const handleStartExam = async () => {
  // Desktop & Android: Bắt buộc vào fullscreen
  if (requiresFullscreen) {
    const success = await requestFullscreen()
    if (!success) {
      toast.error('Không thể vào chế độ toàn màn hình. Vui lòng thử lại.')
      return // Không cho làm bài nếu không vào được fullscreen
    }
    document.body.classList.add('fullscreen-mode')
  }
  
  // iOS: Vào thi luôn, không cần fullscreen
  setIsExamStarted(true)
  toast.success('Bắt đầu làm bài!')
}
```

### 3. UI Conditional Rendering

```tsx
{/* Icon khác nhau cho các thiết bị */}
{requiresFullscreen ? (
  <Maximize2 className='w-4 h-4 md:w-5 md:h-5' /> // Desktop & Android
) : (
  <PlayCircle className='w-4 h-4 md:w-5 md:h-5' /> // iOS
)}

{/* Warning message có điều kiện */}
{requiresFullscreen ? (
  <p className='text-blue-700 text-center text-xs md:text-sm mt-2'>
    ⚠️ Bài thi yêu cầu chế độ toàn màn hình (Desktop/Android)
  </p>
) : (
  <p className='text-green-700 text-center text-xs md:text-sm mt-2'>
    ℹ️ Thiết bị iOS - Không yêu cầu toàn màn hình
  </p>
)}
```

## 📊 So Sánh Behavior

### Desktop & Android (Fullscreen Mode)

**Khi bắt đầu thi:**
- ✅ BẮT BUỘC vào fullscreen
- ✅ Không vào được → Báo lỗi, không cho làm bài
- ✅ Thêm class `fullscreen-mode` vào body
- ✅ Warning message hiển thị

**Trong khi thi:**
- ✅ Fullscreen API monitoring active
- ✅ Tab visibility tracking
- ✅ Window resize detection
- ✅ Exit event gửi khi thoát fullscreen

**Khi thoát fullscreen:**
- ✅ Tự động gửi EXIT event
- ✅ Toast error: "Thoát toàn màn hình — bài thi kết thúc!"
- ✅ Chuyển về trang student sau 1.5s

**Khi nộp bài:**
- ✅ Tự động thoát fullscreen
- ✅ Remove class `fullscreen-mode`
- ✅ Chuyển đến trang kết quả

### iOS (Normal Mode)

**Khi bắt đầu thi:**
- ✅ Vào thi KHÔNG cần fullscreen
- ✅ Không thêm class `fullscreen-mode`
- ✅ Info message hiển thị (không phải warning)

**Trong khi thi:**
- ✅ Tab visibility tracking (quan trọng nhất)
- ✅ Window resize detection (ít quan trọng hơn)
- ✅ Exit event tracking
- ❌ KHÔNG có fullscreen monitoring

**Khi chuyển tab:**
- ✅ Vẫn gửi EXIT event qua visibility API
- ✅ Monitoring hoạt động bình thường

**Khi nộp bài:**
- ✅ Không cần thoát fullscreen (vì không có fullscreen)
- ✅ Chuyển đến trang kết quả bình thường

## 🔒 Security & Monitoring

### Desktop & Android
- **Primary**: Fullscreen API - Thoát fullscreen = Kết thúc thi
- **Secondary**: Tab visibility - Chuyển tab = Ghi lại vi phạm
- **Tertiary**: Window events - Resize/minimize = Ghi lại

### iOS
- **Primary**: Tab visibility - Chuyển tab = Ghi lại vi phạm  
- **Secondary**: Window events - Ghi lại các thay đổi
- **Alternative**: Có thể bổ sung Face ID/Touch ID trong tương lai

## 🎨 User Experience

### Desktop & Android
- Trải nghiệm giống bài thi thật (toàn màn hình)
- Tập trung cao, ít bị phân tâm
- Kiểm soát chặt chẽ, đảm bảo tính công bằng

### iOS
- Trải nghiệm tự nhiên như sử dụng app thông thường
- Không bị gián đoạn bởi fullscreen API
- Keyboard hoạt động ổn định
- Safe area support cho notch/dynamic island

## 📝 Testing Checklist

### Desktop
- [ ] Chrome/Firefox/Edge: Bắt buộc fullscreen
- [ ] Thoát fullscreen (ESC) → Kết thúc bài thi
- [ ] Warning message hiển thị đúng
- [ ] Icon Maximize2 hiển thị

### Android  
- [ ] Chrome/Samsung Internet: Bắt buộc fullscreen
- [ ] Thoát fullscreen → Kết thúc bài thi
- [ ] Warning message hiển thị đúng
- [ ] Icon Maximize2 hiển thị

### iOS
- [ ] Safari: Vào thi KHÔNG cần fullscreen
- [ ] Info message hiển thị (không phải warning)
- [ ] Icon PlayCircle hiển thị
- [ ] Safe area padding hoạt động (notch không che nội dung)
- [ ] Chuyển tab → EXIT event vẫn được gửi

## 🚀 Migration Guide

### Từ Version 1.1.0 sang 1.2.0

**Breaking Changes:**
- iOS không còn yêu cầu fullscreen
- Desktop giờ BẮT BUỘC fullscreen (trước đây optional)

**Tương thích ngược:**
- ✅ Android: Không đổi, vẫn bắt buộc fullscreen
- ⚠️ iOS: Không còn thử request fullscreen
- ⚠️ Desktop: Giờ bắt buộc fullscreen

**Cần test lại:**
- Desktop browsers (Chrome, Firefox, Edge, Safari)
- iOS Safari 13+
- Android Chrome

## 📚 Tài Liệu Liên Quan

- `IOS_FULLSCREEN_SUPPORT.md` - Chi tiết kỹ thuật về fullscreen
- `src/hooks/useFullScreen.ts` - Hook xử lý fullscreen
- `src/utils/utils.ts` - Device detection utilities
- `src/pages/Student/Exam/ExamPage.tsx` - Component chính

---

**Version**: 1.2.0  
**Last Updated**: 16/01/2026  
**Status**: ✅ Production Ready
