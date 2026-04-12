import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminProfilePage.css";
import {
  UserIcon,
  MapPinIcon,
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  YoutubeIcon,
  MailIcon,
  GridIcon,
  UsersIcon
} from "../components/Icons";
import ContentCard from "../components/ContentCard";

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function AdminProfilePage() {
  const navigate = useNavigate();
  const current = JSON.parse(localStorage.getItem("user") || "null");

  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });

  const [modalType, setModalType] = useState(null); 
  const [modalUsers, setModalUsers] = useState([]);
  const [modalSearch, setModalSearch] = useState("");
  const [isModalLoading, setIsModalLoading] = useState(false);

  const handleDeletePost = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setStats(s => ({ ...s, posts: s.posts - 1 }));
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://localhost:8000${path}`;
  };

  useEffect(() => {
    if (!current) {
      navigate("/");
      return;
    }

    fetch(`http://localhost:8000/users/${current.id}`)
      .then(res => res.json())
      .then(data => {
        setUserData(data);
        localStorage.setItem("user", JSON.stringify({ ...current, ...data }));
      });

    fetch(`http://localhost:8000/users/${current.id}/posts`)
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setStats(s => ({ ...s, posts: data.length }));
      });

    fetch(`http://localhost:8000/follow-stats/${current.id}`)
      .then(res => res.json())
      .then(data => setStats(s => ({ ...s, ...data })));

  }, []);

  const openModal = async (type) => {
    setModalType(type);
    setModalSearch("");
    setIsModalLoading(true);

    const endpoint = type === "Followers"
      ? `http://localhost:8000/followers/${current.id}?viewer_id=${current.id}`
      : `http://localhost:8000/following/${current.id}?viewer_id=${current.id}`;

    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      setModalUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setModalUsers([]);
  };

  const toggleFollow = async (user) => {
    const isCurrentlyFollowing = user.isFollowing;
    const url = isCurrentlyFollowing ? "http://localhost:8000/unfollow" : "http://localhost:8000/follow";
    const method = isCurrentlyFollowing ? "DELETE" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follower_id: current.id, following_id: user.id })
      });

      if (res.ok) {
        setModalUsers(prev => prev.map(u => 
          u.id === user.id ? { ...u, isFollowing: !isCurrentlyFollowing } : u
        ));

        setStats(prev => ({
          ...prev,
          following: prev.following + (isCurrentlyFollowing ? -1 : 1)
        }));
      }
    } catch (err) {
      console.error("Toggle follow failed", err);
    }
  };

  const filteredModalUsers = modalUsers.filter(u => 
    u.username.toLowerCase().includes(modalSearch.toLowerCase()) || 
    (u.fullName && u.fullName.toLowerCase().includes(modalSearch.toLowerCase()))
  );

  if (!userData) return <div className="p-6 text-white">Loading...</div>;

  return (
    <main className="profile-main relative">
      <div className="container">

        <div className="profile-card">
          <div className="cover-container">
            {userData.coverPhoto ? (
              <img src={getImageUrl(userData.coverPhoto)} alt="Cover" className="cover-photo" />
            ) : (
              <div className="cover-empty">{userData.fullName || "Upload Cover"}</div>
            )}

            <div className="profile-pic-wrapper">
              <div className="profile-pic">
                {userData.profilePhoto ? (
                  <img src={getImageUrl(userData.profilePhoto)} alt="Profile" className="profile-img" />
                ) : (
                  <UserIcon className="profile-icon" />
                )}
              </div>
            </div>

            <div className="cover-socials">
              {userData.socials?.facebook && <a href={userData.socials.facebook} target="_blank" rel="noreferrer"><FacebookIcon /></a>}
              {userData.socials?.instagram && <a href={userData.socials.instagram} target="_blank" rel="noreferrer"><InstagramIcon /></a>}
              {userData.socials?.twitter && <a href={userData.socials.twitter} target="_blank" rel="noreferrer"><TwitterIcon /></a>}
              {userData.socials?.youtube && <a href={userData.socials.youtube} target="_blank" rel="noreferrer"><YoutubeIcon /></a>}
              {userData.socials?.mail && <a href={`mailto:${userData.socials.mail}`}><MailIcon /></a>}
            </div>
          </div>

          <div className="profile-info">
            <h1 className="fullname">{userData.fullName}</h1>
            <p className="username">@{userData.username}</p>
            
            {/* ✅ NEW: Role display */}
            <div style={{textAlign: "center", marginBottom: "1rem"}}>
              {userData.role && (
                <span style={{ background: "transprant", color: "gray", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
                  {userData.role}
                </span>
              )}
            </div>

            <div className="stats-box">
              <div className="stat-item">
                <GridIcon />
                <span className="stat-number">{stats.posts}</span>
                <span className="stat-label">Posts</span>
              </div>

              <div className="stat-item" style={{cursor: 'pointer'}} onClick={() => openModal("Followers")}>
                <UsersIcon />
                <span className="stat-number">{stats.followers}</span>
                <span className="stat-label hover:underline">Followers</span>
              </div>

              <div className="stat-item" style={{cursor: 'pointer'}} onClick={() => openModal("Following")}>
                <UsersIcon />
                <span className="stat-number">{stats.following}</span>
                <span className="stat-label hover:underline">Following</span>
              </div>
            </div>

            <div className="edit-btn-wrapper">
              <button onClick={() => navigate("/dashboard/edit-profile")} className="edit-btn">
                Edit Profile
              </button>
            </div>

            <p className="bio">{userData.bio}</p>

            {userData.location && (
              <div className="location">
                <MapPinIcon /> {userData.location}
              </div>
            )}
          </div>
        </div>

        <div className="posts-grid">
          {posts.map(post => (
            <ContentCard key={post.id} post={post} onDelete={handleDeletePost} />
          ))}
        </div>
      </div>

      {modalType && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{width: '24px'}}></div> 
              <h2>{modalType}</h2>
              <button className="close-modal-btn" onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>

            <div className="modal-search-box">
              <input 
                type="text" 
                placeholder="Search" 
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
              />
            </div>

            <div className="modal-user-list">
              {isModalLoading ? (
                <div className="loading-text">Loading...</div>
              ) : filteredModalUsers.length === 0 ? (
                <div className="loading-text">No users found.</div>
              ) : (
                filteredModalUsers.map(user => (
                  <div key={user.id} className="modal-user-row">
                    <div className="modal-user-info" onClick={() => navigate(`/dashboard/user/${user.id}`)}>
                      <div className="modal-avatar">
                        {user.profilePhoto ? (
                          <img src={getImageUrl(user.profilePhoto)} alt="img" />
                        ) : (
                          <span>{(user.fullName || user.username)[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="modal-user-text">
                        <span className="modal-username">{user.username}</span>
                        <span className="modal-fullname">{user.fullName}</span>
                      </div>
                    </div>

                    <button 
                      className={`modal-follow-btn ${user.isFollowing ? 'following' : 'follow'}`}
                      onClick={() => toggleFollow(user)}
                    >
                      {user.isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminProfilePage;
