'use client';

import { X, Bell, CheckCircle2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { useState } from 'react';

export interface Alert {
  id: string;
  initials: string;
  name: string;
  location: string;
  reading: string;
  type: string;
  severity: 'HIGH' | 'MEDIUM';
  level: 'L1' | 'L2';
  color: 'red' | 'amber';
}

interface AlertPanelProps {
  alert: Alert;
  onClose: () => void;
  onReview: (id: string) => void;
  onSchedule: (alert: Alert) => void;
}

const bpTrendData = [
  { day: 'Mon', systolic: 155 },
  { day: 'Tue', systolic: 158 },
  { day: 'Wed', systolic: 162 },
  { day: 'Thu', systolic: 165 },
  { day: 'Fri', systolic: 168 },
  { day: 'Sat', systolic: 168 },
  { day: 'Sun', systolic: 168 },
];

const SPRING = { type: 'spring' as const, stiffness: 320, damping: 30 };

export default function AlertPanel({
  alert,
  onClose,
  onReview,
  onSchedule,
}: AlertPanelProps) {
  const [reviewedSuccess, setReviewedSuccess] = useState(false);

  const isLevel1 = alert.level === 'L1';
  const borderColor = isLevel1
    ? 'var(--brand-warning-amber)'
    : 'var(--brand-alert-red)';
  const bgColor = isLevel1
    ? 'var(--brand-warning-amber-light)'
    : 'var(--brand-alert-red-light)';
  const textColor = isLevel1
    ? 'var(--brand-warning-amber)'
    : 'var(--brand-alert-red)';

  const handleReview = () => {
    setReviewedSuccess(true);
    setTimeout(() => onReview(alert.id), 1300);
  };

  const panelContent = (
    <>
      {reviewedSuccess ? (
        <motion.div
          className="flex flex-col items-center justify-center h-full px-8 text-center"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
          <CheckCircle2
            className="w-16 h-16 mb-4"
            style={{ color: 'var(--brand-success-green)' }}
          />
          <h3
            className="text-xl font-bold mb-2"
            style={{ color: 'var(--brand-text-primary)' }}
          >
            Alert Reviewed
          </h3>
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
            {alert.name}&apos;s alert has been marked as reviewed and removed
            from the queue.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Panel Header */}
          <div
            className="px-6 py-5"
            style={{ borderBottom: '1px solid var(--brand-border)' }}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" style={{ color: textColor }} />
                <h2
                  className="text-base font-semibold"
                  style={{ color: 'var(--brand-text-primary)' }}
                >
                  Care Team Alert
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: bgColor, color: textColor }}
                >
                  LEVEL {alert.level === 'L1' ? '1' : '2'}
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <X
                    className="w-5 h-5"
                    style={{ color: 'var(--brand-text-muted)' }}
                  />
                </button>
              </div>
            </div>
            <p
              className="text-[13px]"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              {isLevel1
                ? 'Follow up required within 24 hours'
                : 'Immediate action required'}
            </p>
          </div>

          {/* Patient Card */}
          <div
            className="px-6 py-4"
            style={{ borderBottom: '1px solid var(--brand-border)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold shrink-0"
                style={{ backgroundColor: textColor }}
              >
                {alert.initials}
              </div>
              <div className="flex-1">
                <h3
                  className="text-base font-semibold mb-0.5"
                  style={{ color: 'var(--brand-text-primary)' }}
                >
                  {alert.name}
                </h3>
                <p
                  className="text-[13px] mb-2"
                  style={{ color: 'var(--brand-text-muted)' }}
                >
                  {alert.location}
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                    style={{
                      borderColor: 'var(--brand-border)',
                      color: 'var(--brand-text-secondary)',
                    }}
                  >
                    AmeriHealth Medicaid
                  </div>
                  <div
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: 'var(--brand-accent-teal-light)',
                      color: 'var(--brand-accent-teal)',
                    }}
                  >
                    Cedar Hill Patient
                  </div>
                </div>
                <p
                  className="text-[11px]"
                  style={{ color: 'var(--brand-text-muted)' }}
                >
                  DOB: March 15, 1962 &middot; ID: HC-20019-0042
                </p>
              </div>
            </div>
          </div>

          {/* Alert Details Box */}
          <div className="px-6 pt-4 pb-3">
            <div className="rounded-xl p-4" style={{ backgroundColor: bgColor }}>
              <h4
                className="text-[13px] font-semibold mb-3"
                style={{ color: textColor }}
              >
                Why this alert was triggered:
              </h4>
              <div className="space-y-2">
                {[
                  `Elevated BP: ${alert.reading} (Baseline: 142/88)`,
                  '3 consecutive elevated readings — Mar 19, 20, 21',
                  'Medication missed: 2 of last 3 days',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.75 shrink-0"
                      style={{ backgroundColor: textColor }}
                    />
                    <p
                      className="text-[13px] leading-5"
                      style={{ color: 'var(--brand-text-primary)' }}
                    >
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Summary Box */}
          <div className="px-6 pb-3">
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'var(--brand-primary-purple-light)',
              }}
            >
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-3"
                style={{
                  backgroundColor: 'var(--brand-primary-purple)',
                  color: 'white',
                }}
              >
                AI Summary
              </div>
              <p
                className="text-[13px] leading-5"
                style={{ color: 'var(--brand-text-primary)' }}
              >
                Patient shows a consistent upward BP trend over 72 hours with
                concurrent medication non-adherence. Recommend proactive care
                team outreach within 24 hours to assess barriers to medication
                compliance.
              </p>
            </div>
          </div>

          {/* Communication Preference */}
          <div className="px-6 pb-3">
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'var(--brand-accent-teal-light)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <h4
                  className="text-[13px] font-semibold"
                  style={{ color: 'var(--brand-accent-teal)' }}
                >
                  Audio-First Patient
                </h4>
              </div>
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: 'var(--brand-text-muted)' }}
              >
                Use verbal communication and visual aids at next visit. Patient
                prefers spoken over written instructions.
              </p>
            </div>
          </div>

          {/* BP Mini Chart */}
          <div className="px-6 pb-4">
            <h4
              className="text-[13px] font-semibold mb-3"
              style={{ color: 'var(--brand-text-primary)' }}
            >
              7-Day BP Trend
            </h4>
            <div style={{ width: '100%', height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={bpTrendData}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                  />
                  <YAxis
                    domain={[130, 180]}
                    ticks={[130, 150, 170]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                  />
                  <ReferenceLine
                    y={160}
                    stroke="#DC2626"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                  <Line
                    type="monotone"
                    dataKey="systolic"
                    stroke={textColor}
                    strokeWidth={2}
                    dot={{ fill: textColor, r: 3 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className="sticky bottom-0 bg-white px-6 py-5 space-y-3"
            style={{
              borderTop: '1px solid var(--brand-border)',
              boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
            }}
          >
            <motion.button
              onClick={handleReview}
              className="w-full h-12 rounded-full text-white font-bold text-sm flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--brand-primary-purple)',
                boxShadow: 'var(--brand-shadow-button)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark as Reviewed
            </motion.button>
            <motion.button
              onClick={() => onSchedule(alert)}
              className="w-full h-11 rounded-full font-bold text-sm border-2 bg-white flex items-center justify-center gap-2"
              style={{
                borderColor: 'var(--brand-primary-purple)',
                color: 'var(--brand-primary-purple)',
              }}
              whileHover={{ scale: 1.02, backgroundColor: '#f5f0ff' }}
              whileTap={{ scale: 0.97 }}
            >
              Schedule Follow-up Call
            </motion.button>
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      {/* Desktop backdrop */}
      <motion.div
        className="hidden lg:block fixed inset-0 z-40"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.28) 60%, transparent 60%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      {/* Desktop panel */}
      <motion.div
        className="hidden lg:flex lg:flex-col fixed right-0 top-0 h-full bg-white z-50 overflow-y-auto"
        style={{
          width: '40%',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
          borderTop: `4px solid ${borderColor}`,
        }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={SPRING}
        onClick={(e) => e.stopPropagation()}
      >
        {panelContent}
      </motion.div>

      {/* Mobile backdrop */}
      <motion.div
        className="lg:hidden fixed inset-0 z-40 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
      />
      {/* Mobile bottom sheet */}
      <motion.div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white overflow-y-auto flex flex-col"
        style={{
          height: '90dvh',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          borderTop: `4px solid ${borderColor}`,
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={SPRING}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: 'var(--brand-border)' }}
          />
        </div>
        {panelContent}
      </motion.div>
    </>
  );
}
