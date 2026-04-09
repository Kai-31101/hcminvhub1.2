import React from 'react';
import { X } from 'lucide-react';
import designHeroSkyline from '../assets/design-hero-skyline.png';

type ExplorerActionModalProps = {
  children: React.ReactNode;
  closeLabel: string;
  leftDescription: string;
  leftIcon: React.ReactNode;
  leftTitle: string;
  onClose: () => void;
  panelTitle: string;
};

export function ExplorerActionModal({
  children,
  closeLabel,
  leftDescription,
  leftIcon,
  leftTitle,
  onClose,
  panelTitle,
}: ExplorerActionModalProps) {
  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-[rgba(15,23,42,0.72)] p-4 md:p-8">
      <div className="relative mx-auto w-full max-w-[980px] overflow-hidden border border-[#f0c9a7] bg-white shadow-[0_32px_72px_rgba(15,23,42,0.35)]">
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          title={closeLabel}
          className="absolute right-5 top-5 z-20 inline-flex h-11 w-11 items-center justify-center border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <X size={18} />
        </button>

        <div className="grid bg-white lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="relative hidden lg:block">
            <img src={designHeroSkyline} alt="" className="h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-[rgba(7,17,31,0.65)]" />

            <div className="absolute inset-0 flex items-center justify-center px-10">
              <div className="flex max-w-[640px] flex-col items-center text-center text-white">
                <div className="inline-flex h-[96px] w-[96px] items-center justify-center bg-[#ffe6d8] text-[#f97316] shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
                  {leftIcon}
                </div>
                <h2 className="mt-5 text-[34px] font-semibold leading-[1.12] text-white">{leftTitle}</h2>
                <p className="mt-4 max-w-[640px] text-[16px] leading-7 text-white/84">{leftDescription}</p>
              </div>
            </div>
          </div>

          <div className="bg-white">
            <div className="border-b border-[#d9e3ec] bg-[#5872A0] px-6 py-5 text-center text-[26px] font-semibold text-white md:px-8">
              {panelTitle}
            </div>
            <div className="px-6 py-6 md:px-8 md:py-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
