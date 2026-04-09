# BrandBoost 🚀

BrandBoost is a comprehensive sponsorship networking platform designed to seamlessly connect sponsorship seekers (influencers, event organizers, and students) with potential sponsors (brands and agencies) for digital and physical promotional collaborations. 

## 🌟 Key Features

* **Role-Based User Profiles:** Dedicated profiles for Sponsors and Seekers with customizable portfolios, social links, and cover photos.
* **Dynamic Feed & Discovery:** An algorithmic feed displaying sponsorship requests, offers, and recent posts.
* **Real-Time Messaging System:** Integrated chat functionality allowing brands and creators to negotiate and communicate directly.
* **Post & Content Management:** Users can post media, captions, and sponsorship requirements with interactive features (likes, comments, and views).
* **Notification Engine:** Real-time alerts for new followers, likes, comments, and unread messages.
* **Search & Network:** Explore module to discover relevant brands or creators based on username or full name.
* **Admin Dashboard:** Centralized control for managing user metrics, posts, and platform statistics.

## 💻 Technology Stack

**Frontend**
* React.js
* Vite
* Tailwind CSS

**Backend**
* Python 3.11+
* FastAPI
* SQLAlchemy (ORM)

**Database & Tools**
* MySQL 8+
* GitHub
* VS Code

## Project Structure
```
BrandBoost/
├── Server/
│   ├── uploads/            # Media storage (Profile photos, Chat files)
│   ├── main.py             # FastAPI entry point, Routes, and DB Models
│   └── requirements.txt    # Python dependencies
├── Client/
│   ├── src/
│   │   ├── components/     # Reusable UI components (ContentCard, Icons)
│   │   ├── pages/          # React Views (HomePage, MessagePage, Profile)
│   │   ├── App.jsx         # Main React router
│   │   ├── index.css       # Root css
│   │   ├── ProtectedRoute.jsx 
│   │   └── main.jsx        # React DOM entry
│   ├── package.json        # Node dependencies
│   └── tailwind.config.js  # Tailwind styling rules
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
* Node.js (v16+)
* Python (v3.11+)
* MySQL Server running locally or via Docker.

### Backend Setup (FastAPI)
1. Clone the repository and navigate to the backend directory:
   ```bash
   git clone https://github.com/itsriteshtiwari/BrandBoost
   cd brandboost/backend
   ```
2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```
4. Configure the database connection in ` main.py` (Update the `DATABASE_URL` with your MySQL credentials).
5. Start the FastAPI server:
   ```
   python -m uvicorn main:app --reload
   ```
