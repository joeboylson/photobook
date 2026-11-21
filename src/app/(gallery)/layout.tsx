import { SiteSidebarLayout } from "@/components/sidebar/site-sidebar-layout";

export default function GalleryLayout({ children }: LayoutProps<"/">) {
  return <SiteSidebarLayout>{children}</SiteSidebarLayout>;
}
