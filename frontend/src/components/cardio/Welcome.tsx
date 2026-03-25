'use client';

import Link from 'next/link';
import { ArrowRight, Lock, Building2, BarChart3 } from 'lucide-react';

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="12" fill="#7B00E0" />
      <path
        d="M24 14C20 14 17 17.5 17 21c0 7 7 13 7 13s7-6 7-13c0-3.5-3-7-7-7z"
        fill="white"
      />
      <path
        d="M12 26h6l2-4 3 8 2-6 3 4h8"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function BPCardIllustration({ className }: { className?: string }) {
  return (
    <div className={`relative w-full min-h-[400px] flex items-center justify-center ${className || ''}`}>
      {/* Dot grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(123, 0, 224, 0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Purple radial gradient */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(123, 0, 224, 0.2) 0%, transparent 70%)',
        }}
      />

      {/* ECG heartbeat line */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 600 600"
        preserveAspectRatio="none"
      >
        <path
          d="M 0,300 L 150,300 L 180,250 L 200,350 L 220,300 L 600,300"
          fill="none"
          stroke="var(--brand-primary-purple)"
          strokeWidth="2"
          opacity="0.15"
        />
      </svg>

      {/* Main BP Card */}
      <div
        className="relative z-10 p-8 md:p-12 w-[320px] md:w-[380px]"
        style={{
          backgroundColor: 'var(--brand-surface)',
          borderRadius: '20px',
          boxShadow: 'var(--brand-shadow-elevated)',
        }}
      >
        <p className="text-xs mb-2" style={{ color: 'var(--brand-text-muted)' }}>
          Today&apos;s Reading
        </p>
        <div
          className="mb-4"
          style={{
            fontSize: '3.5rem',
            fontWeight: 700,
            color: 'var(--brand-primary-purple)',
            lineHeight: 1,
          }}
        >
          128 / 84
        </div>
        <p
          className="text-base mb-4"
          style={{ color: 'var(--brand-text-secondary)' }}
        >
          mmHg
        </p>
        <div
          className="inline-flex items-center gap-2 px-4 py-2"
          style={{
            backgroundColor: 'var(--brand-success-green-light)',
            color: 'var(--brand-success-green)',
            borderRadius: 'var(--brand-radius-pill)',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Within Target Range
        </div>
      </div>

      {/* Floating Card - Top Right */}
      <div
        className="hidden md:block absolute top-12 right-8 p-4 w-56 transform rotate-[4deg]"
        style={{
          backgroundColor: 'var(--brand-surface)',
          borderRadius: 'var(--brand-radius-card)',
          boxShadow: 'var(--brand-shadow-card)',
          borderLeft: '4px solid var(--brand-accent-teal)',
        }}
      >
        <p
          className="text-xs mb-1"
          style={{ color: 'var(--brand-text-primary)', fontWeight: 700 }}
        >
          Care team notified
        </p>
        <p className="text-[0.6875rem]" style={{ color: 'var(--brand-text-muted)' }}>
          2 minutes ago
        </p>
      </div>

      {/* Floating Card - Bottom Left */}
      <div
        className="hidden md:block absolute bottom-16 left-8 p-4 w-60 transform -rotate-[3deg]"
        style={{
          backgroundColor: 'var(--brand-surface)',
          borderRadius: 'var(--brand-radius-card)',
          boxShadow: 'var(--brand-shadow-card)',
          borderLeft: '4px solid var(--brand-success-green)',
        }}
      >
        <p
          className="text-xs mb-1"
          style={{ color: 'var(--brand-text-primary)', fontWeight: 700 }}
        >
          Medication taken today
        </p>
        <p
          className="text-[0.6875rem]"
          style={{ color: 'var(--brand-success-green)', fontWeight: 600 }}
        >
          Confirmed
        </p>
      </div>
    </div>
  );
}

export default function Welcome() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--brand-background)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* LEFT COLUMN */}
          <div className="flex flex-col space-y-8">
            {/* Logo + Wordmark */}
            <div className="flex items-center gap-3">
              <LogoIcon className="w-12 h-12" />
              <span
                className="text-2xl font-bold"
                style={{ color: 'var(--brand-primary-purple)' }}
              >
                Healplace Cardio
              </span>
            </div>

            {/* Heading */}
            <h1
              className="text-[2rem] md:text-[3rem] leading-tight"
              style={{
                color: 'var(--brand-text-primary)',
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              Your Heart Health, Monitored Between Every Visit
            </h1>

            {/* Body text */}
            <p
              className="text-base md:text-lg max-w-[480px]"
              style={{ color: 'var(--brand-text-secondary)', lineHeight: 1.6 }}
            >
              Daily blood pressure check-ins, medication tracking, and
              AI-powered insights — keeping you and your care team connected
              between appointments.
            </p>

            {/* Mobile illustration */}
            <div className="lg:hidden my-8">
              <BPCardIllustration />
            </div>

            {/* CTA Button */}
            <Link
              href="/welcome"
              className="w-full lg:w-[320px] py-4 px-8 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--brand-primary-purple)',
                color: '#FFFFFF',
                borderRadius: 'var(--brand-radius-pill)',
                boxShadow: 'var(--brand-shadow-button)',
                fontWeight: 700,
                fontSize: '1.0625rem',
              }}
            >
              Continue with Email
              <ArrowRight className="w-5 h-5" />
            </Link>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3">
              <div
                className="flex items-center gap-2 px-4 py-2"
                style={{
                  backgroundColor: '#F1F5F9',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  color: 'var(--brand-text-primary)',
                  fontWeight: 500,
                }}
              >
                <Lock className="w-4 h-4" />
                HIPAA Compliant
              </div>
              <div
                className="flex items-center gap-2 px-4 py-2"
                style={{
                  backgroundColor: '#F1F5F9',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  color: 'var(--brand-text-primary)',
                  fontWeight: 500,
                }}
              >
                <Building2 className="w-4 h-4" />
                Care Team Connected
              </div>
              <div
                className="flex items-center gap-2 px-4 py-2"
                style={{
                  backgroundColor: '#F1F5F9',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  color: 'var(--brand-text-primary)',
                  fontWeight: 500,
                }}
              >
                <BarChart3 className="w-4 h-4" />
                RPM Billing Ready
              </div>
            </div>

            {/* Footer Partner Text */}
            <p
              className="text-xs"
              style={{ color: 'var(--brand-text-muted)', lineHeight: 1.5 }}
            >
              Trusted by Cedar Hill Regional Medical Center and BridgePoint
              Hospital, Washington DC
            </p>
          </div>

          {/* RIGHT COLUMN - Desktop illustration */}
          <div className="hidden lg:flex relative w-full min-h-[600px] items-center justify-center">
            <BPCardIllustration />
          </div>
        </div>
      </div>
    </div>
  );
}
