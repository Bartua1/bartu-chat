"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { ArrowLeft, Globe, Image, Brain, FileText } from "lucide-react";
import { SettingsLayout } from "~/app/_components/settings-layout";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { UserModel } from "~/app/_components/models/model-types";

// Tag configuration with icons
const AVAILABLE_TAGS = [
  { name: "web", label: "Web", icon: Globe },
  { name: "image", label: "Image", icon: Image },
  { name: "think", label: "Think", icon: Brain },
  { name: "docs", label: "Docs", icon: FileText },
] as const;

export default function ModifyModelPage() {
  const router = useRouter();
  const params = useParams();
  const modelId = params.id as string;
  
  const [model, setModel] = useState<UserModel | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch model data
  useEffect(() => {
    const fetchModel = async () => {
      try {
        const response = await fetch("/api/user-models");
        if (!response.ok) throw new Error("Failed to fetch models");
        
        const models = await response.json() as UserModel[];
        const foundModel = models.find(m => m.id.toString() === modelId);
        
        if (!foundModel) {
          toast.error("Model not found");
          router.push("/settings/models");
          return;
        }
        
        setModel(foundModel);
        // Ensure selectedTags is always an array
        const tags = foundModel.tags;
        if (Array.isArray(tags)) {
          setSelectedTags(tags);
        } else {
          setSelectedTags([]);
        }
      } catch (error) {
        console.error("Error fetching model:", error);
        toast.error("Failed to load model");
        router.push("/settings/models");
      } finally {
        setIsLoading(false);
      }
    };

    if (modelId) {
      void fetchModel();
    }
  }, [modelId, router]);

  const handleTagToggle = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName)
        ? prev.filter(tag => tag !== tagName)
        : [...prev, tagName]
    );
  };

  const handleSave = async () => {
    if (!model) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/user-models/${modelId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tags: selectedTags,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update model");
      }

      toast.success("Model updated successfully");
      router.push("/settings/models");
    } catch (error) {
      console.error("Error updating model:", error);
      toast.error("Failed to update model");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SettingsLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading model...</div>
        </div>
      </SettingsLayout>
    );
  }

  if (!model) {
    return null;
  }

  return (
    <SettingsLayout>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/settings/models")}
            className="mb-4 p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Models
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Modify Model
          </h1>
          <p className="text-muted-foreground">
            Configure tags for {model.displayName}
          </p>
        </div>

        {/* Model Info */}
        <div className="rounded-lg border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">{model.displayName}</h3>
              <p className="text-sm text-muted-foreground">{model.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{model.provider}</p>
              <p className="text-xs text-muted-foreground">by {model.owner}</p>
            </div>
          </div>
          
          {model.maxTokens && (
            <div className="text-sm text-muted-foreground">
              Max tokens: {model.maxTokens.toLocaleString()}
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-medium mb-4">Model Tags</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Select the capabilities and use cases for this model. These tags help categorize and organize your models.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {AVAILABLE_TAGS.map((tag) => {
              const IconComponent = tag.icon;
              const isSelected = selectedTags.includes(tag.name);
              
              return (
                <div
                  key={tag.name}
                  className={`
                    relative rounded-lg border p-4 cursor-pointer transition-all duration-200
                    ${isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }
                  `}
                  onClick={() => handleTagToggle(tag.name)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleTagToggle(tag.name)}
                      className="pointer-events-none"
                    />
                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{tag.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {selectedTags.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Selected tags:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tagName) => {
                  const tag = AVAILABLE_TAGS.find(t => t.name === tagName);
                  if (!tag) return null;
                  
                  const IconComponent = tag.icon;
                  return (
                    <div
                      key={tagName}
                      className="flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20"
                    >
                      <IconComponent className="h-3 w-3" />
                      <span className="text-sm">{tag.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 mt-8">
          <Button
            variant="outline"
            onClick={() => router.push("/settings/models")}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </SettingsLayout>
  );
}
