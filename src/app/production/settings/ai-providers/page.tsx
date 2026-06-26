"use client";

import React, { useEffect, useState } from "react";
import { Bot, CheckCircle2, XCircle, AlertCircle, Loader2, Save, KeyRound } from "lucide-react";

export default function AIProvidersSettingsPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/v1/production/settings/providers");
      const json = await res.json();
      setProviders(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSave = async (providerId: string) => {
    const key = apiKeys[providerId];
    if (!key) return;

    setSavingId(providerId);
    try {
      const res = await fetch("/api/v1/production/settings/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: providerId, api_key: key }),
      });
      if (res.ok) {
        setApiKeys((prev) => ({ ...prev, [providerId]: "" })); // Clear input after saving
        await fetchProviders();
      } else {
        alert("Failed to save credentials");
      }
    } catch (err) {
      alert("Error saving credentials");
    } finally {
      setSavingId(null);
    }
  };

  const handleTest = async (providerId: string) => {
    setTestingId(providerId);
    try {
      const res = await fetch(`/api/v1/production/settings/providers/${providerId}/test`, {
        method: "POST"
      });
      const json = await res.json();
      if (json.success) {
        alert("Connection successful!");
      } else {
        alert(`Connection failed: ${json.error || "Unknown error"}`);
      }
      await fetchProviders();
    } catch (err) {
      alert("Error testing connection");
    } finally {
      setTestingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Bot className="h-6 w-6 text-indigo-600" />
          AI Provider Configurations
        </h1>
        <p className="text-slate-500 mt-1">
          Manage API keys and integration health for AI generation models. Keys are encrypted securely.
        </p>
      </div>

      <div className="grid gap-6">
        {providers.map((p) => {
          let StatusIcon = AlertCircle;
          let statusColor = "text-slate-400";
          let statusBg = "bg-slate-100";

          if (p.status === "Online") {
            StatusIcon = CheckCircle2;
            statusColor = "text-green-600";
            statusBg = "bg-green-100";
          } else if (p.status === "Invalid") {
            StatusIcon = XCircle;
            statusColor = "text-red-600";
            statusBg = "bg-red-100";
          }

          return (
            <div key={p.id} className="border bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{p.name}</h3>
                    <p className="text-sm text-slate-500 capitalize">{p.category} Provider</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusColor} ${statusBg}`}>
                    <StatusIcon className="h-4 w-4" />
                    {p.status}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <KeyRound className="h-3 w-3" /> API Key
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      placeholder={p.is_configured ? "•••••••••••••••• (Encrypted & Saved)" : "sk-..."}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={apiKeys[p.id] || ""}
                      onChange={(e) => setApiKeys({ ...apiKeys, [p.id]: e.target.value })}
                    />
                    <button 
                      onClick={() => handleSave(p.id)}
                      disabled={savingId === p.id || !apiKeys[p.id]}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition"
                    >
                      {savingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">Keys are never exposed to the frontend after saving.</p>
                </div>
              </div>

              <div className="w-full md:w-64 bg-slate-50 p-4 rounded-lg border space-y-4">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Last Tested</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {p.last_tested_at ? new Date(p.last_tested_at).toLocaleString() : "Never"}
                  </div>
                </div>
                <button 
                  onClick={() => handleTest(p.id)}
                  disabled={testingId === p.id || (!p.is_configured && !apiKeys[p.id])}
                  className="w-full px-4 py-2 bg-white border shadow-sm hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-sm font-medium rounded-lg transition"
                >
                  {testingId === p.id ? "Testing..." : "Test Connection"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
