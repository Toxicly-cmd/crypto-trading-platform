import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Suspense, lazy } from "react";

const Hero3D = lazy(() => import("@/components/Hero3D").catch(() => ({ default: () => <div /> })));

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-gray-900 py-6">
        <div className="container flex justify-between items-center">
          <div className="text-3xl font-bold tracking-tighter font-mono">CRYPTOTRADE</div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="btn-brutalist"
                >
                  Dashboard
                </Button>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="btn-brutalist">Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Suspense fallback={<div className="w-full h-full bg-gradient-to-b from-gray-900 to-black" />}>
            <Hero3D />
          </Suspense>
        </div>

        <div className="container relative z-10 flex flex-col items-center justify-center text-center">
          <div className="mb-12">
            <h1 className="text-7xl md:text-8xl font-bold font-mono tracking-tighter mb-6 leading-none">
              CRYPTO<br />TRADING
            </h1>
            <div className="red-divider-thick mb-8" />
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto font-light">
              Professional trading platform with real-time market data and instant payment processing
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {isAuthenticated ? (
              <Button
                onClick={() => navigate("/dashboard")}
                className="btn-brutalist text-lg px-8 py-4"
              >
                Open Dashboard <ArrowRight className="ml-2" size={20} />
              </Button>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="btn-brutalist text-lg px-8 py-4">
                  Start Trading <ArrowRight className="ml-2" size={20} />
                </Button>
              </a>
            )}
            <Button className="btn-brutalist-outline text-lg px-8 py-4">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-black border-t-2 border-white py-20">
        <div className="container">
          <div className="red-divider-thick mb-16" />
          <div className="grid md:grid-cols-3 gap-12">
            <div className="border-l-2 border-white pl-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={28} className="text-cyan-400" />
                <h3 className="text-2xl font-bold font-mono">LIVE PRICES</h3>
              </div>
              <p className="text-gray-400">Real-time cryptocurrency market data for BTC, ETH, SOL, and more</p>
            </div>
            <div className="border-l-2 border-white pl-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap size={28} className="text-magenta-400" />
                <h3 className="text-2xl font-bold font-mono">INSTANT TRADES</h3>
              </div>
              <p className="text-gray-400">Execute buy/sell orders instantly with Razorpay payment integration</p>
            </div>
            <div className="border-l-2 border-white pl-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={28} className="text-lime-400" />
                <h3 className="text-2xl font-bold font-mono">PORTFOLIO</h3>
              </div>
              <p className="text-gray-400">Track holdings, P&L, and transaction history in one dashboard</p>
            </div>
          </div>
          <div className="red-divider-thick mt-16" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-8">
        <div className="container text-center text-gray-500 text-sm">
          <p>© 2026 CryptoTrade. Professional cryptocurrency trading platform.</p>
        </div>
      </footer>
    </div>
  );
}
