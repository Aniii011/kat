import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

export default function AuthCallback() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const finishLogin = async () => {
      try {
        await supabase.auth.exchangeCodeForSession(window.location.href);
      } catch (err) {
        console.error(err);
      }

      navigate("/");
    };

    finishLogin();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Signing you in...
    </div>
  );
}
