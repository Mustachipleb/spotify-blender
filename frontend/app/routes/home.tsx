import type { Route } from "./+types/home";
import { useEffect, useState } from "react";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Spotify Blender" },
    { name: "description", content: "Welcome to Spotify Blender!" },
  ];
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!sessionStorage.getItem("access_token"));
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    setIsLoggedIn(false);
  };

  const loginUrl = import.meta.env.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL}/login`
    : "http://localhost:4010/login";

  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Spotify Blender</h1>
        <div className="flex flex-col gap-4 items-center">
          {isLoggedIn ? (
            <>
              <Link
                to="/user"
                className="px-6 py-3 bg-[#1DB954] text-white rounded-full font-semibold hover:bg-[#1ed760] transition-colors"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <a
              href={loginUrl}
              className="px-6 py-3 bg-[#1DB954] text-white rounded-full font-semibold hover:bg-[#1ed760] transition-colors"
            >
              Log in with Spotify
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
