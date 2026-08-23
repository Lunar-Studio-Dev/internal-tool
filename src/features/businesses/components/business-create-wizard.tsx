"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  BusinessCombobox,
  CreatableCombobox,
  MultiCreatableCombobox,
} from "@/components/common/combobox";
import type { ComboboxOption } from "@/components/common/combobox/types";
import { FieldError, FieldLabel } from "@/components/common/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { businessQueries, useCreateBusiness } from "@/features/businesses/api";
import { BusinessWizardStepIndicator } from "@/features/businesses/components/business-wizard-step-indicator";
import { DuplicateDialog } from "@/features/businesses/components/duplicate-dialog";
import { SOURCE_CATEGORY_NAMES } from "@/features/businesses/constants";
import {
  createBusinessSchema,
  wizardStep1Schema,
  wizardStep2Schema,
  wizardStep3Schema,
} from "@/features/businesses/schemas/business.schema";
import type { DuplicateCandidate } from "@/features/businesses/types";
import {
  taxonomyQueries,
  useCreateIndustry,
  useCreateLocation,
  useCreateMarket,
  useCreateSector,
  useCreateSourceSubCategory,
  useCreateTag,
} from "@/features/taxonomy/api";
import { useCurrentMember } from "@/features/team/hooks/use-current-member";
import { ApiError } from "@/lib/api/client";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";
import { cn } from "@/lib/utils";

type WizardStep = 1 | 2 | 3;

const EMPTY_SOCIAL = { linkedin: "", instagram: "", facebook: "", x: "" };

