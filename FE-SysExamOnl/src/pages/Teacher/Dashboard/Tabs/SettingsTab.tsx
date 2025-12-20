import  { useState, useEffect } from 'react';
import { User, Lock, Bell, LogOut, Eye, EyeOff, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../../api/axiosClient';

interface TeacherProfile {
  id: number;
  fullName: string;
  role: string;
  avatar?: string;
}

export default function SettingsTab() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'notifications'>('account');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<TeacherProfile>({
    id: 0,
    fullName: localStorage.getItem('teacherName') || '',
    role: localStorage.getItem('role') || 'Giáo viên',
  });

  // Edit state
  const [editProfile, setEditProfile] = useState(profile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Password change
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    examReminders: true,
    submissionAlerts: true,
    weeklyReport: true,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const storedName = localStorage.getItem('teacherName') || localStorage.getItem('name') || '';
      const storedRole = localStorage.getItem('role') || 'Giáo viên';

      const normalizedProfile: TeacherProfile = {
        id: 1,
        fullName: storedName,
        role: storedRole,
      };

      setProfile(normalizedProfile);
      setEditProfile(normalizedProfile);
    } catch (error) {
      toast.error('Không tải được thông tin hồ sơ');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editProfile.fullName.trim()) {
      toast.error('Vui lòng nhập tên đầy đủ');
      return;
    }

    setSaving(true);
    try {
      // Replace with actual API call
      // await axiosClient.put(`/teacher/profile`, editProfile);
      setProfile(editProfile);
      localStorage.setItem('teacherName', editProfile.fullName);
      setIsEditingProfile(false);
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (error) {
      toast.error('Cập nhật hồ sơ thất bại');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Vui lòng đăng nhập lại để đổi mật khẩu.');
      navigate('/login');
      return;
    }
    if (!passwordForm.oldPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setIsChangingPassword(true);
    try {
      await axiosClient.put('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
      });
      toast.success('Đổi mật khẩu thành công!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // Replace with actual API call
      // await axiosClient.put(`/teacher/notifications`, notifications);
      toast.success('Cập nhật cài đặt thông báo thành công!');
    } catch (error) {
      toast.error('Cập nhật cài đặt thất bại');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('teacherName');
      localStorage.removeItem('teacherEmail');
      navigate('/login');
      toast.success('Đã đăng xuất thành công!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 pb-4 mb-6">
        {[
          { id: 'account', label: 'Hồ sơ', icon: User },
          { id: 'security', label: 'Bảo mật', icon: Lock },
          { id: 'notifications', label: 'Thông báo', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'account' | 'security' | 'notifications')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-4 space-y-6">
        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin hồ sơ</h3>

              {!isEditingProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        profile.fullName
                      )}&background=6366f1&color=fff&bold=true&size=128`}
                      alt="avatar"
                      className="w-20 h-20 rounded-full ring-4 ring-indigo-100"
                    />
                    <div>
                      <p className="text-sm text-gray-600">Avatar</p>
                      <p className="font-medium text-gray-900">{profile.fullName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-gray-600">Tên đầy đủ</label>
                      <p className="mt-1 text-gray-900 font-medium">{profile.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Chức năng</label>
                      <p className="mt-1 text-gray-900 font-medium">{profile.role || 'Giáo viên'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
                  >
                    Chỉnh sửa hồ sơ
                  </button>
                </div>
              ) : (
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên đầy đủ
                      </label>
                      <input
                        type="text"
                        value={editProfile.fullName}
                        onChange={(e) =>
                          setEditProfile({ ...editProfile, fullName: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chức năng
                      </label>
                      <input
                        type="text"
                        value={editProfile.role || 'Giáo viên'}
                        disabled
                        className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-600"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setEditProfile(profile);
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Đổi mật khẩu</h3>

              <form className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.oldPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          oldPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({
                          ...showPasswords,
                          current: !showPasswords.current,
                        })
                      }
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                      }
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 mt-6"
                >
                  {isChangingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </div>

            <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Vùng nguy hiểm</h3>
              <p className="text-sm text-red-700 mb-4">
                Đăng xuất khỏi tài khoản và xóa tất cả dữ liệu phiên làm việc.
              </p>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Cài đặt thông báo</h3>

              <div className="space-y-4">
                {[
                  {
                    key: 'emailNotifications',
                    label: 'Thông báo email',
                    description: 'Nhận thông báo qua email về các sự kiện quan trọng',
                  },
                  {
                    key: 'examReminders',
                    label: 'Nhắc nhở kì thi',
                    description:
                      'Nhận thông báo trước khi kì thi bắt đầu',
                  },
                  {
                    key: 'submissionAlerts',
                    label: 'Cảnh báo nộp bài',
                    description:
                      'Nhận thông báo khi có thí sinh nộp bài',
                  },
                  {
                    key: 'weeklyReport',
                    label: 'Báo cáo hàng tuần',
                    description:
                      'Nhận báo cáo tóm tắt các hoạt động trong tuần',
                  },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          notifications[
                            item.key as keyof typeof notifications
                          ]
                        }
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveNotifications}
                disabled={saving}
                className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
