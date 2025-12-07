# Class Management - Quản lý Lớp học

Hệ thống quản lý lớp học cho giáo viên, tích hợp với backend API tại `/api/teacher/classes`.

## 📁 Cấu trúc Files

```
src/
├── api/
│   └── class-api.ts                 # API client cho Class Management
├── types/
│   └── class.type.ts                # TypeScript types/interfaces
├── pages/Teacher/Classes/
│   ├── index.tsx                    # Export default
│   ├── ClassListPage.tsx            # Trang danh sách lớp học
│   ├── ClassDetailPage.tsx          # Trang chi tiết lớp học
│   ├── ClassEditPage.tsx            # Trang chỉnh sửa lớp học
│   ├── ClassFormModal.tsx           # Modal tạo/sửa lớp học
│   ├── AddStudentsModal.tsx         # Modal thêm học sinh
│   └── AddExamSessionsModal.tsx     # Modal thêm bài thi
└── routes/
    └── AppRouter.tsx                # Routes configuration
```

## 🔗 Routes

- `/teacher/classes` - Danh sách tất cả lớp học
- `/teacher/classes/:classId` - Chi tiết lớp học
- `/teacher/classes/:classId/edit` - Chỉnh sửa lớp học

## 🎯 Chức năng

### 1. Quản lý Lớp học
- ✅ Xem danh sách lớp học (có phân trang)
- ✅ Tìm kiếm lớp học
- ✅ Tạo lớp học mới
- ✅ Chỉnh sửa thông tin lớp học
- ✅ Xóa lớp học

### 2. Quản lý Học sinh
- ✅ Xem danh sách học sinh trong lớp
- ✅ Thêm nhiều học sinh vào lớp (bằng ID)
- ✅ Xóa học sinh khỏi lớp

### 3. Quản lý Bài thi
- ✅ Xem danh sách bài thi được gán cho lớp
- ✅ Thêm nhiều bài thi vào lớp (bằng exam session ID)
- ✅ Xóa bài thi khỏi lớp

## 🔌 API Endpoints (Backend)

### Class Management
```typescript
GET    /api/teacher/classes                      // Lấy danh sách lớp (có pagination)
POST   /api/teacher/classes                      // Tạo lớp mới
GET    /api/teacher/classes/{classId}            // Lấy thông tin cơ bản lớp
GET    /api/teacher/classes/{classId}/detail     // Lấy chi tiết lớp (có students & exams)
PUT    /api/teacher/classes/{classId}            // Cập nhật lớp
DELETE /api/teacher/classes/{classId}            // Xóa lớp
```

### Student Management
```typescript
POST   /api/teacher/classes/{classId}/students           // Thêm học sinh
DELETE /api/teacher/classes/{classId}/students/{studentId}  // Xóa học sinh
```

### Exam Session Management
```typescript
POST   /api/teacher/classes/{classId}/exam-sessions                  // Thêm bài thi
DELETE /api/teacher/classes/{classId}/exam-sessions/{examSessionId}  // Xóa bài thi
```

## 📦 Types

### ClassResponse
```typescript
interface ClassResponse {
  id: number;
  name: string;
  description?: string;
  teacherId: number;
  teacherName?: string;
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
  examSessionCount?: number;
}
```

### ClassDetailResponse
```typescript
interface ClassDetailResponse {
  id: number;
  name: string;
  description?: string;
  teacherId: number;
  teacherName?: string;
  createdAt: string;
  updatedAt: string;
  students: StudentInClass[];
  examSessions: ExamSessionInClass[];
}
```

### Request Types
```typescript
interface ClassCreationRequest {
  name: string;
  description?: string;
}

interface ClassUpdateRequest {
  name?: string;
  description?: string;
}

interface AddStudentsToClassRequest {
  studentIds: number[];
}

interface AddExamSessionsToClassRequest {
  examSessionIds: number[];
}
```

## 🎨 UI/UX Features

- 📱 Responsive design (mobile-friendly)
- 🔍 Tìm kiếm real-time
- 📄 Pagination
- ✏️ Modal forms
- 🎯 Tab navigation (Students/Exams)
- 🔔 Confirmation dialogs
- ⚠️ Error handling & messages
- ⏳ Loading states

## 🚀 Cách sử dụng

### Tạo lớp học mới
1. Vào `/teacher/classes`
2. Click "Tạo lớp mới"
3. Nhập tên và mô tả
4. Click "Tạo mới"

### Thêm học sinh
1. Vào chi tiết lớp học
2. Tab "Học sinh"
3. Click "Thêm học sinh"
4. Nhập danh sách ID (cách nhau bằng dấu phẩy hoặc xuống dòng)
5. Click "Thêm học sinh"

### Thêm bài thi
1. Vào chi tiết lớp học
2. Tab "Bài thi"
3. Click "Thêm bài thi"
4. Nhập danh sách exam session ID
5. Click "Thêm bài thi"

## 🔧 API Client Usage

```typescript
import {
  getAllClasses,
  getClassDetail,
  createClass,
  updateClass,
  deleteClass,
  addStudentsToClass,
  removeStudentFromClass,
  addExamSessionsToClass,
  removeExamSessionFromClass,
} from '../api/class-api';

// Lấy danh sách lớp
const classes = await getAllClasses(0, 10, 'createdAt,desc');

// Lấy chi tiết lớp
const detail = await getClassDetail(classId);

// Tạo lớp mới
const newClass = await createClass({
  name: 'Lớp Toán 12A1',
  description: 'Lớp toán nâng cao'
});

// Thêm học sinh
await addStudentsToClass(classId, {
  studentIds: [1, 2, 3]
});

// Thêm bài thi
await addExamSessionsToClass(classId, {
  examSessionIds: [10, 11, 12]
});
```

## ⚙️ Configuration

Đảm bảo backend URL được cấu hình đúng trong `.env`:
```env
VITE_API_BASE=http://localhost:8080
```

## 🐛 Troubleshooting

### Lỗi 401 Unauthorized
- Kiểm tra token đã được lưu trong localStorage
- Kiểm tra header Authorization trong request

### Lỗi 404 Not Found
- Kiểm tra backend đang chạy
- Kiểm tra đường dẫn API endpoint
- Kiểm tra classId/studentId/examSessionId có tồn tại

### Lỗi 403 Forbidden
- Kiểm tra role = 'teacher'
- Kiểm tra giáo viên có quyền truy cập lớp học

## 📝 Notes

- Tất cả API calls đều sử dụng JWT token từ localStorage
- Response format: `BaseResponse<T>` hoặc `PageResponse<T>`
- Error handling tự động trong axios interceptor
- Pagination bắt đầu từ page = 0

## 🔐 Security

- JWT token được gửi trong header Authorization
- Chỉ teacher mới có quyền truy cập
- Validation ở cả client và server side
