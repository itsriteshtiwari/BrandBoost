import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function NotificationsPage() {
  const navigate = useNavigate();
  const current = JSON.parse(localStorage.getItem("user") || "null");

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔔 DEFINE THE FUNCTION (THIS WAS MISSING)
  const fetchNotifications = async () => {
    if (!current) return;

    try {
      const res = await fetch(
        `http://localhost:8000/notifications/${current.id}`
      );

      if (!res.ok) {
        console.error("Failed to fetch notifications");
        return;
      }

      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Notification fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!current) {
      navigate("/");
      return;
    }
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:8000/notifications/${id}/read`, {
        method: "PUT",
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: 1 } : n
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-white p-6">Loading notifications...</div>;
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-semibold mb-4">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="text-gray-400">No notifications yet</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-lg cursor-pointer ${
                n.read ? "bg-[#1a144e]" : "bg-[#2b246f]"
              }`}
              onClick={() => {
                if (!n.read) markAsRead(n.id);
                if (n.post_id) {
                  navigate(`/dashboard/post/${n.post_id}`);
                } else {
                  navigate(`/dashboard/user/${n.sender_id}`);
                }
              }}
            >
              <p>
                <strong>@{n.sender_username}</strong>{" "}
                {n.type === "follow" && "started following you"}
                {n.type === "like" && "liked your post"}
                {n.type === "comment" && "commented on your post"}
              </p>

              <small className="text-gray-400">
                {new Date(n.created_at).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
