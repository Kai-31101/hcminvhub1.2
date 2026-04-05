export interface InvestmentNewsItem {
  image: string;
  source: string;
  enDate: string;
  viDate: string;
  enTitle: string;
  viTitle: string;
  enSummary: string;
  viSummary: string;
  href: string;
}

export const investmentNews: InvestmentNewsItem[] = [
  {
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    enDate: 'April 3, 2026',
    viDate: '03/04/2026',
    source: 'VietnamPlus',
    enTitle: 'Vietnam\u2019s international financial centre strengthens global foothold',
    viTitle: 'Trung t\u00e2m t\u00e0i ch\u00ednh qu\u1ed1c t\u1ebf c\u1ee7a Vi\u1ec7t Nam gia t\u0103ng v\u1ecb th\u1ebf to\u00e0n c\u1ea7u',
    enSummary: 'Ho Chi Minh City climbed 11 places to rank 84th in the 2026 Global Financial Centres Index, reinforcing its push to become a regional financial hub.',
    viSummary: 'TP. H\u1ed3 Ch\u00ed Minh t\u0103ng 11 b\u1eadc l\u00ean v\u1ecb tr\u00ed 84 trong Ch\u1ec9 s\u1ed1 Trung t\u00e2m T\u00e0i ch\u00ednh To\u00e0n c\u1ea7u 2026, c\u1ee7ng c\u1ed1 \u0111\u1ecbnh h\u01b0\u1edbng tr\u1edf th\u00e0nh trung t\u00e2m t\u00e0i ch\u00ednh khu v\u1ef1c.',
    href: 'https://en.vietnamplus.vn/vietnams-international-financial-centre-strengthens-global-foothold-post340425.vnp',
  },
  {
    image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80',
    enDate: 'April 2, 2026',
    viDate: '02/04/2026',
    source: 'VietnamPlus',
    enTitle: 'Ho Chi Minh City promotes logistics supply chain cooperation with US state',
    viTitle: 'TP. H\u1ed3 Ch\u00ed Minh th\u00fac \u0111\u1ea9y h\u1ee3p t\u00e1c chu\u1ed7i cung \u1ee9ng logistics v\u1edbi bang c\u1ee7a M\u1ef9',
    enSummary: 'At the HCMC\u2013Oregon Economic Cooperation Forum, city officials highlighted logistics collaboration and the depth of US investment in the city.',
    viSummary: 'T\u1ea1i Di\u1ec5n \u0111\u00e0n H\u1ee3p t\u00e1c Kinh t\u1ebf TP.HCM - Oregon, l\u00e3nh \u0111\u1ea1o th\u00e0nh ph\u1ed1 nh\u1ea5n m\u1ea1nh h\u1ee3p t\u00e1c logistics v\u00e0 chi\u1ec1u s\u00e2u \u0111\u1ea7u t\u01b0 c\u1ee7a doanh nghi\u1ec7p M\u1ef9 v\u00e0o \u0111\u1ecba ph\u01b0\u01a1ng.',
    href: 'https://en.vietnamplus.vn/ho-chi-minh-city-promotes-logistics-supply-chain-cooperation-with-us-state-post340397.vnp',
  },
  {
    image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1200&q=80',
    enDate: 'March 30, 2026',
    viDate: '30/03/2026',
    source: 'Vietnam News',
    enTitle: 'FDI into HCM City jumps over 200% in first quarter',
    viTitle: 'FDI v\u00e0o TP.HCM t\u0103ng h\u01a1n 200% trong qu\u00fd I',
    enSummary: 'First-quarter 2026 FDI was estimated at nearly US$2.9 billion, pointing to strong investor interest despite global volatility.',
    viSummary: 'T\u1ed5ng v\u1ed1n FDI trong qu\u00fd I/2026 \u01b0\u1edbc \u0111\u1ea1t g\u1ea7n 2,9 t\u1ef7 USD, cho th\u1ea5y s\u1ee9c h\u00fat \u0111\u1ea7u t\u01b0 m\u1ea1nh m\u1ebd c\u1ee7a TP.HCM b\u1ea5t ch\u1ea5p bi\u1ebfn \u0111\u1ed9ng to\u00e0n c\u1ea7u.',
    href: 'https://vietnamnews.vn/economy/1778328/fdi-into-hcm-city-jumps-over-200-in-first-quarter.html',
  },
  {
    image: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=1200&q=80',
    enDate: 'March 2, 2026',
    viDate: '02/03/2026',
    source: 'VietnamPlus',
    enTitle: 'Ho Chi Minh City targets high-quality FDI inflows',
    viTitle: 'TP. H\u1ed3 Ch\u00ed Minh h\u01b0\u1edbng t\u1edbi d\u00f2ng v\u1ed1n FDI ch\u1ea5t l\u01b0\u1ee3ng cao',
    enSummary: 'The city set an FDI target of US$11 billion for 2026, prioritising high technology, logistics, data infrastructure, and financial-commercial centre projects.',
    viSummary: 'Th\u00e0nh ph\u1ed1 \u0111\u1eb7t m\u1ee5c ti\u00eau thu h\u00fat 11 t\u1ef7 USD FDI trong n\u0103m 2026, \u01b0u ti\u00ean c\u00f4ng ngh\u1ec7 cao, logistics, h\u1ea1 t\u1ea7ng d\u1eef li\u1ec7u v\u00e0 c\u00e1c d\u1ef1 \u00e1n trung t\u00e2m t\u00e0i ch\u00ednh - th\u01b0\u01a1ng m\u1ea1i.',
    href: 'https://en.vietnamplus.vn/ho-chi-minh-city-targets-high-quality-fdi-inflows-post338487.vnp',
  },
];
