import React from 'react';
import { X } from 'lucide-react';
import designHeroSkyline from '../assets/design-hero-skyline.png';

type ExplorerActionModalProps = {
  children: React.ReactNode;
  closeLabel?: string;
  leftDescription: string;
  leftIcon: React.ReactNode;
  leftTitle: string;
  onClose: () => void;
  panelTitle: string;
  sideImageSrc?: string;
  variant?: 'default' | 'investment-interest' | 'meeting-request' | 'investor-question';
};

export function ExplorerActionModal({
  children,
  closeLabel,
  leftDescription,
  leftIcon,
  leftTitle,
  onClose,
  panelTitle,
  sideImageSrc,
  variant = 'default',
}: ExplorerActionModalProps) {
  const resolvedCloseLabel = closeLabel ?? 'Close';

  const isFigmaFormVariant = variant === 'investment-interest' || variant === 'meeting-request' || variant === 'investor-question';

  if (isFigmaFormVariant) {
    const sidePanelHeight = variant === 'meeting-request' ? 'h-[876px]' : variant === 'investor-question' ? 'h-[628px]' : 'h-[674px]';

    return (
      <div className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-[rgba(15,23,42,0.72)] p-3 md:p-4">
        <div className="relative mx-auto w-full max-w-[980px] overflow-hidden rounded-xl bg-white p-3 shadow-[0_32px_72px_rgba(15,23,42,0.35)]">
          <button
            type="button"
            onClick={onClose}
            aria-label={resolvedCloseLabel}
            title={resolvedCloseLabel}
            className="absolute right-6 top-6 z-20 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f9fafb] text-[#1f2937] transition-colors hover:bg-[#f3f4f6]"
          >
            <X size={20} />
          </button>

          <div className="flex w-full flex-col bg-white lg:flex-row">
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl bg-white px-4 py-3 md:px-6 lg:pr-6">
              <div className="pointer-events-none absolute -left-10 top-12 h-[132px] w-[132px] opacity-[0.08]">
                <span className="absolute left-0 top-0 h-0 w-0 border-y-[30px] border-l-[48px] border-y-transparent border-l-[#1c7de8]" />
                <span className="absolute left-12 top-12 h-0 w-0 border-y-[24px] border-l-[38px] border-y-transparent border-l-[#ed6203]" />
                <span className="absolute left-4 top-24 h-0 w-0 border-y-[20px] border-l-[32px] border-y-transparent border-l-[#1c7de8]" />
              </div>
              <div className="relative z-10 flex w-full flex-col gap-4">
                <h2 className="text-center text-[28px] font-bold leading-9 text-[#1f2937]">{panelTitle}</h2>
                {children}
              </div>
            </div>

            <div className={`relative hidden ${sidePanelHeight} w-[296px] shrink-0 overflow-hidden rounded-r-lg lg:block`}>
              <img src={sideImageSrc ?? designHeroSkyline} alt="" className="h-full w-full object-cover object-center" />
              <div className="absolute inset-0 bg-[rgba(0,0,0,0.64)]" />
              <div className="pointer-events-none absolute inset-0 opacity-20">
                <span className="absolute right-8 top-24 h-0 w-0 border-y-[26px] border-l-[42px] border-y-transparent border-l-white" />
                <span className="absolute right-20 top-40 h-0 w-0 border-y-[18px] border-l-[30px] border-y-transparent border-l-[#ed6203]" />
                <span className="absolute right-12 bottom-28 h-0 w-0 border-y-[22px] border-l-[36px] border-y-transparent border-l-white" />
              </div>
              <div className="absolute left-1/2 top-1/2 flex w-[264px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center text-white">
                <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-white/12 text-white">
                  {leftIcon}
                </div>
                <h3 className="mt-5 text-[20px] font-semibold leading-7 text-white">{leftTitle}</h3>
                <p className="mt-4 text-[16px] leading-6 text-white">{leftDescription}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-[rgba(15,23,42,0.72)] p-4 md:p-8">
      <div className="relative mx-auto w-full max-w-[980px] overflow-hidden border border-[#f0c9a7] bg-white shadow-[0_32px_72px_rgba(15,23,42,0.35)]">
        <button
          type="button"
          onClick={onClose}
          aria-label={resolvedCloseLabel}
          title={resolvedCloseLabel}
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
