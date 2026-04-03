'use client';

import Image from 'next/image';
import { Mic, Send, Users, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';

export default function About() {
  const { t } = useLanguage();

  const principles = [
    { num: '01', title: t('about.principle1Title'), desc: t('about.principle1Desc') },
    { num: '02', title: t('about.principle2Title'), desc: t('about.principle2Desc') },
    { num: '03', title: t('about.principle3Title'), desc: t('about.principle3Desc') },
    { num: '04', title: t('about.principle4Title'), desc: t('about.principle4Desc') },
  ];

  return (
    <div className="bg-[#fef7ff] flex flex-col min-h-screen">
      <LandingHeader activeLink="About" />

      <main className="flex flex-col items-center pt-[64px]">
        {/* ============ HERO SECTION ============ */}
        <section className="w-full bg-[#fef7ff] flex items-start lg:items-center justify-center h-[calc(100vh-64px)] px-6 md:px-8 py-6 md:py-10 overflow-hidden">
          <div className="max-w-[1280px] w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="flex flex-col gap-5 justify-center">
              <div className="bg-[#7b00e0] inline-flex items-center justify-center px-4 py-2 rounded-full w-fit">
                <span className="font-bold text-white text-sm tracking-widest uppercase">{t('about.visionBadge')}</span>
              </div>
              <h1 className="font-extrabold text-[#191c1d] text-4xl md:text-5xl lg:text-[72px] leading-[1.1] tracking-tight">
                {t('about.heroTitle').split(t('about.heroTitleGap')).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && <span className="text-[#7b00e0]">{t('about.heroTitleGap')}</span>}
                  </span>
                ))}
              </h1>
              <p className="text-[#4c4355] text-lg md:text-xl leading-relaxed max-w-[576px]">
                {t('about.heroDesc')}
              </p>
            </div>

            {/* Chat Mockup */}
            <div className="flex items-center justify-center relative">
              <div className="absolute -right-20 -top-16 w-96 h-96 rounded-full bg-[rgba(92,0,169,0.05)] blur-[32px]" />
              <div className="relative">
                <div className="bg-white border border-[rgba(207,194,216,0.2)] rounded-[40px] p-4 shadow-2xl relative z-10 w-full max-w-[448px]" style={{ transform: 'rotate(2deg)' }}>
                  <div className="bg-[#f3f4f5] rounded-[32px] p-6 min-h-[500px] flex flex-col">
                    <div className="flex items-center gap-3 pb-4 border-b border-[rgba(207,194,216,0.1)]">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundImage: 'linear-gradient(135deg, #7b00e0 0%, #5c00a9 100%)' }}>
                        <Image src="/logo2.png" alt="" width={22} height={22} />
                      </div>
                      <div>
                        <p className="font-bold text-[#191c1d] text-sm">{t('about.assistantName')}</p>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                          <span className="text-[#16a34a] text-[10px]">{t('about.online')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4 pt-6 flex-1">
                      <div className="bg-white rounded-tr-2xl rounded-br-2xl rounded-bl-2xl p-4 shadow-sm border border-[rgba(207,194,216,0.1)] max-w-[85%]">
                        <p className="text-[#191c1d] text-sm leading-relaxed">{t('about.chatGreeting')}</p>
                      </div>
                      <div className="self-end bg-[#5c00a9] rounded-tl-2xl rounded-bl-2xl rounded-br-2xl p-4 shadow-sm">
                        <p className="text-white text-sm font-medium">135/85</p>
                      </div>
                      <div className="bg-white rounded-tr-2xl rounded-br-2xl rounded-bl-2xl p-4 shadow-sm border border-[rgba(207,194,216,0.1)] max-w-[85%]">
                        <p className="text-[#191c1d] text-sm leading-relaxed">{t('about.chatReply')}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-full p-2 flex items-center gap-3 mt-6" style={{ boxShadow: '0 0 0 2px rgba(92,0,169,0.2), inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                      <div className="bg-[#edeeef] w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                        <Mic className="w-4 h-4 text-[#4c4355]" />
                      </div>
                      <span className="text-[#4c4355]/60 text-xs flex-1">{t('about.chatPlaceholder')}</span>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md" style={{ backgroundImage: 'linear-gradient(135deg, #7b00e0 0%, #5c00a9 100%)' }}>
                        <Send className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-8 -left-10 bg-white rounded-3xl p-6 shadow-xl border border-[rgba(207,194,216,0.1)] z-20">
                  <p className="font-bold text-[#4c4355] text-[10px] tracking-wider uppercase mb-2">{t('about.healthScore')}</p>
                  <div className="w-20 h-1.5 rounded-full bg-gradient-to-r from-[#5c00a9] to-[#b0003b] mb-3" />
                  <div className="flex items-end gap-2">
                    <span className="font-bold text-[#191c1d] text-3xl leading-none">92</span>
                    <span className="font-bold text-[#16a34a] text-xs mb-1">+2.4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ MISSION SECTION ============ */}
        <section className="w-full bg-[#fef7ff] py-16 md:py-20">
          <div className="max-w-[1280px] mx-auto px-6 md:px-8 flex flex-col items-center gap-16 md:gap-24">
            <div className="max-w-[896px] flex flex-col items-center gap-8 text-center">
              <h2 className="font-semibold text-[#7b00e0] text-3xl md:text-4xl lg:text-[48px]">{t('about.missionTitle')}</h2>
              <p className="text-[#1f1924] text-xl md:text-2xl lg:text-[30px] leading-snug">{t('about.missionQuote')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
              {principles.map((p) => (
                <div key={p.num} className="bg-white rounded-[32px] border-b-4 border-[#5c00a9] p-8 md:p-10 flex flex-col gap-4">
                  <span className="text-[#7b00e0] text-4xl">{p.num}</span>
                  <h3 className="text-[#1f1924] text-xl leading-snug font-normal">{p.title}</h3>
                  <p className="text-[#4c4355] text-base leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ SILENT LITERACY SECTION ============ */}
        <section className="w-full px-6 md:px-8 py-16 md:py-20">
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-center">
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-[-80px] rounded-full border border-[#eedbff] opacity-10" />
                <div className="absolute inset-[-40px] rounded-full border-2 border-[#eedbff] opacity-30" />
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(31,25,36,0.06)]" style={{ backgroundImage: 'linear-gradient(135deg, #5c00a9 0%, #7b00e0 100%)' }}>
                  <Mic className="w-10 h-10 md:w-14 md:h-14 text-white" />
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 flex flex-col gap-8">
              <h2 className="font-semibold text-[#7b00e0] text-3xl md:text-4xl lg:text-[48px]">{t('about.silentLiteracyTitle')}</h2>
              <div className="flex flex-col gap-6">
                <p className="text-[#1f1924] text-lg md:text-xl leading-relaxed">
                  {t('about.silentLiteracyDesc1').split('<highlight>').map((part, i) => {
                    if (i === 0) return <span key={i}>{part}</span>;
                    const [highlighted, rest] = part.split('</highlight>');
                    return <span key={i}><span className="text-[#5c00a9]">{highlighted}</span>{rest}</span>;
                  })}
                </p>
                <p className="text-[#4c4355] text-base md:text-lg leading-relaxed">{t('about.silentLiteracyDesc2')}</p>
              </div>
              <div className="bg-[#f5eafa] rounded-[32px] p-8 flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <Users className="w-5 h-5 text-[#7b00e0] shrink-0 mt-0.5" />
                  <span className="text-[#1f1924] text-base">{t('about.silentFeature1')}</span>
                </div>
                <div className="flex items-start gap-4">
                  <ShieldCheck className="w-5 h-5 text-[#7b00e0] shrink-0 mt-0.5" />
                  <span className="text-[#1f1924] text-base">{t('about.silentFeature2')}</span>
                </div>
                <div className="flex items-start gap-4">
                  <HeartHandshake className="w-5 h-5 text-[#7b00e0] shrink-0 mt-0.5" />
                  <span className="text-[#1f1924] text-base">{t('about.silentFeature3')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingFooter />
      </main>
    </div>
  );
}
