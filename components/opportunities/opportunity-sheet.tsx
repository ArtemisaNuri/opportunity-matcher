"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ClockIcon,
  InfoIcon,
  PlusIcon,
  ShieldAlertIcon,
  SparklesIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import { useAppState, useAppStore, useOpportunity } from "@/lib/store/react";
import { isRestrictedSector } from "@/lib/scoring/engine";
import { addWeeks, formatDate, isValidISODate, todayISO } from "@/lib/dates";
import { STAGE_LABEL, type ProjectStage } from "@/lib/domain/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { TagInput } from "@/components/ui/tag-input";
import {
  COMMON_SECTORS,
  LIMITS,
  ROLE_SUGGESTIONS,
  STAGE_DESCRIPTION,
  emptyForm,
  fieldId,
  fieldOrder,
  formFromOpportunity,
  milestoneKey,
  num,
  toOpportunityInput,
  validateForm,
  type OpportunityFormState,
} from "@/components/opportunities/opportunity-form";

const STAGE_OPTIONS = (Object.keys(STAGE_LABEL) as ProjectStage[]).map((value) => ({ value, label: STAGE_LABEL[value] }));
const SECTOR_LIST_ID = "opp-sector-options";

export function OpportunitySheet({
  open,
  editId,
  onOpenChange,
}: {
  open: boolean;
  editId?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useAppStore();
  const settings = useAppState((s) => s.settings);
  const existing = useOpportunity(editId);
  const isEdit = Boolean(editId);

  const [form, setForm] = React.useState<OpportunityFormState>(() => emptyForm());
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const scoreNowRef = React.useRef(false);

  // Reset every time the sheet opens (or switches target). Reads the latest record without
  // re-running when it changes mid-edit (e.g. a background score landing).
  const existingRef = React.useRef(existing);
  existingRef.current = existing;
  React.useEffect(() => {
    if (!open) return;
    const source = editId ? existingRef.current : undefined;
    setForm(source ? formFromOpportunity(source) : emptyForm());
    setTouched({});
    setSubmitted(false);
  }, [open, editId]);

  const errors = React.useMemo(() => validateForm(form), [form]);
  const errorFor = (key: string) => (submitted || touched[key] ? errors[key] : undefined);
  const touch = (key: string) => () => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));
  const set = <K extends keyof OpportunityFormState>(key: K, value: OpportunityFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ---------------------------------------------------------------- live hints
  const restricted = form.sector.trim() !== "" && isRestrictedSector(form.sector, settings.restrictedSectors);
  const budget = num(form.clientBudget);
  const cost = num(form.costToBuild);
  const belowCost = budget !== null && cost !== null && budget < cost;
  const belowMin = budget !== null && budget < settings.minBudget;
  const hours = num(form.hoursPerWeek);
  const weeks = num(form.durationWeeks);
  const plan =
    hours && weeks && hours > 0 && weeks > 0 && isValidISODate(form.preferredStart)
      ? { total: hours * weeks, end: addWeeks(form.preferredStart, weeks) }
      : null;

  // ---------------------------------------------------------------- submit
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const scoreNow = scoreNowRef.current;
    scoreNowRef.current = false;
    setSubmitted(true);
    const firstInvalid = fieldOrder(form).find((k) => errors[k]);
    if (firstInvalid) {
      const el = document.getElementById(fieldId(firstInvalid));
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus({ preventScroll: true });
      return;
    }
    const input = toOpportunityInput(form);
    if (editId) {
      const wasScored = Boolean(existing?.scoring.result);
      store.updateOpportunity(editId, input, { scoreNow });
      toast.success(scoreNow ? "Changes saved · queued for re-scoring" : "Changes saved", {
        description: !scoreNow && wasScored ? `${input.title}: score marked as out of date` : input.title,
      });
    } else {
      store.addOpportunity(input, { scoreNow });
      toast.success(scoreNow ? "Opportunity added · queued for scoring" : "Opportunity added", {
        description: input.title,
      });
    }
    onOpenChange(false);
  };

  const updateMilestone = (i: number, patch: Partial<{ label: string; date: string }>) =>
    setForm((f) => ({ ...f, milestones: f.milestones.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));

  const today = todayISO();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader className="pr-12">
            <SheetTitle>{isEdit ? "Edit opportunity" : "New opportunity"}</SheetTitle>
            <SheetDescription>
              {isEdit
                ? "Update the details. Saved changes mark the current score as out of date."
                : "Describe the work and what it needs. Smart Scoring checks it against your team's capacity."}
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="flex flex-col gap-8">
            {/* ------------------------------------------------------------ Basics */}
            <FormSection title="Basics" description="Who it's for and what kind of work it is.">
              <Field k="title" label="Title" required error={errorFor("title")}>
                <Input
                  id={fieldId("title")}
                  value={form.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("title", e.target.value)}
                  onBlur={touch("title")}
                  placeholder="e.g. Customer Energy Portal"
                  aria-invalid={Boolean(errorFor("title"))}
                  aria-describedby={errorFor("title") ? `${fieldId("title")}-error` : undefined}
                  autoComplete="off"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field k="client" label="Client" required error={errorFor("client")}>
                  <Input
                    id={fieldId("client")}
                    value={form.client}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("client", e.target.value)}
                    onBlur={touch("client")}
                    placeholder="e.g. Brightline Utilities"
                    aria-invalid={Boolean(errorFor("client"))}
                    aria-describedby={errorFor("client") ? `${fieldId("client")}-error` : undefined}
                    autoComplete="off"
                  />
                </Field>
                <Field k="sector" label="Sector" required error={errorFor("sector")}>
                  <Input
                    id={fieldId("sector")}
                    list={SECTOR_LIST_ID}
                    value={form.sector}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("sector", e.target.value)}
                    onBlur={touch("sector")}
                    placeholder="e.g. Energy"
                    aria-invalid={Boolean(errorFor("sector"))}
                    aria-describedby={
                      [errorFor("sector") ? `${fieldId("sector")}-error` : "", restricted ? "opp-restricted-note" : ""]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                    autoComplete="off"
                  />
                  <datalist id={SECTOR_LIST_ID}>
                    {COMMON_SECTORS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </Field>
              </div>
              {restricted ? (
                <div
                  id="opp-restricted-note"
                  role="status"
                  className="flex animate-fade-in items-start gap-2.5 rounded-lg bg-cat-bad-soft px-3 py-2.5 text-sm text-cat-bad ring-1 ring-cat-bad/25 ring-inset"
                >
                  <ShieldAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <p>
                    <span className="font-medium">{form.sector.trim()} is a restricted sector.</span> This opportunity
                    will be a Bad Match regardless of score.
                  </p>
                </div>
              ) : null}
              <Field k="profile" label="Project profile" hint="What the client wants built, in a few sentences.">
                <Textarea
                  id={fieldId("profile")}
                  value={form.profile}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set("profile", e.target.value)}
                  rows={3}
                  placeholder="A customer self-service portal with usage dashboards, billing and outage alerts…"
                />
              </Field>
              <Field
                k="profileTags"
                label="Profile tags"
                hint="Tags that match your focus areas raise the profile fit score."
              >
                <TagInput
                  id={fieldId("profileTags")}
                  value={form.profileTags}
                  onChange={(v) => set("profileTags", v)}
                  suggestions={settings.preferredTags}
                  placeholder="Add a tag and press Enter"
                />
              </Field>
            </FormSection>

            {/* ------------------------------------------------------------ Project */}
            <FormSection title="Project" description="The shape of the engagement and the money involved.">
              <div className="flex flex-col gap-2">
                <Label id="opp-stage-label">Stage</Label>
                <Segmented
                  aria-label="Stage"
                  size="md"
                  value={form.stage}
                  onValueChange={(v) => set("stage", v)}
                  options={STAGE_OPTIONS}
                  className="w-full [&>*]:flex-1 [&>*]:justify-center"
                />
                <p className="text-xs text-muted-foreground">{STAGE_DESCRIPTION[form.stage]}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field k="clientBudget" label="Client budget" required error={errorFor("clientBudget")}>
                  <AdornedInput
                    prefix="$"
                    id={fieldId("clientBudget")}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={500}
                    value={form.clientBudget}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("clientBudget", e.target.value)}
                    onBlur={touch("clientBudget")}
                    placeholder="e.g. 60000"
                    aria-invalid={Boolean(errorFor("clientBudget"))}
                    aria-describedby={errorFor("clientBudget") ? `${fieldId("clientBudget")}-error` : undefined}
                  />
                </Field>
                <Field
                  k="costToBuild"
                  label="Cost to build"
                  required
                  error={errorFor("costToBuild")}
                  hint="Internyl's estimate, separate from the client's budget."
                >
                  <AdornedInput
                    prefix="$"
                    id={fieldId("costToBuild")}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={500}
                    value={form.costToBuild}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("costToBuild", e.target.value)}
                    onBlur={touch("costToBuild")}
                    placeholder="e.g. 45000"
                    aria-invalid={Boolean(errorFor("costToBuild"))}
                    aria-describedby={errorFor("costToBuild") ? `${fieldId("costToBuild")}-error` : undefined}
                  />
                </Field>
              </div>
              {belowCost || belowMin ? (
                <div className="flex flex-col gap-1.5 rounded-lg bg-warning/10 px-3 py-2.5 text-xs ring-1 ring-warning/25 ring-inset" role="status">
                  {belowCost ? (
                    <p className="flex items-center gap-2">
                      <TriangleAlertIcon className="size-3.5 shrink-0 text-warning" aria-hidden />
                      <span>
                        Budget is below cost to build <span className="font-medium tabular">(−5)</span>
                      </span>
                    </p>
                  ) : null}
                  {belowMin ? (
                    <p className="flex items-center gap-2">
                      <TriangleAlertIcon className="size-3.5 shrink-0 text-warning" aria-hidden />
                      <span>
                        Below the minimum budget of <span className="font-medium tabular">{formatMoney(settings.minBudget)}</span>
                      </span>
                    </p>
                  ) : null}
                </div>
              ) : null}
              <Field k="deadline" label="Deadline" optional error={errorFor("deadline")} className="sm:max-w-[calc(50%-0.5rem)]">
                <Input
                  id={fieldId("deadline")}
                  type="date"
                  value={form.deadline}
                  min={form.preferredStart || today}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("deadline", e.target.value)}
                  onBlur={touch("deadline")}
                  aria-invalid={Boolean(errorFor("deadline"))}
                  aria-describedby={errorFor("deadline") ? `${fieldId("deadline")}-error` : undefined}
                />
              </Field>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="gap-1.5">
                    Milestones <span className="text-xs font-normal text-muted-foreground">Optional</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setForm((f) => ({ ...f, milestones: [...f.milestones, { key: milestoneKey(), label: "", date: "" }] }))
                    }
                  >
                    <PlusIcon aria-hidden /> Add milestone
                  </Button>
                </div>
                {form.milestones.length === 0 ? (
                  <p className="rounded-lg border border-dashed px-3 py-2.5 text-xs text-muted-foreground">
                    No milestones yet. Add key dates like a beta or launch.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {form.milestones.map((m, i) => {
                      const labelKey = `milestone-${i}-label`;
                      const dateKey = `milestone-${i}-date`;
                      const labelErr = errorFor(labelKey);
                      const dateErr = errorFor(dateKey);
                      return (
                        <li key={m.key} className="flex animate-fade-in flex-col gap-1">
                          <div className="flex items-start gap-2">
                            <Input
                              id={fieldId(labelKey)}
                              aria-label={`Milestone ${i + 1} label`}
                              value={m.label}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMilestone(i, { label: e.target.value })}
                              onBlur={touch(labelKey)}
                              placeholder="e.g. Beta launch"
                              aria-invalid={Boolean(labelErr)}
                              className="flex-1"
                            />
                            <Input
                              id={fieldId(dateKey)}
                              aria-label={`Milestone ${i + 1} date`}
                              type="date"
                              value={m.date}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMilestone(i, { date: e.target.value })}
                              onBlur={touch(dateKey)}
                              aria-invalid={Boolean(dateErr)}
                              className="w-36 shrink-0 sm:w-40"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Remove milestone ${i + 1}`}
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setForm((f) => ({ ...f, milestones: f.milestones.filter((_, j) => j !== i) }))
                              }
                            >
                              <Trash2Icon aria-hidden />
                            </Button>
                          </div>
                          {labelErr || dateErr ? (
                            <p className="text-xs text-destructive" role="alert">
                              {[labelErr, dateErr].filter(Boolean).join(" · ")}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </FormSection>

            {/* ------------------------------------------------------------ Capacity */}
            <FormSection title="Capacity needs" description="What delivering this would ask of the team.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field k="hoursPerWeek" label="Hours per week" required error={errorFor("hoursPerWeek")}>
                  <AdornedInput
                    suffix="h/wk"
                    id={fieldId("hoursPerWeek")}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={LIMITS.hoursPerWeek}
                    value={form.hoursPerWeek}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("hoursPerWeek", e.target.value)}
                    onBlur={touch("hoursPerWeek")}
                    aria-invalid={Boolean(errorFor("hoursPerWeek"))}
                    aria-describedby={errorFor("hoursPerWeek") ? `${fieldId("hoursPerWeek")}-error` : undefined}
                  />
                </Field>
                <Field k="durationWeeks" label="Duration" required error={errorFor("durationWeeks")}>
                  <AdornedInput
                    suffix="weeks"
                    id={fieldId("durationWeeks")}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={LIMITS.durationWeeks}
                    value={form.durationWeeks}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("durationWeeks", e.target.value)}
                    onBlur={touch("durationWeeks")}
                    aria-invalid={Boolean(errorFor("durationWeeks"))}
                    aria-describedby={errorFor("durationWeeks") ? `${fieldId("durationWeeks")}-error` : undefined}
                  />
                </Field>
                <Field k="preferredStart" label="Preferred start" required error={errorFor("preferredStart")}>
                  <Input
                    id={fieldId("preferredStart")}
                    type="date"
                    value={form.preferredStart}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("preferredStart", e.target.value)}
                    onBlur={touch("preferredStart")}
                    aria-invalid={Boolean(errorFor("preferredStart"))}
                    aria-describedby={errorFor("preferredStart") ? `${fieldId("preferredStart")}-error` : undefined}
                  />
                </Field>
                <Field k="teamSize" label="Team size" required error={errorFor("teamSize")}>
                  <AdornedInput
                    suffix="people"
                    id={fieldId("teamSize")}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={LIMITS.teamSize}
                    step={1}
                    value={form.teamSize}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("teamSize", e.target.value)}
                    onBlur={touch("teamSize")}
                    aria-invalid={Boolean(errorFor("teamSize"))}
                    aria-describedby={errorFor("teamSize") ? `${fieldId("teamSize")}-error` : undefined}
                  />
                </Field>
              </div>
              <Field
                k="startFlexibilityWeeks"
                label="Start flexibility"
                optional
                error={errorFor("startFlexibilityWeeks")}
                hint="How far the start can move if capacity is tight."
                className="sm:max-w-[calc(50%-0.5rem)]"
              >
                <AdornedInput
                  prefix="±"
                  suffix="weeks"
                  id={fieldId("startFlexibilityWeeks")}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={LIMITS.startFlexibilityWeeks}
                  value={form.startFlexibilityWeeks}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("startFlexibilityWeeks", e.target.value)}
                  onBlur={touch("startFlexibilityWeeks")}
                  aria-invalid={Boolean(errorFor("startFlexibilityWeeks"))}
                  aria-describedby={
                    errorFor("startFlexibilityWeeks") ? `${fieldId("startFlexibilityWeeks")}-error` : undefined
                  }
                />
              </Field>
              <Field k="roles" label="Roles & skills" optional>
                <TagInput
                  id={fieldId("roles")}
                  value={form.roles}
                  onChange={(v) => set("roles", v)}
                  suggestions={ROLE_SUGGESTIONS}
                  placeholder="Add a role and press Enter"
                />
              </Field>
              <div
                aria-live="polite"
                className="flex items-center gap-2.5 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground"
              >
                <ClockIcon className="size-4 shrink-0 text-primary" aria-hidden />
                {plan ? (
                  <span>
                    ≈ <span className="font-medium text-foreground tabular">{Math.round(plan.total).toLocaleString("en-US")}</span>{" "}
                    total hours <span aria-hidden>·</span> ends{" "}
                    <span className="font-medium text-foreground">
                      {formatDate(plan.end, plan.end.slice(0, 4) !== today.slice(0, 4))}
                    </span>
                  </span>
                ) : (
                  <span>Add hours, duration and a start date to see the delivery window.</span>
                )}
              </div>
            </FormSection>

            {submitted && Object.keys(errors).length > 0 ? (
              <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
                <InfoIcon className="size-4 shrink-0" aria-hidden />
                Fix the highlighted fields to save.
              </p>
            ) : null}
          </SheetBody>

          <SheetFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="sm:mr-auto">
              Cancel
            </Button>
            <Button type="submit" variant="outline" onClick={() => (scoreNowRef.current = false)}>
              Save
            </Button>
            <Button type="submit" onClick={() => (scoreNowRef.current = true)}>
              <SparklesIcon aria-hidden /> Save &amp; Score Now
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ------------------------------------------------------------------ pieces

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-xs font-semibold tracking-wide text-primary uppercase">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  k,
  label,
  required,
  optional,
  hint,
  error,
  className,
  children,
}: {
  k: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const id = fieldId(k);
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label htmlFor={id} className="gap-1">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        ) : null}
        {optional ? <span className="ml-1 text-xs font-normal text-muted-foreground">Optional</span> : null}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="animate-fade-in text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function AdornedInput({
  prefix,
  suffix,
  className,
  ...props
}: React.ComponentProps<"input"> & { prefix?: string; suffix?: string }) {
  return (
    <div className="relative">
      {prefix ? (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground" aria-hidden>
          {prefix}
        </span>
      ) : null}
      <Input
        {...props}
        className={cn(
          "tabular [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          prefix && "pl-7",
          suffix && "pr-16",
          className,
        )}
      />
      {suffix ? (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground" aria-hidden>
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
