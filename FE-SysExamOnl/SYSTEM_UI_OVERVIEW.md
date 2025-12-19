# TÓM TẮT GIAO DIỆN HỆ THỐNG THI TRỰC TUYẾN

## 🎨 TỔNG QUAN THIẾT KẾ

Hệ thống sử dụng **React + TypeScript + TailwindCSS** với thiết kế hiện đại, responsive và user-friendly. Màu sắc chủ đạo là **xanh dương (blue)** và **tím (purple/indigo)** tạo cảm giác chuyên nghiệp và thân thiện.

---

## 👥 HAI VAI TRÒ CHÍNH

### 1. GIÁO VIÊN (Teacher)
### 2. SINH VIÊN (Student)

---

## 🔐 TRANG ĐĂNG NHẬP & ĐĂNG KÝ

### **Trang Chọn Vai Trò** (`RoleSelectPage`)
- Layout đơn giản, trung tâm màn hình
- 2 card lớn với gradient:
  - **Card Giáo Viên**: Gradient xanh dương → tím, icon 👨‍🏫
  - **Card Sinh Viên**: Gradient xanh lá → xanh ngọc, icon 👨‍🎓
- Hover effect: Scale lên 1.05, shadow đậm hơn
- Background: Gradient nhẹ từ trắng → xanh nhạt

### **Trang Đăng Nhập** (`LoginPage`)
- Modal trung tâm với shadow lớn
- Form gọn gàng: Email, Password
- Button gradient xanh dương
- Link chuyển sang đăng ký
- Background blur với overlay tối

### **Trang Đăng Ký** (`RegisterPage`)
- Tương tự LoginPage nhưng nhiều field hơn:
  - Username, Email, Password, Confirm Password
  - First Name, Last Name
- Validation real-time với icon ✓ hoặc ✗
- Button gradient xanh dương

### **Xác Thực Email** (`VerifyEmailPage`)
- Hiển thị thông báo yêu cầu verify
- Icon email lớn 📧
- Button "Gửi lại email" nếu cần

---

## 👨‍🏫 GIAO DIỆN GIÁO VIÊN

### **Layout Chung** (`TeacherLayout`)
- **Header**: 
  - Logo + Tên hệ thống bên trái
  - Navigation: Dashboard | Lớp học | Đề thi | Profile
  - Avatar + dropdown menu bên phải
  - Gradient xanh dương → tím
  - Sticky top, shadow khi scroll

