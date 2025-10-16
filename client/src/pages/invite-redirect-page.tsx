import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function InviteRedirectPage() {
  const [match, params] = useRoute("/invite/:token");
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (match && params?.token) {
      // Redirect to join page with token as query param
      setLocation(`/join?token=${params.token}`);
    } else {
      // Redirect to login if no token
      setLocation("/login");
    }
  }, [match, params, setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
