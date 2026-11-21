"use client";

import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { createAlbumAction, type FormResult } from "@/app/album-actions";
import { ACCESS_DETAILS } from "@/components/albums/access-icon";
import { AlbumMonthField } from "./album-month-field";
import { SAVE_BUTTON_CLASS } from "@/components/button-colors";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { isAlbumAccess } from "@/lib/albums/album-rules";
import type { AlbumAccess } from "@/lib/albums/album-types";
import { ALBUM_ACCESS_LEVELS } from "@/lib/constants";

const INITIAL_RESULT: FormResult = { error: null, savedAt: null };
const NEW_ALBUM_LABEL = "New Album";

export function CreateAlbumDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [access, setAccess] = useState<AlbumAccess | null>(null);
  const [result, submit, isPending] = useActionState(createAlbumAction, INITIAL_RESULT);
  const pathname = usePathname();

  // Creating an album opens its page, and the dialog shouldn't follow you there.
  useEffect(() => setIsOpen(false), [pathname]);

  const needsPassword = access === "password";
  // Root.items sets the step order; the password step only counts for password albums.
  const steps = [
    { name: "title", required: true },
    { name: "access", required: true, choices: ALBUM_ACCESS_LEVELS.map((level) => ({ value: level })) },
    { name: "password", required: true, disabled: !needsPassword },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<SidebarMenuButton className="bg-sidebar-accent text-sidebar-accent-foreground" />}>
        <Plus />
        {NEW_ALBUM_LABEL}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{NEW_ALBUM_LABEL}</DialogTitle>
        </DialogHeader>
        <Questionnaire items={steps} action={submit}>
          <QuestionnaireItem name="title" required>
            <QuestionnaireTitle>Name</QuestionnaireTitle>
            <QuestionnaireInput aria-label="Name" autoComplete="off" autoFocus />
            <QuestionnaireError>Add a name</QuestionnaireError>
            <AlbumMonthField defaultMonth={null} />
          </QuestionnaireItem>
          <QuestionnaireItem name="access" required>
            <QuestionnaireTitle>Who can see it</QuestionnaireTitle>
            <QuestionnaireChoices>
              {ALBUM_ACCESS_LEVELS.map((level) => {
                const { label, description, icon: Icon } = ACCESS_DETAILS[level];
                return (
                  <QuestionnaireChoice
                    key={level}
                    value={level}
                    onChange={(event) => {
                      if (isAlbumAccess(event.target.value)) setAccess(event.target.value);
                    }}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <Icon className="size-4" />
                      {label}
                    </span>
                    <QuestionnaireChoiceDescription>{description}</QuestionnaireChoiceDescription>
                  </QuestionnaireChoice>
                );
              })}
            </QuestionnaireChoices>
            <QuestionnaireError>Pick who can see it</QuestionnaireError>
          </QuestionnaireItem>
          <QuestionnaireItem name="password" required disabled={!needsPassword}>
            <QuestionnaireTitle>Password</QuestionnaireTitle>
            <QuestionnaireInput aria-label="Password" autoComplete="off" />
            <QuestionnaireError>Add a password</QuestionnaireError>
          </QuestionnaireItem>
          {result.error && <FieldError>{result.error}</FieldError>}
          <QuestionnaireActions>
            <QuestionnairePrevious variant="secondary" />
            <QuestionnaireNext variant="secondary" />
            <QuestionnaireSubmit disabled={isPending} className={SAVE_BUTTON_CLASS}>
              {isPending ? <Spinner /> : <Plus />}
              Create
            </QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
      </DialogContent>
    </Dialog>
  );
}
