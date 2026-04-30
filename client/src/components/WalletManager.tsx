import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function WalletManager() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [address, setAddress] = useState("");

  const addressesQuery = trpc.wallet.getAddresses.useQuery();
  const addAddressMutation = trpc.wallet.addAddress.useMutation();

  const addresses = addressesQuery.data || [];

  const handleAddAddress = async () => {
    if (!symbol || !address) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await addAddressMutation.mutateAsync({ symbol: symbol.toUpperCase(), address });
      setSymbol("");
      setAddress("");
      setShowAddForm(false);
      toast.success("Address added successfully");
      addressesQuery.refetch();
    } catch (error) {
      toast.error("Failed to add address");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold font-mono">WALLET ADDRESSES</h2>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-neon"
        >
          <Plus size={18} className="mr-2" />
          Add Address
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Add Wallet Address</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">SYMBOL</label>
              <Input
                type="text"
                placeholder="BTC, ETH, SOL..."
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">ADDRESS</label>
              <Input
                type="text"
                placeholder="Wallet address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddAddress}
                disabled={addAddressMutation.isPending}
                className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold"
              >
                {addAddressMutation.isPending ? "Adding..." : "Add Address"}
              </Button>
              <Button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {addresses.length > 0 ? (
        <div className="grid gap-4">
          {addresses.map((wallet) => (
            <Card key={wallet.id} className="bg-gray-900 border-gray-800 p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white mb-2">{wallet.symbol}</h4>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-800 px-3 py-2 rounded text-sm text-cyan-400 break-all">
                      {wallet.address}
                    </code>
                    <button
                      onClick={() => copyToClipboard(wallet.address)}
                      className="p-2 hover:bg-gray-800 rounded transition-colors"
                    >
                      <Copy size={18} className="text-gray-400 hover:text-cyan-400" />
                    </button>
                  </div>
                </div>
                <button className="p-2 hover:bg-red-900 rounded transition-colors">
                  <Trash2 size={18} className="text-red-400" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded">
          <p className="text-gray-400 mb-4">No wallet addresses added yet</p>
          <Button
            onClick={() => setShowAddForm(true)}
            className="btn-brutalist"
          >
            Add First Address
          </Button>
        </div>
      )}
    </div>
  );
}
