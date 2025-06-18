"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { SettingsLayout } from "~/app/_components/settings-layout";
import { ModelsList } from "~/app/_components/models/models-page-list";
import { ImportModelsDialog } from "~/app/_components/models/import-models-dialog";
import { EmptyState } from "~/app/_components/models/modes-empty";
import { UserModel, UserAPI, AvailableModel, ModelToImport } from "~/app/_components/models/model-types";

export default function ModelsPage() {
  const [userModels, setUserModels] = useState<UserModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const favoriteModels = userModels
    .filter(model => model.isFavorite)
    .map(model => model.id) ?? []; // Ensure we always have an array
  // Fetch user models with proper error handling
  const fetchUserModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await fetch("/api/user-models");
      if (!response.ok) throw new Error("Failed to fetch models");
      const models = await response.json();

      // Ensure we always have an array
      if (Array.isArray(models)) {
        setUserModels(models);
      } else {
        console.error("Models response is not an array:", models);
        setUserModels([]);
        toast.error("Invalid models data received");
      }
    } catch (err) {
      console.error("Error fetching models:", err);
      setUserModels([]); // Ensure we always have an array
      toast.error("Failed to load models");
    } finally {
      setIsLoadingModels(false);
    }
  };

  const toggleFavoriteModel = async (modelId: string) => {
    try {
      const response = await fetch("/api/user-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ modelId: modelId }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle favorite");
      }

      // Refresh the models list to get updated favorite status
      await fetchUserModels();
      toast.success("Favorite updated successfully");
    } catch (err) {
      console.error("Error toggling favorite:", err);
      toast.error("Failed to update favorite");
    }
  };

  // Load models on component mount
  useEffect(() => {
    void fetchUserModels();
  }, []);

  const handleImportSuccess = () => {
    setShowImportDialog(false);
    void fetchUserModels();
  };

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
          <EmptyState onImportClick={() => setShowImportDialog(true)} />
        ) : (
          <ModelsList models={userModels} favoriteModels={favoriteModels} toggleFavoriteModel={toggleFavoriteModel} />
        )}

        {showImportDialog && (
          <ImportModelsDialog
            onClose={() => setShowImportDialog(false)}
            onImportSuccess={handleImportSuccess}
          />
        )}
      </div>
    </SettingsLayout>
  );
}
