import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HeartIcon, MessageIcon, EyeIcon, XIcon, ThreeDotsIcon } from "../components/Icons"; // Ensure these exist


function PostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const current = JSON.parse(localStorage.getItem("user") || "null");

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [showMenu, setShowMenu] = useState(false); // ✅ Menu State

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://localhost:8000${path}`;
  };

  useEffect(() => {
    if (!postId) return;

    const load = async () => {
      try {
        const p = await fetch(`http://localhost:8000/posts/${postId}?viewer_id=${current?.id}`).then(r => r.json());
        setPost(p);
        setLikes(p.likes || 0);

        const c = await fetch(`http://localhost:8000/posts/${postId}/comments`).then(r => r.json());
        setComments(Array.isArray(c) ? c : []);

        if (current) {
          const l = await fetch(`http://localhost:8000/posts/${postId}/is-liked/${current.id}`).then(r => r.json());
          setLiked(l.liked);
        }
      } catch (err) {
        console.error("Failed to load post");
      }
    };
    load();
  }, [postId, current?.id]);

  const toggleLike = async () => {
    if (!current) return navigate("/");
    const url = `http://localhost:8000/posts/${postId}/${liked ? "unlike" : "like"}`;
    await fetch(url, {
      method: liked ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: current.id }),
    });
    setLiked(!liked);
    setLikes(l => l + (liked ? -1 : 1));
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    const res = await fetch(`http://localhost:8000/posts/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: current.id, text: commentText }),
    });

    if (res.ok) {
      setCommentText("");
      const c = await fetch(`http://localhost:8000/posts/${postId}/comments`).then(r => r.json());
      setComments(c);
    }
  };

  // ✅ DELETE FUNCTION
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this post?")) return;

    try {
      const res = await fetch(`http://localhost:8000/posts/${postId}?user_id=${current.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        navigate(-1); // Go back to previous page
      } else {
        alert("Failed to delete");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!post) return <div className="text-white p-10">Loading...</div>;

  const isOwner = current && current.id === post.user_id;

  return (
    <div className="min-h-screen bg-[#0d0b2b] flex justify-center py-10 text-white relative">
      
      {/* CLOSE BUTTON */}
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-5 right-5 text-white/80 hover:text-white z-50 p-2 bg-black/20 rounded-full"
      >
        <XIcon className="h-8 w-8" />
      </button>

      <div className="bg-[#1a144e] w-[900px] h-[85vh] rounded-2xl overflow-hidden flex shadow-2xl">

        {/* LEFT: IMAGE */}
        <div className="w-1/2 bg-black flex items-center justify-center relative">
          <img src={post.media} alt="post" className="max-w-full max-h-full object-contain" />
        </div>

        {/* RIGHT: CONTENT */}
        <div className="w-1/2 flex flex-col relative">

          {/* HEADER */}
          <div className="flex items-center justify-between p-4 border-b border-gray-600 bg-[#1a144e]">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/dashboard/user/${post.user_id}`)}>
             {/* ✅ UPDATED PROFILE PHOTO LOGIC */}
              <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center text-white font-bold border border-gray-600">
                {post.profilePhoto ? (
                  <img 
                    src={getImageUrl(post.profilePhoto)} 
                    alt="profile" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span>
                    {(post.fullName || post.username || "?")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <span className="font-semibold text-lg hover:underline">@{post.username}</span>
            </div>

            {/* ✅ THREE DOTS MENU (Only Owner) */}
            {isOwner && (
              <div className="relative"
                    onClick={(e) =>{
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
              >
                <ThreeDotsIcon className="w-6 h-6 cursor-pointer text-gray-300 hover:text-white"/>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-32 bg-[#2a246e] rounded shadow-xl border border-gray-600 z-10">
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#352f7a] transition"
                    >
                      Delete Post
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COMMENTS LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600">
            {/* Caption */}
            <div className="flex gap-2">
              <span className="font-bold text-sm">@{post.username}</span>
              <p className="text-sm text-gray-300">{post.caption}</p>
            </div>

            {/* Comments */}
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <span 
                  className="font-bold text-sm cursor-pointer hover:underline"
                  onClick={() => navigate(`/dashboard/user/${c.user_id}`)}
                >
                  @{c.username}
                </span>
                <p className="text-sm text-gray-300 break-words">{c.text}</p>
              </div>
            ))}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="p-4 border-t border-gray-600 bg-[#1a144e]">
            <div className="flex items-center gap-4 mb-2">
              <HeartIcon onClick={toggleLike} className={`h-7 w-7 cursor-pointer transition ${liked ? "text-red-500 scale-110" : "hover:text-gray-300"}`} />
              <MessageIcon className="h-7 w-7 cursor-pointer hover:text-gray-300" />
              <EyeIcon className="h-7 w-7 text-gray-400" />
            </div>

            <p className="font-semibold text-sm mb-2">{likes} likes</p>

            {/* Comment Input */}
            <div className="flex gap-2 mt-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent border-none text-sm outline-none placeholder-gray-500"
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
              />
              <button 
                onClick={submitComment} 
                className={`text-sm font-semibold ${commentText.trim() ? "text-blue-400 hover:text-blue-300" : "text-blue-400/50 cursor-default"}`}
                disabled={!commentText.trim()}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostPage;