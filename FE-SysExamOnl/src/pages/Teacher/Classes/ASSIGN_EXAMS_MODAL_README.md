# 📝 AssignExamsModal - Hướng dẫn sử dụng

## 🎯 Tổng quan

`AssignExamsModal` là component modal được thiết kế theo **phương án 3 (Hybrid)** cho phép giáo viên giao đề thi cho lớp học theo 2 cách:

1. **Tab "Tạo đề thi mới"**: Tạo ca thi mới từ đề có sẵn và tự động gán cho lớp
2. **Tab "Chọn đề có sẵn"**: Chọn từ danh sách các ca thi đã tồn tại trong hệ thống

## ✨ Tính năng chính

### Tab 1: Tạo đề thi mới
- 📚 Dropdown chọn đề thi từ danh sách có sẵn
- ✍️ Đặt tên cho ca thi mới
- 📅 Chọn thời gian bắt đầu và kết thúc
- ⏱️ Cấu hình thời gian làm bài (phút)
- ✅ Tùy chọn tự động gán cho tất cả sinh viên trong lớp
- 👁️ Preview thông tin ca thi trước khi tạo

### Tab 2: Chọn đề có sẵn
- 🔍 Tìm kiếm ca thi theo tên, mã hoặc tên đề
- ☑️ Chọn nhiều ca thi cùng lúc (multi-select)
- 🏷️ Hiển thị trạng thái ca thi (Sắp diễn ra / Đang diễn ra / Đã kết thúc)
- 📊 Hiển thị đầy đủ thông tin: mã, thời gian, thời lượng
- 📈 Đếm số lượng đề đã chọn

## 🎨 Giao diện

### Header
- Gradient màu tím đến xanh indigo
- Hiển thị tên lớp và số lượng sinh viên
- Icon 🎓 để nhận diện nhanh chức năng

### Tabs Navigation
- Tab "Tạo đề thi mới" (icon ➕)
- Tab "Chọn đề có sẵn" (icon ☑️)
- Active tab có border màu tím và background trắng
- Hover effect cho tab không active

### Tab 1: Form tạo mới
```
┌─────────────────────────────────────────────┐
│ 🎓 Giao đề thi cho lớp          [X]        │
│ Lớp CNTT K18 · 👥 45 sinh viên             │
├─────────────────────────────────────────────┤
│ [Tạo đề thi mới] [Chọn đề có sẵn]          │
├─────────────────────────────────────────────┤
│                                             │
│ Chọn đề thi *                               │
│ ┌─────────────────────────────────────┐    │
│ │ -- Chọn đề thi --                   ▼│   │
│ └─────────────────────────────────────┘    │
│                                             │
│ Tên ca thi *                                │
│ ┌─────────────────────────────────────┐    │
│ │ VD: Kỳ thi Giữa kỳ - Lớp CNTT K18  │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ 📅 Thời gian bắt đầu *  │ 📅 Kết thúc *    │
│ ┌──────────────────┐   │ ┌──────────────┐ │
│ │ 2024-12-01 09:00 │   │ │ 11:00        │ │
│ └──────────────────┘   │ └──────────────┘ │
│                                             │
│ ⏱️ Thời gian làm bài (phút)                 │
│ ┌─────────────────────────────────────┐    │
│ │ 60                                   │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ ╔═══════════════════════════════════════╗  │
│ ║ ☑️ Tự động gán cho tất cả sinh viên   ║  │
│ ║                                       ║  │
│ ║ Khi bật, tất cả 45 sinh viên sẽ được ║  │
│ ║ tự động thêm vào ca thi...            ║  │
│ ╚═══════════════════════════════════════╝  │
│                                             │
│ ┌───────────────────────────────────────┐  │
│ │ ✅ Xem trước ca thi                   │  │
│ │                                       │  │
│ │ Đề thi: Đề thi Giữa kỳ Toán          │  │
│ │ Tên ca thi: Kỳ thi GK - CNTT K18     │  │
│ │ Bắt đầu: 01/12/2024 09:00            │  │
│ │ Kết thúc: 01/12/2024 11:00           │  │
│ │ Thời gian: 90 phút                   │  │
│ │ Sinh viên: 45 (tự động)              │  │
│ └───────────────────────────────────────┘  │
│                                             │
├─────────────────────────────────────────────┤
│               [Hủy] [Tạo và gán đề thi]    │
└─────────────────────────────────────────────┘
```

