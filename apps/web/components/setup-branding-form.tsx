"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, ImagePlus, Link2, Loader2, Save } from "lucide-react";
import { apiFetch } from "../lib/client-api";
import { Card, DataState } from "./ui";

interface CompanySettings {
  name?: string;
  legalName?: string;
  logoUrl?: string;
  address?: string;
  taxId?: string;
  workWeek?: string;
  timezone?: string;
}

interface RulesSettings {
  branding?: Record<string, unknown>;
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function SetupBrandingForm() {
  const [company, setCompany] = useState<CompanySettings>({
    name: "",
    legalName: "",
    address: "",
    taxId: "",
    workWeek: "Monday to Saturday",
    timezone: "Asia/Kolkata",
  });
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadSettings() {
      try {
        const [companyResponse, rulesResponse] = await Promise.all([
          apiFetch<CompanySettings>("/settings/company"),
          apiFetch<RulesSettings>("/settings/rules"),
        ]);
        if (!mounted) return;
        const loadedCompany = companyResponse.data || {};
        const branding = rulesResponse.data?.branding || {};
        setCompany({
          name: loadedCompany.name || "",
          legalName: loadedCompany.legalName || "",
          logoUrl: loadedCompany.logoUrl || "",
          address: loadedCompany.address || "",
          taxId: loadedCompany.taxId || "",
          workWeek: loadedCompany.workWeek || "Monday to Saturday",
          timezone: loadedCompany.timezone || "Asia/Kolkata",
        });
        setLogoDataUrl(textValue(branding.logoDataUrl) || loadedCompany.logoUrl || "");
        setLinkedinUrl(textValue(branding.linkedinUrl));
        setFacebookUrl(textValue(branding.facebookUrl));
        setXUrl(textValue(branding.xUrl));
      } catch (caught) {
        if (!mounted) return;
        setError(caught instanceof Error ? caught.message : "Unable to load setup settings.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const previewName = useMemo(() => company.name?.trim() || "Your Company", [company.name]);

  function updateCompany(key: keyof CompanySettings, value: string) {
    setCompany((current) => ({ ...current, [key]: value }));
  }

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setMessage("");
    setError("");
    if (!file) return;
    if (file.type !== "image/png") {
      setError("Please upload only a PNG company logo.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(String(reader.result || ""));
    reader.onerror = () => setError("Logo could not be read. Please try another PNG file.");
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const cleanCompany = {
        ...company,
        name: company.name?.trim(),
        legalName: company.legalName?.trim(),
        logoUrl: logoDataUrl,
      };
      await apiFetch<CompanySettings>("/settings/company", {
        method: "PATCH",
        body: JSON.stringify(cleanCompany),
      });
      await apiFetch<RulesSettings>("/settings/rules", {
        method: "PATCH",
        body: JSON.stringify({
          branding: {
            platformBrand: "PeopleOS",
            clientDisplayName: cleanCompany.name || cleanCompany.legalName || "Client Company",
            logoDataUrl,
            linkedinUrl: linkedinUrl.trim(),
            facebookUrl: facebookUrl.trim(),
            xUrl: xUrl.trim(),
            showPoweredBy: true,
            primaryColor: "#078ced",
          },
        }),
      });
      setMessage("Company branding saved. Dashboard will show this logo and social links.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save company branding.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <DataState message="Loading company setup from database..." />
      </Card>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_320px]" id="client-branding-setup">
      <Card>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Client company profile</div>
            <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Branding and social links</h2>
            <p className="mt-1 text-sm text-muted">These details are saved in the database and used on the dashboard company card.</p>
          </div>
          <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 text-sm font-semibold text-[var(--text-secondary)]">
            <Building2 className="h-4 w-4 text-brand" />
            Setup Wizard
          </span>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-[var(--text-secondary)]">
              Company Name
              <input className="min-h-11 rounded-lg border border-[var(--border-default)] px-3 font-normal text-[var(--text-primary)] outline-none focus:border-brand" value={company.name || ""} onChange={(event) => updateCompany("name", event.target.value)} required />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--text-secondary)]">
              Legal Name
              <input className="min-h-11 rounded-lg border border-[var(--border-default)] px-3 font-normal text-[var(--text-primary)] outline-none focus:border-brand" value={company.legalName || ""} onChange={(event) => updateCompany("legalName", event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--text-secondary)]">
              GST / Tax ID
              <input className="min-h-11 rounded-lg border border-[var(--border-default)] px-3 font-normal text-[var(--text-primary)] outline-none focus:border-brand" value={company.taxId || ""} onChange={(event) => updateCompany("taxId", event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--text-secondary)]">
              Work Week
              <input className="min-h-11 rounded-lg border border-[var(--border-default)] px-3 font-normal text-[var(--text-primary)] outline-none focus:border-brand" value={company.workWeek || ""} onChange={(event) => updateCompany("workWeek", event.target.value)} />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-semibold text-[var(--text-secondary)]">
            Office Address
            <textarea className="min-h-24 rounded-lg border border-[var(--border-default)] px-3 py-2 font-normal text-[var(--text-primary)] outline-none focus:border-brand" value={company.address || ""} onChange={(event) => updateCompany("address", event.target.value)} />
          </label>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-[var(--text-secondary)]">
              Company Logo
              <span className="flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-[var(--border-default)] bg-sunken px-3 font-normal text-muted select-none">
                Logo upload disabled
              </span>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--text-secondary)]">
              Timezone
              <input className="min-h-11 rounded-lg border border-[var(--border-default)] px-3 font-normal text-[var(--text-primary)] outline-none focus:border-brand" value={company.timezone || ""} onChange={(event) => updateCompany("timezone", event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--text-secondary)]">
              LinkedIn Link
              <input className="min-h-11 rounded-lg border border-[var(--border-default)] px-3 font-normal text-[var(--text-primary)] outline-none focus:border-brand" placeholder="https://linkedin.com/company/..." value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--text-secondary)]">
              Facebook Link
              <input className="min-h-11 rounded-lg border border-[var(--border-default)] px-3 font-normal text-[var(--text-primary)] outline-none focus:border-brand" placeholder="https://facebook.com/..." value={facebookUrl} onChange={(event) => setFacebookUrl(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--text-secondary)] lg:col-span-2">
              X Link
              <input className="min-h-11 rounded-lg border border-[var(--border-default)] px-3 font-normal text-[var(--text-primary)] outline-none focus:border-brand" placeholder="https://x.com/..." value={xUrl} onChange={(event) => setXUrl(event.target.value)} />
            </label>
          </div>

          {error ? <DataState message={error} tone="error" /> : null}
          {message ? (
            <div className="flex items-center gap-2 rounded-lg border border-[#c4ecd9] bg-[var(--success-bg)] p-3 text-sm font-semibold text-[var(--success-fg)]">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </div>
          ) : null}

          <button className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-brand px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} type="submit">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Company Setup
          </button>
        </form>
      </Card>

      <Card className="text-center">
        <div className="text-left text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Dashboard preview</div>
        <div className="mx-auto mt-5 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-brand bg-[var(--color-brand-50)] text-4xl font-bold text-brand select-none">
          {previewName.slice(0, 2).toUpperCase()}
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">{previewName}</h2>
        <div className="mt-3 flex justify-center gap-2">
          {[
            { label: "in", value: linkedinUrl },
            { label: "f", value: facebookUrl },
            { label: "x", value: xUrl },
          ].map((item) => (
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${item.value ? "bg-brand" : "bg-[var(--text-muted)]"}`} key={item.label}>
              {item.label}
            </span>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-2 rounded-lg bg-[var(--surface-sunken)] p-3 text-left text-xs text-muted">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          Saved social links will open from the dashboard card.
        </div>
      </Card>
    </section>
  );
}
