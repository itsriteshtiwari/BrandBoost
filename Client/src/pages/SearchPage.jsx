import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon } from "../components/Icons";

function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path; // Google image
  return `http://localhost:8000${path}`;    // Uploaded image
  };

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:8000/search/users?q=${query}`
        );

        if (!res.ok) {
          setUsers([]);
          return;
        }

        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Search error:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 400); // debounce

    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="text-white p-8 w-full">
      <h1 className="text-4xl font-bold mb-8">Search</h1>

      <div className="relative w-full max-w-xl mx-auto">
        <input
          type="text"
          placeholder="Search for users..."
          className="bg-[#0d0b2b] border border-gray-600 rounded-full py-3 px-6 w-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <SearchIcon className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
      </div>

      {query && (
        <div className="mt-8 max-w-xl mx-auto">
          <h2 className="text-xl font-semibold mb-3 text-gray-300">
            Users
          </h2>

          <div className="bg-[#0d0b2b] rounded-lg p-2">
            {loading && (
              <p className="text-gray-400 text-center p-4">
                Searching...
              </p>
            )}

            {!loading && users.length === 0 && (
              <p className="text-gray-400 text-center p-4">
                User not found
              </p>
            )}

            {users.map((user) => (
              <div
                key={user.id}
                onClick={() =>
                  navigate(`/dashboard/user/${user.id}`)
                }
                className="flex items-center p-3 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden flex mr-4 items-center justify-center text-white font-semibold">
                  {user.profilePhoto ? (
                    <img
                      src={getImageUrl(user.profilePhoto)} 
                      alt="profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                       <span>
                        { (user.fullName || user.username || "?")[0].toUpperCase()}
                       </span>
                     )}
                </div>
                <div>
                  <p className="font-semibold">
                    {user.fullName || "User"}
                  </p>
                  <p className="text-sm text-gray-400">
                    @{user.username}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
