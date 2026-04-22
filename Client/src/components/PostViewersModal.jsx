import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CloseIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function PostViewersModal({ postId, onClose }) {
  const navigate = useNavigate();
  const [viewers, setViewers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    fetch(`http://localhost:8000/posts/${postId}/viewers`)
      .then(res => res.json())
      .then(data => {
        setViewers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [postId]);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://localhost:8000${path}`;
  };

  const handleMessage = (user) => {
     onClose(); 
     navigate("/dashboard/messages", {
       state: {
         chatUser: {
            id: user.id,
            name: user.fullName,
            username: user.username,
            profilePhoto: user.profilePhoto
         }
       }
     });
  };

  const filteredViewers = viewers.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/65 backdrop-blur-[2px]" 
      onClick={onClose}
    >
      <div 
        // ✅ Added text-left here to block external center-alignment CSS
        className="bg-[#262626] w-[400px] max-w-[90vw] h-[400px] rounded-xl flex flex-col text-white shadow-2xl animate-[modalPopIn_0.2s_ease-out] text-left" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#363636]">
          <div className="w-6"></div> {/* Spacer for centering */}
          <h2 className="text-base font-semibold m-0 text-center flex-1">Post Viewers</h2>
          <button onClick={onClose} className="text-white hover:text-gray-300 flex items-center justify-center w-6">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-[#363636] border-none rounded-lg text-white text-sm outline-none placeholder-[#8e8e8e]"
          />
        </div>

        {/* Body - Viewer List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ scrollbarWidth: 'none' }}>
          {loading ? (
            <div className="text-center text-[#8e8e8e] mt-5 text-sm">Loading...</div>
          ) : filteredViewers.length === 0 ? (
            <div className="text-center text-[#8e8e8e] mt-5 text-sm">No viewers found.</div>
          ) : filteredViewers.map(user => (
            <div key={user.id} className="flex items-center justify-between mb-4">
              
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/dashboard/user/${user.id}`)}>
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-[#555] overflow-hidden flex items-center justify-center text-white font-bold flex-shrink-0">
                  {user.profilePhoto ? (
                    <img src={getImageUrl(user.profilePhoto)} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(user.fullName || user.username || "?")[0].toUpperCase()}</span>
                  )}
                </div>

                {/* User Details */}
                {/* ✅ Added items-start to force left alignment for the text block */}
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-sm text-[#f5f5f5]">@{user.username}</span>
                  <span className="text-xs text-[#a8a8a8]">
                    {user.fullName} {user.role && <span className="ml-1 text-[10px] text-blue-400 font-bold uppercase tracking-wider">• {user.role}</span>}
                  </span>
                </div>
              </div>

              {/* Message Button */}
              <button 
                onClick={() => handleMessage(user)}
                className="px-4 py-1.5 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-lg font-semibold text-sm transition border-none"
              >
                 Message
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PostViewersModal;