export function BusinessCreateWizard({ onCancel }: { onCancel?: () => void }) {
  const router = useRouter();
  const member = useCurrentMember();
  const createBusiness = useCreateBusiness();
  const createSector = useCreateSector();
  const createIndustry = useCreateIndustry();
  const createMarket = useCreateMarket();
  const createLocation = useCreateLocation();
  const createTag = useCreateTag();
  const createSubCategory = useCreateSourceSubCategory();

  const [step, setStep] = useState<WizardStep>(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[] | null>(null);

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [social, setSocial] = useState(EMPTY_SOCIAL);

  const [sectorId, setSectorId] = useState("");
  const [industryId, setIndustryId] = useState("");
  const [marketId, setMarketId] = useState("");
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });

  const [sourceCategoryId, setSourceCategoryId] = useState("");
  const [sourceSubCategoryId, setSourceSubCategoryId] = useState("");
  const [sourceReferredByBusinessId, setSourceReferredByBusinessId] = useState("");
  const [sourceReferenceLabel, setSourceReferenceLabel] = useState("");
  const [sourceReferenceNote, setSourceReferenceNote] = useState("");

  const categoriesQuery = useQuery(taxonomyQueries.sourceCategories());
  const subCategoriesQuery = useQuery({
    ...taxonomyQueries.sourceSubCategories(sourceCategoryId || undefined),
    enabled: Boolean(sourceCategoryId),
  });
  const sectorsQuery = useQuery(taxonomyQueries.sectors());
  const industriesQuery = useQuery({
    ...taxonomyQueries.industries(sectorId || undefined),
    enabled: true,
  });
  const marketsQuery = useQuery(taxonomyQueries.markets());
  const locationsQuery = useQuery(taxonomyQueries.locations());
  const tagsQuery = useQuery(taxonomyQueries.tags());
  const businessesQuery = useQuery(businessQueries.list());

  const selectedCategory = categoriesQuery.data?.find((c) => c.id === sourceCategoryId);
  const sourceCategoryName = selectedCategory?.name ?? "";

  const subCategoryOptions = useMemo((): ComboboxOption[] => {
    return (subCategoriesQuery.data ?? []).map((item) => ({
      value: item.id,
      label: item.parentId ? `↳ ${item.name}` : item.name,
      keywords: item.name,
    }));
  }, [subCategoriesQuery.data]);

  const toOptions = (items: { id: string; name: string }[] | undefined): ComboboxOption[] =>
    (items ?? []).map((item) => ({ value: item.id, label: item.name }));

  const businessOptions = useMemo(
    () =>
      (businessesQuery.data ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        website: b.website,
      })),
    [businessesQuery.data],
  );

  function validateStep(current: WizardStep) {
    setErrors({});
    if (current === 1) {
      const parsed = parseForm(wizardStep1Schema, {
        name,
        website,
        email,
        phone,
        address,
        social,
        notes,
      });
      if (!parsed.ok) {
        setErrors(parsed.errors);
        return false;
      }
    }
    if (current === 2) {
      const parsed = parseForm(wizardStep2Schema, {
        sectorId,
        industryId,
        marketId,
        locationIds,
        tagIds,
        contact,
      });
      if (!parsed.ok) {
        setErrors(parsed.errors);
        return false;
      }
    }
    if (current === 3) {
      const parsed = parseForm(wizardStep3Schema, {
        sourceCategoryId,
        sourceCategoryName,
        sourceSubCategoryId,
        sourceReferredByBusinessId,
        sourceReferenceLabel,
        sourceReferenceNote,
      });
      if (!parsed.ok) {
        setErrors(parsed.errors);
        return false;
      }
    }
    return true;
  }

  async function submit(force: boolean) {
    setError(null);
    const payload = {
      name,
      website,
      email,
      phone,
      address,
      social,
      notes,
      sectorId,
      industryId,
      marketId,
      locationIds,
      tagIds,
      contact,
      sourceCategoryId,
      sourceCategoryName,
      sourceSubCategoryId,
      sourceReferredByBusinessId,
      sourceReferenceLabel,
      sourceReferenceNote,
      force,
    };
    const parsed = parseForm(createBusinessSchema, payload);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    try {
      const result = await createBusiness.mutateAsync(parsed.data);
      setDuplicates(null);
      toast.success("Business created");
      if (result.id) router.push(`/businesses/${result.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const body = err.body as { duplicates?: DuplicateCandidate[] } | undefined;
        setDuplicates(body?.duplicates ?? []);
        return;
      }
      setDuplicates(null);
      setError(mutationErrorMessage(err));
    }
  }

  const isPending = createBusiness.isPending;

  return (
    <>
      <div className="flex flex-col gap-6">
        <BusinessWizardStepIndicator step={step} />

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {step === 1 ? (
          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-medium">Business information</h3>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="wiz-name" required>
                Name
              </FieldLabel>
              <Input id="wiz-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={160} />
              <FieldError error={errors.name} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="wiz-website">Website</FieldLabel>
                <Input id="wiz-website" value={website} onChange={(e) => setWebsite(e.target.value)} maxLength={300} />
                <FieldError error={errors.website} />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="wiz-email">Email</FieldLabel>
                <Input id="wiz-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} />
                <FieldError error={errors.email} />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="wiz-phone">Phone</FieldLabel>
                <Input id="wiz-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
                <FieldError error={errors.phone} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="wiz-address">Address</FieldLabel>
              <Textarea id="wiz-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} maxLength={400} />
              <FieldError error={errors.address} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["linkedin", "instagram", "facebook", "x"] as const).map((key) => (
                <div key={key} className="flex flex-col gap-2">
                  <FieldLabel htmlFor={`wiz-${key}`}>{key === "x" ? "X" : key.charAt(0).toUpperCase() + key.slice(1)}</FieldLabel>
                  <Input
                    id={`wiz-${key}`}
                    value={social[key]}
                    onChange={(e) => setSocial((s) => ({ ...s, [key]: e.target.value }))}
                    maxLength={300}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="wiz-notes">Notes</FieldLabel>
              <Textarea id="wiz-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={2000} />
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-medium">Profile</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <FieldLabel>Sector</FieldLabel>
                <CreatableCombobox
                  options={toOptions(sectorsQuery.data)}
                  value={sectorId}
                  onChange={setSectorId}
                  onCreate={async (n) => {
                    const r = await createSector.mutateAsync({ name: n });
                    return r;
                  }}
                  createDialogTitle="Create sector"
                  placeholder="Select sector"
                />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel>Industry</FieldLabel>
                <CreatableCombobox
                  options={toOptions(industriesQuery.data)}
                  value={industryId}
                  onChange={setIndustryId}
                  onCreate={async (n) => {
                    const r = await createIndustry.mutateAsync({ name: n, sectorId });
                    return r;
                  }}
                  createDialogTitle="Create industry"
                  placeholder="Select industry"
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <FieldLabel>Market</FieldLabel>
                <CreatableCombobox
                  options={toOptions(marketsQuery.data)}
                  value={marketId}
                  onChange={setMarketId}
                  onCreate={async (n) => {
                    const r = await createMarket.mutateAsync({ name: n });
                    return r;
                  }}
                  createDialogTitle="Create market"
                  placeholder="B2B / B2C"
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <FieldLabel>Locations</FieldLabel>
                <MultiCreatableCombobox
                  options={toOptions(locationsQuery.data)}
                  values={locationIds}
                  onChange={setLocationIds}
                  onCreate={async (n) => {
                    const r = await createLocation.mutateAsync({ name: n });
                    return r;
                  }}
                  createDialogTitle="Create location"
                  placeholder="Add location"
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <FieldLabel>Tags</FieldLabel>
                <MultiCreatableCombobox
                  options={toOptions(tagsQuery.data)}
                  values={tagIds}
                  onChange={setTagIds}
                  onCreate={async (n) => {
                    const r = await createTag.mutateAsync({ name: n });
                    return r;
                  }}
                  createDialogTitle="Create tag"
                  placeholder="Add tag"
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium">Primary contact</h3>
              <p className="text-xs text-muted-foreground">
                Every business starts with one primary contact.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <FieldLabel required>Name</FieldLabel>
                  <Input value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} maxLength={120} />
                  <FieldError error={errors["contact.name"]} />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel required>Email</FieldLabel>
                  <Input type="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} maxLength={200} />
                  <FieldError error={errors["contact.email"]} />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel>Phone</FieldLabel>
                  <Input value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} maxLength={40} />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-medium">Where did this business come from?</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {(categoriesQuery.data ?? []).map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={cn(
                    "rounded-lg border p-3 text-left text-sm transition-colors",
                    sourceCategoryId === category.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50",
                  )}
                  onClick={() => {
                    setSourceCategoryId(category.id);
                    setSourceSubCategoryId("");
                    setSourceReferredByBusinessId("");
                    setSourceReferenceLabel("");
                  }}
                >
                  <p className="font-medium">{category.name}</p>
                </button>
              ))}
            </div>
            <FieldError error={errors.sourceCategoryId} />

            {selectedCategory?.name === SOURCE_CATEGORY_NAMES.CLUB ? (
              <div className="flex flex-col gap-2">
                <FieldLabel required>Club / sub-club</FieldLabel>
                <CreatableCombobox
                  options={subCategoryOptions}
                  value={sourceSubCategoryId}
                  onChange={setSourceSubCategoryId}
                  onCreate={async (n) => {
                    const r = await createSubCategory.mutateAsync({
                      name: n,
                      sourceCategoryId,
                    });
                    return r;
                  }}
                  createDialogTitle="Create club"
                  placeholder="Select club"
                />
                <FieldError error={errors.sourceSubCategoryId} />
              </div>
            ) : null}

            {selectedCategory?.name === SOURCE_CATEGORY_NAMES.EXISTING_CLIENT ? (
              <div className="flex flex-col gap-2">
                <FieldLabel required>Referred by</FieldLabel>
                <BusinessCombobox
                  options={businessOptions}
                  value={sourceReferredByBusinessId || null}
                  onChange={setSourceReferredByBusinessId}
                  placeholder="Search existing client"
                />
                <FieldError error={errors.sourceReferredByBusinessId} />
              </div>
            ) : null}

            {selectedCategory?.name === SOURCE_CATEGORY_NAMES.EXTERNAL ? (
              <div className="flex flex-col gap-2">
                <FieldLabel required>Reference label</FieldLabel>
                <Input
                  value={sourceReferenceLabel}
                  onChange={(e) => setSourceReferenceLabel(e.target.value)}
                  placeholder="e.g. LinkedIn outreach, trade fair"
                  maxLength={200}
                />
                <FieldError error={errors.sourceReferenceLabel} />
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="wiz-ref-note">Reference note</FieldLabel>
              <Textarea
                id="wiz-ref-note"
                value={sourceReferenceNote}
                onChange={(e) => setSourceReferenceNote(e.target.value)}
                rows={2}
                maxLength={1000}
              />
            </div>
          </section>
        ) : null}

        <div className="flex justify-between gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={() => onCancel?.()}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {step > 1 ? (
              <Button type="button" variant="outline" disabled={isPending} onClick={() => setStep((s) => (s - 1) as WizardStep)}>
                Back
              </Button>
            ) : null}
            {step < 3 ? (
              <Button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (validateStep(step)) setStep((s) => (s + 1) as WizardStep);
                }}
              >
                Continue
              </Button>
            ) : (
              <Button type="button" disabled={isPending} onClick={() => submit(false)}>
                {isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
                Create Business
              </Button>
            )}
          </div>
        </div>
      </div>

      {duplicates ? (
        <DuplicateDialog
          candidates={duplicates}
          open={duplicates.length > 0}
          canForce={member.isAdmin}
          pending={isPending}
          onCancel={() => setDuplicates(null)}
          onForceCreate={() => submit(true)}
        />
      ) : null}
    </>
  );
}
