// app/_components/models/models-page-list.tsx
import { useState } from "react";
import { Star, StarOff, Edit } from "lucide-react";
import { UserModel } from "./model-types";
import { ModelSelector } from "./model-selector";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";

interface ModelsListProps {
  models: UserModel[];
  favoriteModels: string[];
  toggleFavoriteModel: (modelId: string) => Promise<void>;
}

export function ModelsList({ models, favoriteModels, toggleFavoriteModel }: ModelsListProps) {
  const router = useRouter();
  // Convert UserModel[] to the format expected by ModelSelector
  const formattedModels = models.map(model => {
    // Safely handle createdAt - it might be a string or Date object
    let createdTimestamp: number;
    
    if (model.createdAt instanceof Date) {
      // It's already a Date object
      createdTimestamp = Math.floor(model.createdAt.getTime() / 1000);
    } else if (typeof model.createdAt === 'string') {
      // It's a string, convert to Date first
      createdTimestamp = Math.floor(new Date(model.createdAt).getTime() / 1000);
    } else if (typeof model.createdAt === 'number') {
      // It's already a timestamp
      createdTimestamp = model.createdAt;
    } else {
      // Fallback to current time if createdAt is invalid
      createdTimestamp = Math.floor(Date.now() / 1000);
    }

    return {
      id: model.id,
      object: "model",
      created: createdTimestamp,
      displayName: model.displayName,
      owned_by: model.owner,
      provider: model.provider,
      tags: model.tags ?? [],
    };
  });

  const [selectedModel, setSelectedModel] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Available Models</h2>
        <ModelSelector
          loadingModels={false}
          modelError={null}
          open={open}
          setOpen={setOpen}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          models={formattedModels}
          favoriteModels={favoriteModels}
          toggleFavoriteModel={toggleFavoriteModel}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <div
            key={model.id}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium truncate">{model.displayName}</h3>
              <div className="flex items-center space-x-2">
                {model.isFavorite && (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                )}
                <span className="text-xs text-muted-foreground">
                  {model.provider}
                </span>
              </div>
            </div>
           
            <p className="text-sm text-muted-foreground mb-3">
              {model.name}
            </p>
            {model.tags && Array.isArray(model.tags) && model.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {model.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-secondary rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Owner: {model.owner}</span>
              {model.maxTokens && (
                <span>Max: {model.maxTokens.toLocaleString()}</span>
              )}
            </div>
            {(model.inputPrice > 0 || model.outputPrice > 0) && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span>Input: ${(model.inputPrice / 1000000).toFixed(6)}</span>
                {" • "}
                <span>Output: ${(model.outputPrice / 1000000).toFixed(6)}</span>
              </div>
            )}
            <div className="flex items-center justify-between mt-3">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/settings/models/${model.id}/modify`);
                }}
              >
                <Edit className="h-3 w-3 mr-1" />
                Modify
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  void toggleFavoriteModel(model.id);
                }}
              >
                {model.isFavorite ? (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
