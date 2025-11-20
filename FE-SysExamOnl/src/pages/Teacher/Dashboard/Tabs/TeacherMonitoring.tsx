import { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import { getStompClient } from '../../../../utils/websocket';

export default function TeacherMonitoring() {
  const { examSessionId } = useParams();
  const id = Number(examSessionId); // convert string → number

  const [students, setStudents] = useState<Map<number, StudentLiveStatus>>(new Map());

  useEffect(() => {
  const client = getStompClient();

    let subscription: any = null;
    console.log("Connected to examSessionId:", examSessionId);

  const onConnect = () => {
    console.log("Connected to examSessionId:", examSessionId);

    subscription = client.subscribe(
      `/topic/exam/${examSessionId}`,
      (message) => {
        const broadcast: {
          userId: number;
          event: "ENTER" | "LEAVE" | "FOCUS_LOST" | "FOCUS_GAINED" | "SUBMIT";
        } = JSON.parse(message.body);

        setStudents((prev) => {
          const map = new Map(prev);
          const existing =
            map.get(broadcast.userId) || {
              userId: broadcast.userId,
              username: "Đang tải...",
            };

          switch (broadcast.event) {
            case "ENTER":
            case "FOCUS_GAINED":
              map.set(broadcast.userId, {
                ...existing,
                status: "ONLINE",
              });
              break;

            case "LEAVE":
            case "FOCUS_LOST":
              map.set(broadcast.userId, {
                ...existing,
                status:
                  broadcast.event === "FOCUS_LOST"
                    ? "FOCUS_LOST"
                    : "OFFLINE",
              });
              break;

            case "SUBMIT":
              map.set(broadcast.userId, {
                ...existing,
                status: "SUBMITTED",
              });
              break;
          }

          return map;
        });
      }
    );
  };

  // Nếu đã kết nối thì subscribe ngay
  if (client.connected) {
    onConnect();
  } else {
    // Nếu chưa kết nối thì gán handler chờ
    client.onConnect = onConnect;
  }

  return () => {
    // Hủy subscribe nếu có
    if (subscription) {
      subscription.unsubscribe();
    }
  };
}, [examSessionId]);


  // Render danh sách với màu sắc
  const statusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-100 text-green-800';
      case 'OFFLINE': return 'bg-gray-100 text-gray-800';
      case 'FOCUS_LOST': return 'bg-yellow-100 text-yellow-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from(students.values()).map((s) => (
        <div key={s.userId} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="font-semibold">{s.username || s.userId}</div>
          <div className={`inline-block px-3 py-1 rounded-full text-xs mt-2 ${statusColor(s.status)}`}>
            {s.status === 'ONLINE' && '🟢 Đang làm bài'}
            {s.status === 'OFFLINE' && '⚫ Đã rời'}
            {s.status === 'FOCUS_LOST' && '🟡 Mất tập trung'}
            {s.status === 'SUBMITTED' && '✅ Đã nộp bài'}
          </div>
        </div>
      ))}
    </div>
  );
}