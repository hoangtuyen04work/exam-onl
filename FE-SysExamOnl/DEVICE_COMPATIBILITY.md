# Device Compatibility Guide

## Quick Reference

### 📱 iOS (iPhone/iPad)
```
✅ Không yêu cầu fullscreen
✅ Làm bài thi bình thường
✅ Icon: PlayCircle
✅ Không có warning message
```

### 🤖 Android
```
⚠️ BẮT BUỘC fullscreen
⚠️ Không cho fullscreen = không cho thi
✅ Icon: Maximize2
✅ Có warning message
```

## Tại sao khác nhau?

### iOS Limitations:
- Fullscreen API trên iOS Safari rất hạn chế
- Keyboard popup có thể tự động thoát fullscreen
- User experience không tốt khi force fullscreen
- Apple không khuyến khích fullscreen cho web apps

### Android Advantages:
- Fullscreen API hoạt động tốt và ổn định
- Không bị gián đoạn bởi keyboard
- User đã quen với fullscreen trong apps
- Tốt cho security và anti-cheating

## Technical Implementation

```typescript
// Device detection
const isIOS = isIOSDevice()
const isAndroid = isAndroidDevice()
const requiresFullscreen = isAndroid  // ← Key difference

// Start exam
if (requiresFullscreen) {
  // Android: Must enter fullscreen
  await requestFullscreen()
} else {
  // iOS: Start directly
  setIsExamStarted(true)
}
```

## User Flow Comparison

### iOS Flow:
1. Click "Bắt đầu thi" (PlayCircle icon)
2. ✅ Immediately start exam
3. Do exam normally
4. Submit when done

### Android Flow:
1. Click "Bắt đầu thi" (Maximize2 icon)
2. ⚠️ See fullscreen warning
3. Browser requests fullscreen permission
4. ✅ Enter fullscreen mode
5. Do exam (must stay in fullscreen)
6. Submit → Auto exit fullscreen

## Monitoring Methods

| Feature | iOS | Android |
|---------|-----|---------|
| Fullscreen API | ❌ Not used | ✅ Required |
| Tab Visibility | ✅ Primary | ✅ Secondary |
| Window Resize | ✅ Monitored | ✅ Monitored |
| Exit Events | ✅ Tracked | ✅ Tracked |

## Testing Checklist

### iOS Testing:
- [ ] Open Safari on iPhone/iPad
- [ ] Navigate to exam page
- [ ] Click start (should NOT request fullscreen)
- [ ] Complete exam without fullscreen
- [ ] Verify monitoring still works
- [ ] Check notch/safe area support

### Android Testing:
- [ ] Open Chrome on Android
- [ ] Navigate to exam page
- [ ] Click start (MUST request fullscreen)
- [ ] Verify can't start without fullscreen
- [ ] Try exiting fullscreen (should kick out)
- [ ] Complete exam in fullscreen
- [ ] Verify auto-exit on submit

## FAQs

**Q: Tại sao iOS không cần fullscreen?**
A: iOS Safari có nhiều giới hạn với Fullscreen API. Thay vì force một tính năng không ổn định, chúng ta dùng monitoring methods khác (tab visibility, events) cho iOS.

**Q: iOS có bị lỏng lẻo hơn Android không?**
A: Không. iOS vẫn được monitor chặt chẽ qua tab visibility, window events, và exit tracking. Chỉ khác method, không khác mức độ monitoring.

**Q: Android bắt buộc fullscreen có gây khó cho user không?**
A: Có thể ban đầu, nhưng Android user đã quen với fullscreen trong apps. Và fullscreen trên Android rất ổn định nên trải nghiệm tốt.

**Q: Có thể cho cả 2 không cần fullscreen không?**
A: Có thể, nhưng Android có Fullscreen API tốt nên tận dụng để tăng security. iOS không có nên phải dùng alternative methods.

---

**Last Updated**: 2026-01-16  
**Version**: 1.2.0
