import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle } from "lucide-react";

interface RazorpayCheckoutProps {
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
}

export default function RazorpayCheckout({ onSuccess, onError }: RazorpayCheckoutProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const createOrderMutation = trpc.payments.createOrder.useMutation();

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setStatus("error");
      setMessage("Please enter a valid amount");
      onError?.("Invalid amount");
      return;
    }

    setLoading(true);
    setStatus("processing");

    try {
      const order = await createOrderMutation.mutateAsync({
        amount,
        currency: "INR",
      });

      if (order.key === "mock") {
        // Fallback for development if keys are missing
        setTimeout(() => {
          setStatus("success");
          setMessage(`[MOCK] Payment successful for ₹${amount}. Order ID: ${order.orderId}`);
          setAmount("");
          onSuccess?.(order.orderId);
        }, 1500);
        return;
      }

      const options = {
        key: order.key,
        amount: Math.round(parseFloat(amount) * 100),
        currency: order.currency,
        name: "CryptoTrade",
        description: "Crypto Purchase",
        order_id: order.orderId,
        handler: function (response: any) {
          setStatus("success");
          setMessage(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
          setAmount("");
          onSuccess?.(order.orderId);
        },
        prefill: {
          name: "Toxic User",
          email: "toxic@example.com",
        },
        theme: {
          color: "#00ffff",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setStatus("error");
        setMessage(`Payment failed: ${response.error.description}`);
        onError?.(response.error.description);
      });
      rzp.open();
    } catch (error) {
      setStatus("error");
      setMessage("Payment initiation failed. Please check your keys.");
      onError?.("Payment failed");
      console.error("Payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 p-6 max-w-md mx-auto">
      <h3 className="text-2xl font-bold text-white mb-6 font-mono">DEPOSIT FUNDS</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-mono text-gray-400 mb-2">AMOUNT (₹)</label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum: ₹100 | Maximum: ₹1,00,000</p>
        </div>

        {status === "error" && (
          <div className="bg-red-900 border border-red-700 p-3 rounded flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-green-900 border border-green-700 p-3 rounded flex items-start gap-3">
            <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-200">{message}</p>
          </div>
        )}

        <Button
          onClick={handlePayment}
          disabled={loading || !amount}
          className={`w-full py-3 font-bold uppercase tracking-wider ${
            loading
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-cyan-400 hover:bg-cyan-500 text-black"
          }`}
        >
          {loading ? "Processing..." : `Pay ₹${amount || "0"}`}
        </Button>

        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>💳 Powered by Razorpay</p>
          <p>🔒 Secure payment gateway</p>
          <p>By proceeding, you agree to our terms</p>
        </div>
      </div>
    </Card>
  );
}
