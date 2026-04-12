import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status, Body, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, or_, ForeignKey, DateTime, func, Boolean, and_, case
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.mysql import JSON, LONGTEXT
from pydantic import BaseModel, field_validator, EmailStr
from typing import Optional, List, Dict
from passlib.context import CryptContext
import uuid, os, shutil, json, smtplib, re
from fastapi.staticfiles import StaticFiles
from uuid import uuid4
from google.oauth2 import id_token
from google.auth.transport import requests
from email.mime.text import MIMEText
from dotenv import load_dotenv
from datetime import datetime, timedelta

# ------------------------------------------------------
# DATABASE SETUP
# ------------------------------------------------------
DATABASE_URL = "mysql+pymysql://root:password@localhost/brandboost"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


# ------------------------------------------------------
# MODELS
# ------------------------------------------------------
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    fullName = Column(String(255))
    username = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    bio = Column(Text)
    location = Column(String(255))
    role = Column(String(50), nullable=True) # ✅ NEW: Seeker, Brand, Agency
    profilePhoto = Column(String(500))
    coverPhoto = Column(String(500))
    socials = Column(JSON)
    followers_count = Column(Integer, default=0)


class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    caption = Column(Text, nullable=True)
    media = Column(LONGTEXT, nullable=True)  
    views = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())


class Follow(Base):
    __tablename__ = "follows"
    id = Column(Integer, primary_key=True)
    follower_id = Column(Integer)
    following_id = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Like(Base):
    __tablename__ = "likes"
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer)
    user_id = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer)
    user_id = Column(Integer)
    text = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PostView(Base):
    __tablename__ = "post_views"
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, index=True)
    user_id = Column(Integer, index=True)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    receiver_id = Column(Integer)      
    sender_id = Column(Integer)        
    type = Column(String(50))          
    post_id = Column(Integer, nullable=True)
    read_flag = Column(Integer, default=0)  
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Message(Base): 
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, nullable=False)
    receiver_id = Column(Integer, nullable=False)
    text = Column(Text, nullable=True)
    media = Column(String(500), nullable=True)  
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String(255), unique=True, index=True)
    expires_at = Column(DateTime)


Base.metadata.create_all(bind=engine)


# ------------------------------------------------------
# PYDANTIC MODELS
# ------------------------------------------------------
class UserCreate(BaseModel):
    email: str
    fullName: str
    username: str
    password: str

    @field_validator('fullName')
    def validate_fullname(cls, v):
        if len(v) > 50:
            raise ValueError('Name must be 50 characters or less')
        if not re.match(r"^[a-zA-Z\s]+$", v):
            raise ValueError('Name must contain only alphabets')
        return v

    @field_validator('username')
    def validate_username(cls, v):
        if len(v) > 20:
            raise ValueError('Username must be 20 characters or less')
        if not re.match(r"^[a-z]+$", v):
            raise ValueError('Username must be lowercase letters only')
        return v

    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < 8 or len(v) > 20:
            raise ValueError('Password must be between 8 and 20 characters')
        regex = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).+$"
        if not re.match(regex, v):
            raise ValueError('Password must contain 1 uppercase, 1 lowercase, and 1 number/special character')
        return v


class UserLogin(BaseModel):
    usernameOrEmail: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    new_password: str

class UserUpdate(BaseModel):
    id: int
    fullName: Optional[str]
    username: Optional[str]
    bio: Optional[str]
    location: Optional[str]
    role: Optional[str]  # ✅ NEW
    socials: Optional[Dict]


class UserOut(BaseModel):
    id: int
    email: str
    fullName: str
    username: str
    bio: Optional[str]
    location: Optional[str]
    role: Optional[str]  # ✅ NEW
    profilePhoto: Optional[str]
    coverPhoto: Optional[str]
    socials: Optional[Dict]

    class Config:
        from_attributes = True


class PostCreate(BaseModel):
    user_id: int
    caption: Optional[str]
    media: Optional[str]


class FollowAction(BaseModel):
    follower_id: int
    following_id: int

class CommentCreate(BaseModel):
    user_id: int
    text: str


class MessageCreate(BaseModel):
    sender_id: int
    receiver_id: int
    text: Optional[str] = None
    media: Optional[str] = None

# ------------------------------------------------------
# FASTAPI INITIALIZATION
# ------------------------------------------------------
app = FastAPI()

