import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MarketTicker from "@/components/MarketTicker";
import { ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const portfolioQuery = trpc.portfolio.getPortfolio.useQuery();
  const transactionsQuery = trpc.transactions.getTransactions.useQuery({ limit: 10 });
  const topCoinsQuery = trpc.market.getTopCoins.useQuery();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const portfolio = portfolioQuery.data?.portfolio;
  const holdings = portfolioQuery.data?.holdings || [];
  const transactions = transactionsQuery.data || [];
  const topCoins = topCoinsQuery.data || [];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-900 py-6">
        <div className="container flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold font-mono tracking-tighter">DASHBOARD</h1>
            <p className="text-gray-400 mt-2">Welcome back, {user?.name}</p>
          </div>
          <div className="flex gap-4">
            <Button className="btn-neon">Deposit</Button>
            <Button className="btn-brutalist">Withdraw</Button>
          </div>
        </div>
      </div>

      {/* Market Ticker */}
      <MarketTicker />

      {/* Portfolio Overview */}
      <section className="py-12 border-b border-gray-900">
        <div className="container">
          <div className="red-divider-thick mb-8" />
          <h2 className="text-3xl font-bold font-mono mb-8">PORTFOLIO</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded">
              <div className="text-gray-400 text-sm font-mono mb-2">TOTAL VALUE</div>
              <div className="text-4xl font-bold text-white mb-2">
                ₹{portfolio?.totalValue || "0"}
              </div>
              <div className="text-sm text-green-400">+12.5% this month</div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded">
              <div className="text-gray-400 text-sm font-mono mb-2">TOTAL INVESTED</div>
              <div className="text-4xl font-bold text-white mb-2">
                ₹{portfolio?.totalInvested || "0"}
              </div>
              <div className="text-sm text-gray-400">Across {holdings.length} coins</div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded">
              <div className="text-gray-400 text-sm font-mono mb-2">PROFIT/LOSS</div>
              <div className={`text-4xl font-bold mb-2 ${parseFloat(portfolio?.totalProfitLoss || "0") >= 0 ? "text-green-400" : "text-red-400"}`}>
                ₹{portfolio?.totalProfitLoss || "0"}
              </div>
              <div className="text-sm text-gray-400">
                {parseFloat(portfolio?.totalProfitLoss || "0") >= 0 ? "↑" : "↓"} Performance
              </div>
            </div>
          </div>

          {/* Holdings */}
          {holdings.length > 0 ? (
            <div>
              <h3 className="text-2xl font-bold font-mono mb-4">YOUR HOLDINGS</h3>
              <div className="space-y-3">
                {holdings.map((holding) => (
                  <div
                    key={holding.id}
                    className="bg-gray-900 border border-gray-800 p-4 rounded flex justify-between items-center hover:border-cyan-400 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-white">{holding.symbol}</div>
                      <div className="text-sm text-gray-400">
                        {holding.quantity} coins @ ₹{holding.averageBuyPrice}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        ₹{holding.totalValue}
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          parseFloat(holding.profitLoss) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {parseFloat(holding.profitLoss) >= 0 ? "+" : ""}
                        ₹{holding.profitLoss}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded">
              <Wallet size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 mb-4">No holdings yet</p>
              <Button className="btn-brutalist">Start Trading</Button>
            </div>
          )}
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="py-12 border-b border-gray-900">
        <div className="container">
          <div className="red-divider-thick mb-8" />
          <h2 className="text-3xl font-bold font-mono mb-8">RECENT TRANSACTIONS</h2>

          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-gray-900 border border-gray-800 p-4 rounded flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    {tx.type === "buy" ? (
                      <ArrowDownLeft size={24} className="text-green-400" />
                    ) : (
                      <ArrowUpRight size={24} className="text-red-400" />
                    )}
                    <div>
                      <div className="font-bold text-white">
                        {tx.type === "buy" ? "Bought" : "Sold"} {tx.quantity} {tx.symbol}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">₹{tx.total}</div>
                    <div className="text-sm text-gray-400">@ ₹{tx.price}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded">
              <TrendingUp size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No transactions yet</p>
            </div>
          )}
        </div>
      </section>

      {/* Market Overview */}
      <section className="py-12">
        <div className="container">
          <div className="red-divider-thick mb-8" />
          <h2 className="text-3xl font-bold font-mono mb-8">TOP COINS</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topCoins.slice(0, 5).map((coin: any) => (
              <div
                key={coin.id}
                className="bg-gray-900 border border-gray-800 p-4 rounded hover:border-cyan-400 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-3">
                  {coin.image && (
                    <img src={coin.image} alt={coin.name} className="w-6 h-6" />
                  )}
                  <div className="font-bold text-white text-sm">{coin.symbol}</div>
                </div>
                <div className="text-lg font-bold text-white mb-1">₹{coin.price.toFixed(0)}</div>
                <div
                  className={`text-sm font-semibold ${
                    coin.change24h >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {coin.change24h >= 0 ? "↑" : "↓"} {Math.abs(coin.change24h).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
