import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import { formatDistanceToNow } from 'date-fns';
import { LogIn, LogOut, Users, Wifi, WifiOff, Clock } from 'lucide-react';
import SockJS from 'sockjs-client';
import vi from 'date-fns/locale/vi'; // Để format tiếng Việt

interface StudentEventData {
  userId: number;
  username?: string; // Thêm username từ backend
  fullName?: string;
  event: {
    examSessionId: number;
    event: 'ENTER' | 'LEAVE' | 'CHEAT_DETECTED' | 'SUBMIT' | 'TAB_SWITCH';
    timestamp?: string;
  };
  timestamp: string;
}

export default function ExamMonitoringPage() {
  const [onlineStudents, setOnlineStudents] = useState<Set<number>>(new Set());
  const { examSessionId: paramId } = useParams<{ examSessionId: string }>();
  const [examSessionId, setExamSessionId] = useState(paramId || '28');
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [studentDetails, setStudentDetails] = useState<Map<number, { name: string; lastEvent: StudentEventData; status: 'online' | 'offline' }>>(new Map()); // Cache chi tiết sinh viên

  const token = localStorage.getItem('authToken') || '';

  // Fetch tên sinh viên từ API nếu chưa có (nếu backend không gửi fullName)
  const fetchStudentName = async (userId: number) => {
    if (studentDetails.has(userId) && studentDetails.get(userId)?.name) return;

    try {
      const response = await fetch(`http://localhost:8888/exam-online-system/api/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStudentDetails(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(userId) || { name: '', lastEvent: {} as StudentEventData, status: 'offline' };
          newMap.set(userId, { ...existing, name: data.fullName || data.username || 'Sinh viên ' + userId });
          return newMap;
        });
      } 
    } catch (err) {
      console.error(`Lỗi fetch tên user ${userId}: ${err}`);
    }
  };

  useEffect(() => {
    if (!token) {
      alert('Vui lòng đăng nhập để xem monitoring!');
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8888/exam-online-system/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      setConnected(true);

      client.subscribe(`/topic/exam/${examSessionId}`, (message) => {
        try {
          const broadcast: StudentEventData = JSON.parse(message.body);

          // Sử dụng username nếu có, hoặc fetch fullName
          const name = broadcast.username || broadcast.fullName || 'Sinh viên ' + broadcast.userId;
          if (!broadcast.username && !broadcast.fullName) fetchStudentName(broadcast.userId);

          // Thêm timestamp nếu không có
          broadcast.timestamp = broadcast.timestamp || new Date().toISOString();

          // Cập nhật chi tiết sinh viên
          setStudentDetails(prev => {
            const newMap = new Map(prev);
            newMap.set(broadcast.userId, {
              name,
              lastEvent: broadcast,
              status: broadcast.event.event === 'ENTER' ? 'online' : 'offline'
            });
            return newMap;
          });

          // Cập nhật online/offline
          if (broadcast.event.event === 'ENTER') {
            setOnlineStudents((prev) => new Set(prev).add(broadcast.userId));
          } else if (broadcast.event.event === 'LEAVE') {
            setOnlineStudents((prev) => {
              const next = new Set(prev);
              next.delete(broadcast.userId);
              return next;
            });
          }
        } catch (err) {
          console.error(`Lỗi parse message: ${err}`);
        }
      });
    };

    client.onStompError = (frame) => {
      setConnected(false);
    };

    client.onWebSocketError = (error) => {
      setConnected(false);
    };

    client.onWebSocketClose = (event) => {
      setConnected(false);
    };

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [token, examSessionId]);

  // Lấy danh sách sinh viên từ studentDetails
  const studentList = Array.from(studentDetails.entries()).sort((a, b) => a[0] - b[0]); // Sắp xếp theo userId

  return (
    <div className="min-h-screen bg-[#f3f4ff] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Giám sát phòng thi</h1>
              <p className="text-gray-600 mt-1">Phòng thi ID: <span className="font-semibold">{examSessionId}</span></p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-500">Sinh viên đang online</p>
                <p className="text-3xl font-bold text-green-600">{onlineStudents.size}</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {connected ? 'Đã kết nối' : 'Mất kết nối'}
              </div>
            </div>
          </div>
        </div>

        {/* Grid các card sinh viên - giống ảnh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {studentList.map(([userId, details], index) => {
            const isOnline = details.status === 'online';
            const timeAgo = details.lastEvent.timestamp ? formatDistanceToNow(new Date(details.lastEvent.timestamp), { addSuffix: true, locale: vi }) : 'Không rõ';

            return (
              <div key={userId} className={`rounded-xl shadow-sm p-4 flex flex-col items-center text-center transition-all duration-300 ${
                isOnline ? 'bg-[#e8fff4] hover:bg-[#d4ffe9]' : 'bg-[#fff4e6] hover:bg-[#ffe8cc]'
              }`}>
                <div className={`mb-2 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                  isOnline ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {isOnline ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                  {isOnline ? 'Đã vào' : 'Đã ra'}
                </div>
                <p className="text-lg font-semibold text-gray-800">#{index + 1}</p>
                <p className="text-base font-medium text-gray-900 mt-1">{details.name}</p>
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {timeAgo}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}