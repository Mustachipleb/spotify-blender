import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const expiresIn = searchParams.get("expires_in");

    if (accessToken && refreshToken && expiresIn) {
      sessionStorage.setItem("access_token", accessToken);
      sessionStorage.setItem("refresh_token", refreshToken);
      sessionStorage.setItem("expires_in", expiresIn);
      sessionStorage.setItem("token_timestamp", Date.now().toString());

      navigate("/user");
    } else {
      console.error("Missing token data in callback URL");
      navigate("/");
    }
  }, [searchParams, navigate]);

  return <div>Authenticating...</div>;
}
