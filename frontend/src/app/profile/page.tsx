"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Activity,
  CheckCircle2,
  Info,
  LogOut,
  Pencil,
  Save,
  Star,
  X,
} from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import SpinnerIndicator from "@/components/ui/SpinnerIndicator";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth } from "@/lib/services/token";

type PrimaryCondition = "hypertension" | "heart_disease" | "diabetes_cardiac" | "high_cholesterol" | "other" | "";

type AccountStatus = "active" | "blocked" | "suspended";

type User = {
  id: string;
  email: string;
  createdAt: string;

  // Demographics & profile
  name: string;
  dateOfBirth: string;
  primaryCondition: PrimaryCondition;
  communicationPreference: string | null;
  preferredLanguage: string;
  riskTier: string;
  timezone: string;
  diagnosisDate: string | null;

  // Metadata & audit
  accountStatus: AccountStatus;
  emailVerified: boolean;
  roles: string[];
};

type ProfileGetResponse = {
  id?: string;
  email?: string;
  name?: string;
  roles?: string[];
  emailVerified?: boolean;
  accountStatus?: AccountStatus;
  createdAt?: string;
  dateOfBirth?: string | null;
  primaryCondition?: string;
  communicationPreference?: string | null;
  preferredLanguage?: string;
  riskTier?: string;
  timezone?: string;
  diagnosisDate?: string | null;
  onboardingStatus?: string;
};

