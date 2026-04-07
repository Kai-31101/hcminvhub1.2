import React from 'react';
import { Globe } from 'lucide-react';
import { Link } from 'react-router';
import { useApp } from '../context/AppContext';
import { translateText } from '../utils/localization';

type HeaderNavItem = {
  label: string;
  to?: string;
  onClick?: () => void;
};

type PublicPortalHeaderProps = {
  items?: HeaderNavItem[];
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  actionTo?: string;
};

export function PublicPortalHeader({
  items = [],
  title,
  subtitle,
  actionLabel,
  actionTo,
}: PublicPortalHeaderProps) {
  const { language, setLanguage } = useApp();
  const t = (value: string) => translateText(value, language);

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(224,192,177,0.12)] bg-[#F7F9FB]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-4 py-3 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#E0E3E5] text-[#455F87]">
            <Globe size={20} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[18px] font-bold uppercase tracking-[-0.5px] text-[#1E3A5F]">
              {title ?? t('Investor Portal')}
            </div>
            <div className="truncate text-[10px] uppercase tracking-[0.05em] text-[#455F87]/70">
              {subtitle ?? t('HCMC Investment Hub')}
            </div>
          </div>
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          {items.map((item) => {
            if (item.to) {
              return (
                <Link
                  key={`${item.label}-${item.to}`}
                  to={item.to}
                  className="text-[14px] font-medium leading-5 text-[#455F87] transition-colors hover:text-[#1E3A5F]"
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="text-[14px] font-medium leading-5 text-[#455F87] transition-colors hover:text-[#1E3A5F]"
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden h-9 items-center border border-[rgba(69,95,135,0.16)] bg-white p-1 shadow-[0px_1px_2px_rgba(0,0,0,0.04)] sm:inline-flex">
            {(['vi', 'en'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLanguage(option)}
                className={`inline-flex h-7 min-w-[44px] items-center justify-center px-3 text-[13px] font-semibold leading-5 transition-colors ${
                  language === option
                    ? 'bg-[linear-gradient(22.81deg,#9D4300_0%,#F97316_100%)] text-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)]'
                    : 'text-[#455F87] hover:bg-[#eef2f6]'
                }`}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>

          {actionLabel && actionTo ? (
            <Link
              to={actionTo}
              className="inline-flex h-9 items-center gap-2 rounded-[4px] bg-[linear-gradient(22.81deg,#9D4300_0%,#F97316_100%)] px-5 text-[14px] font-bold text-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] transition-opacity hover:opacity-95"
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
