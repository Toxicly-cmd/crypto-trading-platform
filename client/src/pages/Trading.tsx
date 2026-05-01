import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import TradingPanel from "@/components/TradingPanel";
import { ArrowLeft } from "lucide-react";

export default function Trading() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");

  const topCoinsQuery = trpc.market.getTopCoins.useQuery();
  const coins = topCoinsQuery.data || [];

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const selectedCoin = coins.find((c: any) => c.symbol === selectedSymbol);
  const currentPrice = selectedCoin?.price || 0;

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Coin Selector */}
      <div className="bg-gray-900 border-b border-gray-800 py-4 overflow-x-auto">
        <div className="container">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {coins.map((coin: any) => (
              <button
                key={coin.id}
                onClick={() => setSelectedSymbol(coin.symbol)}
                className={`flex-shrink-0 px-4 py-2 rounded font-bold transition-all ${
                  selectedSymbol === coin.symbol
                    ? "bg-cyan-400 text-black"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
              >
                {coin.symbol}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trading Interface */}
      <section className="py-12">
        <div className="container">
          <div className="red-divider-thick mb-8" />
          {selectedCoin && <TradingPanel symbol={selectedSymbol} currentPrice={currentPrice} />}
        </div>
      </section>

      {/* Order Book */}
      <section className="py-12 border-t border-gray-900">
        <div className="container">
          <div className="red-divider-thick mb-8" />
          <h2 className="text-3xl font-bold font-mono mb-8">ORDER BOOK</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Bids */}
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-4">BIDS</h3>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between bg-gray-900 p-3 rounded text-sm">
                    <span className="text-gray-400">₹{(currentPrice - i * 100).toFixed(2)}</span>
                    <span className="text-white">{(Math.random() * 10).toFixed(2)} BTC</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Asks */}
            <div>
              <h3 className="text-xl font-bold text-red-400 mb-4">ASKS</h3>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between bg-gray-900 p-3 rounded text-sm">
                    <span className="text-gray-400">₹{(currentPrice + i * 100).toFixed(2)}</span>
                    <span className="text-white">{(Math.random() * 10).toFixed(2)} BTC</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
