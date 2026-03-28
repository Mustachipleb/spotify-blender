import { Link, useNavigate, useLocation } from "react-router";
import { useEffect, useState } from "react";

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsLoggedIn(!!sessionStorage.getItem("access_token"));
  }, [location.pathname]);

  const handleLogout = () => {
    sessionStorage.clear();
    setIsLoggedIn(false);
    navigate("/");
  };

  if (!isLoggedIn) return null;

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 mb-8 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex gap-6">
          <Link 
            to="/user" 
            className={`font-semibold transition-colors ${location.pathname === '/user' ? 'text-[#1DB954]' : 'text-gray-700 dark:text-gray-200 hover:text-[#1DB954]'}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/blacklist" 
            className={`font-semibold transition-colors ${location.pathname === '/blacklist' ? 'text-[#1DB954]' : 'text-gray-700 dark:text-gray-200 hover:text-[#1DB954]'}`}
          >
            Blacklist
          </Link>
        </div>
        <button
          onClick={handleLogout}
          className="text-red-500 hover:text-red-600 font-semibold transition-colors"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
