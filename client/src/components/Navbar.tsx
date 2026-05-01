import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "./ui/button";

export default function Navbar() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <nav className="border-b border-gray-900 py-6 bg-black">
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-12">
          <div 
            className="text-3xl font-bold tracking-tighter font-mono cursor-pointer"
            onClick={() => navigate("/")}
          >
            CRYPTOTRADE
          </div>
          <div className="hidden md:flex gap-8 font-mono text-sm uppercase tracking-widest">
            <button onClick={() => navigate("/dashboard")} className="hover:text-cyan-400 transition-colors">Portfolio</button>
            <button onClick={() => navigate("/trading")} className="hover:text-magenta-400 transition-colors">Trade</button>
            <button onClick={() => navigate("/wallet")} className="hover:text-lime-400 transition-colors">Wallet</button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:block text-right">
            <div className="text-xs text-gray-500 font-mono">TRADING AS</div>
            <div className="text-sm font-bold text-white">{user?.name}</div>
          </div>
          <Button
            onClick={() => navigate("/dashboard")}
            className="btn-brutalist"
          >
            Dashboard
          </Button>
        </div>
      </div>
    </nav>
  );
}
