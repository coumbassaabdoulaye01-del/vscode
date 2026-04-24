import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AdminPanel() {
  const { user } = useAuth();
  const { data: apiKeys, isLoading } = trpc.apiKeys.adminList.useQuery();

  // Redirect if not admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <p className="text-red-400">Access Denied: Admin privileges required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const stats = apiKeys
    ? {
        totalKeys: apiKeys.length,
        activeKeys: apiKeys.filter((k) => k.status === "active").length,
        revokedKeys: apiKeys.filter((k) => k.status === "revoked").length,
        expiredKeys: apiKeys.filter((k) => k.status === "expired").length,
        totalUsage: apiKeys.reduce((sum, k) => sum + k.usageCount, 0),
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-slate-400">System Overview & Management</p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm mb-1">Total API Keys</p>
                <p className="text-2xl font-bold text-white">{stats.totalKeys}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm mb-1">Active Keys</p>
                <p className="text-2xl font-bold text-green-400">{stats.activeKeys}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm mb-1">Revoked Keys</p>
                <p className="text-2xl font-bold text-red-400">{stats.revokedKeys}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm mb-1">Expired Keys</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.expiredKeys}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm mb-1">Total Usage</p>
                <p className="text-2xl font-bold text-blue-400">{stats.totalUsage}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* API Keys Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">All API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            ) : apiKeys && apiKeys.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300">Key Preview</th>
                      <th className="text-left py-3 px-4 text-slate-300">User ID</th>
                      <th className="text-left py-3 px-4 text-slate-300">Plan</th>
                      <th className="text-left py-3 px-4 text-slate-300">Status</th>
                      <th className="text-left py-3 px-4 text-slate-300">Usage</th>
                      <th className="text-left py-3 px-4 text-slate-300">Expires</th>
                      <th className="text-left py-3 px-4 text-slate-300">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                        <td className="py-3 px-4">
                          <code className="bg-slate-900 px-2 py-1 rounded text-xs text-slate-300">
                            {key.keyPreview}
                          </code>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{key.userId}</td>
                        <td className="py-3 px-4 text-slate-300 capitalize">{key.plan}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              key.status === "active"
                                ? "bg-green-900 text-green-200"
                                : key.status === "revoked"
                                ? "bg-red-900 text-red-200"
                                : "bg-yellow-900 text-yellow-200"
                            }`}
                          >
                            {key.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{key.usageCount}</td>
                        <td className="py-3 px-4 text-slate-300 text-xs">
                          {new Date(key.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-slate-300 text-xs">
                          {new Date(key.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No API keys found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
