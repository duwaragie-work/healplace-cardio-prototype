'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  Bell,
  Flame,
  Clock,
  ArrowRight,
  Home,
  Plus,
  MessageCircle,
  User,
} from 'lucide-react';

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

const bpData = [
  { day: 'Mon', systolic: 145, diastolic: 92 },
  { day: 'Tue', systolic: 142, diastolic: 88 },
  { day: 'Wed', systolic: 148, diastolic: 94 },
  { day: 'Thu', systolic: 138, diastolic: 85 },
  { day: 'Fri', systolic: 142, diastolic: 88 },
  { day: 'Sat', systolic: 140, diastolic: 86 },
  { day: 'Sun', systolic: 142, diastolic: 88 },
];

export default function Dashboard() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--brand-background)' }}
    >
      {/* Top Navigation Bar */}
      <nav
        className="bg-white h-16 flex items-center justify-between px-4 md:px-8"
        style={{ borderBottom: '1px solid var(--brand-border)' }}
      >
        <Link href="/dashboard" className="flex items-center gap-3">
          <LogoIcon className="w-10 h-10" />
          <span
            className="hidden md:block text-xl font-bold"
            style={{ color: 'var(--brand-primary-purple)' }}
          >
            Healplace Cardio
          </span>
        </Link>

        {/* Center: Nav Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-8">
          <a
            href="#"
            className="text-sm pb-1 relative"
            style={{ color: 'var(--brand-primary-purple)', fontWeight: 600 }}
          >
            Home
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: 'var(--brand-primary-purple)' }}
            />
          </a>
          <button
            className="text-sm"
            style={{ color: 'var(--brand-text-secondary)', fontWeight: 600 }}
            onClick={() => router.push('/check-in')}
          >
            Check-In
          </button>
          <button
            className="text-sm"
            style={{ color: 'var(--brand-text-secondary)', fontWeight: 600 }}
            onClick={() => router.push('/chat')}
          >
            Chat
          </button>
          <a
            href="#"
            className="text-sm"
            style={{ color: 'var(--brand-text-secondary)', fontWeight: 600 }}
          >
            History
          </a>
          <a
            href="#"
            className="text-sm"
            style={{ color: 'var(--brand-text-secondary)', fontWeight: 600 }}
          >
            Profile
          </a>
        </div>

        {/* Right: Bell + Avatar */}
        <div className="flex items-center gap-4">
          <button className="relative">
            <Bell
              className="w-5 h-5"
              style={{ color: 'var(--brand-warning-amber)' }}
            />
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: 'var(--brand-warning-amber)' }}
            >
              1
            </span>
          </button>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
            style={{ backgroundColor: 'var(--brand-primary-purple)' }}
          >
            MJ
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-8">
        {/* ROW 1 - Greeting + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5 mb-5">
          {/* Greeting Card */}
          <div
            className="md:col-span-3 lg:col-span-2 p-6 md:p-7 rounded-[20px] relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #7B00E0 0%, #9333EA 100%)',
            }}
          >
            <h2 className="text-white text-2xl font-bold mb-2">
              Good morning, Marcus
            </h2>
            <p
              className="text-white mb-4"
              style={{ opacity: 0.8, fontSize: '14px' }}
            >
              Your care team is monitoring your progress
            </p>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-xs font-semibold"
              style={{ color: 'var(--brand-primary-purple)' }}
            >
              Cedar Hill Connected
            </div>
          </div>

          {/* Stat Card 1 - BP */}
          <div
            className="bg-white p-4 rounded-2xl"
            style={{ boxShadow: 'var(--brand-shadow-card)' }}
          >
            <div
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--brand-primary-purple)' }}
            >
              142/88
            </div>
            <div
              className="text-xs mb-2"
              style={{ color: 'var(--brand-text-secondary)' }}
            >
              mmHg
            </div>
            <div
              className="text-xs mb-2"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              Today&apos;s BP
            </div>
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                backgroundColor: 'var(--brand-success-green-light)',
                color: 'var(--brand-success-green)',
              }}
            >
              Within Target
            </div>
          </div>

          {/* Stat Card 2 - Medication Streak */}
          <div
            className="bg-white p-4 rounded-2xl"
            style={{ boxShadow: 'var(--brand-shadow-card)' }}
          >
            <Flame
              className="w-6 h-6 mb-2"
              style={{ color: 'var(--brand-warning-amber)' }}
            />
            <div
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--brand-text-primary)' }}
            >
              3 day
            </div>
            <div
              className="text-xs"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              streak
            </div>
            <div
              className="text-xs mt-1"
              style={{ color: 'var(--brand-text-secondary)' }}
            >
              Medication taken
            </div>
          </div>

          {/* Stat Card 3 - Interactions */}
          <div
            className="bg-white p-4 rounded-2xl"
            style={{ boxShadow: 'var(--brand-shadow-card)' }}
          >
            <div
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--brand-accent-teal)' }}
            >
              1,247
            </div>
            <div
              className="text-xs mb-1"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              This month
            </div>
            <div
              className="text-xs"
              style={{ color: 'var(--brand-text-secondary)' }}
            >
              Total interactions
            </div>
          </div>
        </div>

        {/* ROW 2 - Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* BP Trend Card */}
          <div
            className="bg-white p-6 rounded-2xl"
            style={{ boxShadow: 'var(--brand-shadow-card)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-base font-semibold"
                style={{ color: 'var(--brand-text-primary)' }}
              >
                Your BP This Week
              </h3>
              <a
                href="#"
                className="text-xs"
                style={{ color: 'var(--brand-accent-teal)' }}
              >
                View full history &rarr;
              </a>
            </div>

            <div className="h-48 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bpData}>
                  <defs>
                    <linearGradient
                      id="colorSystolic"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#7B00E0"
                        stopOpacity={0.08}
                      />
                      <stop
                        offset="95%"
                        stopColor="#7B00E0"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={true}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                  />
                  <YAxis
                    domain={[130, 160]}
                    ticks={[130, 140, 150, 160]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="systolic"
                    stroke="#7B00E0"
                    strokeWidth={2}
                    fill="url(#colorSystolic)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <p
              className="text-xs"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              Baseline: 138/85 mmHg
            </p>
          </div>

          {/* Today's Check-In CTA */}
          <div
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: 'var(--brand-primary-purple-light)',
              border: '1px solid #E9D5FF',
            }}
          >
            <Clock
              className="w-8 h-8 mb-3"
              style={{ color: 'var(--brand-primary-purple)' }}
            />
            <h3
              className="text-base font-semibold mb-1"
              style={{ color: 'var(--brand-text-primary)' }}
            >
              Today&apos;s Check-In
            </h3>
            <p
              className="text-xs mb-3"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              Takes about 3 minutes
            </p>
            <div
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{
                backgroundColor: 'var(--brand-warning-amber-light)',
                color: 'var(--brand-warning-amber)',
              }}
            >
              Due today
            </div>

            <button
              onClick={() => router.push('/check-in')}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-full text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--brand-primary-purple)',
                boxShadow: 'var(--brand-shadow-button)',
              }}
            >
              Start Today&apos;s Check-In
              <ArrowRight className="w-4 h-4" />
            </button>

            <p
              className="text-[11px] mt-3 text-center"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              Last check-in: Yesterday, 9:02 AM
            </p>
          </div>

          {/* Recent Alerts */}
          <div
            className="bg-white p-6 rounded-2xl"
            style={{ boxShadow: 'var(--brand-shadow-card)' }}
          >
            <h3
              className="text-base font-semibold mb-4"
              style={{ color: 'var(--brand-text-primary)' }}
            >
              Recent Alerts
            </h3>

            {/* Alert 1 */}
            <div
              className="p-3 rounded-xl mb-3 relative"
              style={{
                backgroundColor: 'var(--brand-warning-amber-light)',
                borderLeft: '3px solid var(--brand-warning-amber)',
              }}
            >
              <div className="flex items-start justify-between mb-1">
                <p
                  className="text-xs font-semibold"
                  style={{ color: 'var(--brand-text-primary)' }}
                >
                  Elevated BP — March 21
                </p>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: 'var(--brand-success-green)' }}
                >
                  Acknowledged
                </span>
              </div>
              <p
                className="text-xs"
                style={{ color: 'var(--brand-text-muted)' }}
              >
                Care team notified
              </p>
            </div>

            {/* Alert 2 */}
            <div
              className="p-3 rounded-xl"
              style={{
                backgroundColor: 'var(--brand-success-green-light)',
                borderLeft: '3px solid var(--brand-success-green)',
              }}
            >
              <p
                className="text-xs font-semibold mb-1"
                style={{ color: 'var(--brand-text-primary)' }}
              >
                Medication streak: 3 days
              </p>
              <p
                className="text-xs"
                style={{ color: 'var(--brand-text-muted)' }}
              >
                Keep it up!
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white h-16 flex items-center justify-around"
        style={{
          borderTop: '1px solid var(--brand-border)',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        }}
      >
        <Link href="/dashboard" className="flex flex-col items-center gap-1">
          <Home
            className="w-5 h-5"
            style={{ color: 'var(--brand-primary-purple)' }}
          />
          <span
            className="text-[10px] font-semibold"
            style={{ color: 'var(--brand-primary-purple)' }}
          >
            Home
          </span>
        </Link>
        <Link href="/check-in" className="flex flex-col items-center gap-1">
          <Plus
            className="w-5 h-5"
            style={{ color: 'var(--brand-text-muted)' }}
          />
          <span
            className="text-[10px]"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            Check-In
          </span>
        </Link>
        <Link href="/chat" className="flex flex-col items-center gap-1">
          <MessageCircle
            className="w-5 h-5"
            style={{ color: 'var(--brand-text-muted)' }}
          />
          <span
            className="text-[10px]"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            Chat
          </span>
        </Link>
        <button className="flex flex-col items-center gap-1">
          <User
            className="w-5 h-5"
            style={{ color: 'var(--brand-text-muted)' }}
          />
          <span
            className="text-[10px]"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            Profile
          </span>
        </button>
      </nav>
    </div>
  );
}
