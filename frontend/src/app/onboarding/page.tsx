"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth } from "@/lib/services/token";
import {
  markOnboardingSkipped,
  shouldShowOnboardingForUser,
} from "@/lib/onboarding";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import SpinnerIndicator from "@/components/ui/SpinnerIndicator";

function getBrowserTimezone(): string | undefined {
  if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat === "undefined") return undefined;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading, logout, markOnboardingComplete } = useAuth();
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/welcome");
      return;
    }

    const showOnboarding = shouldShowOnboardingForUser({
      userId: user.id,
      onboardingStatus: user.onboardingStatus,
      onboardingRequiredHint: user.onboardingRequired,
    });

    if (!showOnboarding) {
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.debug("[onboarding] redirect away from onboarding page", {
          userId: user.id,
          onboardingStatus: user.onboardingStatus,
          onboardingRequired: user.onboardingRequired,
        });
      }
      setIsRedirecting(true);
      router.replace("/");
    }
  }, [user, isLoading, router]);

  function isDateOfBirthValid(raw: string): boolean {
    if (!raw) return false;
    const dob = new Date(raw);
    if (Number.isNaN(dob.getTime())) return false;
    const today = new Date();
    // Strip time for comparison
    const dobDay = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // Reject future dates
    if (dobDay > todayDay) return false;
    // Basic sanity check: not older than 120 years
    const minYear = todayDay.getFullYear() - 120;
    if (dobDay.getFullYear() < minYear) return false;
    return true;
  }

  const isFormPartiallyFilled = name.trim() !== "" || dateOfBirth !== "" || stage !== "";

  if (isLoading || !user || isRedirecting) {
    return <SpinnerIndicator />;
  }

  async function submitProfile(body: Record<string, unknown>) {
    setError("");
    setIsSubmitting(true);
    try {
      if (!user) {
        router.push("/welcome");
        return;
      }
      const timezone = getBrowserTimezone();
      const payload = timezone && !("timezone" in body) ? { ...body, timezone } : body;

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v2/auth/profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(timezone ? { "X-Timezone": timezone } : {}),
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save profile");
      }

      markOnboardingComplete();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete onboarding");
      setIsSubmitting(false);
    }
  }

  async function handleContinue() {
    if (!isFormPartiallyFilled || isSubmitting) return;
    if (dateOfBirth && !isDateOfBirthValid(dateOfBirth)) {
      setError("Please enter a valid date of birth.");
      return;
    }
    await submitProfile({
      name: name.trim() || null,
      dateOfBirth: dateOfBirth || null,
      menopauseStage: stage || null,
    });
  }

  async function handleSkip() {
    if (isSubmitting) return;
    if (!user) {
      router.push("/welcome");
      return;
    }
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.debug("[onboarding] skip clicked", { userId: user.id });
    }
    markOnboardingSkipped(user.id);
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 lg:px-12 py-10">
      <div className="w-full max-w-300 mx-auto">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
          {/* Left side - Form */}
          <div className="flex-1 w-full max-w-105 lg:max-w-130">
            {/* Logo */}
            <div className="mb-8 flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="Healplace logo"
                width={40}
                height={40}
                className="h-10 w-10 lg:h-12 lg:w-12"
                priority
              />
              <span className="font-semibold text-dark-blue-500 text-xl lg:text-3xl tracking-[-0.5px]">
                Healplace
              </span>
            </div>

            {/* Heading */}
            <div className="mb-10">
              <h1 className="font-semibold text-[#171717] text-3xl lg:text-4xl tracking-[-0.04em] mb-3">
                Basic Profile Info
              </h1>
              <p className="text-[#4b5563] text-sm lg:text-base leading-relaxed max-w-105">
                Let&apos;s get to know you better to personalize your experience.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6 w-full">
              {/* Name */}
              <div className="w-full max-w-105">
                <label className="block font-semibold text-[#171717] text-xs lg:text-sm mb-2">
                  What should we call you?
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full h-11 lg:h-12 px-4 lg:px-5 bg-[rgba(243,232,255,0.1)] border border-[#e5d9f2] rounded-lg text-sm lg:text-base text-[#171717] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-dark-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Date of Birth */}
              <div className="w-full max-w-105">
                <label className="block font-semibold text-[#171717] text-xs lg:text-sm mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full h-11 lg:h-12 px-4 lg:px-5 bg-[rgba(243,232,255,0.1)] border border-[#e5d9f2] rounded-lg text-sm lg:text-base text-[#171717] focus:outline-none focus:ring-2 focus:ring-dark-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Menopause stage */}
              <div className="w-full max-w-105">
                <label className="block font-semibold text-[#171717] text-xs lg:text-sm mb-2">
                  Which stage describes you best?
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full h-11 lg:h-12 px-4 lg:px-5 bg-[rgba(243,232,255,0.1)] border border-[#e5d9f2] rounded-lg text-sm lg:text-base text-[#171717] focus:outline-none focus:ring-2 focus:ring-dark-blue-500 focus:border-transparent transition-all appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%3E%3cpath%20fill%3D%22%23171717%22%20d%3D%22M6%208L0%200h12z%22%2F%3E%3c%2Fsvg%3E')] bg-size-[12px] bg-position-[center_right_1rem] bg-no-repeat"
                >
                  <option value="">Select your stage</option>
                  <option value="PERIMENOPAUSE">Perimenopause</option>
                  <option value="MENOPAUSE">Menopause</option>
                  <option value="POSTMENOPAUSE">Postmenopause</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>

              {/* Error Message */}
              {error && (
                <div className="w-full max-w-105">
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-4 w-full max-w-105 space-y-2">
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!isFormPartiallyFilled || isSubmitting}
                  className="w-full h-12 lg:h-14 bg-dark-blue-500 rounded-full shadow-[0px_10px_15px_-3px_rgba(108,0,209,0.25)] font-semibold text-white text-sm lg:text-base hover:bg-[#5a00b1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Continue"}
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full text-sm text-[#737373] mt-4 cursor-pointer"
                >
                  Skip for now
                </button>
              </div>
              {/* (Privacy note and sign out text removed per design) */}
            </div>
          </div>

          {/* Right side - Info Panel (match register panel) */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="bg-linear-to-br from-[#f3e8ff] to-[#e9d5ff] rounded-3xl md:p-6 lg:p-10 md:w-80 md:h-80 lg:w-105 lg:h-auto flex">
              <div className="space-y-4 my-auto w-full">
                <div className="flex items-center gap-3">
                  <div className="bg-dark-blue-500 size-12 lg:size-16 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-[#170c1d] text-base md:text-lg lg:text-2xl">
                    Personalized Care
                  </h3>
                </div>
                <p className="text-[#4b3b55] text-xs md:text-sm lg:text-base leading-relaxed">
                  We use your profile to provide tailored health insights, symptom tracking, and recommendations designed for your
                  unique journey.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="bg-white rounded-full p-1 mt-1">
                      <CheckCircle2 className="w-3 h-3 lg:w-4 lg:h-4 text-dark-blue-500" strokeWidth={2.5} />
                    </div>
                    <p className="text-[#4b3b55] text-xs md:text-sm">Stage-specific content &amp; resources</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-white rounded-full p-1 mt-1">
                      <CheckCircle2 className="w-3 h-3 lg:w-4 lg:h-4 text-dark-blue-500" strokeWidth={2.5} />
                    </div>
                    <p className="text-[#4b3b55] text-xs md:text-sm">Customized symptom monitoring</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-white rounded-full p-1 mt-1">
                      <CheckCircle2 className="w-3 h-3 lg:w-4 lg:h-4 text-dark-blue-500" strokeWidth={2.5} />
                    </div>
                    <p className="text-[#4b3b55] text-xs md:text-sm">Age-appropriate health tips</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