# ------------------------------------------------------
# CORS
# ------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(os.path.join(UPLOADS_DIR, "profile"), exist_ok=True)
os.makedirs(os.path.join(UPLOADS_DIR, "chat"), exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


# ------------------------------------------------------
# UTILITY
# ------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)


def hash_password(password):
    return pwd_context.hash(password)

# ------------------------------------------------------
# Email utility
# ------------------------------------------------------
load_dotenv()

def send_reset_email(to_email: str, reset_link: str):
    msg = MIMEText(f"""
    Click the link below to reset your password:

    {reset_link}

    This link will expire in 15 minutes.
    """)
    msg["Subject"] = "BrandBoost - Reset Password"
    msg["From"] = os.getenv("EMAIL_USER")
    msg["To"] = to_email

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(
            os.getenv("EMAIL_USER"),
            os.getenv("EMAIL_PASS")
        )
        server.send_message(msg)

# ------------------------------------------------------
# ALL AUTH ENDPOINTS
# ------------------------------------------------------
@app.post("/signup", response_model=UserOut)
def signup(data: UserCreate, db: Session = Depends(get_db)):
    email_exists = db.query(User).filter(User.email == data.email).first()
    if email_exists:
        raise HTTPException(status_code=400, detail="Email already taken")

    username_exists = db.query(User).filter(User.username == data.username).first()
    if username_exists:
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=data.email,
        fullName=data.fullName,
        username=data.username,
        hashed_password=hash_password(data.password),
        socials={}
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@app.post("/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        or_(User.username == data.usernameOrEmail, User.email == data.usernameOrEmail)
    ).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")

    return {"message": "Login successful", "user": UserOut.from_orm(user)}


# ------------------------------------------------------
# USE OF GOOGLE TO LOGIN & SIGN UP
# ------------------------------------------------------
GOOGLE_CLIENT_ID = "give you google auth client id wich you get when you create API"

@app.post("/auth/google")
def google_auth(token: str = Body(..., embed=True), db: Session = Depends(get_db)):
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo.get("email")
        full_name = idinfo.get("name")
        picture = idinfo.get("picture")
        google_id = idinfo.get("sub")

        user = db.query(User).filter(User.email == email).first()

        if not user:
            username = email.split("@")[0]
            i = 1
            base = username
            while db.query(User).filter(User.username == username).first():
                username = f"{base}{i}"
                i += 1

            user = User(
                email=email,
                fullName=full_name,
                username=username,
                hashed_password=hash_password(str(uuid.uuid4())),
                profilePhoto=picture,  
                socials={
                    "google": True,
                    "google_id": google_id
                }
            )

            db.add(user)
            db.commit()
            db.refresh(user)

        else:
            if not user.socials:
                user.socials = {}

            user.socials["google"] = True
            user.socials["google_id"] = google_id

            if not user.profilePhoto:
                user.profilePhoto = picture

            db.commit()
            db.refresh(user)

        return {
            "message": "Google login successful",
            "user": UserOut.from_orm(user)
        }

    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token")


# ------------------------------------------------------
# PROFILE UPDATE
# ------------------------------------------------------

PROFILE_UPLOAD_DIR = os.path.join(UPLOADS_DIR, "profile")

@app.put("/update-profile")
def update_profile(
    id: int = Form(...),
    fullName: str = Form(None),
    username: str = Form(None),
    bio: str = Form(None),
    location: str = Form(None),
    role: str = Form(None),  # ✅ NEW
    socials: str = Form(None),
    profilePhoto: UploadFile = File(None),
    coverPhoto: UploadFile = File(None),
    removeProfilePhoto: str = Form(None),
    removeCoverPhoto: str = Form(None),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if fullName is not None:
        if len(fullName) > 50:
            raise HTTPException(status_code=400, detail="Name must be 50 characters or less")
        if not re.match(r"^[a-zA-Z\s]+$", fullName):
            raise HTTPException(status_code=400, detail="Name must contain only alphabets")
        user.fullName = fullName

    if username is not None:
        if len(username) > 20:
            raise HTTPException(status_code=400, detail="Username must be 20 characters or less")
        if not re.match(r"^[a-z]+$", username):
            raise HTTPException(status_code=400, detail="Username must be lowercase letters only (no numbers/spaces)")
        
        username_exists = db.query(User).filter(User.username == username, User.id != id).first()
        if username_exists:
            raise HTTPException(status_code=400, detail="Username already taken")

        user.username = username

    if bio is not None:
        user.bio = bio

    if location is not None:
        user.location = location

    # ✅ Save Role
    if role is not None:
        user.role = role

    if socials:
        try:
            user.socials = json.loads(socials)
        except:
            pass 

    if removeProfilePhoto == "true":
        user.profilePhoto = None  
    elif profilePhoto is not None:
        ext = profilePhoto.filename.split(".")[-1].lower()
        filename = f"profile_{uuid4().hex}.{ext}"
        path = os.path.join(PROFILE_UPLOAD_DIR, filename)
        with open(path, "wb") as f:
            shutil.copyfileobj(profilePhoto.file, f)
        user.profilePhoto = f"/uploads/profile/{filename}"

    if removeCoverPhoto == "true":
        user.coverPhoto = None  
    elif coverPhoto is not None:
        ext = coverPhoto.filename.split(".")[-1].lower()
        filename = f"cover_{uuid4().hex}.{ext}"
        path = os.path.join(PROFILE_UPLOAD_DIR, filename)
        with open(path, "wb") as f:
            shutil.copyfileobj(coverPhoto.file, f)
        user.coverPhoto = f"/uploads/profile/{filename}"

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated successfully",
        "user": UserOut.from_orm(user)
    }


@app.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "fullName": user.fullName,     
        "username": user.username,
        "bio": user.bio,
        "location": user.location,
        "role": user.role,  # ✅ NEW
        "profilePhoto": user.profilePhoto,
        "coverPhoto": user.coverPhoto,
        "socials": user.socials
    }


