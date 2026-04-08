import React, { useEffect, useState, useRef } from "react";
import { PaperclipIcon, SendIcon } from "../components/Icons";

function MessagePage() {
  const current = JSON.parse(localStorage.getItem("user") || "null");

  const [conversations, setConversations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");

  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://localhost:8000${path}`;
  };

  /* Helper for formatting message previews */
  const formatMessageTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(); // Shows date (e.g., 12/05/2026)
    }
  };

  /* ================= LOAD CONVERSATIONS ================= */
  const loadConversations = () => {
    if (!current?.id) return;
    fetch(`http://localhost:8000/messages/conversations/${current.id}`)
      .then(res => res.json())
      .then(setConversations);

    fetch(`http://localhost:8000/messages/requests/${current.id}`)
      .then(res => res.json())
      .then(setRequests);
  };

  useEffect(() => {
    loadConversations();
  }, [current?.id]);

  /* ================= LOAD MESSAGES ================= */
  useEffect(() => {
    if (!activeUser) return;

    fetch(`http://localhost:8000/messages/${current.id}/${activeUser.id}`)
      .then(res => res.json())
      .then(setMessages);
      
    // ✅ Refresh the local list of chats after opening one,
    // to clear the unread count dot.
    loadConversations(); 
  }, [activeUser]);

  /* ================= SEARCH ================= */
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    fetch(`http://localhost:8000/messages/search?q=${search}&viewer_id=${current.id}`)
      .then(res => res.json())
      .then(setSearchResults);
  }, [search]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim() || !activeUser) return;

    const res = await fetch("http://localhost:8000/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_id: current.id,
        receiver_id: activeUser.id,
        text,
      }),
    });

    if (res.ok) {
      const newMsg = await res.json();
      setMessages(prev => [...prev, newMsg]);
      setText("");
      
      // ✅ Update the current conversations list locally so the list
      // re-sorts and puts this person on top without full reload.
      setConversations(prev => {
         const filtered = prev.filter(c => c.partnerId !== activeUser.id);
         const updatedConv = {
            partnerId: activeUser.id,
            name: activeUser.name,
            username: activeUser.username,
            profilePhoto: activeUser.profilePhoto,
            lastMessageText: text, // Use the sent text as the preview
            lastMessageTime: new Date().toISOString(), // Use now as time
            unreadCount: 0 // You just sent a message, so unread sent TO YOU from them is 0.
         }
         return [updatedConv, ...filtered];
      });
    }
  };

  /* ================= FILE UPLOAD ================= */
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeUser) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("sender_id", current.id);
    fd.append("receiver_id", activeUser.id);

    const res = await fetch("http://localhost:8000/messages/upload", {
      method: "POST",
      body: fd,
    });

    if (res.ok) {
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      loadConversations(); // ✅ Refresh conversations to sort list
    }
  };

  const Avatar = ({ user }) => (
    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden shrink-0">
      {user.profilePhoto ? (
        <img src={getImageUrl(user.profilePhoto)} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold">{user.name?.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );

  return (
    <div className="w-full h-screen text-white flex">
      {/* LEFT SIDEBAR */}
      <div className="w-1/3 bg-[#0d0b2b] border-r border-gray-700 flex flex-col">
        <input
          className="w-full p-4 bg-[#1a144e] outline-none border-b border-gray-700"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="flex-1 overflow-y-auto">
          {searchResults.length > 0 && (
            <>
              <h3 className="p-3 text-sm text-gray-400 font-semibold">Search Results</h3>
              {searchResults.map(u => (
                <div key={u.id} onClick={() => setActiveUser(u)} className="p-3 cursor-pointer hover:bg-white/10 flex gap-3 items-center">
                  <Avatar user={u} />
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.isFollowing ? "Following" : "Not Following"}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          <h3 className="p-3 text-sm text-gray-400 font-semibold">Chats</h3>
          {conversations.map(conv => (
            <div
              key={conv.partnerId}
              onClick={() => setActiveUser({
                 id: conv.partnerId,
                 name: conv.name,
                 username: conv.username,
                 profilePhoto: conv.profilePhoto
              })}
              // ✅ Apply background color to active chat
              className={`p-3 cursor-pointer flex gap-3 items-center ${activeUser?.id === conv.partnerId ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              {/* ✅ Avatar wrapper for absolute positioning of unread dot */}
              <div className="relative">
                 <Avatar user={{ name: conv.name, profilePhoto: conv.profilePhoto }} />
                 {/* ✅ GREEN DOT INDICATOR (UNREAD MESSAGES) */}
                 {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-[#0d0b2b] flex items-center justify-center text-[10px] font-bold text-white">
                       {conv.unreadCount}
                    </div>
                 )}
              </div>
              
              <div className="flex-1">
                 <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{conv.name}</p>
                    {/* ✅ Last message time display */}
                    <p className="text-xs text-gray-500">{formatMessageTime(conv.lastMessageTime)}</p>
                 </div>
                 {/* ✅ Last message preview */}
                 <p className={`text-xs text-gray-400 max-w-xs line-clamp-1 break-all ${conv.unreadCount > 0 ? 'font-semibold text-white' : ''}`}>
                    {conv.lastMessageText || 'No message text'}
                 </p>
              </div>
            </div>
          ))}

          {requests.length > 0 && (
            <>
              <h3 className="p-3 text-sm text-yellow-400 font-semibold mt-2">Message Requests</h3>
              {requests.map(u => (
                <div key={u.id} onClick={() => setActiveUser(u)} className="p-3 cursor-pointer hover:bg-yellow-500/10 flex gap-3 items-center">
                  <Avatar user={u} />
                  <p>{u.name}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* RIGHT CHAT AREA */}
      <div className="flex-1 bg-[#1a144e] flex flex-col">
        {!activeUser ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a chat to start messaging
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex gap-3 items-center bg-[#0d0b2b]">
              <Avatar user={activeUser} />
              <h2 className="font-bold text-lg">{activeUser.name}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.sender === "me" ? "items-end" : "items-start"}`}>
                  <div className={`p-3 max-w-sm rounded-2xl ${m.sender === "me" ? "bg-blue-600 rounded-br-none" : "bg-gray-700 rounded-bl-none"}`}>
                    {m.text}
                    {m.media && (
                      <img src={`http://localhost:8000${m.media}`} className="mt-2 rounded-lg max-h-60" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 flex items-center gap-3 border-t border-gray-700 bg-[#0d0b2b]">
              <PaperclipIcon className="cursor-pointer text-gray-400 hover:text-white" onClick={() => fileInputRef.current.click()} />
              <input type="file" hidden ref={fileInputRef} onChange={handleFileSelect} />
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="bg-[#1a144e] rounded-full py-2 px-4 w-full text-sm outline-none border border-gray-600 focus:border-blue-500"
              />
              <SendIcon className="cursor-pointer text-blue-500 hover:text-blue-400" onClick={sendMessage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MessagePage;