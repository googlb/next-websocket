import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";

export function useToastHelper() {
  const { toast } = useToast();

  // 使用 useCallback 确保函数稳定
  const showToast = useCallback(
    (title: string, description: string) => {
      toast({
        title,
        description,
      });
    },
    [toast] // 依赖 toast 确保稳定性
  );

  return { showToast };
}