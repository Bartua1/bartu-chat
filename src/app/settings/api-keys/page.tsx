"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { SettingsLayout } from "~/app/_components/settings-layout";

interface UserAPI {
  id: number;
  userId: string;
  name: string;
  provider: string;
  apiKey: string;
  apiUrl: string;
  isActive: string;
  createdAt: string;
  updatedAt: string;
}

export default function APIKeysPage() {
  const [userAPIs, setUserAPIs] = useState<UserAPI[]>([]);
  const [showAddAPIForm, setShowAddAPIForm] = useState(false);
  const [isLoadingAPIs, setIsLoadingAPIs] = useState(false);
  const [newAPI, setNewAPI] = useState({
    name: "",
    provider: "openai",
    apiKey: "",
    apiUrl: "",
  });

  // Fetch user APIs
  const fetchUserAPIs = async () => {
    setIsLoadingAPIs(true);
    try {
      const response = await fetch("/api/user-apis");
      if (!response.ok) throw new Error("Failed to fetch APIs");
      const apis = await response.json();
      setUserAPIs(apis);
    } catch (err) {
      console.error("Error fetching APIs:", err);
      toast.error("Failed to load APIs");
    } finally {
      setIsLoadingAPIs(false);
    }
  };

  // Load APIs on component mount
  useEffect(() => {
    void fetchUserAPIs();
  }, []);

  // Add new API
  const handleAddAPI = async () => {
    if (!newAPI.name || !newAPI.apiKey || !newAPI.apiUrl) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/api/user-apis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAPI),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add API");
      }

      const result = await response.json();
      toast.success(result.message);
      setNewAPI({ name: "", provider: "openai", apiKey: "", apiUrl: "" });
      setShowAddAPIForm(false);
      await fetchUserAPIs();
    } catch (err) {
      console.error("Error adding API:", err);
      toast.error(err instanceof Error ? err.message : "Failed to add API");
    }
  };

  // Delete API
  const handleDeleteAPI = async (apiId: number) => {
    if (!confirm("Are you sure you want to delete this API? This will also delete all associated models.")) {
      return;
    }

    try {
      const response = await fetch(`/api/user-apis?id=${apiId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete API");
      }

      toast.success("API deleted successfully");
      await fetchUserAPIs();
    } catch (err) {
      console.error("Error deleting API:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete API");
    }
  };

  return (
    <SettingsLayout>
      <div>
        <div className="mb-8 flex items-baseline justify-between">
          <h1 className="text-3xl font-bold text-foreground">API Keys</h1>
          <button
            onClick={() => setShowAddAPIForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            <PlusIcon className="h-4 w-4" />
            Add API
          </button>
        </div>

        <p className="mb-6 text-muted-foreground">
          Add your own API keys to use custom models. We support OpenAI-compatible APIs.
        </p>

        {/* Add API Form */}
        {showAddAPIForm && (
          <div className="mb-6 rounded-lg bg-card border p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-card-foreground">Add New API</h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newAPI.name}
                  onChange={(e) => setNewAPI({ ...newAPI, name: e.target.value })}
                  placeholder="My Custom API"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Provider
                </label>
                <select
                  value={newAPI.provider}
                  onChange={(e) => setNewAPI({ ...newAPI, provider: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google Gemini</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={newAPI.apiKey}
                  onChange={(e) => setNewAPI({ ...newAPI, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  API URL
                </label>
                <input
                  type="url"
                  value={newAPI.apiUrl}
                  onChange={(e) => setNewAPI({ ...newAPI, apiUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddAPI}
                  className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                >
                  Test & Add API
                </button>
                <button
                  onClick={() => setShowAddAPIForm(false)}
                  className="rounded-lg border border-border px-4 py-2 text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* APIs List */}
        {isLoadingAPIs ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading APIs...</div>
          </div>
        ) : userAPIs.length === 0 ? (
          <div className="rounded-lg bg-muted/50 border border-dashed border-border p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold text-foreground">No APIs Added</h3>
            <p className="text-muted-foreground mb-4">
              Add your first API to start using custom models.
            </p>
            <button
              onClick={() => setShowAddAPIForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              <PlusIcon className="h-4 w-4" />
              Add API
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {userAPIs.map((api) => (
              <div key={api.id} className="rounded-lg bg-card border p-6 shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-card-foreground">{api.name}</h3>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                        {api.provider}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        api.isActive === "true" 
                          ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}>
                        {api.isActive === "true" ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>URL:</strong> {api.apiUrl}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Added:</strong> {new Date(api.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAPI(api.id)}
                    className="rounded-lg bg-destructive/10 p-2 text-destructive hover:bg-destructive/20"
                    title="Delete API"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}
