import React from 'react';
import { Facebook, Linkedin, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translateText } from '../utils/localization';

export function ExplorerFooter() {
  const { language } = useApp();
  const t = (value: string) => translateText(value, language);

  return (
    <footer className="bg-[#1e3a5f] py-16 text-white">
      <div className="mx-auto max-w-[1280px] px-8">
        <div className="grid gap-16 lg:grid-cols-3">
          <div className="flex flex-col gap-6">
            <div className="text-[20px] font-normal uppercase tracking-[2px] text-white">
              {t('HCMC Investment Hub')}
            </div>
            <div className="max-w-[320px] text-[12px] leading-[19.5px] text-[#cbd5e1]">
              <p>{t('The official portal for investment promotion and')}</p>
              <p>{t('facilitation in Ho Chi Minh City, managed by the')}</p>
              <p>{t('Investment Promotion Center (ITPC).')}</p>
            </div>
            <div className="flex items-start gap-4 text-[#cbd5e1]">
              <Facebook size={20} strokeWidth={1.75} />
              <Mail size={20} strokeWidth={1.75} />
              <Linkedin size={18} strokeWidth={1.75} />
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div className="text-[14px] uppercase tracking-[0.7px] text-[#f97316]">{t('Quick Links')}</div>
              <div className="flex flex-col gap-2 text-[12px] leading-4 text-[#cbd5e1]">
                <div>{t('Explore Projects')}</div>
                <div>{t('Interactive Map')}</div>
                <div>{t('Legal Framework')}</div>
                <div>{t('Investment News')}</div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="text-[14px] uppercase tracking-[0.7px] text-[#f97316]">{t('Support')}</div>
              <div className="flex flex-col gap-2 text-[12px] leading-4 text-[#cbd5e1]">
                <div>{t('Contact Us')}</div>
                <div>{t('FAQs')}</div>
                <div>{t('Sitemap')}</div>
                <div>{t('E-Governance')}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="text-[14px] uppercase tracking-[0.7px] text-[#f97316]">{t('About Arobid')}</div>
            <div className="text-[12px] leading-[19.5px] text-[#cbd5e1]">
              <p>{t('Powered by Arobid. Providing cutting-edge investment')}</p>
              <p>{t('management technology for modern government hubs.')}</p>
            </div>
            <div className="bg-[rgba(255,255,255,0.05)] p-4 text-[10px] italic leading-[15px] text-[#94a3b8]">
              {t('Technology Partner of HCMC Government Since 2024')}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-[rgba(255,255,255,0.1)] pt-[33px] text-[10px] text-[#94a3b8] sm:flex-row sm:items-center sm:justify-between">
          <div>{t('© 2024 HCMC Investment Promotion Center. All Rights Reserved.')}</div>
          <div className="flex items-center gap-6">
            <div>{t('Privacy Policy')}</div>
            <div>{t('Terms of Service')}</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