- **Main Content**: 
  - Container rộng với padding
  - Background xám nhạt (#f3f4ff)

### **Dashboard Giáo Viên** (`TeacherDashboard`)

#### 📊 **Statistics Cards** (Hàng trên cùng)
- 4 card ngang với gradient và icon:
  1. **Tổng lớp học**: Icon 📚, gradient xanh dương
  2. **Tổng đề thi**: Icon 📝, gradient tím
  3. **Tổng câu hỏi**: Icon ❓, gradient xanh lá
  4. **Sinh viên**: Icon 👥, gradient cam
- Mỗi card có số lớn, label nhỏ, shadow nhẹ
- Hover: Shadow đậm, scale nhẹ

#### 📑 **Tabs Navigation**
- 3 tabs: Đề thi | Phòng thi | Ngân hàng câu hỏi
- Active tab: Background gradient, text trắng
- Inactive tab: Background xám nhạt, text xám

#### **Tab 1: Danh Sách Đề Thi** (`ExamsList`)
- **Search bar**: Input với icon 🔍, placeholder "Tìm kiếm đề thi..."
- **Button "Tạo đề thi mới"**: Gradient xanh dương, icon +
- **Table hiển thị**:
  - Columns: STT | Tên đề thi | Mô tả | Số câu hỏi | Thời gian | Ngày tạo | Actions
  - Row hover: Background xanh nhạt
  - Actions: Icon sửa ✏️ (xanh), xóa 🗑️ (đỏ)
- **Pagination**: Arrows trái/phải + số trang

#### **Tab 2: Danh Sách Phòng Thi** (`ExamSessionsList`)
- **Grid layout 3 cột** (responsive 1-2-3 cột)
- **Mỗi card phòng thi**:
  - **Header**: Gradient xanh dương → tím, tên phòng thi
  - **Body**: 
    - Tên đề thi với icon 📋
    - Thời gian: Start time ⏰ + End time 🏁
    - Thời lượng: Icon ⏱️ + số phút
  - **Status badge**:
    - 🟢 **Đang diễn ra**: Green badge, chấm animate pulse
    - 🔵 **Sắp diễn ra**: Blue badge
    - ⚫ **Đã kết thúc**: Gray badge
  - **Button "Giám sát"**: Nổi bật nếu đang diễn ra
  - **Actions**: Edit, Delete icons ở góc
- Hover: Shadow lớn, border xanh

#### **Tab 3: Ngân Hàng Câu Hỏi** (`QuestionBankList`)
- **Search + Filter**:
  - Input search
  - Dropdown lọc theo độ khó (Dễ/Trung bình/Khó)
  - Dropdown lọc theo loại câu hỏi (Trắc nghiệm/Đúng-Sai)
- **Table câu hỏi**:
  - Hiển thị: Nội dung | Loại | Độ khó | Ngày tạo | Actions
  - Độ khó với badge màu:
    - 🟢 Dễ: Green
    - 🟡 Trung bình: Yellow
    - 🔴 Khó: Red
  - Actions: Edit, Delete, Preview

### **Quản Lý Lớp Học** (`ClassListPage`)

#### **Layout 2 cột**:

##### **Cột Trái - Sidebar Danh Sách Lớp** (w-80, fixed width)
- **Header**:
  - Title "Danh sách lớp học"
  - Search input nhỏ
- **List các lớp**:
  - **Mỗi item lớp**:
    - Avatar tròn gradient với chữ cái đầu
    - Tên lớp (font semibold)
    - Mã lớp (text nhỏ, gray)
    - Số học sinh 👥 + Số bài thi 📝
    - Icon Edit ✏️ và Delete 🗑️ (hiện khi hover)
  - **Dropdown menu khi hover**:
    - 🟣 **Học sinh**: Icon users, background tím nhạt khi hover
    - 🔵 **Bài thi**: Icon document, background xanh nhạt khi hover
    - 🟢 **Chat lớp học**: Icon chat, background xanh lá nhạt khi hover
  - Animation: max-height từ 0 → 40 khi hover
- **Pagination** ở dưới cùng
- Background trắng, shadow nhẹ, border radius

##### **Cột Phải - Nội Dung Chi Tiết** (flex-1, full width còn lại)

**Khi chưa chọn lớp**:
- Icon 📚 lớn
- Text "Quản lý lớp học"
- Hướng dẫn: "Chọn một lớp học từ danh sách bên trái để xem chi tiết"

**Khi đã chọn lớp**:

###### **Header Lớp** (Gradient indigo → purple, compact)
- Avatar class với chữ cái đầu
- Tên lớp (font bold)
- Badge mã lớp
- Thông tin: X học sinh • Y bài thi

###### **Content Area**:

**View 1: Danh Sách Học Sinh**
- **Button "Thêm học sinh"**: Gradient xanh lá, icon +
- **Grid 3 cột** (responsive):
  - **Card mỗi sinh viên**:
    - Avatar gradient tím với chữ cái đầu
    - Tên đầy đủ (font semibold)
    - Username với icon 👤
    - Email với icon ✉️
    - Ngày tham gia với icon 📅
    - Badge "Đang hoạt động" nếu isActive
    - Button xóa 🗑️ (hiện khi hover, góc trên phải)
  - Gradient background: trắng → tím nhạt
  - Border radius lớn, shadow khi hover

**View 2: Danh Sách Bài Thi**
- **Button "Giao bài thi"**: Gradient xanh dương, icon +
- **Grid 2 cột**:
  - **Card mỗi bài thi**:
    - **Header**: Tên bài thi (font bold), mã bài thi (monospace)
    - **Status badge**:
      - 🟢 **Đang diễn ra**: Green, chấm pulse
      - 🔵 **Sắp tới**: Blue
      - ⚫ **Đã kết thúc**: Gray
    - **Thông tin chi tiết**:
      - ⏰ Thời gian bắt đầu (xanh lá)
      - 🏁 Thời gian kết thúc (đỏ)
      - ⚡ Thời lượng (xanh dương)
      - 🎯 Ngày giao (tím)
    - Mô tả nếu có (line-clamp-2)
    - Button xóa (hiện khi hover)
  - Gradient background: trắng → xanh nhạt
  - Border theo màu status

**View 3: Chat Lớp Học**
- **Chiếm full height** của content area
- **ChatBox Component**:
  
  ###### **Header Chat** (Gradient xanh dương, clickable cho giáo viên)
  - Icon chat, text "Chat Lớp Học"
  - Status: "Trực tuyến" hoặc "Chat đã tắt"
  - Badge 🔒 "Chỉ xem" nếu chat tắt
  - Icon chevron (chỉ giáo viên thấy) để mở settings
  
  ###### **Settings Panel** (collapsible, chỉ giáo viên)
  - Background xanh nhạt
  - Toggle switch: "Cho phép học sinh chat"
  - Text mô tả trạng thái
  - Smooth expand/collapse animation
  
  ###### **Messages Area** (flex-1, scrollable)
  - Background gradient xám nhạt
  - **Tin nhắn của mình** (bên phải):
    - Bubble gradient xanh dương
    - Text trắng
    - Bo góc phải nhỏ hơn
  - **Tin nhắn người khác** (bên trái):
    - Avatar gradient với chữ cái đầu
    - Tên người gửi + badge "👨‍🏫 GV" nếu là giáo viên
    - Bubble trắng (học sinh) hoặc xanh lá nhạt (GV)
    - Bo góc trái nhỏ hơn
  - Timestamp nhỏ dưới mỗi tin
  - Auto scroll khi có tin mới
  
  ###### **Input Area** (bottom, compact)
  - Textarea auto-resize
  - Character counter
  - Button "Gửi" gradient xanh dương với icon ✈️
  - Disabled nếu không có quyền chat

### **Modals**

#### **Modal Tạo/Sửa Lớp** (`ClassFormModal`)
- Background overlay: blur + black/60
- Modal: Trắng, border radius lớn, shadow lớn
- **Header**:
  - Icon sách trong square gradient
  - Title "Tạo lớp học mới" hoặc "Chỉnh sửa lớp học"
- **Form**:
  - Input "Tên lớp học" *required
  - Textarea "Mô tả"
  - Borders dày hơn (border-2)
  - Focus: Ring xanh dương
- **Footer**:
  - Button "Hủy": Border xám
  - Button "Tạo mới"/"Cập nhật": Gradient xanh, icon ✓ hoặc +
  - Loading state: Spinner animation

#### **Modal Thêm Học Sinh** (`AddStudentsModal`)
- Tương tự ClassFormModal
- Textarea nhập danh sách email (phân cách bằng dấu phẩy hoặc xuống dòng)
- Validation email real-time
- Hiển thị số email hợp lệ/không hợp lệ

#### **Modal Giao Bài Thi** (`AssignExamsModal`)
- Dropdown chọn đề thi (infinite scroll)
- DateTimePicker: Thời gian bắt đầu
- DateTimePicker: Thời gian kết thúc
- Input: Thời lượng (phút)
- Hiển thị thông tin lớp: Tên + số học sinh
- Button "Giao bài thi" gradient xanh

### **Trang Giám Sát Thi** (`ExamMonitoringPage`)

- **Header Card**:
  - Title "Giám sát phòng thi"
  - ID phòng thi
  - **Số sinh viên online**: Số lớn màu xanh lá
  - **Status connection**: Badge "Đã kết nối" (xanh) hoặc "Mất kết nối" (đỏ)

- **Grid Sinh Viên** (4 cột, responsive):
  
  **Card mỗi sinh viên**:
  - **Status Badge** (top center):
    - 🟢 **Đang làm bài**: Green, icon LogIn
    - 🔵 **Đã hoàn thành**: Blue, icon checkmark
    - 🟡 **Mất tập trung**: Yellow, icon warning
    - 🟠 **Đã rời phòng**: Orange, icon LogOut
    - 🔴 **Thoát đột ngột**: Red, icon lightning
    - ⚫ **Chưa vào phòng**: Gray, icon dash
  
  - **Thông tin**:
    - Số thứ tự lớn
    - Tên sinh viên
    - Icon ⏰ + thời gian (format: "X phút trước")
  
  - **Vi phạm** (nếu có):
    - 🟡 Badge "Mất focus: X lần" (yellow background)
    - 🟠 Badge "Chuyển tab: X lần" (orange background)
  
  - **Màu card theo status**:
    - IN_PROGRESS: Gradient xanh lá nhạt, border xanh
    - COMPLETED: Gradient xanh dương nhạt, border xanh
    - FOCUS_LOST: Gradient vàng nhạt, border vàng
    - LEFT: Gradient cam nhạt, border cam
    - DISCONNECTED: Gradient đỏ nhạt, border đỏ
    - UNKNOWN: Gradient xám nhạt, border xám
  
  - Border dày (border-2), shadow khi hover

- **Real-time Updates**:
  - WebSocket connection
  - Auto update khi có event
  - Animation khi thay đổi status

---

## 👨‍🎓 GIAO DIỆN SINH VIÊN

### **Layout Chung** (`StudentLayout`)
- Header tương tự Teacher nhưng đơn giản hơn
- Navigation: Dashboard | Lớp học | Profile
- Gradient xanh ngọc → xanh dương

### **Dashboard Sinh Viên** (`StudentDashboard`)

#### 📊 **Statistics Cards**
- 3 card:
  1. **Lớp học của tôi**: Icon 📚, gradient xanh
  2. **Bài thi sắp tới**: Icon 📝, gradient cam
  3. **Bài thi đã hoàn thành**: Icon ✅, gradient xanh lá

#### **Danh Sách Lớp Học**
- Grid 3 cột
- **Card mỗi lớp**:
  - Avatar class gradient
  - Tên lớp + mã lớp
  - Tên giáo viên với icon 👨‍🏫
  - Số học sinh trong lớp
  - Button "Xem chi tiết" gradient xanh
- Hover: Shadow lớn, border highlight

### **Chi Tiết Lớp Sinh Viên** (`ClassDetailPage`)

#### **Header Lớp** (gradient xanh ngọc)
- Thông tin lớp chi tiết
- Giáo viên, số học sinh

#### **Tabs**:
- **Tab Bài thi**: Danh sách bài thi được giao
- **Tab Chat**: Chat với lớp (nếu được phép)

#### **Danh Sách Bài Thi**
- Grid 2 cột
- **Card mỗi bài thi**:
  - Tên bài thi
  - Status badge (Sắp tới/Đang diễn ra/Đã kết thúc)
  - Thời gian bắt đầu, kết thúc
  - Thời lượng
  - **Button "Vào thi"**: 
    - Gradient xanh nếu đang diễn ra
    - Disabled nếu chưa đến giờ hoặc đã kết thúc
  - Icon khóa 🔒 nếu chưa thể vào

### **Trang Tham Gia Thi** (`JoinExam`)
- **Màn hình chờ trước khi bắt đầu**:
  - Tên bài thi lớn
  - Countdown timer lớn
  - Thông tin: Số câu hỏi, thời gian làm bài
  - Button "Bắt đầu làm bài" (chỉ active khi đến giờ)

### **Trang Làm Bài Thi** (`ExamPage`)

#### **Header** (sticky top, gradient xanh)
- Tên bài thi
- **Timer**: Đếm ngược lớn, màu đỏ khi < 5 phút
- Button "Nộp bài" (gradient đỏ)

#### **Sidebar Câu Hỏi** (left, fixed)
- Grid các số câu hỏi (button tròn)
- Màu sắc:
  - ⚪ Chưa làm: Trắng, border xám
  - 🟢 Đã trả lời: Xanh lá, background fill
  - 🔵 Đang xem: Xanh dương, background fill
- Click để nhảy đến câu hỏi
- Scroll smooth

#### **Content Area** (center, scrollable)
- **Mỗi câu hỏi**:
  - Card trắng, shadow nhẹ
  - Số câu hỏi + đề bài
  - **Radio buttons cho đáp án**:
    - Border tròn
    - Hover: Background xanh nhạt
    - Selected: Background xanh, text trắng, checkmark
  - Space giữa các đáp án

#### **Footer** (sticky bottom)
- Button "← Câu trước" | "Câu sau →"
- Button "Nộp bài" (gradient đỏ, nổi bật)

#### **Modal Xác Nhận Nộp Bài**
- Overlay tối
- Modal warning
- Text: "Bạn có chắc muốn nộp bài?"
- Hiển thị: X/Y câu đã trả lời
- Button "Hủy" | "Nộp bài" (đỏ)

#### **Monitoring WebSocket**
- **Tự động gửi event**:
  - ENTER: Khi vào trang thi
  - FOCUS_LOST: Khi chuyển tab/blur window
  - FOCUS_REGAINED: Khi quay lại
  - DISCONNECTED: Khi đóng tab đột ngột
  - SUBMIT: Khi nộp bài
- **Cảnh báo**:
  - Toast notification khi mất focus
  - Confirm dialog khi cố thoát trang

---

## 🎨 HỆ THỐNG MÀU SẮC

### **Primary Colors**
- **Blue**: #3B82F6 → #2563EB (gradient chính)
- **Indigo**: #6366F1 → #4F46E5
- **Purple**: #8B5CF6 → #7C3AED

### **Status Colors**
- **Success/Online**: #10B981 (Green)
- **Warning/Focus Lost**: #F59E0B (Yellow/Orange)
- **Error/Danger**: #EF4444 (Red)
- **Info**: #3B82F6 (Blue)
- **Gray/Inactive**: #6B7280

### **Background Colors**
- **Primary BG**: #F3F4FF (light purple tint)
- **Card BG**: #FFFFFF (white)
- **Hover BG**: #F9FAFB (light gray)
- **Input BG**: #F9FAFB

---

## 🎭 HIỆU ỨNG & ANIMATIONS

### **Hover Effects**
- Scale: `hover:scale-105`
- Shadow: `hover:shadow-lg` → `hover:shadow-2xl`
- Brightness: `hover:brightness-110`
- Border color change
- Background color transition

### **Transitions**
- Duration: 200ms - 300ms
- Ease: `ease-in-out`
- All properties: `transition-all`

### **Loading States**
- Spinner: `animate-spin` (circle border-t-transparent)
- Skeleton: Pulse animation cho cards
- Progress bar: Width transition

### **Notifications**
- Toast từ top-right
- Slide in/out animation
- Auto dismiss sau 3-5s
- Color theo type: success/warning/error

### **Modals**
- Backdrop: Fade in `opacity-0 → opacity-100`
- Modal: Scale + Fade `scale-95 opacity-0 → scale-100 opacity-100`
- Duration: 300ms

---

## 📱 RESPONSIVE DESIGN

### **Breakpoints** (Tailwind defaults)
- **sm**: 640px (mobile)
- **md**: 768px (tablet)
- **lg**: 1024px (laptop)
- **xl**: 1280px (desktop)
- **2xl**: 1536px (large desktop)

### **Grid Responsive**
- Cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Sidebar + Content: Chuyển từ row sang column trên mobile
- Navigation: Hamburger menu trên mobile (nếu có)

### **Typography Responsive**
- Headings: `text-xl md:text-2xl lg:text-3xl`
- Body: `text-sm md:text-base`
- Padding: `p-4 md:p-6 lg:p-8`

---

## ♿ ACCESSIBILITY

### **Keyboard Navigation**
- Tab order hợp lý
- Focus visible: Ring xanh dương `focus:ring-2 focus:ring-blue-500`
- Escape để đóng modal

### **Screen Reader Support**
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<article>`
- ARIA labels cho icons
- Alt text cho images
- Title attributes cho buttons

### **Color Contrast**
- Text đạt WCAG AA (4.5:1)
- Buttons có contrast đủ
- Disabled states rõ ràng (opacity 50%)

---

## 🔔 NOTIFICATIONS & FEEDBACK

### **Success Messages**
- Toast màu xanh lá với icon ✓
- "Tạo thành công", "Lưu thành công", etc.

### **Error Messages**
- Toast/Banner màu đỏ với icon ✗
- Validation errors dưới input (text đỏ nhỏ)
- API errors: Modal hoặc toast

### **Warning Messages**
- Toast màu vàng/cam với icon ⚠️
- Confirm dialogs trước action nguy hiểm

### **Info Messages**
- Toast màu xanh dương với icon ℹ️
- Helper text dưới inputs

---

## 📊 DATA DISPLAY

### **Tables**
- Header: Background xám nhạt, font semibold
- Rows: Alternate row colors (striped)
- Hover: Background highlight
- Borders: Subtle gray
- Responsive: Scroll horizontal trên mobile

### **Cards**
- White background
- Border radius: `rounded-lg` (8px) hoặc `rounded-xl` (12px)
- Shadow: `shadow-sm` → `shadow-lg` on hover
- Padding: `p-4` hoặc `p-6`

### **Lists**
- Clear separation giữa items
- Hover effect
- Icons/Avatars bên trái
- Actions bên phải

### **Empty States**
- Icon lớn (emoji hoặc SVG)
- Text mô tả
- Button CTA (Call To Action)
- Centered trong container

---

## 🚀 PERFORMANCE

### **Lazy Loading**
- Images: `loading="lazy"`
- Routes: React lazy import
- Modals: Mount khi cần

### **Optimizations**
- Memoization: React.memo cho heavy components
- Virtual scrolling cho danh sách dài
- Debounce cho search inputs
- Pagination thay vì load all

---

## 🔒 SECURITY UI

### **Password Fields**
- Toggle show/hide password
- Strength indicator (màu đỏ → vàng → xanh)
- Requirements checklist

### **Sensitive Actions**
- Confirm modals
- Re-authentication nếu cần
- Warning messages rõ ràng

---

## 📝 FORMS

### **Input Fields**
- Border: 2px solid gray → blue on focus
- Placeholder: Gray text
- Label: Font medium, gray dark
- Required: Red asterisk *
- Error state: Border red, text error dưới

### **Buttons**
- **Primary**: Gradient xanh, text trắng
- **Secondary**: Border gray, text gray
- **Danger**: Gradient đỏ, text trắng
- **Disabled**: Opacity 50%, cursor not-allowed
- Padding: `px-4 py-2` hoặc `px-6 py-3`
- Font: medium hoặc semibold

### **Dropdowns**
- Border giống input
- Icon chevron down
- Menu: Shadow lớn, white bg
- Options: Hover background
- Max height + scroll

---

## 🎯 KẾT LUẬN

Hệ thống có thiết kế **hiện đại, chuyên nghiệp và dễ sử dụng**. Sử dụng **gradients, shadows, và animations** để tạo depth và interactivity. **Responsive hoàn toàn** cho mọi thiết bị. **Color scheme nhất quán** với blue/purple làm chủ đạo. **Feedback rõ ràng** cho mọi hành động của user. **Real-time updates** qua WebSocket cho monitoring và chat.

Interface được thiết kế với **user experience** làm trọng tâm, đảm bảo giáo viên và sinh viên đều có trải nghiệm tốt nhất khi sử dụng hệ thống thi trực tuyến.
