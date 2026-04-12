import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./EditProfile.css";

function EditProfilePage() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");

  if (!storedUser) {
    navigate("/");
    return null;
  }

  const [formData, setFormData] = useState({
    id: storedUser.id,
    fullName: storedUser.fullName || "",
    username: storedUser.username || "",
    bio: storedUser.bio || "",
    location: storedUser.location || "",
    role: storedUser.role || "", // ✅ NEW
    coverPhoto: storedUser.coverPhoto || "",
    profilePhoto: storedUser.profilePhoto || "",
    socials: storedUser.socials || {
      facebook: "",
      instagram: "",
      twitter: "",
      youtube: "",
      mail: ""
    }
  });

  const [error, setError] = useState("");
  const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false);
  const [removeCoverPhoto, setRemoveCoverPhoto] = useState(false);

  const coverRef = useRef(null);
  const profileRef = useRef(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`http://localhost:8000/users/${storedUser.id}`);
        if (!res.ok) return;

        const data = await res.json();

        setFormData(prev => ({
          ...prev,
          fullName: data.fullName ?? prev.fullName,
          username: data.username ?? prev.username,
          bio: data.bio ?? prev.bio,
          location: data.location ?? prev.location,
          role: data.role ?? prev.role, // ✅ NEW
          coverPhoto: data.coverPhoto ?? prev.coverPhoto,
          profilePhoto: data.profilePhoto ?? prev.profilePhoto,
          socials: data.socials ?? prev.socials
        }));
      } catch (err) {
        console.error("Fetch user error:", err);
      }
    })();
  }, [storedUser.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socials: { ...prev.socials, [name]: value }
    }));
  };

  const validateForm = () => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(formData.fullName)) {
      setError("Full Name must contain only alphabets.");
      return false;
    }
    if (formData.fullName.length > 50) {
      setError("Full Name cannot exceed 50 characters.");
      return false;
    }

    const userRegex = /^[a-z]+$/;
    if (!userRegex.test(formData.username)) {
      setError("Username must be lowercase letters only (no numbers, spaces, or caps).");
      return false;
    }
    if (formData.username.length > 20) {
      setError("Username cannot exceed 20 characters.");
      return false;
    }

    return true;
  };

  const handleSaveChanges = async () => {
    setError(""); 
    if (!validateForm()) {
      return; 
    }

    try {
      const fd = new FormData();

      fd.append("id", formData.id);
      fd.append("fullName", formData.fullName);
      fd.append("username", formData.username);
      fd.append("bio", formData.bio);
      fd.append("location", formData.location);
      fd.append("role", formData.role); // ✅ NEW
      fd.append("socials", JSON.stringify(formData.socials));

      if (removeProfilePhoto) {
        fd.append("removeProfilePhoto", "true");
      } else if (profilePhotoFile) {
        fd.append("profilePhoto", profilePhotoFile);
      }

      if (removeCoverPhoto) {
        fd.append("removeCoverPhoto", "true");
      } else if (coverPhotoFile) {
        fd.append("coverPhoto", coverPhotoFile);
      }

      const res = await fetch("http://localhost:8000/update-profile", {
        method: "PUT",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Update failed");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard/profile");

    } catch (err) {
      console.error("Update error:", err);
      setError("Error updating profile");
    }
  };

  const resolveImage = (path) => {
    if (!path) return null;
    if (path.startsWith("blob:")) return path;
    if (path.startsWith("http")) return path;
    return `http://localhost:8000${path}`;
  };

  return (
    <div className="edit-profile-container">
      <h1 className="edit-title">Edit Profile</h1>

      <div className="edit-box">

        {/* COVER */}
        <div className="cover-section">
          <label className="label">Cover Photo</label>
          <input
            ref={coverRef}
            type="file"
            className="hidden-input"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              setCoverPhotoFile(file);
              setFormData(prev => ({
                ...prev,
                coverPhoto: URL.createObjectURL(file)
              }));
            }}
          />

          <div
            className="cover-preview"
            onClick={() => coverRef.current.click()}
          >
            {formData.coverPhoto ? (
              <img
                className="cover-image"
                src={resolveImage(formData.coverPhoto)}
                alt="cover"
              />
            ) : (
              <div className="cover-empty">
                {formData.fullName || "Upload Cover"}
              </div>
            )}
          </div>

          <button
            className="remove-btn"
            onClick={() => {
              setRemoveCoverPhoto(true);
              setCoverPhotoFile(null); 
              setFormData(p => ({ ...p, coverPhoto: "" }));
            }}
          >
            Remove Cover
          </button>
        </div>

        {/* PROFILE PHOTO */}
        <div className="profile-photo-section">
          <input
            ref={profileRef}
            type="file"
            className="hidden-input"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              setProfilePhotoFile(file);
              setFormData(prev => ({
                ...prev,
                profilePhoto: URL.createObjectURL(file)
              }));
            }}
          />

          <div
            className="profile-photo"
            onClick={() => profileRef.current.click()}
          >
            {formData.profilePhoto ? (
              <img
                className="profile-image"
                src={resolveImage(formData.profilePhoto)}
                alt="profile"
              />
            ) : (
              <div className="profile-placeholder">+</div>
            )}
          </div>

          <div>
            <h2>@{formData.username}</h2>
            <p style={{ color: "#9ca3af" }}>Change profile photo</p>
            <button
               className="remove-btn"
               onClick={() => {
                  setRemoveProfilePhoto(true);
                  setProfilePhotoFile(null); 
                  setFormData(p => ({ ...p, profilePhoto: "" }));
                }}
              >
               Remove Profile
            </button>
          </div>
        </div>

        {/* BASIC INFO */}
        <div className="grid-two">
          <div>
            <label className="label">Full Name</label>
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="text-input"
            />
          </div>

          <div>
            <label className="label">Username</label>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="text-input"
            />
          </div>
        </div>

        <label className="label">Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          className="text-area"
        />

        <label className="label">Location</label>
        <input
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="text-input mb-4"
          placeholder="State, Country"
        />

        {/* ✅ NEW: Role Select */}
        <label className="label">Account Type</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="text-input mb-4"
        >
          <option value="">Select Type</option>
          <option value="Seeker">Seeker</option>
          <option value="Brand">Brand</option>
          <option value="Agency">Agency</option>
        </select>

        {/* SOCIAL LINKS */}
        <h3 className="section-title">Social Links</h3>
        <div className="social-list">
          <input name="facebook" value={formData.socials.facebook} onChange={handleSocialChange} className="text-input" placeholder="Facebook URL" />
          <input name="instagram" value={formData.socials.instagram} onChange={handleSocialChange} className="text-input" placeholder="Instagram URL" />
          <input name="twitter" value={formData.socials.twitter} onChange={handleSocialChange} className="text-input" placeholder="Twitter URL" />
          <input name="youtube" value={formData.socials.youtube} onChange={handleSocialChange} className="text-input" placeholder="YouTube URL" />
          <input name="mail" value={formData.socials.mail} onChange={handleSocialChange} className="text-input" placeholder="Email" />
        </div>

        {error && (
          <div style={{ color: "red", marginTop: "10px", textAlign: "center", fontWeight: "bold" }}>
            {error}
          </div>
        )}

        <div className="btn-row">
          <button
            className="cancel-btn"
            onClick={() => navigate("/dashboard/profile")}
          >
            Cancel
          </button>
          <button
            className="save-btn"
            onClick={handleSaveChanges}
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}

export default EditProfilePage;
