import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2 text-slate-800 hover:text-blue-600">
            {/* Simple headset icon using SVG */}
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 5.636A9 9 0 1 1 5.636 18.364M12 8v4l3 3"
              />
            </svg>
            <span className="font-semibold text-lg">Support CRM</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium ${
                location.pathname === "/"
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tickets
            </Link>
            <Link
              to="/tickets/new"
              className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800"
            >
              New Ticket
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