# ------------------------------------------------------
# POSTS
# ------------------------------------------------------
@app.post("/posts")
def create_post(data: PostCreate, db: Session = Depends(get_db)):
    post = Post(
        user_id=data.user_id,
        caption=data.caption,
        media=data.media,
        views=0
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return {"message": "Post created", "post": post}


@app.get("/feed/{user_id}")
def feed(user_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Post, User)
        .join(User, Post.user_id == User.id)
        .order_by(Post.created_at.desc())
        .all()
    )

    return [{
        "id": p.Post.id,
        "media": p.Post.media,
        "caption": p.Post.caption,
        "views": p.Post.views,
        "user_id": p.User.id,
        "username": p.User.username,
        "fullName": p.User.fullName,
        "role": p.User.role, # ✅ NEW
        "profilePhoto": p.User.profilePhoto,
        "likes": db.query(Like).filter_by(post_id=p.Post.id).count(),
        "comments": db.query(Comment).filter_by(post_id=p.Post.id).count()
    } for p in rows]


@app.get("/users/{user_id}/posts")
def user_posts(user_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Post, User)
        .join(User)
        .filter(Post.user_id == user_id)
        .order_by(Post.created_at.desc())
        .all()
    )

    return [{
        "id": p.Post.id,
        "media": p.Post.media,
        "caption": p.Post.caption,
        "views": p.Post.views,
        "user_id": p.User.id,
        "username": p.User.username,
        "fullName": p.User.fullName,
        "role": p.User.role, # ✅ NEW
        "profilePhoto": p.User.profilePhoto,
        "likes": db.query(Like).filter_by(post_id=p.Post.id).count(),
        "comments": db.query(Comment).filter_by(post_id=p.Post.id).count()
    } for p in rows]


@app.get("/posts/{post_id}")
def get_post(post_id: int, viewer_id: int | None = None, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404)

    if viewer_id and viewer_id != post.user_id:
        already_viewed = db.query(PostView).filter_by(
            post_id=post_id,
            user_id=viewer_id
        ).first()

        if not already_viewed:
            db.add(PostView(post_id=post_id, user_id=viewer_id))
            post.views += 1
            db.commit()

    user = db.query(User).filter(User.id == post.user_id).first()

    return {
        "id": post.id,
        "media": post.media,
        "caption": post.caption,
        "views": post.views,
        "user_id": user.id,
        "username": user.username,
        "fullName": user.fullName, 
        "role": user.role, # ✅ NEW
        "profilePhoto": user.profilePhoto,
        "likes": db.query(Like).filter_by(post_id=post.id).count()
    }


