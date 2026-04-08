import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageIcon } from "../components/Icons";

function CreatePostPage() {
  const navigate = useNavigate();
  const current = JSON.parse(localStorage.getItem("user") || "null");

  const [preview, setPreview] = useState(null);
  const [fileBase64, setFileBase64] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  if (!current) navigate("/");

  // convert image to base64
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setFileBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const sharePost = async () => {
    if (!fileBase64) return alert("Select an image");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: current.id,
          caption,
          media: fileBase64
        })
      });

      if (res.ok) {
        navigate("/dashboard/home");
      } else {
        alert("Post failed");
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0b2b] flex justify-center items-center text-white">
      <div className="bg-[#1a144e] p-6 rounded-2xl w-[400px]">

        <h2 className="text-xl font-semibold mb-4 text-center">
          Create new post
        </h2>

        {!preview ? (
          <label className="border-2 border-dashed border-gray-400 rounded-xl p-10 flex flex-col items-center cursor-pointer">
            <ImageIcon className="h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-300">Select image</p>
            <input type="file" accept="image/*" hidden onChange={handleImage} />
          </label>
        ) : (
          <img src={preview} alt="preview" className="rounded-xl mb-4" />
        )}

        <textarea
          placeholder="Write a caption... #hashtags"
          className="w-full mt-4 p-3 rounded-lg bg-[#0d0b2b] resize-none"
          rows="3"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <button
          onClick={sharePost}
          disabled={loading}
          className="mt-4 w-full bg-blue-600 py-2 rounded-lg font-semibold hover:bg-blue-700"
        >
          {loading ? "Sharing..." : "Share"}
        </button>
      </div>
    </div>
  );
}

export default CreatePostPage;
