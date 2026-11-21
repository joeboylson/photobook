"use client";

import { ArrowDownAZ, BookImage, CalendarDays } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AccessIcon } from "@/components/albums/access-icon";
import { CreateAlbumDialog } from "@/components/edit/create-album-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { describeShortMonth } from "@/lib/albums/album-month";
import { type AlbumYearGroup, groupAlbumsByYear, isAlbumSort, sortAlbumsByTitle } from "@/lib/albums/album-order";
import type { AlbumSort, AlbumSummary } from "@/lib/albums/album-types";
import { writePreferenceCookie } from "@/lib/auth/preference-cookie";
import { ALBUM_SORT_COOKIE_NAME, SITE_NAME } from "@/lib/constants";
import { SidebarProfile } from "./sidebar-profile";

const SORT_OPTIONS = [
  { value: "date", label: "By date", icon: CalendarDays },
  { value: "title", label: "A to Z", icon: ArrowDownAZ },
] as const satisfies ReadonlyArray<{ value: AlbumSort; label: string; icon: typeof CalendarDays }>;

const UNDATED_GROUP_LABEL = "No date";

function AlbumSortToggle({ sort, onChange }: { sort: AlbumSort; onChange: (sort: AlbumSort) => void }) {
  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      spacing={0}
      value={[sort]}
      onValueChange={(values) => {
        const [picked] = values;
        if (isAlbumSort(picked)) onChange(picked);
      }}
    >
      {SORT_OPTIONS.map((option) => (
        <Tooltip key={option.value}>
          <TooltipTrigger render={<ToggleGroupItem value={option.value} aria-label={option.label} />}>
            <option.icon />
          </TooltipTrigger>
          <TooltipContent>{option.label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}

function AlbumMenu({
  albums,
  showsMonth,
  onPick,
}: {
  albums: AlbumSummary[];
  showsMonth: boolean;
  onPick: () => void;
}) {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {albums.map((album) => {
        const albumHref = `/albums/${album.slug}`;
        return (
          <SidebarMenuItem key={album.slug}>
            <SidebarMenuButton isActive={pathname === albumHref} render={<Link href={albumHref} onClick={onPick} />}>
              {showsMonth && album.month && (
                <Badge variant="secondary" className="w-9 justify-center px-0 font-normal">
                  {describeShortMonth(album.month)}
                </Badge>
              )}
              <span className="flex-1 truncate">{album.title}</span>
              {album.access !== "public" && <AccessIcon access={album.access} className="text-muted-foreground" />}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function SiteSidebar({
  albums,
  savedSort,
  editorEmail,
  isSignInSkipped,
}: {
  albums: AlbumSummary[];
  savedSort: AlbumSort;
  editorEmail: string | null;
  isSignInSkipped: boolean;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [sort, setSort] = useState<AlbumSort>(savedSort);
  // On phones the sidebar slides over the page, so picking a link should close it.
  const closeOnPhone = () => setOpenMobile(false);

  const changeSort = (nextSort: AlbumSort) => {
    setSort(nextSort);
    writePreferenceCookie(ALBUM_SORT_COOKIE_NAME, nextSort);
  };

  const groups: AlbumYearGroup[] =
    sort === "title" ? [{ year: null, albums: sortAlbumsByTitle(albums) }] : groupAlbumsByYear(albums);

  return (
    // White like the page, without changing the theme's sidebar color.
    <Sidebar className="[--sidebar:var(--background)]">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              isActive={pathname === "/"}
              className="flex-1 font-semibold"
              render={<Link href="/" onClick={closeOnPhone} />}
            >
              <BookImage />
              {SITE_NAME}
            </SidebarMenuButton>
            <AlbumSortToggle sort={sort} onChange={changeSort} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.year ?? "undated"}>
            {sort === "date" && <SidebarGroupLabel>{group.year ?? UNDATED_GROUP_LABEL}</SidebarGroupLabel>}
            <AlbumMenu albums={group.albums} showsMonth={sort === "date"} onPick={closeOnPhone} />
          </SidebarGroup>
        ))}
        {editorEmail && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <CreateAlbumDialog />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarProfile editorEmail={editorEmail} isSignInSkipped={isSignInSkipped} />
      </SidebarFooter>
    </Sidebar>
  );
}
