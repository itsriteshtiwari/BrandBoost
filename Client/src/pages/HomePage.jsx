import React, { useEffect, useState } from "react";
import ContentCard from "../components/ContentCard";
import { useNavigate } from "react-router-dom";
import {
  HomeIcon,
  SearchIcon,
  PlusSquareIcon,
  BellIcon,
  SendIcon,
} from "../components/Icons"; 
import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false); // For Bell
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);       // ✅ For Messages
  const current = JSON.parse(localStorage.getItem("user") || "null");

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://localhost:8000${path}`;
  };

  useEffect(() => {
    if (!current) return;

    // 1. Fetch Feed
    const fetchFeed = async () => {
      try {
        const res = await fetch(`http://localhost:8000/feed/${current.id}`);
        const data = await res.json();
        setPosts(data);
      } catch (err) { console.error(err); }
    };

    // 2. Fetch Notification Status (Red Dot)
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`http://localhost:8000/notifications/${current.id}`);
        const data = await res.json();
        setHasUnreadNotifs(data.some((n) => n.read === 0));
      } catch (err) { console.error(err); }
    };

    // 3. ✅ Fetch Unread Message Count (Number)
    const fetchMessageCount = async () => {
      try {
        const res = await fetch(`http://localhost:8000/messages/unread-count/${current.id}`);
        if (res.ok) {
          const data = await res.json();
          setUnreadMsgCount(data.count);
        }
      } catch (err) {
        console.error("Error fetching message count", err);
      }
    };

    fetchFeed();
    fetchNotifications();
    fetchMessageCount();
  }, [current?.id]);

  return (
    <div className="homepage-container">
      <header className="homepage-header">
        <div className="logo">BrandBoost</div>
        <div className="search-container">
          <input
            type="text"
            placeholder="What are you looking for?"
            className="search-input"
            onFocus={() => navigate("/dashboard/search")}
          />
          <SearchIcon className="search-icon" />
        </div>

        <div className="header-icons">
          <HomeIcon onClick={() => navigate("/dashboard/home")} className="icon" />
          <PlusSquareIcon onClick={() => navigate("/dashboard/post")} className="icon" />
          
          {/* ✅ MESSAGE ICON WITH NUMBER BADGE */}
          <div className="icon-wrapper" onClick={() => navigate("/dashboard/messages")}>
            <SendIcon className="icon" />
            
            {unreadMsgCount > 0 && (
              <span className="message-badge">
                {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
              </span>
            )}
          </div>

          {/* ✅ BELL ICON WITH RED DOT */}
          <div className="icon-wrapper" onClick={() => navigate("/dashboard/notifications")}>
            <BellIcon className="icon" />
            {hasUnreadNotifs && <span className="notification-dot"></span>}
          </div>

          <div className="divider"></div>

          {/* Profile Photo */}
          <div 
            className="header-profile-pic" 
            onClick={() => navigate("/dashboard/profile")}
          >
            {current?.profilePhoto ? (
              <img src={getImageUrl(current.profilePhoto)} alt="Profile" className="header-img"/>
            ) : (
              <div className="header-initial">
                {(current?.fullName || current?.username || "?")[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="homepage-main">
        <div className="intro-text">
          <h1>BrandBoost</h1>
          <p>Connecting Sponsors with Opportunity.</p>
        </div>

        <div className="card-grid">
          {posts.length === 0 ? (
            <p className="text-gray-400 text-center w-full">No posts yet</p>
          ) : (
            posts.map((post) => <ContentCard key={post.id} post={post} />)
          )}
        </div>
      </main>
    </div>
  );
}

export default HomePage;