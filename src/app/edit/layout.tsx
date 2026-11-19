import { Eye, LogOut } from "lucide-react";
import Link from "next/link";
import { IconLink } from "@/components/icon-link";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { requireEditor } from "@/lib/auth/session";
import { signOutAction } from "./actions";

export const metadata = { title: "Edit" };

export default async function EditLayout({ children }: LayoutProps<"/edit">) {
  await requireEditor();

  return (
    <div className="mx-auto max-w-[1600px] px-4">
      <header className="flex items-center gap-2 py-4">
        <h1 className="flex-1 text-lg font-semibold">
          <Link href="/edit">Edit</Link>
        </h1>
        <IconLink href="/" label="View site" icon={Eye} />
        <form action={signOutAction}>
          <Tooltip>
            <TooltipTrigger render={<Button type="submit" variant="ghost" size="icon-sm" aria-label="Sign out" />}>
              <LogOut />
            </TooltipTrigger>
            <TooltipContent>Sign out</TooltipContent>
          </Tooltip>
        </form>
      </header>
      <main className="space-y-8 pb-16">{children}</main>
    </div>
  );
}