### Tab 2: Chọn đề có sẵn
```
┌─────────────────────────────────────────────┐
│ 🎓 Giao đề thi cho lớp          [X]        │
│ Lớp CNTT K18 · 👥 45 sinh viên             │
├─────────────────────────────────────────────┤
│ [Tạo đề thi mới] [Chọn đề có sẵn]          │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ 🔍 Tìm kiếm theo tên, mã...          │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ ╔═══════════════════════════════════════╗  │
│ ║ Đã chọn 2 đề thi                      ║  │
│ ╚═══════════════════════════════════════╝  │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ ☑️ Kỳ thi Giữa kỳ - Lớp A          │    │
│ │    Đề thi Giữa kỳ Toán              │    │
│ │    Mã: EXAM101  ⏱️ 90 phút          │    │
│ │    🕐 01/12/24 09:00 - 11:00        │    │
│ │    [Sắp diễn ra]                    │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ ☑️ Kỳ thi Cuối kỳ - Lớp B          │    │
│ │    Đề thi Cuối kỳ Lý                │    │
│ │    Mã: EXAM102  ⏱️ 120 phút         │    │
│ │    🕐 15/12/24 14:00 - 16:30        │    │
│ │    [Đang diễn ra]                   │    │
│ └─────────────────────────────────────┘    │
│                                             │
├─────────────────────────────────────────────┤
│               [Hủy] [Gán 2 đề thi]         │
└─────────────────────────────────────────────┘
```

## 🔧 Props Interface

```typescript
interface AssignExamsModalProps {
  isOpen: boolean;              // Trạng thái hiển thị modal
  onClose: () => void;          // Callback khi đóng modal
  onAssign: (examSessionIds: number[]) => Promise<void>;  // Callback khi gán đề
  classId: number;              // ID của lớp học
  className: string;            // Tên lớp học (hiển thị trong header)
  studentCount: number;         // Số lượng sinh viên (hiển thị trong header)
}
```

## 📝 Cách sử dụng

### Import component
```typescript
import AssignExamsModal from './AssignExamsModal';
```

### Trong component cha
```typescript
const [showAssignExamsModal, setShowAssignExamsModal] = useState(false);

// Handler để gán đề thi
const handleAssignExams = async (examSessionIds: number[]) => {
  try {
    await addExamSessionsToClass(classId, { examSessionIds });
    fetchClassDetail(); // Refresh dữ liệu
  } catch (err) {
    console.error('Failed to assign exams:', err);
    throw err;
  }
};

// Render modal
<AssignExamsModal
  isOpen={showAssignExamsModal}
  onClose={() => setShowAssignExamsModal(false)}
  onAssign={handleAssignExams}
  classId={classData.id}
  className={classData.name}
  studentCount={classData.students.length}
/>
```

## 🔄 Workflow

### Workflow 1: Tạo đề thi mới
1. User chọn tab "Tạo đề thi mới"
2. Chọn đề thi từ dropdown
3. Nhập tên ca thi
4. Chọn thời gian bắt đầu và kết thúc
5. Nhập thời gian làm bài
6. Chọn/bỏ chọn tự động gán sinh viên
7. Xem preview thông tin ca thi
8. Click "Tạo và gán đề thi"
9. System tạo ExamSession mới
10. System gán ExamSession cho Class
11. (Optional) System tạo ExamSessionStudent cho tất cả sinh viên nếu autoAssign = true
12. Hiển thị thông báo thành công
13. Đóng modal và refresh danh sách

### Workflow 2: Chọn đề có sẵn
1. User chọn tab "Chọn đề có sẵn"
2. (Optional) Nhập từ khóa tìm kiếm
3. System filter danh sách ca thi theo từ khóa
4. User click vào các ca thi để chọn
5. Checkbox được đánh dấu và số lượng đã chọn tăng
6. User có thể click lại để bỏ chọn
7. Click "Gán X đề thi" (X = số lượng đã chọn)
8. System gán các ExamSession đã chọn cho Class
9. Hiển thị thông báo thành công
10. Đóng modal và refresh danh sách

## 🎨 Màu sắc và Styling

