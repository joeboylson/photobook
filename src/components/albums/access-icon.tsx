import { Globe, KeyRound, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AlbumAccess } from "@/lib/albums/album-types";
import { cn } from "@/lib/utils";

export const ACCESS_DETAILS = {
  public: { label: "Public", description: "Listed and open to anyone", icon: Globe },
  password: { label: "Password", description: "Listed, but opens with a password", icon: KeyRound },
  private: { label: "Private", description: "Hidden from everyone but editors", icon: Lock },
} as const satisfies Record<AlbumAccess, { label: string; description: string; icon: typeof Globe }>;

export function AccessIcon({ access, className }: { access: AlbumAccess; className?: string }) {
  const { label, icon: Icon } = ACCESS_DETAILS[access];
  return (
    <Tooltip>
      <TooltipTrigger render={<span aria-label={label} className={cn("inline-flex", className)} />}>
        <Icon className="size-4" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
