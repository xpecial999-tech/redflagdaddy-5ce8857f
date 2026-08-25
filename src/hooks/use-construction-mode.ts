import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicSettings } from "@/lib/entitlement.functions";

export function useConstructionMode() {
  const getSettings = useServerFn(getPublicSettings);
  const query = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => getSettings(),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  return {
    enabled: query.data?.constructionModeEnabled ?? true,
    statusAvailable: query.data?.settingsAvailable ?? false,
    isLoading: query.isLoading,
  };
}
