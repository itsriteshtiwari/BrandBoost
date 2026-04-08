import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarLink from "./SidebarLink";
import {
  HomeIcon,
  SearchIcon,
  PlusSquareIcon,
  BellIcon,
  SendIcon,
  UserIcon,
  MenuIcon,
  LogoutIcon,
} from "./Icons";

function Sidebar({ currentPage }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <aside
      className="
        bg-black text-white
        h-screen
        fixed top-0 left-0
        flex flex-col
        transition-all duration-300
        w-20 md:w-64
      "
    >
      {/* LOGO */}
      <div
        className="text-2xl font-bold mb-10 cursor-pointer
                   flex justify-center md:justify-start
                   px-0 md:px-6"
        onClick={() => navigate("/dashboard/home")}
      >
        <span className="hidden md:inline">BrandBoost</span>
        <span className="md:hidden">BB</span>
      </div>

      {/* NAV */}
      <nav className="flex flex-col gap-2 flex-1 items-center md:items-stretch">
        <SidebarLink icon={HomeIcon} text="Home" to="/dashboard/home" />
        <SidebarLink icon={SearchIcon} text="Search" to="/dashboard/search" />
        <SidebarLink icon={PlusSquareIcon} text="Post" to="/dashboard/post" />
        <SidebarLink icon={BellIcon} text="Notifications" to="/dashboard/notifications" />
        <SidebarLink icon={SendIcon} text="Messages" to="/dashboard/messages" />
        <SidebarLink icon={UserIcon} text="Profile" to="/dashboard/profile" />
      </nav>

      {/* MENU / LOGOUT */}
      <div className="relative p-4 flex justify-center md:justify-start">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#1a1a1a]"
        >
          <MenuIcon className="h-6 w-6" />
          <span className="hidden md:inline">More</span>
        </button>

        {open && (
          <div className="absolute bottom-14 left-4 bg-[#1a1a1a] rounded-xl w-44">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full hover:bg-red-600 rounded-xl"
            >
              <LogoutIcon className="h-5 w-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