@app.post("/posts/{post_id}/comment")
def add_comment(post_id: int, data: CommentCreate, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404)

    db.add(Comment(
        post_id=post_id,
        user_id=data.user_id,
        text=data.text
    ))
    db.commit()

    if post.user_id != data.user_id:
        db.add(Notification(
            receiver_id=post.user_id,
            sender_id=data.user_id,
            type="comment",
            post_id=post_id
        ))
        db.commit()

    return {"ok": True}


@app.get("/posts/{post_id}/comments")
def get_comments(post_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Comment, User)
        .join(User, Comment.user_id == User.id)  
        .filter(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
        .all()
    )

    return [
        {
            "id": c.id,
            "text": c.text,
            "user_id": u.id,
            "username": u.username,
            "created_at": c.created_at
        }
        for c, u in rows
    ]

@app.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, user_id: int, db: Session = Depends(get_db)):
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.user_id == user_id
    ).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db.delete(comment)
    db.commit()
    return {"ok": True}


@app.get("/posts/{post_id}/is-liked/{user_id}")
def is_liked(post_id: int, user_id: int, db: Session = Depends(get_db)):
    liked = db.query(Like).filter_by(post_id=post_id, user_id=user_id).first()
    return {"liked": liked is not None}

@app.post("/posts/{post_id}/like")
def like_post(post_id: int, user_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    exists = db.query(Like).filter_by(post_id=post_id, user_id=user_id).first()
    if exists:
        return {"ok": True}

    db.add(Like(post_id=post_id, user_id=user_id))
    db.commit()

    if post.user_id != user_id:
        db.add(Notification(
            receiver_id=post.user_id,
            sender_id=user_id,
            type="like",
            post_id=post_id
        ))
        db.commit()

    return {"ok": True}


@app.delete("/posts/{post_id}/unlike")
def unlike_post(post_id: int, user_id: int, db: Session = Depends(get_db)):
    like = db.query(Like).filter_by(post_id=post_id, user_id=user_id).first()
    if like:
        db.delete(like)
        db.commit()
    return {"ok": True}

@app.delete("/posts/{post_id}")
def delete_post(post_id: int, user_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    db.query(Like).filter(Like.post_id == post_id).delete()
    db.query(Comment).filter(Comment.post_id == post_id).delete()
    db.query(Notification).filter(Notification.post_id == post_id).delete()

    db.delete(post)
    db.commit()

    return {"message": "Post deleted successfully"}


# ------------------------------------------------------
# FOLLOW / UNFOLLOW
# ------------------------------------------------------
@app.post("/follow")
def follow_user(data: dict, db: Session = Depends(get_db)):
    follower_id = data["follower_id"]
    following_id = data["following_id"]

    if follower_id == following_id:
        raise HTTPException(400, "Cannot follow yourself")

    exists = db.query(Follow).filter(
        Follow.follower_id == follower_id,
        Follow.following_id == following_id
    ).first()

    if exists:
        return {"message": "Already following"}

    db.add(Follow(
        follower_id=follower_id,
        following_id=following_id
    ))
    db.commit()

    db.add(Notification(
        receiver_id=following_id,
        sender_id=follower_id,
        type="follow"
    ))
    db.commit()

    return {"message": "Followed successfully"}


@app.delete("/unfollow")
def unfollow_user(data: dict, db: Session = Depends(get_db)):
    follow = db.query(Follow).filter(
        Follow.follower_id == data["follower_id"],
        Follow.following_id == data["following_id"]
    ).first()

    if not follow:
        raise HTTPException(404, "Not following")

    db.delete(follow)
    db.commit()

    return {"message": "Unfollowed successfully"}


@app.get("/followers/{user_id}")
def get_followers(user_id: int, viewer_id: int, db: Session = Depends(get_db)):
    followers = (
        db.query(User)
        .join(Follow, Follow.follower_id == User.id)
        .filter(Follow.following_id == user_id)
        .all()
    )
    
    viewer_following = {
        f.following_id for f in db.query(Follow).filter(Follow.follower_id == viewer_id)
    }
    
    return [{
        "id": u.id,
        "username": u.username,
        "fullName": u.fullName,
        "profilePhoto": u.profilePhoto,
        "isFollowing": u.id in viewer_following
    } for u in followers]


@app.get("/following/{user_id}")
def get_following(user_id: int, viewer_id: int, db: Session = Depends(get_db)):
    following = (
        db.query(User)
        .join(Follow, Follow.following_id == User.id)
        .filter(Follow.follower_id == user_id)
        .all()
    )
    
    viewer_following = {
        f.following_id for f in db.query(Follow).filter(Follow.follower_id == viewer_id)
    }
    
    return [{
        "id": u.id,
        "username": u.username,
        "fullName": u.fullName,
        "profilePhoto": u.profilePhoto,
        "isFollowing": u.id in viewer_following
    } for u in following]


@app.get("/follow-stats/{user_id}")
def follow_stats(user_id: int, db: Session = Depends(get_db)):
    followers = db.query(Follow).filter(
        Follow.following_id == user_id
    ).count()

    following = db.query(Follow).filter(
        Follow.follower_id == user_id
    ).count()

    return {
        "followers": followers,
        "following": following
    }


@app.get("/is-following/{viewer_id}/{profile_id}")
def is_following(viewer_id: int, profile_id: int, db: Session = Depends(get_db)):
    exists = db.query(Follow).filter(
        Follow.follower_id == viewer_id,
        Follow.following_id == profile_id
    ).first()

    return {"following": bool(exists)}


# ------------------------------------------------------
# NOTIFICATIONS
# ------------------------------------------------------
@app.get("/notifications/{user_id}")
def notifications(user_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Notification, User)
        .join(User, Notification.sender_id == User.id)
        .filter(Notification.receiver_id == user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    return [
        {
            "id": n.id,
            "type": n.type,
            "post_id": n.post_id,
            "sender_id": n.sender_id,
            "sender_username": u.username,
            "read": n.read_flag,
            "created_at": n.created_at
        }
        for n, u in rows
    ]

@app.put("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(404)

    notif.read_flag = 1
    db.commit()
    return {"ok": True}


# ------------------------------------------------------
# Search
# ------------------------------------------------------
@app.get("/search/users")
def search_users(q: str, db: Session = Depends(get_db)):
    users = (
        db.query(User)
        .filter(
            (User.username.like(f"%{q}%")) |
            (User.fullName.like(f"%{q}%"))
        )
        .limit(10)
        .all()
    )

    return [
        {
            "id": u.id,
            "username": u.username,
            "fullName": u.fullName,
            "profilePhoto": u.profilePhoto
        }
        for u in users
    ]


# ------------------------------------------------------
# Massages
# ------------------------------------------------------

@app.post("/messages")
def send_message(data: MessageCreate, db: Session = Depends(get_db)):
    msg = Message(
        sender_id=data.sender_id,
        receiver_id=data.receiver_id,
        text=data.text
    )

    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {
        "id": msg.id,
        "text": msg.text,
        "sender": "me",
        "created_at": msg.created_at
    }

@app.get("/messages/search")
def search_users(q: str, viewer_id: int, db: Session = Depends(get_db)):
    users = (
        db.query(User)
        .filter(
            or_(
                User.username.like(f"%{q}%"),
                User.fullName.like(f"%{q}%")
            )
        )
        .limit(10)
        .all()
    )

    following_ids = {
        f.following_id
        for f in db.query(Follow).filter(Follow.follower_id == viewer_id)
    }

    return [{
        "id": u.id,
        "name": u.fullName,
        "username": u.username,
        "profilePhoto": u.profilePhoto,
        "isFollowing": u.id in following_ids
    } for u in users]


@app.get("/messages/requests/{user_id}")
def message_requests(user_id: int, db: Session = Depends(get_db)):
    sub = db.query(Follow.following_id).filter(
        Follow.follower_id == user_id
    )

    rows = (
        db.query(User)
        .join(Message, Message.sender_id == User.id)
        .filter(
            Message.receiver_id == user_id,
            ~User.id.in_(sub)
        )
        .distinct()
        .all()
    )

    return [{
        "id": u.id,
        "name": u.fullName,
        "username": u.username,
        "profilePhoto": u.profilePhoto
    } for u in rows]

@app.get("/messages/unread-count/{user_id}")
def get_unread_count(user_id: int, db: Session = Depends(get_db)):
    count = db.query(Message).filter(
        Message.receiver_id == user_id,
        or_(
            Message.read == False,  
            Message.read == None    
        )
    ).count()
    
    return {"count": count}

@app.get("/messages/conversations/{user_id}")
def get_conversations(user_id: int, db: Session = Depends(get_db)):
    other_id = case(
        (Message.sender_id == user_id, Message.receiver_id),
        else_=Message.sender_id
    ).label("other_id")

    latest_subq = (
        db.query(
            other_id,
            Message.created_at,
            Message.text,
            func.row_number().over(partition_by=other_id, order_by=Message.created_at.desc()).label("rn")
        )
        .filter(or_(Message.sender_id == user_id, Message.receiver_id == user_id))
        .subquery()
    )

    unread_subq = (
        db.query(Message.sender_id, func.count().label("unread_count"))
        .filter(Message.receiver_id == user_id, Message.read == False)
        .group_by(Message.sender_id)
        .subquery()
    )

    response_data = (
        db.query(User, latest_subq.c.created_at, latest_subq.c.text, unread_subq.c.unread_count)
        .join(latest_subq, User.id == latest_subq.c.other_id)
        .outerjoin(unread_subq, User.id == unread_subq.c.sender_id)
        .filter(latest_subq.c.rn == 1) 
        .order_by(latest_subq.c.created_at.desc()) 
        .all()
    )
    
    final_previews = []
    for user, last_time, last_text, unread_count in response_data:
        final_previews.append({
            "partnerId": user.id,
            "name": user.fullName,
            "username": user.username,
            "profilePhoto": user.profilePhoto,
            "lastMessageText": last_text,
            "lastMessageTime": last_time,
            "unreadCount": unread_count or 0 
        })
    
    return final_previews

@app.get("/messages/{me}/{other}")
def get_messages(me: int, other: int, db: Session = Depends(get_db)):
    db.query(Message).filter(
        Message.sender_id == other,
        Message.receiver_id == me,
        Message.read == False
    ).update({"read": True})
    db.commit()

    rows = (
        db.query(Message, User)
        .join(User, User.id == Message.sender_id)
        .filter(
            or_(
                and_(Message.sender_id == me, Message.receiver_id == other),
                and_(Message.sender_id == other, Message.receiver_id == me)
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    return [
        {
            "id": m.id,
            "text": m.text,
            "media": m.media,
            "sender": "me" if m.sender_id == me else "other",
            "senderPhoto": u.profilePhoto,   
            "created_at": m.created_at 
        }
        for m, u in rows
    ]


UPLOAD_DIR_CHAT = os.path.join(UPLOADS_DIR, "chat")

@app.post("/messages/upload")
def upload_message(
    file: UploadFile = File(...),
    sender_id: int = Form(...),
    receiver_id: int = Form(...),
    db: Session = Depends(get_db)
):
    filename = f"{uuid4().hex}_{file.filename}"
    save_path = os.path.join(UPLOAD_DIR_CHAT, filename)

    with open(save_path, "wb") as f:
        f.write(file.file.read())

    message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        media=f"/uploads/chat/{filename}"
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return {
        "id": message.id,
        "text": None,
        "media": message.media,
        "sender": "me"
    }


# ------------------------------------------------------
# FORGOT PASSWORD
# ------------------------------------------------------
@app.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        return {"message": "If account exists, reset link sent"}

    token = uuid4().hex
    expires = datetime.utcnow() + timedelta(minutes=10)

    db.query(PasswordReset).filter(
        PasswordReset.user_id == user.id
    ).delete()

    reset = PasswordReset(
        user_id=user.id,
        token=token,
        expires_at=expires
    )

    db.add(reset)
    db.commit()

    reset_link = f"{os.getenv('FRONTEND_URL')}/reset-password/{token}"
    send_reset_email(user.email, reset_link)

    return {"message": "If account exists, reset link sent"}

# ------------------------------------------------------
# RESET PASSWORD
# ------------------------------------------------------
@app.post("/reset-password/{token}")
def reset_password(
    token: str,
    data: ResetPasswordRequest, 
    db: Session = Depends(get_db)
):
    pwd = data.new_password
    
    if len(pwd) < 8 or len(pwd) > 20:
        raise HTTPException(400, "Password must be between 8 and 20 characters")
    
    if not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).+$", pwd):
        raise HTTPException(400, "Password must have 1 Uppercase, 1 Lowercase, and 1 Number/Special char")

    reset = db.query(PasswordReset).filter(
        PasswordReset.token == token
    ).first()

    if not reset or reset.expires_at < datetime.utcnow():
        raise HTTPException(400, "Invalid or expired token")

    user = db.query(User).filter(User.id == reset.user_id).first()
    user.hashed_password = hash_password(pwd)

    db.delete(reset)
    db.commit()

    return {"message": "Password reset successful"}

# ------------------------------------------------------
# RUN APP
# ------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
