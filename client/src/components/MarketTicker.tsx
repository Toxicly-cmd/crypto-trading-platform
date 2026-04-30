import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  image: string;
}

export default function MarketTicker() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);

  const topCoinsQuery = trpc.market.getTopCoins.useQuery();

  useEffect(() => {
    if (topCoinsQuery.data) {
      setCoins(topCoinsQuery.data);
      setLoading(false);
    }
  }, [topCoinsQuery.data]);

  // Refresh prices every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      topCoinsQuery.refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [topCoinsQuery]);

  if (loading) {
    return (
      <div className="bg-black border-b border-gray-900 py-4">
        <div className="container">
          <div className="flex gap-4 overflow-x-auto">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-40 h-20 bg-gray-900 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black border-b border-gray-900 py-4 overflow-x-auto">
      <div className="container">
        <div className="flex gap-6 overflow-x-auto pb-2">
          {coins.map((coin) => (
            <div
              key={coin.id}
              className="flex-shrink-0 bg-gray-900 border border-gray-800 p-4 rounded hover:border-cyan-400 transition-colors cursor-pointer min-w-max"
            >
              <div className="flex items-center gap-3 mb-2">
                {coin.image && (
                  <img src={coin.image} alt={coin.name} className="w-6 h-6" />
                )}
                <div>
                  <div className="font-bold text-white">{coin.symbol}</div>
                  <div className="text-xs text-gray-400">{coin.name}</div>
                </div>
              </div>
              <div className="text-lg font-bold text-white">₹{coin.price.toFixed(2)}</div>
              <div
                className={`text-sm font-semibold flex items-center gap-1 ${
                  coin.change24h >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {coin.change24h >= 0 ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {Math.abs(coin.change24h).toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
