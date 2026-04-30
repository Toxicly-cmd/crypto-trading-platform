import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Trash2, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

export default function AlertsCenter() {
  const [filter, setFilter] = useState<"all" | "payment" | "trade" | "price">("all");

  const alertsQuery = trpc.alerts.getAlerts.useQuery({ limit: 20 });
  const priceAlertsQuery = trpc.alerts.getPriceAlerts.useQuery();

  const alerts = alertsQuery.data || [];
  const priceAlerts = priceAlertsQuery.data || [];

  const filteredAlerts = alerts.filter(alert => 
    filter === "all" ? true : alert.type === filter
  );

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <CheckCircle size={20} className="text-green-400" />;
      case "trade":
        return <TrendingUp size={20} className="text-cyan-400" />;
      case "price":
        return <AlertCircle size={20} className="text-yellow-400" />;
      default:
        return <Bell size={20} className="text-gray-400" />;
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case "payment":
        return "bg-green-900 border-green-700";
      case "trade":
        return "bg-cyan-900 border-cyan-700";
      case "price":
        return "bg-yellow-900 border-yellow-700";
      default:
        return "bg-gray-900 border-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold font-mono">ALERTS & NOTIFICATIONS</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setFilter("all")}
            className={filter === "all" ? "btn-neon" : "btn-brutalist-outline"}
          >
            All
          </Button>
          <Button
            onClick={() => setFilter("payment")}
            className={filter === "payment" ? "btn-neon" : "btn-brutalist-outline"}
          >
            Payments
          </Button>
          <Button
            onClick={() => setFilter("trade")}
            className={filter === "trade" ? "btn-neon" : "btn-brutalist-outline"}
          >
            Trades
          </Button>
          <Button
            onClick={() => setFilter("price")}
            className={filter === "price" ? "btn-neon" : "btn-brutalist-outline"}
          >
            Prices
          </Button>
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className={`border p-4 flex justify-between items-start ${getAlertBgColor(alert.type)}`}>
              <div className="flex gap-4 flex-1">
                <div className="flex-shrink-0 mt-1">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-1">{alert.title}</h4>
                  {alert.message && (
                    <p className="text-sm text-gray-300 mb-2">{alert.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-red-900 rounded transition-colors flex-shrink-0">
                <Trash2 size={18} className="text-red-400" />
              </button>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded">
            <Bell size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No notifications yet</p>
          </div>
        )}
      </div>

      {/* Price Alerts */}
      {priceAlerts.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold font-mono mb-4">PRICE ALERTS</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {priceAlerts.map((alert) => (
              <Card key={alert.id} className="bg-gray-900 border-gray-800 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white mb-2">
                      {alert.symbol}
                      <span className="ml-2 text-xs bg-gray-800 px-2 py-1 rounded">
                        {alert.alertType === "above" ? "↑" : "↓"} ₹{alert.targetPrice}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-400">
                      {alert.alertType === "above" ? "Alert when price goes above" : "Alert when price goes below"}
                    </p>
                    <p className={`text-xs mt-2 ${alert.isActive ? "text-green-400" : "text-gray-500"}`}>
                      {alert.isActive ? "🟢 Active" : "⚫ Inactive"}
                    </p>
                  </div>
                  <button className="p-2 hover:bg-red-900 rounded transition-colors">
                    <Trash2 size={18} className="text-red-400" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
