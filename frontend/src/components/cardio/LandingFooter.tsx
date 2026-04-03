'use client';

import Image from 'next/image';
import { Share2, Mail, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LandingFooter() {
  const { t } = useLanguage();

  return (
    <footer
      className="w-full"
      id="contact"
      style={{ backgroundImage: 'linear-gradient(159deg, #5c00a9 0%, #a04cee 46%, #c79afd 93%)' }}
    >
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 px-8 md:px-12 py-16 md:py-20">
        {/* Col 1 - Brand */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-1">
            <Image src="/logo2.png" alt="Healplace Cardio" width={42} height={42} />
            <span className="font-bold text-white text-2xl tracking-tight">
              Healplace Cardio
            </span>
          </div>
          <p className="text-white/70 text-base leading-relaxed">
            {t('landing.copyright')}
          </p>
        </div>

        {/* Col 2 - Links */}
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <span className="font-bold text-white text-base">{t('landing.company')}</span>
            <a href="#" className="text-white/70 font-semibold text-base hover:text-white transition-colors">{t('landing.mission')}</a>
            <a href="#" className="text-white/70 font-semibold text-base hover:text-white transition-colors">{t('landing.patients')}</a>
            <a href="#" className="text-white/70 font-semibold text-base hover:text-white transition-colors">{t('landing.careTeams')}</a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-bold text-white text-base">{t('landing.legal')}</span>
            <a href="#" className="text-white/70 font-semibold text-base hover:text-white transition-colors">{t('landing.privacy')}</a>
            <a href="#" className="text-white/70 font-semibold text-base hover:text-white transition-colors">{t('landing.terms')}</a>
          </div>
        </div>

        {/* Col 3 - Social */}
        <div className="flex items-start gap-4">
          <a href="#" className="bg-[#f5eafa] w-12 h-12 rounded-full flex items-center justify-center hover:bg-white transition-colors">
            <Share2 className="w-5 h-5 text-[#5c00a9]" />
          </a>
          <a href="#" className="bg-[#f5eafa] w-12 h-12 rounded-full flex items-center justify-center hover:bg-white transition-colors">
            <Mail className="w-5 h-5 text-[#5c00a9]" />
          </a>
          <a href="#" className="bg-[#f5eafa] w-12 h-12 rounded-full flex items-center justify-center hover:bg-white transition-colors">
            <Settings className="w-5 h-5 text-[#5c00a9]" />
          </a>
        </div>
      </div>
    </footer>
  );
}
