import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { Check, ChevronsUpDown, Star, StarOff, Eye, Globe, Code, Image, Mic, FileText, Layers, MoreHorizontal, MessageSquare, Brain } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import { modelProviders } from '../model-providers';

interface Model {
  id: string;
  object: string;
  created: number;
  displayName?: string;
  owned_by: string;
  provider: string;
  tags?: string[];
}

interface ModelTags {
  name: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ModelSelectorProps {
  loadingModels: boolean;
  modelError: string | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedModel: string;
  setSelectedModel: (selectedModel: string) => void;
  models: Model[];
  toggleFavoriteModel: (modelId: string) => Promise<void>;
  favoriteModels?: string[];
}

export const modelTags: ModelTags[] = [
  { name: 'web', label: 'Web', icon: Globe },
  { name: 'image', label: 'Image', icon: Image },
  { name: 'think', label: 'Think', icon: Brain },
  { name: 'docs', label: 'Docs', icon: FileText },
  { name: 'chat', label: 'Chat', icon: MessageSquare },
  { name: 'code', label: 'Code', icon: Code },
  { name: 'vision', label: 'Vision', icon: Eye },
  { name: 'audio', label: 'Audio', icon: Mic },
  { name: 'text', label: 'Text', icon: FileText },
  { name: 'embeddings', label: 'Embeddings', icon: Layers },
  { name: 'other', label: 'Other', icon: MoreHorizontal },
];

// Icon mapping for direct access (matching modify page)
const tagIconMap = {
  web: Globe,
  image: Image,
  think: Brain,
  docs: FileText,
  chat: MessageSquare,
  code: Code,
  vision: Eye,
  audio: Mic,
  text: FileText,
  embeddings: Layers,
  other: MoreHorizontal,
};

// Tooltip descriptions for each tag
const tagTooltips = {
  web: "The model will search the web",
  image: "The model supports image files", 
  think: "The model thinks",
  docs: "The model supports doc files",
  chat: "The model is optimized for chat",
  code: "The model is optimized for code",
  vision: "The model can process visual content",
  audio: "The model can process audio",
  text: "The model processes text",
  embeddings: "The model generates embeddings",
  other: "Other capabilities",
};

export function ModelSelector({
  loadingModels,
  modelError,
  open,
  setOpen,
  selectedModel,
  setSelectedModel,
  models,
  favoriteModels = [],
  toggleFavoriteModel,
}: ModelSelectorProps) {
  if (loadingModels) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (modelError) {
    return <div className="text-destructive text-xs">{modelError}</div>;
  }

  const favoriteModelsList = models.filter((model) => favoriteModels.includes(model.id)) ?? [];
  const nonFavoriteModelsList = models.filter((model) => !favoriteModels.includes(model.id));

  // Group models by tags (ensure safe array access)
  const groupedModels = nonFavoriteModelsList.reduce((acc, model) => {
    const tags = Array.isArray(model.tags) ? model.tags : [];
    const primaryTag = tags[0] ?? 'other';
    if (!acc[primaryTag]) {
      acc[primaryTag] = [];
    }
    acc[primaryTag].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  const ModelCard = ({ model }: { model: Model }) => {
    const isFavorite = favoriteModels.includes(model.id);
    const isSelected = selectedModel === model.id;
    const primaryTag = model.tags?.[0] ?? 'other';
    const tagInfo = modelTags.find(tag => tag.name === primaryTag);
    const IconComponent = tagIconMap[primaryTag as keyof typeof tagIconMap] ?? MoreHorizontal;

    return (
      <div
        className={`
          relative p-4 rounded-lg border cursor-pointer transition-all duration-200 group
          ${isSelected 
            ? 'border-primary bg-primary/5 shadow-md' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }
        `}
        onClick={() => {
          setSelectedModel(model.id);
          setOpen(false);
        }}
      >
        {/* Provider Icon */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <img
              src={modelProviders.find((provider) => provider.name === model.provider)?.icon ?? '/default-model-icon.png'}
              alt={model.provider}
              className="h-6 w-6 rounded-full object-cover"
            />
            <span className="text-sm font-medium truncate">{model.displayName ?? model.id}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              void toggleFavoriteModel(model.id);
            }}
          >
            {isFavorite ? (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Model Tags */}
        <TooltipProvider>
          <div className="flex flex-wrap gap-1">
            {(Array.isArray(model.tags) ? model.tags : []).map((tag) => {
              const TagIcon = tagIconMap[tag as keyof typeof tagIconMap] ?? MoreHorizontal;
              const tooltip = tagTooltips[tag as keyof typeof tagTooltips] ?? `${tag} capability`;
              return (
                <Tooltip key={tag}>
                  <TooltipTrigger asChild>
                    <div className="p-1.5 rounded-full bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-help">
                      <TagIcon className="h-3 w-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <Check className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>
    );
  };

  const FavoriteCard = ({ model }: { model: Model }) => {
    const isSelected = selectedModel === model.id;
    const primaryTag = model.tags?.[0] ?? 'other';
    const tagInfo = modelTags.find(tag => tag.name === primaryTag);
    const IconComponent = tagIconMap[primaryTag as keyof typeof tagIconMap] ?? MoreHorizontal;
    
    return (
      <div
        className={`
          relative p-4 rounded-lg border cursor-pointer transition-all duration-200 group
          ${isSelected 
            ? 'border-primary bg-primary/5 shadow-md' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }
        `}
        onClick={() => {
          setSelectedModel(model.id);
          setOpen(false);
        }}
      >
        {/* Provider Icon */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <img
              src={modelProviders.find((provider) => provider.name === model.provider)?.icon ?? '/default-model-icon.png'}
              alt={model.provider}
              className="h-6 w-6 rounded-full object-cover"
            />
            <span className="text-sm font-medium truncate">{model.displayName}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                void toggleFavoriteModel(model.id);
              }}
            >
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            </Button>
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </div>
        </div>

        {/* Model Tags */}
        <TooltipProvider>
          <div className="flex flex-wrap gap-1">
            {(Array.isArray(model.tags) ? model.tags : []).map((tag) => {
              const TagIcon = tagIconMap[tag as keyof typeof tagIconMap] ?? MoreHorizontal;
              const tooltip = tagTooltips[tag as keyof typeof tagTooltips] ?? `${tag} capability`;
              return (
                <Tooltip key={tag}>
                  <TooltipTrigger asChild>
                    <div className="p-1.5 rounded-full bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-help">
                      <TagIcon className="h-3 w-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <Check className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
        >
          <span className="truncate max-w-[200px]">
            {models.find(model => model.id === selectedModel)?.displayName ?? selectedModel ?? "Select model..."}
          </span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList className="max-h-[500px]">
            <CommandEmpty>No model found.</CommandEmpty>
            
            {favoriteModelsList.length > 0 && (
              <CommandGroup heading="Favorites">
                <div className="grid grid-cols-2 gap-3 p-2">
                  {favoriteModelsList.map((model) => (
                    <FavoriteCard key={model.id} model={model} />
                  ))}
                </div>
              </CommandGroup>
            )}

            {Object.entries(groupedModels).map(([tagName, tagModels]) => {
              const tagInfo = modelTags.find(tag => tag.name === tagName);
              return (
                <CommandGroup key={tagName} heading={tagInfo?.label ?? tagName}>
                  <div className="grid grid-cols-2 gap-3 p-2">
                    {tagModels.map((model) => (
                      <ModelCard key={model.id} model={model} />
                    ))}
                  </div>
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
