import { useEffect } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSessionFromUrl();
      if (error) console.error(error);
      else if (data.session) navigate("/dashboard"); // redirect after login
    };
    getSession();
  }, []);

  return <div>Logging in...</div>;
}
