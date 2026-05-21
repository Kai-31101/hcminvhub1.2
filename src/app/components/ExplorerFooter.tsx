import React from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translateText } from '../utils/localization';
import { ArobidLogo } from './ArobidLogo';

export function ExplorerFooter() {
  const { language } = useApp();
  const t = (value: string) => translateText(value, language);

  return (
    <footer id="footer" className="border-t border-[#f9fafb] bg-white px-6 py-8 md:px-[78px]">
      <div className="mx-auto flex max-w-[1284px] flex-col gap-3">
        <div className="grid gap-8 lg:grid-cols-[365px_1fr_1fr_327px]">
          <div className="space-y-7">
            <div className="flex items-center gap-[13px]">
              <img src="/figma-homepage/header-logo.png" alt="" className="h-[50px] w-[50px] object-contain" />
              <div className="text-[22px] font-bold leading-6 text-[#1f2937]">HCMC<br />INVESTMENT HUB</div>
            </div>
            <p className="text-[12px] leading-4 text-[#6b7280]">&copy; 2026 HCMC Investment Promotion Center. All Rights Reserved.</p>
            <div className="flex gap-3 text-[#1f2937]">
              <span className="flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[#1877f2] text-[12px] font-bold text-white">f</span>
              <Mail size={25} />
              <span className="flex h-[25px] w-[25px] items-center justify-center rounded-sm bg-[#0a66c2] text-[12px] font-bold text-white">in</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-[16px] font-bold leading-6 text-[#ed6203]">HCMC INVESTMENT HUB</div>
            {['Projects', 'Projects Map View', 'Why Ho Chi Minh City?'].map((item) => (
              <div key={item} className="text-[14px] leading-5 text-[#030712]">{t(item)}</div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="text-[16px] font-bold leading-6 text-[#ed6203]">{t('SUPPORT')}</div>
            {['Quick Intake', 'Support', 'FAQs'].map((item) => (
              <div key={item} className="text-[14px] leading-5 text-[#030712]">{t(item)}</div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-2.5 py-1.5 text-[10px] leading-3 text-[#166534]">
              <CheckCircle2 size={15} />
              Digital Trade & Investment Infrastructure
            </div>
            <div className="flex flex-wrap items-center gap-[13px]">
              <span className="text-[12px] leading-4 text-[#030712]">{t('Powered by')}</span>
              <ArobidLogo className="h-[54px] w-[207px] shrink-0" />
            </div>
            <p className="text-[12px] leading-4 text-[#6b7280]">{t('Providing cutting-edge investment management technology for modern government hubs.')}</p>
          </div>
        </div>

        <div className="mt-3 border-t border-[#e5e7eb] pt-3 text-right text-[10px] leading-3 text-[#111827]">
          Privacy Policy&nbsp;&nbsp;&nbsp; Term of Services
        </div>
      </div>
    </footer>
  );
}
