import React from 'react';
import { X } from 'lucide-react';
import designHeroSkyline from '../assets/design-hero-skyline.png';

type ExplorerActionModalProps = {
  children: React.ReactNode;
  leftDescription: string;
  leftIcon: React.ReactNode;
  leftTitle: string;
  onClose: () => void;
  panelTitle: string;
};

export function ExplorerActionModal({
  children,
  leftDescription,
  leftIcon,
  leftTitle,
  onClose,
  panelTitle,
}: ExplorerActionModalProps) {
  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-[rgba(15,23,42,0.72)] p-4 md:p-8">
      <div className="relative mx-auto w-full max-w-[1760px] overflow-hidden rounded-[40px] shadow-[0_32px_72px_rgba(15,23,42,0.35)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/90 bg-[rgba(255,255,255,0.06)] text-white backdrop-blur-sm transition-opacity hover:opacity-90"
        >
          <X size={28} />
        </button>

        <div className="grid min-h-[820px] bg-white lg:grid-cols-[1fr_1.08fr]">
          <div className="relative hidden lg:block">
            <img src={designHeroSkyline} alt="" className="h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-[rgba(7,17,31,0.62)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.22)_0%,rgba(7,17,31,0.68)_100%)]" />

            <div className="absolute inset-0 flex items-center justify-center px-12">
              <div className="flex max-w-[640px] flex-col items-center text-center text-white">
                <div className="inline-flex h-[124px] w-[124px] items-center justify-center rounded-[20px] bg-[#ffe6d8] text-[#f97316] shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
                  {leftIcon}
                </div>
                <h2 className="mt-6 text-[34px] font-semibold leading-[1.2] text-white">{leftTitle}</h2>
                <p className="mt-4 max-w-[640px] text-[19px] leading-[1.65] text-white/88">{leftDescription}</p>
              </div>
            </div>
          </div>

          <div className="bg-white">
            <div className="bg-[#5872A0] px-8 py-8 text-center text-[32px] font-semibold text-white md:px-12 md:py-10">
              {panelTitle}
            </div>
            <div className="px-6 py-8 md:px-10 md:py-10">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
