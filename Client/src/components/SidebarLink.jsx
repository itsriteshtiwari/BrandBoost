import { NavLink } from "react-router-dom";

function SidebarLink({ icon: Icon, text, to, active }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-4 px-4 py-3 rounded-xl transition
        ${isActive || active ? "bg-[#1a1a1a]" : "hover:bg-[#1a1a1a]"}`
      }
    >
      {/* ICON (always visible) */}
      <Icon className="h-6 w-6 text-white" />

      {/* TEXT (hidden on small screens) */}
      <span className="hidden md:inline text-white text-lg">
        {text}
      </span>
    </NavLink>
  );
}

export default SidebarLink;
