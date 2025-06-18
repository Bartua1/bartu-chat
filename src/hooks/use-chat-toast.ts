import { useToast } from "~/hooks/use-toast";

export const useChatToast = () => {
  const { toast } = useToast();

  const showToast = (title: string, description: string, variant: "default" | "destructive" = "default") => {
    toast({
      title,
      description,
      variant,
    });
  };

  return { showToast };
};
