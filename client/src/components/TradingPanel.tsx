import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TradingPanelProps {
  symbol: string;
  currentPrice: number;
}

export default function TradingPanel({ symbol, currentPrice }: TradingPanelProps) {
  const [quantity, setQuantity] = useState("");
  const [priceInput, setPriceInput] = useState(currentPrice.toString());
  const [chartType, setChartType] = useState<"line" | "candlestick">("line");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");

  const createTransactionMutation = trpc.transactions.createTransaction.useMutation();

  const total = quantity && priceInput ? (parseFloat(quantity) * parseFloat(priceInput)).toFixed(2) : "0";

  const handleTrade = async () => {
    if (!quantity || !priceInput) {
      alert("Please fill in all fields");
      return;
    }

    try {
      await createTransactionMutation.mutateAsync({
        symbol,
        type: tradeType,
        quantity,
        price: priceInput,
      });

      setQuantity("");
      setPriceInput(currentPrice.toString());
      alert(`Successfully ${tradeType === "buy" ? "bought" : "sold"} ${quantity} ${symbol}`);
    } catch (error) {
      console.error("Trade failed:", error);
      alert("Trade failed. Please try again.");
    }
  };

  // Mock chart data with OHLC for candlesticks
  const mockChartData = Array.from({ length: 24 }, (_, i) => {
    const open = currentPrice + (Math.random() - 0.5) * 2000;
    const close = open + (Math.random() - 0.5) * 1500;
    const high = Math.max(open, close) + Math.random() * 500;
    const low = Math.min(open, close) - Math.random() * 500;
    return {
      time: `${i}:00`,
      price: close,
      open,
      close,
      high,
      low,
    };
  });

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Chart Section */}
      <div className="md:col-span-2">
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-white">{symbol}/INR</h3>
              <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)}>
                <TabsList className="bg-gray-800">
                  <TabsTrigger value="line">Line</TabsTrigger>
                  <TabsTrigger value="candlestick">Candle</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="text-3xl font-bold text-white mb-2">₹{currentPrice.toFixed(2)}</div>
            <div className="text-sm text-green-400">+5.2% (24h)</div>
          </div>

          <div className="w-full h-80 bg-gray-900 rounded border border-gray-800 p-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="time" stroke="#666" tick={{fontSize: 12}} />
                  <YAxis stroke="#666" domain={["auto", "auto"]} tick={{fontSize: 12}} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "4px" }}
                    itemStyle={{ color: "#00ffff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#00ffff"
                    dot={false}
                    strokeWidth={3}
                    animationDuration={1000}
                  />
                </LineChart>
              ) : (
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="time" stroke="#666" tick={{fontSize: 12}} />
                  <YAxis stroke="#666" domain={["auto", "auto"]} tick={{fontSize: 12}} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "4px" }}
                    content={({ payload, label }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-black border border-gray-800 p-3 rounded font-mono text-xs">
                            <div className="text-gray-400 mb-1">{label}</div>
                            <div className="flex gap-4">
                              <span className="text-green-400">O: {data.open.toFixed(0)}</span>
                              <span className="text-red-400">C: {data.close.toFixed(0)}</span>
                            </div>
                            <div className="flex gap-4 mt-1">
                              <span className="text-gray-300">H: {data.high.toFixed(0)}</span>
                              <span className="text-gray-300">L: {data.low.toFixed(0)}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* High/Low Line */}
                  <Line dataKey="high" stroke="#666" dot={false} strokeWidth={1} connectNulls />
                  <Line dataKey="low" stroke="#666" dot={false} strokeWidth={1} connectNulls />
                  {/* Simplified Candlestick visualization using customized dots or bars */}
                  {/* For simplicity in a mock, we use colored dots for now or a specialized render */}
                  <Line 
                    type="step" 
                    dataKey="close" 
                    stroke={(d: any) => d.close > d.open ? "#22c55e" : "#ef4444"} 
                    strokeWidth={0}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      const isUp = payload.close > payload.open;
                      const color = isUp ? "#22c55e" : "#ef4444";
                      return (
                        <rect 
                          key={props.index}
                          x={cx - 4} 
                          y={isUp ? cy : cy - Math.abs(payload.close - payload.open) / 100} 
                          width={8} 
                          height={Math.max(2, Math.abs(payload.close - payload.open) / 100)} 
                          fill={color} 
                        />
                      );
                    }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Trading Panel */}
      <div>
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTradeType("buy")}
                className={`flex-1 py-2 px-4 font-bold rounded transition-all ${
                  tradeType === "buy"
                    ? "bg-green-500 text-black"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
              >
                <ArrowDownLeft size={16} className="inline mr-2" />
                BUY
              </button>
              <button
                onClick={() => setTradeType("sell")}
                className={`flex-1 py-2 px-4 font-bold rounded transition-all ${
                  tradeType === "sell"
                    ? "bg-red-500 text-black"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
              >
                <ArrowUpRight size={16} className="inline mr-2" />
                SELL
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">QUANTITY</label>
              <Input
                type="number"
                placeholder="0.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">PRICE (₹)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="bg-gray-800 p-4 rounded">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Total:</span>
                <span className="text-white font-bold">₹{total}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Fee (0.5%):</span>
                <span className="text-white">₹{(parseFloat(total) * 0.005).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-700 pt-2 flex justify-between">
                <span className="text-gray-300 font-semibold">Final:</span>
                <span className="text-white font-bold">
                  ₹{(parseFloat(total) * 1.005).toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              onClick={handleTrade}
              disabled={!quantity || !priceInput || createTransactionMutation.isPending}
              className={`w-full py-3 font-bold uppercase tracking-wider ${
                tradeType === "buy"
                  ? "bg-green-500 hover:bg-green-600 text-black"
                  : "bg-red-500 hover:bg-red-600 text-black"
              }`}
            >
              {createTransactionMutation.isPending
                ? "Processing..."
                : `${tradeType === "buy" ? "Buy" : "Sell"} ${symbol}`}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              By placing an order, you agree to our terms
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
