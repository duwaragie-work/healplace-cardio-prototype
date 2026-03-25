"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Apple, CheckCircle2 } from "lucide-react";
import { useAuth, type OtpVerifyResponse } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { getOrCreateDeviceId } from "@/lib/device";

const OTP_LENGTH = 6;

function getBrowserTimezone(): string | undefined {
  try {
    if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat === "undefined") return undefined;
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const resendTimerRef = useRef<number | null>(null);

  const emailIsValid = useMemo(() => isEmailValid(email.trim()), [email]);
  const canVerifyOtp = otp.length === OTP_LENGTH;

  useEffect(() => {
    if (!isLoading && user) {
      if (user.onboardingRequired) {
        router.replace("/onboarding");
      } else {
        router.replace("/");
      }
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    return () => {
      if (resendTimerRef.current !== null) window.clearInterval(resendTimerRef.current);
    };
  }, []);

  if (isLoading || user) return null;

  async function sendOtpRequest(emailToUse: string) {
    const deviceId = getOrCreateDeviceId();
    const timezone = getBrowserTimezone();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v2/auth/otp/send`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Id": deviceId,
        ...(timezone ? { "X-Timezone": timezone } : {}),
      },
      body: JSON.stringify({ email: emailToUse, deviceId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Something went wrong.");
    return data;
  }

  function startResendCooldown(seconds = 30) {
    if (resendTimerRef.current !== null) window.clearInterval(resendTimerRef.current);
    setResendCooldown(seconds);
    resendTimerRef.current = window.setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (resendTimerRef.current !== null) {
            window.clearInterval(resendTimerRef.current);
            resendTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOtp() {
    if (!emailIsValid || isRequestingOtp) return;
    setErrorMessage("");
    setStatusMessage("");
    setIsRequestingOtp(true);
    try {
      const data = await sendOtpRequest(email.trim());
      setOtpSent(true);
      setOtp("");
      setStatusMessage(data.message || "OTP sent to your email.");
      startResendCooldown();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to request OTP.");
    } finally {
      setIsRequestingOtp(false);
    }
  }

  async function handleResendOtp() {
    if (!otpSent || resendCooldown > 0 || isResendingOtp) return;
    setErrorMessage("");
    setStatusMessage("");
    setIsResendingOtp(true);
    try {
      const data = await sendOtpRequest(email.trim());
      setStatusMessage(data.message || "OTP resent to your email.");
      startResendCooldown();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to resend OTP.");
    } finally {
      setIsResendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (!canVerifyOtp || isVerifyingOtp || !otpSent) return;
    setErrorMessage("");
    setStatusMessage("");
    setIsVerifyingOtp(true);
    try {
      const deviceId = getOrCreateDeviceId();
      const timezone = getBrowserTimezone();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v2/auth/otp/verify`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": deviceId,
          ...(timezone ? { "X-Timezone": timezone } : {}),
        },
        body: JSON.stringify({ email: email.trim(), otp, deviceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.message || "Verification failed.");
        throw new Error(data.message || "Verification failed.");
      }
      setStatusMessage("Sucessfully verified");
      login(data as OtpVerifyResponse);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Invalid OTP. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function handleSocialLogin(provider: "google" | "apple") {
    setErrorMessage("");
    setStatusMessage("");
    provider === "google" ? setIsGoogleLoading(true) : setIsAppleLoading(true);

    try {
      const deviceId = getOrCreateDeviceId();
      const timezone = getBrowserTimezone();
      const endpoint =
        provider === "google"
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/v2/auth/google/callback?deviceId=${encodeURIComponent(
              deviceId,
            )}${timezone ? `&timezone=${encodeURIComponent(timezone)}` : ""}`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/v2/auth/apple/web?deviceId=${encodeURIComponent(
              deviceId,
            )}${timezone ? `&timezone=${encodeURIComponent(timezone)}` : ""}`;

      window.location.href = endpoint;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Social login failed.");
      provider === "google" ? setIsGoogleLoading(false) : setIsAppleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 lg:px-12 py-10">
      <div className="w-full max-w-300 mx-auto">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
          {/* Left side - Form */}
          <div className="flex-1 w-full max-w-105 lg:max-w-130">
            {/* Logo */}
            <div className="mb-8 flex items-center gap-3">
              <Logo />
            </div>

            {/* Heading */}
            <div className="mb-10 w-full">
              <h2 className="font-bold leading-[1.2] text-[#170c1d] text-[26px] lg:text-[33px] tracking-[-0.4px] mb-4">
                Join Healplace
              </h2>
              <p className="font-normal leading-[28.5px] text-[#4b5563] text-label lg:text-[18px]">
                Join Healplace. We&apos;ll send you a code to verify your email.
              </p>
            </div>


            {/* Form */}
            <div className="space-y-6 w-full">
              {/* Email / OTP section (swaps in-place) */}
              <div className="w-full max-w-105">
                <>
                  <label className="block font-semibold text-[#171717] text-xs lg:text-sm mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    autoComplete="email"
                    className="w-full h-11 lg:h-12 px-4 lg:px-5 bg-[rgba(243,232,255,0.1)] border border-[#e5d9f2] rounded-lg text-sm lg:text-base text-[#171717] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-dark-blue-500 focus:border-transparent transition-all"
                  />

                  <button
                    onClick={handleSendOtp}
                    disabled={!emailIsValid || isRequestingOtp}
                    className="w-full cursor-pointer h-12 lg:h-14 rounded-lg flex items-center justify-center border border-[#6B00D1] mt-3 mb-7"
                  >
                    <span className="font-semibold text-[#6B00D1] text-base lg:text-medium">{isRequestingOtp ? "Sending OTP..." : "Send OTP"}</span>
                  </button>
                </>
                {otpSent &&
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-semibold text-[#171717] text-xs lg:text-sm">
                        Enter OTP
                      </label>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0 || isResendingOtp}
                        className="font-medium text-dark-blue-500 text-xs lg:text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isResendingOtp
                          ? "Resending..."
                          : resendCooldown > 0
                            ? `Resend in ${resendCooldown}s`
                            : "Resend code"}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                      placeholder="••••••"
                      maxLength={OTP_LENGTH}
                      className="w-full h-11 lg:h-12 px-4 lg:px-5 bg-[rgba(243,232,255,0.1)] border border-[#e5d9f2] rounded-lg text-base lg:text-lg text-center tracking-[8px] text-[#171717] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-dark-blue-500 focus:border-transparent transition-all mb-3"
                    />

                    {/* Feedback */}

                    {!(statusMessage || errorMessage) ? (
                      <p className="mt-2 text-[#737373] text-xs lg:text-sm">
                        Enter the 6-digit code sent to your inbox.
                      </p>
                    ) : (
                      <div className="w-full max-w-105">

                        <p
                          role="status"
                          className={`mt-2 text-xs lg:text-sm ${errorMessage
                            ? "text-red-500"
                            : "text-green-500"
                            }`}
                        >
                          {errorMessage || statusMessage}
                        </p>
                      </div>
                    )}

                  </>
                }

              </div>

              <div className="pt-4 w-full max-w-105">
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={!canVerifyOtp || isVerifyingOtp}
                  className="w-full h-12 lg:h-14 bg-dark-blue-500 rounded-full shadow-[0px_10px_15px_-3px_rgba(108,0,209,0.25)] font-semibold text-white text-sm lg:text-base hover:bg-[#5a00b1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isVerifyingOtp ? "Verifying..." : "Continue"}
                </button>
              </div>

              {/* Terms */}
              <div className=" w-full max-w-105">
                <p className="text-[#737373] text-[11px] lg:text-xs leading-relaxed text-center">
                  By creating an account, you agree to our{" "}
                  <a
                    href="#"
                    className="font-medium text-dark-blue-500 hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "} <br />
                  <a
                    href="#"
                    className="font-medium text-dark-blue-500 hover:underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Info Panel */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="bg-linear-to-br from-[#f3e8ff] to-[#e9d5ff] rounded-3xl md:p-6 lg:p-10 md:w-80 md:h-80 lg:w-105 lg:h-auto flex">
              <div className="space-y-4 my-auto w-full">
                <div className="flex items-center gap-3">
                  <div className="bg-dark-blue-500 size-12 lg:size-16 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 lg:w-8 lg:h-8 text-white" strokeWidth={2} />
                  </div>
                  <h3 className="font-bold text-[#170c1d] text-base md:text-lg lg:text-2xl">
                    Secure &amp; Private
                  </h3>
                </div>
                <p className="text-[#4b3b55] text-xs md:text-sm lg:text-base leading-relaxed">
                  Your health data is encrypted and protected. We never share your personal information without your
                  consent.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="bg-white rounded-full p-1 mt-1">
                      <CheckCircle2 className="w-3 h-3 lg:w-4 lg:h-4 text-dark-blue-500" strokeWidth={2.5} />
                    </div>
                    <p className="text-[#4b3b55] text-xs md:text-sm">
                      Track symptoms &amp; sleep patterns
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-white rounded-full p-1 mt-1">
                      <CheckCircle2 className="w-3 h-3 lg:w-4 lg:h-4 text-dark-blue-500" strokeWidth={2.5} />
                    </div>
                    <p className="text-[#4b3b55] text-xs md:text-sm">
                      Get AI-powered personalized insights
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-white rounded-full p-1 mt-1">
                      <CheckCircle2 className="w-3 h-3 lg:w-4 lg:h-4 text-dark-blue-500" strokeWidth={2.5} />
                    </div>
                    <p className="text-[#4b3b55] text-xs md:text-sm">
                      Access health recommendations
                    </p>
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

