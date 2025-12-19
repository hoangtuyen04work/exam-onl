# 🔌 API Integration Complete

## ✅ Đã hoàn thành

### 1. Tạo file `exam-api.ts`
**Vị trí**: `src/api/exam-api.ts`

**API Functions**:
- ✅ `getAllExams(page, size)` - Lấy tất cả đề thi
- ✅ `getExamById(examId)` - Lấy đề thi theo ID
- ✅ `getAllExamSessions(searchParams, page, size)` - Lấy tất cả ca thi
- ✅ `getExamSessionById(examSessionId)` - Lấy ca thi theo ID
- ✅ `createExamSession(request)` - Tạo ca thi mới
- ✅ `deleteExamSession(examSessionId)` - Xóa ca thi

**TypeScript Types**:
```typescript
interface ExamResponse {
  id: number;
  title: string;
  description?: string;
  durationMinutes: number;
  totalQuestions?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ExamSessionResponse {
  id: number;
  name: string;
  code: string;
  inviteLink: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  examId: number;
  examTitle?: string;
  status?: string;
}

interface ExamSessionCreationRequest {
  examId: number;
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}
```

### 2. Cập nhật `AssignExamsModal.tsx`

**Thay đổi**:
- ❌ Xóa toàn bộ mock data
- ✅ Import API functions từ `exam-api.ts`
- ✅ Sử dụng `ExamResponse` và `ExamSessionResponse` types
- ✅ `fetchExams()` gọi `getAllExams()` API thật
- ✅ `fetchExistingSessions()` gọi `getAllExamSessions()` API thật
- ✅ `handleCreateSession()` gọi `createExamSession()` API thật
- ✅ Error handling với alert messages
- ✅ Cập nhật hiển thị: `totalQuestions` và `durationMinutes`

## 🔗 Backend Endpoints

### Exam APIs (`/api/teacher/exams`)
```
GET    /api/teacher/exams                      - Get all exams (paginated)
GET    /api/teacher/exams/basic/{examId}       - Get exam by ID (basic)
GET    /api/teacher/exams/{examId}             - Get exam detail
POST   /api/teacher/exams                      - Create exam
DELETE /api/teacher/exams/{examId}             - Delete exam
```

### Exam Session APIs (`/api/teacher/exam-sessions`)
```
GET    /api/teacher/exam-sessions/search       - Search exam sessions
GET    /api/teacher/exam-sessions              - Get exam session by ID (query param)
POST   /api/teacher/exam-sessions              - Create exam session
PUT    /api/teacher/exam-sessions/{id}         - Update exam session
DELETE /api/teacher/exam-sessions/{id}         - Delete exam session
```

### Class APIs (`/api/teacher/classes`)
```
POST   /api/teacher/classes/{classId}/exam-sessions    - Assign exam sessions to class
DELETE /api/teacher/classes/{classId}/exam-sessions/{examSessionId}  - Remove from class
```

## 🎯 Workflow với API thật

### Tab 1: Tạo đề thi mới
1. Modal mở → `fetchExams()` gọi `GET /api/teacher/exams`
2. User chọn đề, nhập thông tin
3. User click "Tạo và gán đề thi"
4. `createExamSession()` gọi `POST /api/teacher/exam-sessions`
5. `onAssign([newSessionId])` gọi `POST /api/teacher/classes/{classId}/exam-sessions`
6. Hiển thị thông báo thành công
7. Modal đóng và refresh danh sách

### Tab 2: Chọn đề có sẵn
1. Modal mở → `fetchExistingSessions()` gọi `GET /api/teacher/exam-sessions/search`
2. User search/filter và chọn các ca thi
3. User click "Gán X đề thi"
4. `onAssign(selectedIds)` gọi `POST /api/teacher/classes/{classId}/exam-sessions`
5. Hiển thị thông báo thành công
6. Modal đóng và refresh danh sách

## 📊 Data Flow

```
Frontend (AssignExamsModal)
    ↓ fetchExams()
    ↓ GET /api/teacher/exams
Backend (ExamController)
    ↓ examService.getAllExam()
Database (Exam table)
    ↑ List<ExamResponse>
Frontend
    ↓ Display in dropdown

User selects & fills form
    ↓ handleCreateSession()
    ↓ POST /api/teacher/exam-sessions
Backend (ExamSessionController)
    ↓ examSessionService.createSession()
Database (ExamSession table)
    ↑ ExamSessionResponse (with ID)
Frontend
    ↓ onAssign([sessionId])
    ↓ POST /api/teacher/classes/{classId}/exam-sessions
Backend (ClassController)
    ↓ classService.addExamSessionsToClass()
Database (Class_ExamSession mapping)
    ↑ Success
Frontend
    ↑ Alert & close modal
```

## 🧪 Testing

### Test API trong browser console:
```javascript
// Test get exams
fetch('/api/teacher/exams?page=0&size=10', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
  .then(r => r.json())
  .then(console.log)

// Test get exam sessions
fetch('/api/teacher/exam-sessions/search?page=0&size=10', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
  .then(r => r.json())
  .then(console.log)
```

### Test trong UI:
1. ✅ Mở modal "Giao đề thi"
2. ✅ Tab "Tạo đề thi mới" → Dropdown load đề thi từ API
3. ✅ Tab "Chọn đề có sẵn" → List load ca thi từ API
4. ✅ Tạo ca thi mới → Thành công và gán cho lớp
5. ✅ Chọn ca thi có sẵn → Thành công và gán cho lớp
6. ✅ Error handling → Alert hiển thị khi API fail

## ⚠️ Lưu ý

### Auto-assign students
Hiện tại tính năng "Tự động gán sinh viên" chưa có API endpoint riêng. Có 2 cách xử lý:

**Option 1**: Backend tự động gán khi add exam session vào class
```java
// ClassService.addExamSessionsToClass()
// Tự động tạo ExamSessionStudent cho tất cả students trong class
```

**Option 2**: Frontend gọi thêm API riêng (cần implement backend)
```typescript
// Sau khi assign session to class
if (autoAssign) {
  await assignStudentsToSession(newSession.id, classId);
}
```

### Search trong exam sessions
API hỗ trợ search với params:
```typescript
getAllExamSessions({
  examId: 123,      // Filter theo exam ID
  name: "giữa kỳ",  // Search theo tên
  code: "EXAM"      // Search theo mã
}, page, size)
```

## ✨ Improvements tiếp theo

1. ✅ Thêm loading skeleton khi fetch data
2. ✅ Thêm debounce cho search box
3. ✅ Thêm pagination cho exam sessions list
4. ✅ Thêm filter dropdown (by status, by exam)
5. ✅ Thêm toast notification thay alert
6. ✅ Thêm validation cho datetime (startTime < endTime)
7. ✅ Thêm confirmation dialog trước khi submit

## 🎉 Kết quả

- ✅ Không còn mock data
- ✅ Tất cả data đều từ backend API
- ✅ Error handling đầy đủ
- ✅ Type-safe với TypeScript
- ✅ Sẵn sàng cho production
