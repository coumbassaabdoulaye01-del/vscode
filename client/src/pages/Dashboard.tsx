import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Copy, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "pro" | "enterprise">("basic");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const { data: apiKeys, isLoading: keysLoading, refetch: refetchKeys } = trpc.apiKeys.list.useQuery();
  const { data: pricing } = trpc.payment.getPricing.useQuery();
  const { mutate: purchaseKey, isPending: isPurchasing } = trpc.payment.purchaseKey.useMutation({
    onSuccess: (data) => {
      toast.success(`API key created successfully! Expires: ${new Date(data.expiresAt).toLocaleDateString()}`);
      setShowPurchaseModal(false);
      refetchKeys();
    },
    onError: (error) => {
      toast.error(`Failed to create API key: ${error.message}`);
    },
  });

  const { mutate: revokeKey } = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => {
      toast.success("API key revoked successfully");
      refetchKeys();
    },
    onError: (error) => {
      toast.error(`Failed to revoke API key: ${error.message}`);
    },
  });

  const { mutate: getFullKey } = trpc.apiKeys.getFullKey.useMutation({
    onSuccess: (key) => {
      navigator.clipboard.writeText(key.key);
      toast.success("API key copied to clipboard");
    },
    onError: () => {
      toast.error("Failed to copy API key");
    },
  });

  const handleCopyKey = (keyId: number) => {
    getFullKey({ keyId });
  };

  const handlePurchase = () => {
    purchaseKey({ plan: selectedPlan });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Terminal Access Dashboard</h1>
          <p className="text-slate-400">Welcome, {user?.name || "User"}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* API Keys Section */}
            <Card className="bg-slate-800 border-slate-700 mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Your API Keys</CardTitle>
                <Button
                  onClick={() => setShowPurchaseModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Purchase Key
                </Button>
              </CardHeader>
              <CardContent>
                {keysLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  </div>
                ) : apiKeys && apiKeys.length > 0 ? (
                  <div className="space-y-4">
                    {apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="bg-slate-700 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="bg-slate-900 px-3 py-1 rounded text-sm text-slate-300">
                              {key.key}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyKey(key.id)}
                              className="text-slate-400 hover:text-white"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-xs text-slate-400 space-y-1">
                            <p>Plan: <span className="text-slate-300 capitalize">{key.plan}</span></p>
                            <p>Status: <span className={`capitalize ${key.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>{key.status}</span></p>
                            <p>Expires: {new Date(key.expiresAt).toLocaleDateString()}</p>
                            <p>Usage: {key.usageCount} sessions</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeKey({ keyId: key.id })}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">No API keys yet</p>
                    <Button
                      onClick={() => setShowPurchaseModal(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Purchase Your First Key
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Terminal Access Section */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Terminal Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 mb-4">
                  Use your API key to connect to the web terminal. Select a key and click "Open Terminal" to start a session.
                </p>
                {apiKeys && apiKeys.length > 0 ? (
                  <Button className="bg-green-600 hover:bg-green-700">
                    Open Terminal
                  </Button>
                ) : (
                  <p className="text-slate-500">Purchase an API key to access the terminal</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Pricing */}
          <div>
            <Card className="bg-slate-800 border-slate-700 sticky top-8">
              <CardHeader>
                <CardTitle className="text-white">Plans</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pricing?.plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 rounded-lg border cursor-pointer transition ${
                      selectedPlan === plan.id
                        ? "bg-blue-900 border-blue-500"
                        : "bg-slate-700 border-slate-600 hover:border-slate-500"
                    }`}
                    onClick={() => setSelectedPlan(plan.id as any)}
                  >
                    <h3 className="font-semibold text-white mb-1">{plan.name}</h3>
                    <p className="text-2xl font-bold text-blue-400 mb-2">{plan.priceFormatted}</p>
                    <p className="text-xs text-slate-400 mb-3">{plan.duration}</p>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                <Button
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Purchase Plan"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
