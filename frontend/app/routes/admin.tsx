import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { getAppConfig } from "../config";
import { Section } from "../components/Section";

interface AdminUser {
  spotifyId: string;
  display_name: string;
  email: string;
  blacklistCount: number;
}

export async function loader() {
  return {
    backendUrl: getAppConfig().BACKEND_URL,
  };
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cronStatus, setCronStatus] = useState<string | null>(null);
  const [triggeringCron, setTriggeringCron] = useState(false);
  const navigate = useNavigate();
  const { backendUrl } = useLoaderData<typeof loader>();

  const fetchUsers = async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        // Not an admin or not logged in
        navigate("/user");
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [navigate]);

  const triggerCron = async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    setTriggeringCron(true);
    setCronStatus("Triggering cron job...");
    try {
      const response = await fetch(`${backendUrl}/admin/trigger-cron`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to trigger cron job");
      
      setCronStatus("Cron job triggered successfully!");
      setTimeout(() => setCronStatus(null), 5000);
    } catch (err) {
      console.error(err);
      setCronStatus(err instanceof Error ? `Error: ${err.message}` : "Failed to trigger cron job");
    } finally {
      setTriggeringCron(false);
    }
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-[#1DB954]">Admin Dashboard</h1>
      
      <div className="mb-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Cron Management</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Manually trigger the daily "Blender" playlist update. This process refreshes all users' top tracks and updates the common playlist.
        </p>
        <button
          onClick={triggerCron}
          disabled={triggeringCron}
          className={`px-6 py-2 rounded-full font-bold text-white transition-all ${
            triggeringCron 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-[#1DB954] hover:bg-[#1ed760] active:scale-95 shadow-lg hover:shadow-[#1DB954]/20"
          }`}
        >
          {triggeringCron ? "Processing..." : "Trigger Manual Update"}
        </button>
        {cronStatus && (
          <p className={`mt-4 font-medium ${cronStatus.includes("Error") ? "text-red-500" : "text-[#1DB954]"}`}>
            {cronStatus}
          </p>
        )}
      </div>

      {loading && <p>Loading users...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <Section title="User Overview">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-4 px-2 font-semibold">Display Name</th>
                  <th className="py-4 px-2 font-semibold">Spotify ID</th>
                  <th className="py-4 px-2 font-semibold">Email</th>
                  <th className="py-4 px-2 font-semibold text-center">Blacklist</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 italic">No users found in database.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.spotifyId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-4 px-2">{user.display_name}</td>
                      <td className="py-4 px-2 font-mono text-sm text-gray-500">{user.spotifyId}</td>
                      <td className="py-4 px-2 text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="py-4 px-2 text-center">
                        <span className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-sm font-medium">
                          {user.blacklistCount}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </main>
  );
}
