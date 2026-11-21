"use client";

import { ChevronsUpDown, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { signInLocallyAction, signOutAction } from "@/app/sign-in/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";

function SignInButton({ isSignInSkipped }: { isSignInSkipped: boolean }) {
  const [isSigningIn, startSignIn] = useTransition();

  if (!isSignInSkipped) {
    return (
      <SidebarMenuButton render={<Link href="/sign-in" prefetch={false} />}>
        <LogIn />
        Sign in
      </SidebarMenuButton>
    );
  }

  return (
    <Dialog>
      <DialogTrigger render={<SidebarMenuButton />}>
        <LogIn />
        Sign in
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Google sign-in is off</DialogTitle>
          <DialogDescription>Continue signs you in as the first editor.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => startSignIn(() => signInLocallyAction())} disabled={isSigningIn}>
            {isSigningIn && <Spinner />}
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SidebarProfile({
  editorEmail,
  isSignInSkipped,
}: {
  editorEmail: string | null;
  isSignInSkipped: boolean;
}) {
  if (!editorEmail) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SignInButton isSignInSkipped={isSignInSkipped} />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const initial = editorEmail.charAt(0).toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg">{initial}</AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-sm">{editorEmail}</span>
            <ChevronsUpDown className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="min-w-56">
            <DropdownMenuItem onClick={() => signOutAction()}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
