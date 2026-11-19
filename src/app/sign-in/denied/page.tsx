import { House } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export default function SignInDeniedPage() {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>This account can't edit</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            <House /> Home
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
