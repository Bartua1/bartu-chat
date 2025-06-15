"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { PlusIcon, PencilIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { SettingsLayout } from "~/app/_components/settings-layout";

interface UserModel {
  id: number;
  name: string;
  displayName: string;
  provider: string;
  inputPrice: number;
  outputPrice: number;
  maxTokens: number | null;
  isActive: string;
  userApiId: number | null;
  owner: string;
  apiName?: string;
  apiUrl?: string;
}

interface UserAPI {
  id: number;
  name: string;
  provider: string;
  apiUrl: string;
  isActive: string;
}

interface AvailableModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
}

interface ModelToImport {
  name: string;
  displayName: string;
  inputPrice: number;
  outputPrice: number;
  maxTokens: number | null;
  isActive: string;
  selected: boolean;
}

export default function ModelsPage() {
  const [userModels, setUserModels] = useState<UserModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  
  // Import models state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [userAPIs, setUserAPIs] = useState<UserAPI[]>([]);
  const [selectedAPI, setSelectedAPI] = useState<number | null>(null);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [modelsToImport, setModelsToImport] = useState<ModelToImport[]>([]);
  const [isLoadingAPIs, setIsLoadingAPIs] = useState(false);
  const [isSearchingModels, setIsSearchingModels] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // Fetch user models
  const fetchUserModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await fetch("/api/user-models");
      if (!response.ok) throw new Error("Failed to fetch models");
      const models = await response.json() as UserModel[];
      setUserModels(models);
    } catch (err) {
      console.error("Error fetching models:", err);
      toast.error("Failed to load models");
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Fetch user APIs
  const fetchUserAPIs = async () => {
    setIsLoadingAPIs(true);
    try {
      const response = await fetch("/api/user-apis");
      if (!response.ok) throw new Error("Failed to fetch APIs");
      const apis = await response.json() as UserAPI[];
      setUserAPIs(apis.filter(api => api.isActive === "true"));
    } catch (err) {
      console.error("Error fetching APIs:", err);
      toast.error("Failed to load APIs");
    } finally {
      setIsLoadingAPIs(false);
    }
  };

  // Search models from selected API
  const searchModels = async (apiId: number) => {
    setIsSearchingModels(true);
    try {
      const response = await fetch(`/api/user-models/search?apiId=${apiId}`);
      if (!response.ok) throw new Error("Failed to search models");
      const data = await response.json() as { api: UserAPI; models: AvailableModel[] };
      setAvailableModels(data.models);
      
      // Initialize models to import with default values (use Gemini-specific fields if available)
      const modelsWithDefaults: ModelToImport[] = data.models.map(model => ({
        name: model.id,
        displayName: model.displayName ?? model.id, // Use Gemini displayName if available
        inputPrice: 0,
        outputPrice: 0,
        maxTokens: model.inputTokenLimit ?? null, // Use Gemini inputTokenLimit if available
        isActive: "true",
        selected: false,
      }));
      setModelsToImport(modelsWithDefaults);
    } catch (err) {
      console.error("Error searching models:", err);
      toast.error("Failed to search models");
    } finally {
      setIsSearchingModels(false);
    }
  };

  // Import selected models
  const importModels = async () => {
    if (!selectedAPI) return;
    
    const selectedModels = modelsToImport.filter(model => model.selected);
    if (selectedModels.length === 0) {
      toast.error("Please select at least one model to import");
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch("/api/user-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiId: selectedAPI,
          models: selectedModels.map(({ selected, ...model }) => model),
        }),
      });

      if (!response.ok) throw new Error("Failed to import models");
      
      const result = await response.json() as { message: string };
      toast.success(result.message);
      setShowImportDialog(false);
      await fetchUserModels(); // Refresh the models list
    } catch (err) {
      console.error("Error importing models:", err);
      toast.error("Failed to import models");
    } finally {
      setIsImporting(false);
    }
  };

  // Filter models based on search term
  const filteredModels = modelsToImport.filter(model => 
    searchFilter === "" || 
    model.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
    model.displayName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Load models on component mount
  useEffect(() => {
    void fetchUserModels();
  }, []);

  // Load APIs when import dialog opens
  useEffect(() => {
    if (showImportDialog) {
      void fetchUserAPIs();
    }
  }, [showImportDialog]);

  // Search models when API is selected
  useEffect(() => {
    if (selectedAPI) {
      void searchModels(selectedAPI);
    }
  }, [selectedAPI]);

  return (
    <SettingsLayout>
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Models</h1>
            <p className="text-muted-foreground">
              Manage your available models. You can import models from your API keys.
            </p>
          </div>
          <button
            onClick={() => setShowImportDialog(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            Import Models
          </button>
        </div>

        {isLoadingModels ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading models...</div>
          </div>
        ) : userModels.length === 0 ? (
          <div className="rounded-lg bg-muted/50 border border-dashed border-border p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold text-foreground">No Models Available</h3>
            <p className="text-muted-foreground mb-4">
              Add an API key and import models to get started.
            </p>
            <div className="flex gap-2 justify-center">
              <Link
                href="/settings/api-keys"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              >
                <PlusIcon className="h-4 w-4" />
                Add API Key
              </Link>
              <button
                onClick={() => setShowImportDialog(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/90"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                Import Models
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {userModels.map((model) => (
              <div key={model.id} className="rounded-lg bg-card border p-6 shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-card-foreground">{model.displayName}</h3>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                        {model.provider}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        model.isActive === "true" 
                          ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}>
                        {model.isActive === "true" ? "Active" : "Inactive"}
                      </span>
                      {model.owner !== "system" && (
                        <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Model ID:</strong> {model.name}
                    </p>
                    {model.apiName && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>API:</strong> {model.apiName}
                      </p>
                    )}
                    {model.maxTokens && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Max Tokens:</strong> {model.maxTokens.toLocaleString()}
                      </p>
                    )}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span><strong>Input:</strong> ${(model.inputPrice / 1000000).toFixed(6)}/token</span>
                      <span><strong>Output:</strong> ${(model.outputPrice / 1000000).toFixed(6)}/token</span>
                    </div>
                  </div>
                  {model.owner !== "system" && (
                    <div className="flex gap-2">
                      <button 
                        className="rounded-lg bg-muted p-2 text-foreground hover:bg-muted/80"
                        title="Edit model"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Import Models Dialog */}
        {showImportDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg border shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-card-foreground">Import Models</h2>
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                {/* API Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select API Key
                  </label>
                  {isLoadingAPIs ? (
                    <div className="text-muted-foreground">Loading APIs...</div>
                  ) : (
                    <select
                      value={selectedAPI ?? ""}
                      onChange={(e) => setSelectedAPI(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="">Select an API...</option>
                      {userAPIs.map((api) => (
                        <option key={api.id} value={api.id}>
                          {api.name} ({api.provider})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Models List */}
                {selectedAPI && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-foreground">Available Models</h3>
                      {modelsToImport.length > 0 && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setModelsToImport(prev => prev.map(model => ({ ...model, selected: true })));
                            }}
                            className="text-sm text-primary hover:text-primary/80"
                          >
                            Select All
                          </button>
                          <button
                            onClick={() => {
                              setModelsToImport(prev => prev.map(model => ({ ...model, selected: false })));
                            }}
                            className="text-sm text-muted-foreground hover:text-foreground"
                          >
                            Deselect All
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Search Filter */}
                    {modelsToImport.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Search Models
                        </label>
                        <input
                          type="text"
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          placeholder="Filter models by name or display name..."
                          className="w-full p-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    )}

                    {isSearchingModels ? (
                      <div className="text-muted-foreground">Searching models...</div>
                    ) : modelsToImport.length === 0 ? (
                      <div className="text-muted-foreground">No models found for this API.</div>
                    ) : filteredModels.length === 0 ? (
                      <div className="text-muted-foreground">No models match your search criteria.</div>
                    ) : (
                      <div className="space-y-4">
                        {filteredModels.map((model) => {
                          // Get the original index for state updates
                          const originalIndex = modelsToImport.findIndex(m => m.name === model.name);
                          return (
                            <div key={model.name} className="border border-border rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={model.selected}
                                  onChange={(e) => {
                                    setModelsToImport(prev => prev.map((m, i) => 
                                      i === originalIndex ? { ...m, selected: e.target.checked } : m
                                    ));
                                  }}
                                  className="mt-1"
                                />
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                      Model ID
                                    </label>
                                    <div className="text-sm text-muted-foreground">{model.name}</div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                      Display Name
                                    </label>
                                    <input
                                      type="text"
                                      value={model.displayName}
                                      onChange={(e) => {
                                        setModelsToImport(prev => prev.map((m, i) => 
                                          i === originalIndex ? { ...m, displayName: e.target.value } : m
                                        ));
                                      }}
                                      className="w-full p-1 text-sm border border-border rounded bg-background text-foreground"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                      Input Price ($/M tokens)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.000001"
                                      value={model.inputPrice / 1000000}
                                      onChange={(e) => {
                                        setModelsToImport(prev => prev.map((m, i) => 
                                          i === originalIndex ? { ...m, inputPrice: Math.round(parseFloat(e.target.value) * 1000000) } : m
                                        ));
                                      }}
                                      className="w-full p-1 text-sm border border-border rounded bg-background text-foreground"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                      Output Price ($/M tokens)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.000001"
                                      value={model.outputPrice / 1000000}
                                      onChange={(e) => {
                                        setModelsToImport(prev => prev.map((m, i) => 
                                          i === originalIndex ? { ...m, outputPrice: Math.round(parseFloat(e.target.value) * 1000000) } : m
                                        ));
                                      }}
                                      className="w-full p-1 text-sm border border-border rounded bg-background text-foreground"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                      Max Tokens
                                    </label>
                                    <input
                                      type="number"
                                      value={model.maxTokens ?? ""}
                                      onChange={(e) => {
                                        setModelsToImport(prev => prev.map((m, i) => 
                                          i === originalIndex ? { ...m, maxTokens: e.target.value ? parseInt(e.target.value) : null } : m
                                        ));
                                      }}
                                      className="w-full p-1 text-sm border border-border rounded bg-background text-foreground"
                                      placeholder="Optional"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                      Status
                                    </label>
                                    <select
                                      value={model.isActive}
                                      onChange={(e) => {
                                        setModelsToImport(prev => prev.map((m, i) => 
                                          i === originalIndex ? { ...m, isActive: e.target.value } : m
                                        ));
                                      }}
                                      className="w-full p-1 text-sm border border-border rounded bg-background text-foreground"
                                    >
                                      <option value="true">Active</option>
                                      <option value="false">Inactive</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 p-6 border-t">
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={importModels}
                  disabled={!selectedAPI || modelsToImport.filter(m => m.selected).length === 0 || isImporting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? "Importing..." : `Import Selected (${modelsToImport.filter(m => m.selected).length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}