### Color Palette
- **Primary**: Purple (#9333EA) to Indigo (#4F46E5) gradient
- **Success**: Green (#16A34A)
- **Info**: Blue (#3B82F6)
- **Warning**: Yellow (#EAB308)
- **Danger**: Red (#DC2626)
- **Gray**: #6B7280, #9CA3AF, #E5E7EB, #F3F4F6

### Status Colors
- **Sắp diễn ra**: `bg-blue-100 text-blue-800`
- **Đang diễn ra**: `bg-green-100 text-green-800`
- **Đã kết thúc**: `bg-gray-100 text-gray-800`

### Component Styles
- **Modal**: `max-w-5xl` với `rounded-xl` và `shadow-2xl`
- **Header**: Gradient purple-indigo với text trắng
- **Tabs**: Active tab có `border-b-2` màu tím
- **Buttons**: Gradient với `shadow-lg` và hover effect
- **Form inputs**: `rounded-lg` với `focus:ring-2 focus:ring-purple-500`
- **Selected cards**: `border-purple-500 bg-purple-50`

## 🔌 Tích hợp Backend

### API Endpoints cần thiết

#### 1. Lấy danh sách đề thi
```typescript
GET /api/teacher/exams
Response: Exam[]

interface Exam {
  id: number;
  title: string;
  description?: string;
  questionCount?: number;
  duration?: number;
}
```

#### 2. Lấy danh sách ca thi
```typescript
GET /api/teacher/exam-sessions
Response: ExamSession[]

interface ExamSession {
  id: number;
  name: string;
  code: string;
  inviteLink: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  examId: number;
  examTitle?: string;
}
```

#### 3. Tạo ca thi mới
```typescript
POST /api/teacher/exam-sessions
Request: {
  examId: number;
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}
Response: { id: number; ... }
```

#### 4. Gán ca thi cho lớp (đã có)
```typescript
POST /api/teacher/classes/{classId}/exam-sessions
Request: { examSessionIds: number[] }
```

#### 5. Tự động gán sinh viên cho ca thi (optional)
```typescript
POST /api/teacher/exam-sessions/{sessionId}/assign-students
Request: { classId: number }
```

### Cập nhật code để tích hợp API thật

Trong file `AssignExamsModal.tsx`, thay thế các phần mock data:

```typescript
// Trong fetchExams()
const response = await examApi.getAllExams();
setExams(response.data);

// Trong fetchExistingSessions()
const response = await examSessionApi.getAllSessions();
setExistingSessions(response.data);

// Trong handleCreateSession()
const sessionResponse = await examSessionApi.createSession({
  examId: selectedExamId,
  name: sessionName,
  startTime,
  endTime,
  durationMinutes,
});

const newSessionId = sessionResponse.data.id;
await onAssign([newSessionId]);

if (autoAssign) {
  await examSessionApi.assignStudentsToSession(newSessionId, classId);
}
```

## 📱 Responsive Design

- Modal width: `w-full max-w-5xl` (tối đa 1024px)
- Max height: `max-h-[90vh]` (90% viewport height)
- Scroll: Chỉ phần content scroll, header và footer cố định
- Grid: `md:grid-cols-2` cho form time range
- Mobile: Form fields chuyển sang 1 cột trên màn hình nhỏ

## ♿ Accessibility

- ✅ Keyboard navigation được hỗ trợ
- ✅ Focus states rõ ràng với `focus:ring-2`
- ✅ Labels có thẻ `<span className="text-red-500">*</span>` cho required fields
- ✅ Disabled states với `opacity-50` và `cursor-not-allowed`
- ✅ Loading states với text "Đang xử lý..."

## 🐛 Xử lý lỗi

```typescript
try {
  await handleCreateSession();
} catch (error) {
  console.error('Failed to create and assign session:', error);
  alert('Có lỗi xảy ra khi tạo đề thi');
}
```

- Tất cả API calls đều được wrap trong try-catch
- Hiển thị thông báo lỗi bằng alert (có thể thay bằng toast notification)
- Log lỗi ra console để debug

## 🚀 Tương lai

### Cải tiến có thể thêm
1. ✨ Toast notification thay vì alert
2. 📊 Thống kê số lượng sinh viên đã có trong mỗi ca thi
3. 🔔 Cảnh báo nếu ca thi trùng thời gian
4. 📅 Calendar view để xem lịch thi trực quan
5. 🏷️ Filter theo trạng thái (Sắp diễn ra / Đang / Đã kết thúc)
6. 📄 Pagination cho danh sách ca thi
7. 🎯 Bulk actions (xóa nhiều, duplicate)

## 📚 Tài liệu liên quan

- [ClassDetailPage.tsx](./ClassDetailPage.tsx) - Component cha sử dụng modal
- [class-api.ts](../../../api/class-api.ts) - API client functions
- [class.type.ts](../../../types/class.type.ts) - TypeScript type definitions
