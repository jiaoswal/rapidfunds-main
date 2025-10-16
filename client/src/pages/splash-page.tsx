import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function SplashPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  const handleTap = () => {
    setLocation("/auth");
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-secondary cursor-pointer relative overflow-hidden"
      onClick={handleTap}
      data-testid="splash-screen"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      
      <div className="relative z-10 flex flex-col items-center gap-8 animate-in fade-in duration-700">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-2xl">
          <span className="text-5xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
            RF
          </span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
          RapidFunds
        </h1>
        
        <p className="text-xl text-white/90 font-medium animate-pulse">
          Tap anywhere to continue
        </p>
      </div>
      
      <div className="absolute bottom-8 text-white/60 text-sm">
        Internal Funding Approval System
      </div>
    </div>
  );
}
