import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Language } from '../utils/localization';

type LanguageDropdownProps = {
  variant?: 'light' | 'dark';
};

const languageOptions: Array<{ code: Language; label: string; flag: 'us' | 'vn' }> = [
  { code: 'en', label: 'English', flag: 'us' },
  { code: 'vi', label: 'Tiếng Việt', flag: 'vn' },
];

const USA_FLAG_ICON_URL = 'https://www.shutterstock.com/image-vector/usa-flag-round-icon-isolated-260nw-2571641559.jpg';

function FlagCircle({ flag, size = 'md' }: { flag: 'us' | 'vn'; size?: 'sm' | 'md' }) {
  const dimensionClass = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';

  if (flag === 'vn') {
    return (
      <span className={`relative inline-flex ${dimensionClass} shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#da251d] shadow-[0px_1px_2px_rgba(0,0,0,0.10)]`}>
        <span className="text-[12px] leading-none text-[#ffcd00]">★</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex ${dimensionClass} shrink-0 overflow-hidden rounded-full bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.10)]`}>
      <img src={USA_FLAG_ICON_URL} alt="USA flag" className="h-full w-full object-cover" />
    </span>
  );
}

export function LanguageDropdown({ variant = 'light' }: LanguageDropdownProps) {
  const { language, setLanguage } = useApp();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedLanguage = languageOptions.find((option) => option.code === language) ?? languageOptions[0];
  const isDark = variant === 'dark';

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div ref={containerRef} className="relative hidden sm:inline-flex">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label="Select language"
        className={`inline-flex items-center justify-center gap-2 transition-colors ${
          isDark
            ? 'text-[18px] font-semibold leading-7 text-white hover:text-[#ed6203]'
            : 'text-[14px] font-medium leading-5 text-[#455F87] hover:text-[#1E3A5F]'
        }`}
      >
        <FlagCircle flag={selectedLanguage.flag} />
        <span>{selectedLanguage.code.toUpperCase()}</span>
        <ChevronDown size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[80] mt-2 w-40 border border-[#e5e7eb] bg-white py-1 shadow-xl">
          {languageOptions.map((option) => {
            const active = option.code === language;

            return (
              <button
                key={option.code}
                type="button"
                onClick={() => {
                  setLanguage(option.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] leading-5 transition-colors ${
                  active ? 'bg-[#fff7ed] font-semibold text-[#9D4300]' : 'text-[#1f2937] hover:bg-[#f8fafc]'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <FlagCircle flag={option.flag} size="sm" />
                  <span>{option.code.toUpperCase()}</span>
                  <span className="text-[#64748b]">{option.label}</span>
                </span>
                {active ? <Check size={14} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
