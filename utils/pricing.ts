import { PricingOption, Country } from '../types';

export const calculatePricingOptions = (
  country: Country,
  discountType: 'Standard' | 'Couple' | 'Reference' | 'Group' | 'Skilled' | 'Custom'
): PricingOption[] => {
  const format = (num: number) => `€${Math.round(num).toLocaleString()}`;
  
  // 1. Discount Percent Calculation
  let discountPercent = 0;
  if (discountType === 'Couple') discountPercent = country.discountCouple;
  else if (discountType === 'Reference') discountPercent = country.discountReference;
  else if (discountType === 'Group') discountPercent = country.discountGroup;
  else if (discountType === 'Skilled') discountPercent = country.discountSkilled;
  else if (discountType === 'Custom') discountPercent = country.discountCustom;

  // 2. Net Base Calculation (Base - Profile Discount)
  const netBase = country.basePrice * (1 - (discountPercent / 100));

  // Helper for VAT and Reg Fee
  const applyTaxAndFee = (planBase: number): number => {
      const taxedTotal = planBase * (1 + (country.vat / 100));
      return taxedTotal + country.regFee;
  };

  // --- Option 1: Full Payment (10% Discount on Net Base) ---
  const opt1PlanBase = netBase * 0.90;
  const opt1TaxedTotal = opt1PlanBase * (1 + (country.vat / 100));
  const opt1FinalTotal = opt1TaxedTotal + country.regFee;

  // --- Option 2: 2-Part (10% Surcharge on Net Base) ---
  // Split: 50% / 50%
  const opt2PlanBase = netBase * 1.10;
  const opt2TaxedTotal = opt2PlanBase * (1 + (country.vat / 100));
  const opt2FinalTotal = opt2TaxedTotal + country.regFee;
  
  const opt2Inst1 = opt2TaxedTotal * 0.50;
  const opt2Inst2 = opt2TaxedTotal * 0.50;
  const opt2Entry = country.regFee + opt2Inst1;

  // --- Option 3: 3-Part (15% Surcharge on Net Base) ---
  // Split: 30% / 40% / 30%
  const opt3PlanBase = netBase * 1.15;
  const opt3TaxedTotal = opt3PlanBase * (1 + (country.vat / 100));
  const opt3FinalTotal = opt3TaxedTotal + country.regFee;

  const opt3Inst1 = opt3TaxedTotal * 0.30;
  const opt3Inst2 = opt3TaxedTotal * 0.40;
  const opt3Inst3 = opt3TaxedTotal * 0.30;
  const opt3Entry = country.regFee + opt3Inst1;

  // --- Option 4: 4-Part (20% Surcharge on Net Base) ---
  // Split: 30% / 30% / 20% / 20%
  const opt4PlanBase = netBase * 1.20;
  const opt4TaxedTotal = opt4PlanBase * (1 + (country.vat / 100));
  const opt4FinalTotal = opt4TaxedTotal + country.regFee;

  const opt4Inst1 = opt4TaxedTotal * 0.30;
  const opt4Inst2 = opt4TaxedTotal * 0.30;
  const opt4Inst3 = opt4TaxedTotal * 0.20;
  const opt4Inst4 = opt4TaxedTotal * 0.20;
  const opt4Entry = country.regFee + opt4Inst1;

  return [
    {
      id: 1,
      name: "Full Payment",
      total: opt1FinalTotal,
      entry: opt1FinalTotal,
      installmentAmount: 0,
      installmentCount: 0,
      breakdown: `Includes ${discountPercent}% Profile Discount & 10% Full Pay Discount. VAT included.`,
      isPopular: true,
      structure: [] // No extra installments
    },
    {
      id: 2,
      name: "2-Part Split",
      total: opt2FinalTotal,
      entry: opt2Entry,
      installmentAmount: opt2Inst2, 
      installmentCount: 1, 
      breakdown: `Entry: ${format(country.regFee)} (Reg) + ${format(opt2Inst1)} (50%). Followed by 1 x ${format(opt2Inst2)} (50%).`,
      structure: [
          { name: "2nd Installment (50%)", percentage: 0.50 }
      ]
    },
    {
      id: 3,
      name: "3-Part Split",
      total: opt3FinalTotal,
      entry: opt3Entry,
      installmentAmount: opt3Inst2,
      installmentCount: 2,
      breakdown: `Entry: ${format(country.regFee)} (Reg) + ${format(opt3Inst1)} (30%). Then ${format(opt3Inst2)} (40%) and ${format(opt3Inst3)} (30%).`,
      structure: [
          { name: "2nd Installment (40%)", percentage: 0.40 },
          { name: "3rd Installment (30%)", percentage: 0.30 }
      ]
    },
    {
      id: 4,
      name: "4-Part Split",
      total: opt4FinalTotal,
      entry: opt4Entry,
      installmentAmount: opt4Inst2,
      installmentCount: 3,
      breakdown: `Entry: ${format(country.regFee)} + ${format(opt4Inst1)} (30%). Then ${format(opt4Inst2)} (30%), ${format(opt4Inst3)} (20%), ${format(opt4Inst4)} (20%).`,
      structure: [
          { name: "2nd Installment (30%)", percentage: 0.30 },
          { name: "3rd Installment (20%)", percentage: 0.20 },
          { name: "4th Installment (20%)", percentage: 0.20 }
      ]
    },
  ];
};