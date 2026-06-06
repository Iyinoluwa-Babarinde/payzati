// Payzati Tax Engine — Real tax calculations for 5 African markets

export interface TaxBreakdown {
  country: string;
  grossSalary: number;
  currency: string;
  incomeTax: number;
  socialContributions: { name: string; amount: number }[];
  totalDeductions: number;
  netSalary: number;
}

// Nigeria PAYE Tax Bands (Annual → converted to monthly)
function calculateNigeriaTax(annualGross: number): number {
  const bands = [
    { limit: 300000, rate: 0.07 },
    { limit: 300000, rate: 0.11 },
    { limit: 500000, rate: 0.15 },
    { limit: 500000, rate: 0.19 },
    { limit: 1600000, rate: 0.21 },
    { limit: Infinity, rate: 0.24 },
  ];
  // Consolidated Relief Allowance: 20% of gross or 200,000, whichever is higher + 1% of gross
  const cra = Math.max(annualGross * 0.2, 200000) + annualGross * 0.01;
  const taxableIncome = Math.max(annualGross - cra, 0);
  let tax = 0, remaining = taxableIncome;
  for (const band of bands) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, band.limit);
    tax += taxable * band.rate;
    remaining -= taxable;
  }
  return tax;
}

// Kenya PAYE Tax Bands (Monthly)
function calculateKenyaTax(monthlyGross: number): number {
  const personalRelief = 2400;
  const bands = [
    { limit: 24000, rate: 0.10 },
    { limit: 8333, rate: 0.25 },
    { limit: 467667, rate: 0.30 },
    { limit: 300000, rate: 0.325 },
    { limit: Infinity, rate: 0.35 },
  ];
  let tax = 0, remaining = monthlyGross;
  for (const band of bands) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, band.limit);
    tax += taxable * band.rate;
    remaining -= taxable;
  }
  return Math.max(tax - personalRelief, 0);
}

// Ghana PAYE Tax Bands (Monthly)
function calculateGhanaTax(monthlyGross: number): number {
  const bands = [
    { limit: 402, rate: 0 },
    { limit: 110, rate: 0.05 },
    { limit: 130, rate: 0.10 },
    { limit: 3166.67, rate: 0.175 },
    { limit: 16000, rate: 0.25 },
    { limit: 29166.67, rate: 0.30 },
    { limit: Infinity, rate: 0.35 },
  ];
  let tax = 0, remaining = monthlyGross;
  for (const band of bands) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, band.limit);
    tax += taxable * band.rate;
    remaining -= taxable;
  }
  return tax;
}

// South Africa PAYE Tax Brackets (Annual → monthly)
function calculateSouthAfricaTax(annualGross: number): number {
  const brackets = [
    { limit: 237100, rate: 0.18 },
    { limit: 132100, rate: 0.26 },
    { limit: 167800, rate: 0.31 },
    { limit: 200500, rate: 0.36 },
    { limit: 160000, rate: 0.39 },
    { limit: 473900, rate: 0.41 },
    { limit: Infinity, rate: 0.45 },
  ];
  const primaryRebate = 17235;
  let tax = 0, remaining = annualGross;
  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, bracket.limit);
    tax += taxable * bracket.rate;
    remaining -= taxable;
  }
  return Math.max(tax - primaryRebate, 0);
}

// Egypt PAYE Tax (Annual → monthly)
function calculateEgyptTax(annualGross: number): number {
  const personalExemption = 15000;
  const taxable = Math.max(annualGross - personalExemption, 0);
  const brackets = [
    { limit: 30000, rate: 0 },
    { limit: 15000, rate: 0.10 },
    { limit: 15000, rate: 0.15 },
    { limit: 200000, rate: 0.20 },
    { limit: 400000, rate: 0.225 },
    { limit: Infinity, rate: 0.25 },
  ];
  let tax = 0, remaining = taxable;
  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const t = Math.min(remaining, bracket.limit);
    tax += t * bracket.rate;
    remaining -= t;
  }
  return tax;
}

export function calculateTax(monthlySalary: number, country: string, currency: string): TaxBreakdown {
  const annualSalary = monthlySalary * 12;
  let incomeTax = 0;
  const socialContributions: { name: string; amount: number }[] = [];

  switch (country.toLowerCase()) {
    case 'nigeria': {
      incomeTax = calculateNigeriaTax(annualSalary) / 12;
      socialContributions.push(
        { name: 'Pension (Employee 8%)', amount: monthlySalary * 0.08 },
        { name: 'NHF (2.5%)', amount: monthlySalary * 0.025 },
        { name: 'NHIS (5%)', amount: monthlySalary * 0.05 }
      );
      break;
    }
    case 'kenya': {
      incomeTax = calculateKenyaTax(monthlySalary);
      socialContributions.push(
        { name: 'SHIF (Medical 2.75%)', amount: monthlySalary * 0.0275 },
        { name: 'NSSF (Tier I)', amount: Math.min(monthlySalary * 0.06, 1080) },
        { name: 'Housing Levy (1.5%)', amount: monthlySalary * 0.015 }
      );
      break;
    }
    case 'ghana': {
      incomeTax = calculateGhanaTax(monthlySalary);
      socialContributions.push(
        { name: 'SSNIT (5.5%)', amount: monthlySalary * 0.055 },
        { name: 'Tier 2 Pension (5%)', amount: monthlySalary * 0.05 }
      );
      break;
    }
    case 'south africa': {
      incomeTax = calculateSouthAfricaTax(annualSalary) / 12;
      socialContributions.push(
        { name: 'UIF (1%)', amount: Math.min(monthlySalary * 0.01, 177.12) },
        { name: 'SDL (1%)', amount: monthlySalary * 0.01 }
      );
      break;
    }
    case 'egypt': {
      incomeTax = calculateEgyptTax(annualSalary) / 12;
      socialContributions.push(
        { name: 'Social Insurance (11%)', amount: monthlySalary * 0.11 }
      );
      break;
    }
    default: {
      incomeTax = monthlySalary * 0.15;
      socialContributions.push({ name: 'Estimated Social (5%)', amount: monthlySalary * 0.05 });
    }
  }

  const totalSocial = socialContributions.reduce((sum, c) => sum + c.amount, 0);
  const totalDeductions = incomeTax + totalSocial;

  return {
    country,
    grossSalary: monthlySalary,
    currency,
    incomeTax: Math.round(incomeTax * 100) / 100,
    socialContributions: socialContributions.map(c => ({ ...c, amount: Math.round(c.amount * 100) / 100 })),
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netSalary: Math.round((monthlySalary - totalDeductions) * 100) / 100,
  };
}

export const SUPPORTED_COUNTRIES = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', flag: '🇪🇬' },
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
];
