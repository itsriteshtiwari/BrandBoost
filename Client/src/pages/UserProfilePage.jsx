import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./UserProfilePage.css";
import {
  UserIcon,
  MapPinIcon,
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  YoutubeIcon,
  MailIcon,
  UsersIcon,
  GridIcon
} from "../components/Icons";
import ContentCard from "../components/ContentCard";

function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const current = JSON.parse(localStorage.getItem("user") || "null");

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://localhost:8000${path}`;
  };

  /* ================= REDIRECT OWN PROFILE ================= */
  useEffect(() => {
    if (current && parseInt(userId) === current.id) {
      navigate("/dashboard/profile");
    }
  }, [userId]);

  /* ================= FETCH USER DATA ================= */
  useEffect(() => {
    if (!userId) return;

    // profile info
    fetch(`http://localhost:8000/users/${userId}`)
      .then(res => res.json())
      .then(setUser);

    // followers / following
    fetch(`http://localhost:8000/follow-stats/${userId}`)
      .then(res => res.json())
      .then(data =>
        setStats(s => ({
          ...s,
          followers: data.followers,
          following: data.following
        }))
      );

    // user posts
    fetch(`http://localhost:8000/users/${userId}/posts`)
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setStats(s => ({ ...s, posts: data.length }));
      });

    // ✅ FIXED: Use the correct is-following endpoint
    if (current) {
      fetch(`http://localhost:8000/is-following/${current.id}/${userId}`)
        .then(res => res.json())
        .then(data => setIsFollowing(data.following))
        .catch(err => console.error("Follow check failed:", err));
    }
  }, [userId, current?.id]);

  /* ================= FOLLOW / UNFOLLOW ================= */
  const toggleFollow = async () => {
    if (!current) return navigate("/");

    const res = await fetch(
      `http://localhost:8000/${isFollowing ? "unfollow" : "follow"}`,
      {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          follower_id: current.id,
          following_id: parseInt(userId)
        })
      }
    );

    if (res.ok) {
      setIsFollowing(!isFollowing);
      setStats(s => ({
        ...s,
        followers: s.followers + (isFollowing ? -1 : 1)
      }));
    }
  };

  if (!user) return <div className="p-6 text-white">Loading...</div>;

  /* ================= UI ================= */
  return (
    <main className="main-content">
      <div className="profile-header">
        <div className="profile-cards">
          <div className="cover-container">
            {user.coverPhoto ? (
              <img src={`http://localhost:8000${user.coverPhoto}`} alt="Cover" className="cover-photo" />
            ) : (
              <div className="cover-empty">{user.fullName || "Upload Cover"}</div>
            )}
            <div className="profile-avatar">
              {user.profilePhoto ? (
                <img src={getImageUrl(user.profilePhoto)} alt="avatar" className="profile-pics"/>
              ) : (
                <UserIcon size={60} />
              )}
            </div>
          </div>

          <div className="profile-content">
            <div className="profile-stats">
              <div className="stat">
                <GridIcon size={20} />
                <span className="stat-number">{stats.posts}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat">
                <UserIcon size={20} />
                <span className="stat-number">{stats.followers}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat">
                <UsersIcon size={20} />
                <span className="stat-number">{stats.following}</span>
                <span className="stat-label">Following</span>
              </div>
            </div>

            <div className="profile-details">
              <h1 className="profile-name">{user.fullName}</h1>
              <p className="profile-username">@{user.username}</p>

              <div className="profile-actions">
                {/* ✅ Follow Button reflects state correctly */}
                <button className={`btn-follow ${isFollowing ? "following-state" : ""}`} onClick={toggleFollow}>
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
                
                {/* ✅ FIXED: Pass user data securely to MessagePage */}
                <button
                  className="btn-message"
                  onClick={() =>
                    navigate("/dashboard/messages", {
                      state: {
                        chatUser: {
                          id: user.id,
                          name: user.fullName,
                          username: user.username,
                          profilePhoto: user.profilePhoto
                        }
                      }
                    })
                  }
                >
                  Message
                </button>
              </div>
            </div>

            <div className="profile-social">
              {user.socials?.facebook && <a href={user.socials.facebook}><FacebookIcon /></a>}
              {user.socials?.instagram && <a href={user.socials.instagram}><InstagramIcon /></a>}
              {user.socials?.twitter && <a href={user.socials.twitter}><TwitterIcon /></a>}
              {user.socials?.youtube && <a href={user.socials.youtube}><YoutubeIcon /></a>}
              {user.socials?.mail && <a href={`mailto:${user.socials.mail}`}><MailIcon /></a>}
            </div>

            <div className="profile-description">
              <p>{user.bio}</p>
            </div>

            {user.location && (
              <div className="profile-location">
                <MapPinIcon size={18} />
                <span>{user.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* ================= POSTS GRID ================= */}
        <div className="posts-grid">
          {posts.length === 0 ? (
            <p className="text-center text-gray-400 mt-6">No posts yet</p>
          ) : (
            posts.map(post => <ContentCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </main>
  );
}

export default UserProfilePage;