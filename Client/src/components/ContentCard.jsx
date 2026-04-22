import React, { useEffect, useState } from "react";
import { HeartIcon, MessageIcon, EyeIcon, ThreeDotsIcon } from "./Icons"; 
import { useNavigate } from "react-router-dom";
import PostViewersModal from "./PostViewersModal"; 

function ContentCard({ post, onDelete }) {
  const navigate = useNavigate();
  const current = JSON.parse(localStorage.getItem("user") || "null");

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false); 

  const isOwner = current && current.id === post.user_id;

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://localhost:8000${path}`;
  };

  useEffect(() => {
    if (!current) return;
    fetch(`http://localhost:8000/posts/${post.id}/is-liked/${current.id}`)
      .then((r) => r.json())
      .then((d) => setLiked(d.liked === true))
      .catch(() => {});
  }, [post.id, current]);

  const toggleLike = async (e) => {
    e.stopPropagation();
    if (!current) return navigate("/");

    const url = `http://localhost:8000/posts/${post.id}/${liked ? "unlike" : "like"}?user_id=${current.id}`;
    try {
      const res = await fetch(url, { method: liked ? "DELETE" : "POST" });
      if (res.ok) {
        setLiked(!liked);
        setLikesCount((v) => v + (liked ? -1 : 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`http://localhost:8000/posts/${post.id}?user_id=${current.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (onDelete) onDelete(post.id); 
        else window.location.reload();   
      } else {
        alert("Failed to delete post");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <>
      {/* ✅ MODAL RENDERED OUTSIDE THE CARD DIV TO PREVENT TRAPPING */}
      {showViewersModal && (
        <PostViewersModal postId={post.id} onClose={() => setShowViewersModal(false)} />
      )}

      <div
        className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer hover:scale-[1.02] transition relative group" 
        onClick={() => navigate(`/dashboard/post/${post.id}?viewer=${current.id}`)}
        onMouseLeave={() => setShowMenu(false)} 
      >
        
        {isOwner && (
          <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div 
               className="bg-white/80 backdrop-blur rounded-full p-1 shadow-sm hover:bg-white"
               onClick={(e) => {
                 e.stopPropagation();
                 setShowMenu(!showMenu);
               }}
            >
              <ThreeDotsIcon className="w-6 h-6 text-gray-700" />
            </div>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1">
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                >
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}

        {/* Media */}
        <div className="aspect-square bg-gray-100">
          {post.media ? (
            <img src={post.media} alt="post" className="w-full h-full object-cover" />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center text-white font-semibold">
              {post.profilePhoto ? (
                <img src={getImageUrl(post.profilePhoto)} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <span>{(post.fullName || post.username || "?")[0].toUpperCase()}</span>
              )}
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-800 leading-tight">@{post.username}</span>
              {post.role && <span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">{post.role}</span>}
            </div>
          </div>

          <div className="flex items-center justify-between text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1" onClick={toggleLike}>
                <HeartIcon className={`h-6 w-6 ${liked ? "text-red-500" : "hover:text-red-400"}`} />
                <span className="text-sm">{likesCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageIcon className="h-6 w-6" />
                <span className="text-sm">{post.comments || 0}</span>
              </div>
            </div>
            
            {/* Eye Icon Action */}
            <div 
               className={`flex items-center gap-1 text-gray-500 ${isOwner ? 'cursor-pointer hover:text-gray-700' : ''}`}
               onClick={(e) => {
                   if (isOwner) {
                     e.stopPropagation(); 
                     setShowViewersModal(true); 
                   }
               }}
            >
              <EyeIcon className="h-6 w-6" />
              <span className="text-sm">{post.views || 0}</span>
            </div>
          </div>

          {post.caption && (
            <p className="mt-2 text-sm text-gray-700 line-clamp-2">{post.caption}</p>
          )}
        </div>
      </div>
    </>
  );
}

export default ContentCard;