type ProfilePatchResponse = {
  message?: string;
  name?: string;
  dateOfBirth?: string;
  primaryCondition?: string;
  communicationPreference?: string | null;
  preferredLanguage?: string;
  timezone?: string;
  onboardingStatus?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function formatPrimaryCondition(condition: string): string {
  const labels: Record<string, string> = {
    hypertension: "Hypertension (High Blood Pressure)",
    heart_disease: "Heart Disease",
    diabetes_cardiac: "Diabetes with Cardiac Risk",
    high_cholesterol: "High Cholesterol",
    other: "Other cardiovascular concern",
  };
  return labels[condition] || toTitleCase(condition || "N/A");
}

function toTitleCase(input: string) {
  return input
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatRoleLabel(role: string) {
  return toTitleCase(role);
}

function formatCommunicationPreference(pref: string | null | undefined): string {
  if (pref === "TEXT_FIRST") return "Text / Chat";
  if (pref === "AUDIO_FIRST") return "Audio / Voice";
  return "Not set";
}

function accountStatusDotClass(status: AccountStatus) {
  if (status === "active") return "bg-[#16a34a]";
  if (status === "suspended") return "bg-[#f59e0b]";
  if (status === "blocked") return "bg-[#dc2626]";
  return "bg-[#3b82f6]";
}

function RiskTierBadge({ tier }: { tier: string | null | undefined }) {
  if (tier === "HIGH")
    return (
      <span className="px-3 py-1 bg-[#dc2626] text-white text-xs font-bold rounded-full">
        High Risk
      </span>
    );
  if (tier === "ELEVATED")
    return (
      <span className="px-3 py-1 bg-[#f59e0b] text-white text-xs font-bold rounded-full">
        Elevated
      </span>
    );
  return (
    <span className="px-3 py-1 bg-[#16a34a] text-white text-xs font-bold rounded-full">
      Standard
    </span>
  );
}

const initialUserData: User = {
  id: "",
  email: "",
  createdAt: "",

  name: "",
  dateOfBirth: "",
  primaryCondition: "",
  communicationPreference: null,
  preferredLanguage: "English",
  riskTier: "STANDARD",
  timezone: "",
  diagnosisDate: null,

  accountStatus: "active",
  emailVerified: false,
  roles: [],
};

export default function Profile() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, logout, markOnboardingComplete } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<User>(initialUserData);
  const [serverSnapshot, setServerSnapshot] = useState<User>(initialUserData);

  const [timezones, setTimezones] = useState<string[]>([]);

  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updatePrimaryCondition = (condition: PrimaryCondition) => {
    setUserData((prev) => ({
      ...prev,
      primaryCondition: condition,
    }));
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatShortMonthYear = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  const toDateInputValue = (raw?: string | null) => {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace("/register");
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    // Prefer browser-provided IANA list; only runs client-side.
    try {
      const supported = typeof Intl !== "undefined" && (Intl as any).supportedValuesOf
        ? (Intl as any).supportedValuesOf("timeZone")
        : [];
      if (Array.isArray(supported) && supported.length > 0) {
        setTimezones(supported);
        return;
      }
    } catch {
      // ignore
    }

    // Fallback list (only used if Intl.supportedValuesOf is unavailable).
    setTimezones([
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Europe/London",
      "Europe/Paris",
      "Asia/Colombo",
      "Asia/Tokyo",
      "Australia/Sydney",
    ]);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!API_BASE_URL) {
      setLoadError("Missing API configuration.");
      return;
    }

    const controller = new AbortController();
    setIsProfileLoading(true);
    setLoadError(null);

    async function fetchProfile() {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/v2/auth/profile`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 401) {
            router.replace("/welcome");
            return;
          }
          setLoadError("We couldn't load your profile. Please try again.");
          return;
        }

        const data: ProfileGetResponse = await res.json();

        setUserData((prev) => {
          const next: User = {
            ...prev,
            id: data.id ?? "",
            email: data.email ?? "",
            name: data.name ?? "",
            roles: Array.isArray(data.roles) ? data.roles : [],
            emailVerified:
              typeof data.emailVerified === "boolean"
                ? data.emailVerified
                : false,
            accountStatus: data.accountStatus ?? "active",
            createdAt: data.createdAt ?? "",
            dateOfBirth: data.dateOfBirth ?? "",
            primaryCondition: (data.primaryCondition as PrimaryCondition) ?? "",
            communicationPreference: data.communicationPreference ?? null,
            preferredLanguage: data.preferredLanguage ?? "English",
            riskTier: data.riskTier ?? "STANDARD",
            timezone: data.timezone ?? "",
            diagnosisDate: data.diagnosisDate ?? null,
          };

          setServerSnapshot(next);
          return next;
        });
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setLoadError("We couldn't load your profile. Please try again.");
        }
      } finally {
        setIsProfileLoading(false);
      }
    }

    void fetchProfile();
    return () => controller.abort();
  }, [user, router]);

  const handleCancelEdit = () => {
    setSaveError(null);
    setIsEditing(false);
    setUserData(serverSnapshot);
  };

  const handleSaveProfile = async () => {
    if (!API_BASE_URL) {
      setSaveError("Missing API configuration. Please try again later.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const timezoneLooksValid =
      userData.timezone && userData.timezone.includes("/");

    // If timezone is missing/invalid, avoid sending it to prevent a 400.
    if (!timezoneLooksValid && userData.timezone) {
      setSaveError('timezone must be a valid IANA identifier (e.g. "America/New_York")');
      setIsSaving(false);
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        name: userData.name,
        dateOfBirth: toDateInputValue(userData.dateOfBirth),
        primaryCondition: userData.primaryCondition,
        preferredLanguage: userData.preferredLanguage || undefined,
        communicationPreference: userData.communicationPreference || undefined,
        ...(timezoneLooksValid ? { timezone: userData.timezone } : {}),
      };

      const res = await fetchWithAuth(`${API_BASE_URL}/api/v2/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        try {
          const err = await res.json();
          const msg =
            Array.isArray(err?.message) ? err.message[0] : err?.message;
          setSaveError(msg || "We couldn't save your profile. Please try again.");
        } catch {
          setSaveError("We couldn't save your profile. Please try again.");
        }
        return;
      }

      const data: ProfilePatchResponse = await res.json();

      const next: User = {
        ...userData,
        name: data.name ?? userData.name,
        dateOfBirth: data.dateOfBirth ?? userData.dateOfBirth,
        primaryCondition: (data.primaryCondition as PrimaryCondition) ?? userData.primaryCondition,
        communicationPreference: data.communicationPreference !== undefined ? data.communicationPreference : userData.communicationPreference,
        preferredLanguage: data.preferredLanguage ?? userData.preferredLanguage,
        timezone: data.timezone ?? userData.timezone,
      };

      setServerSnapshot(next);
      setUserData(next);
      setIsEditing(false);

      if (data.onboardingStatus === "COMPLETED") {
        markOnboardingComplete();
      }
    } catch {
      setSaveError("We couldn't save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthLoading || isProfileLoading) return <SpinnerIndicator />;

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md text-center">
          <p className="text-red-600 font-bold">{loadError}</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-6 w-full h-12 bg-white rounded-lg border border-[#e5e7eb] font-semibold text-[#374151] hover:bg-gray-50 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-auto bg-[#fafafa]">
        {/* Header */}
        <div className="bg-white border-b border-[#e2e8f0]">
          <div className="px-6 lg:px-8 py-6">
            <div className="flex items-end justify-between">
              <h1 className="text-h5 font-bold text-[#0a0a0a] leading-9">
                Your Health Profile
              </h1>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4.25 py-4.25 bg-[#fef2f2] border border-[#fee2e2] rounded-lg text-[#dc2626] font-semibold hover:bg-[#fee2e2] transition-colors"
              >
                <LogOut className="w-4.5 h-4.5" />
                Log Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 lg:px-8 py-6 max-w-300">
          <div className="space-y-6">
            {/* Profile Hero Section */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-[#6c00d1] flex items-center justify-center text-white text-[30px] font-bold shadow-lg">
                      {userData.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </div>
                    <div className="absolute inset-0 rounded-2xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] pointer-events-none" />
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-[#0f172a]">
                      {userData.name || "No name set"}
                    </h2>
                    <p className="text-base font-medium text-[#7B00E0]">
                      {userData.roles.length
                        ? userData.roles.map(formatRoleLabel).join(" / ")
                        : "Patient"}
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-1">
                        <Calendar
                          className="w-3 h-3 text-[#94a3b8] opacity-100! inline-block! visible!"
                          color="#94a3b8"
                          strokeWidth={2.5}
                          style={{
                            visibility: "visible",
                            display: "inline-block",
                            opacity: 1,
                          }}
                        />
                        <span className="text-sm text-[#94a3b8]">
                          Joined {formatShortMonthYear(userData.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2
                          className="w-2.5 h-2.5 text-[#94a3b8] opacity-100! inline-block! visible!"
                          color="#94a3b8"
                          strokeWidth={2.5}
                          style={{
                            visibility: "visible",
                            display: "inline-block",
                            opacity: 1,
                          }}
                        />
                        <span className="text-sm text-[#94a3b8]">
                          {userData.emailVerified ? "Verified" : "Unverified"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`inline-flex w-3 h-3 rounded-full ${accountStatusDotClass(
                            userData.accountStatus,
                          )}`}
                        />
                        <span className="text-sm font-medium text-[#0f172a] capitalize">
                          {toTitleCase(userData.accountStatus)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit / Save actions */}
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#f1f5f9] rounded-lg text-[#334155] font-bold hover:bg-[#e2e8f0] transition-colors"
                  >
                    <Pencil
                      className="w-4 h-4 text-[#334155]"
                      color="#334155"
                      strokeWidth={3}
                    />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#e2e8f0] rounded-lg text-[#334155] font-bold hover:bg-[#f8fafc] transition-colors disabled:opacity-60"
                    >
                      <X
                        className="w-4 h-4 text-[#334155] opacity-100!"
                        color="#334155"
                        strokeWidth={3}
                        style={{ visibility: "visible", display: "inline-block", opacity: 1 }}
                      />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveProfile()}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#7B00E0] rounded-lg text-white font-bold hover:bg-[#6600BC] transition-colors disabled:opacity-60"
                    >
                      <Save
                        className="w-4 h-4 text-white opacity-100!"
                        color="#ffffff"
                        strokeWidth={3}
                        style={{ visibility: "visible", display: "inline-block", opacity: 1 }}
                      />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-[rgba(108,0,209,0.05)] border-b border-[rgba(108,0,209,0.1)] px-6 py-4">
                    <h3 className="text-base font-bold text-[#0f172a]">Personal Information</h3>
                  </div>

                  {saveError && isEditing && <div className="px-6 pt-4"><p className="text-sm font-bold text-red-600">{saveError}</p></div>}

                  <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <label className="text-sm font-medium text-[#64748b] block mb-1">
                        Full name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={userData.name}
                          onChange={(e) =>
                            setUserData((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#6c00d1] text-base font-medium text-[#0f172a]"
                        />
                      ) : (
                        <p className="text-base font-medium text-[#0f172a]">
                          {userData.name || "N/A"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#64748b] block mb-1">
                        Email Address
                      </label>
                      <p className="text-base font-medium text-[#0f172a]">
                        {userData.email || "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#64748b] block mb-1">
                        Date of Birth
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={toDateInputValue(userData.dateOfBirth)}
                          onChange={(e) =>
                            setUserData((prev) => ({
                              ...prev,
                              dateOfBirth: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#6c00d1] text-base font-medium text-[#0f172a]"
                        />
                      ) : (
                        <p className="text-base font-medium text-[#0f172a]">
                          {formatDate(userData.dateOfBirth)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[rgba(108,0,209,0.6)] uppercase tracking-wider block mb-1">
                        Timezone
                      </label>
                      {isEditing ? (
                        <select
                          value={userData.timezone || ""}
                          onChange={(e) =>
                            setUserData((prev) => ({
                              ...prev,
                              timezone: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#6c00d1] text-base font-medium text-[#0f172a] bg-white"
                        >
                          {timezones.map((tz) => (
                            <option key={tz} value={tz}>
                              {tz}
                            </option>
                          ))}
                          {userData.timezone &&
                            !timezones.includes(userData.timezone) && (
                              <option value={userData.timezone}>
                                {userData.timezone}
                              </option>
                            )}
                        </select>
                      ) : (
                        <p className="text-base font-medium text-[#0f172a]">
                          {userData.timezone || "N/A"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[rgba(108,0,209,0.6)] uppercase tracking-wider block mb-2">
                        Primary Condition
                      </label>
                      {isEditing ? (
                        <select
                          value={userData.primaryCondition}
                          onChange={(e) =>
                            updatePrimaryCondition(
                              e.target.value as PrimaryCondition,
                            )
                          }
                          className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#6c00d1] text-base font-medium text-[#0f172a] bg-white"
                        >
                          <option value="">Select your condition</option>
                          <option value="hypertension">Hypertension (High Blood Pressure)</option>
                          <option value="heart_disease">Heart Disease</option>
                          <option value="diabetes_cardiac">Diabetes with Cardiac Risk</option>
                          <option value="high_cholesterol">High Cholesterol</option>
                          <option value="other">Other cardiovascular concern</option>
                        </select>
                      ) : (
                        <p className="text-base font-medium text-[#0f172a]">
                          {formatPrimaryCondition(userData.primaryCondition)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[rgba(108,0,209,0.6)] uppercase tracking-wider block mb-1">
                        Diagnosis Date
                      </label>
                      <p className="text-base font-medium text-[#0f172a]">
                        {userData.diagnosisDate ? formatDate(userData.diagnosisDate) : "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[rgba(108,0,209,0.6)] uppercase tracking-wider block mb-1">
                        Communication Preference
                      </label>
                      {isEditing ? (
                        <select
                          value={userData.communicationPreference ?? ""}
                          onChange={(e) =>
                            setUserData((prev) => ({
                              ...prev,
                              communicationPreference: e.target.value || null,
                            }))
                          }
                          className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#6c00d1] text-base font-medium text-[#0f172a] bg-white"
                        >
                          <option value="">Not set</option>
                          <option value="TEXT_FIRST">Text / Chat</option>
                          <option value="AUDIO_FIRST">Audio / Voice</option>
                        </select>
                      ) : (
                        <p className="text-base font-medium text-[#0f172a]">
                          {formatCommunicationPreference(userData.communicationPreference)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[rgba(108,0,209,0.6)] uppercase tracking-wider block mb-1">
                        Preferred Language
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={userData.preferredLanguage}
                          onChange={(e) =>
                            setUserData((prev) => ({
                              ...prev,
                              preferredLanguage: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#6c00d1] text-base font-medium text-[#0f172a]"
                        />
                      ) : (
                        <p className="text-base font-medium text-[#0f172a]">
                          {userData.preferredLanguage || "English"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[rgba(108,0,209,0.6)] uppercase tracking-wider block mb-1">
                        Risk Tier
                      </label>
                      <RiskTierBadge tier={userData.riskTier} />
                    </div>
                  </div>
                </div>

                {/* Roles & Permissions */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-[rgba(108,0,209,0.05)] border-b border-[rgba(108,0,209,0.1)] px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4.5 h-4.5 text-[#6C00D1]" />
                      <h3 className="text-base font-bold text-[#0f172a]">
                        Roles & Permissions
                      </h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {userData.roles?.map((role, index) => (
                      <div
                        key={`${role}-${index}`}
                        className="flex items-center justify-between p-4 bg-[rgba(108,0,209,0.05)] border border-[rgba(108,0,209,0.1)] rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#7B00E0] flex items-center justify-center">
                            <Star className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#0f172a] capitalize">
                              {role.replace("_", " ")}
                            </p>
                            <p className="text-xs text-[#64748b]">
                              Full access to{" "}
                              {role.includes("admin") ? "admin" : role.includes("provider") ? "provider" : "user"}{" "}
                              features
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-[#16a34a] text-white text-xs font-bold rounded-full">
                          Active
                        </span>
                      </div>
                    ))}
                    {(!userData.roles || userData.roles.length === 0) && (
                      <p className="text-sm text-[#64748b]">No roles assigned</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Metadata */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-[rgba(108,0,209,0.05)] border-b border-[rgba(108,0,209,0.1)] px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-[#6C00D1]" />
                      <h3 className="text-base font-bold text-[#0f172a]">
                        Metadata
                      </h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-[rgba(108,0,209,0.6)] uppercase tracking-wider block mb-1">
                        User ID
                      </label>
                      <p className="text-xs font-mono text-[#0f172a]">
                        {userData.id || "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[rgba(108,0,209,0.6)] uppercase tracking-wider block mb-1">
                        Account Created
                      </label>
                      <p className="text-sm text-[#0f172a]">
                        {formatDate(userData.createdAt)}
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[rgba(108,0,209,0.6)] uppercase tracking-wider block mb-1">
                        Email Status
                      </label>
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-[#16a34a] opacity-100! inline-block! visible!"
                          color={userData.emailVerified ? "#16a34a" : "#94a3b8"}
                          strokeWidth={3}
                          style={{
                            visibility: "visible",
                            display: "inline-block",
                            opacity: 1,
                          }}
                        />
                        <span className={`text-sm font-bold ${userData.emailVerified ? "text-[#16a34a]" : "text-[#94a3b8]"}`}>
                          {userData.emailVerified ? "Verified" : "Unverified"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-[rgba(108,0,209,0.05)] border-b border-[rgba(108,0,209,0.1)] px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4.5 h-4.5 text-[#6C00D1]" />
                      <h3 className="text-base font-bold text-[#0f172a]">
                        Account Status
                      </h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#0f172a]">
                        Status
                      </span>
                      <span className={`px-3 py-1 text-white text-xs font-bold rounded-full capitalize ${
                        userData.accountStatus === "active" ? "bg-[#16a34a]" :
                        userData.accountStatus === "suspended" ? "bg-[#f59e0b]" :
                        "bg-[#dc2626]"
                      }`}>
                        {toTitleCase(userData.accountStatus)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#0f172a]">
                        Two-Factor Auth
                      </span>
                      <span className="px-3 py-1 bg-[#7B00E0] text-white text-xs font-bold rounded-full">
                        Enabled
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#0f172a]">
                        Session Timeout
                      </span>
                      <span className="text-sm font-bold text-[#0f172a]">
                        30 minutes
                      </span>
                    </div>
                    <div className="pt-4 border-t border-[rgba(108,0,209,0.05)]">
                      <button className="w-full py-2.5 text-sm font-bold text-[#dc2626] hover:bg-[rgba(220,38,38,0.05)] rounded-lg transition-colors">
                        Deactivate Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
