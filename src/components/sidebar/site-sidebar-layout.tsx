import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { listVisibleSummaries } from "@/lib/albums/album-rules";
import { listAlbumSummaries } from "@/lib/albums/album-store";
import { getSignedInEditorEmail, getViewer } from "@/lib/auth/session";
import { readSavedAlbumSort } from "@/lib/auth/view-preferences";
import { isEditorSignInSkipped } from "@/lib/env";
import { SiteSidebar } from "./site-sidebar";

export async function SiteSidebarLayout({ children }: { children: ReactNode }) {
  const [viewer, editorEmail, summaries, savedSort] = await Promise.all([
    getViewer(),
    getSignedInEditorEmail(),
    listAlbumSummaries(),
    readSavedAlbumSort(),
  ]);
  const albums = listVisibleSummaries(summaries, viewer);

  return (
    <SidebarProvider>
      <SiteSidebar
        albums={albums}
        savedSort={savedSort}
        editorEmail={editorEmail}
        isSignInSkipped={isEditorSignInSkipped()}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
