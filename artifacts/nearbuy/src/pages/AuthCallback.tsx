import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const finishLogin = async () => {
      await supabase.auth.exchangeCodeForSession(window.location.href);
      navigate("/");
    };

    finishLogin();
  }, []);

  return <div>Signing you in...</div>;
}
