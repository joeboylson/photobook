import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** An icon-only link with a tooltip and an accessible name, per the UI rules. */
export function IconLink({
  href,
  label,
  icon: Icon,
  prefetch,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  prefetch?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            nativeButton={false}
            render={<Link href={href} prefetch={prefetch} />}
          />
        }
      >
        <Icon />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
