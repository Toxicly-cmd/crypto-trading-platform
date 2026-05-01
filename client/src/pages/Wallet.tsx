import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RazorpayCheckout from "@/components/RazorpayCheckout";
import WalletManager from "@/components/WalletManager";
import AlertsCenter from "@/components/AlertsCenter";
import { ArrowLeft } from "lucide-react";

export default function Wallet() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Tabs */}
      <section className="py-12">
        <div className="container">
          <div className="red-divider-thick mb-8" />

          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="bg-gray-900 border border-gray-800 w-full justify-start">
              <TabsTrigger value="deposit" className="data-[state=active]:bg-cyan-400 data-[state=active]:text-black">
                Deposit Funds
              </TabsTrigger>
              <TabsTrigger value="addresses" className="data-[state=active]:bg-cyan-400 data-[state=active]:text-black">
                Wallet Addresses
              </TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-cyan-400 data-[state=active]:text-black">
                Alerts & Notifications
              </TabsTrigger>
            </TabsList>

            {/* Deposit Tab */}
            <TabsContent value="deposit" className="mt-8">
              <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold font-mono mb-4">DEPOSIT CRYPTO</h2>
                  <p className="text-gray-400 mb-6">
                    Add funds to your account using Razorpay. Your deposit will be instantly credited to your wallet.
                  </p>
                </div>
                <RazorpayCheckout
                  onSuccess={(orderId) => {
                    console.log("Payment successful:", orderId);
                  }}
                  onError={(error) => {
                    console.error("Payment error:", error);
                  }}
                />
              </div>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="mt-8">
              <WalletManager />
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="mt-8">
              <AlertsCenter />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
