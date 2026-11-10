export type DiscountType = "PERCENTAGE" | "FIXED";

export interface ItemCalculationInput {
  name: string;
  description?: string | null;
  hsnSac?: string | null;
  unit: string;
  dimensions?: string | null;
  specifications?: string | null;
  quantity: number;
  unitRate: number;
  discountType: DiscountType;
  discountValue: number;
  gstRate: number; // e.g. 18 for 18%
  isGstInclusive: boolean;
}

export interface CalculatedItem {
  name: string;
  description?: string | null;
  hsnSac?: string | null;
  unit: string;
  dimensions?: string | null;
  specifications?: string | null;
  quantity: number;
  unitRate: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  grossAmount: number;
  taxableAmount: number;
  gstRate: number;
  isGstInclusive: boolean;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  finalAmount: number;
}

export interface TaxSummaryBreakdown {
  hsnSac: string;
  gstRate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
}

export interface DocumentCalculationInput {
  supplierStateCode: string;
  placeOfSupplyStateCode: string;
  items: ItemCalculationInput[];
  documentDiscountType: DiscountType;
  documentDiscountValue: number;
  enableRoundOff?: boolean;
}

export interface DocumentCalculationResult {
  isInterState: boolean;
  items: CalculatedItem[];
  subtotal: number; // Sum of items taxable / gross before doc discount
  itemDiscountsTotal: number;
  documentDiscountAmount: number;
  totalTaxableAmount: number;
  totalCgstAmount: number;
  totalSgstAmount: number;
  totalIgstAmount: number;
  totalTaxAmount: number;
  rawTotalAmount: number;
  roundOff: number;
  totalAmount: number;
  taxSummaries: TaxSummaryBreakdown[];
}

/**
 * Rounds a number to a fixed number of decimal places (default 2)
 * using standard round half up to prevent floating point drift.
 */
export function roundTo(val: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Calculate individual item financials based on state jurisdiction and tax rules.
 */
export function calculateItemFinancials(
  item: ItemCalculationInput,
  isInterState: boolean
): CalculatedItem {
  const qty = Number(item.quantity) || 0;
  const rate = Number(item.unitRate) || 0;
  const gstRate = Number(item.gstRate) || 0;
  const discountVal = Number(item.discountValue) || 0;

  const grossAmount = roundTo(qty * rate);

  let discountAmount = 0;
  if (item.discountType === "PERCENTAGE") {
    discountAmount = roundTo((grossAmount * Math.min(100, Math.max(0, discountVal))) / 100);
  } else {
    // Fixed amount discount
    discountAmount = roundTo(Math.min(grossAmount, Math.max(0, discountVal)));
  }

  const netBeforeTax = Math.max(0, grossAmount - discountAmount);

  let taxableAmount = 0;
  let totalTax = 0;
  let finalAmount = 0;

  if (item.isGstInclusive && gstRate > 0) {
    // Inclusive: netBeforeTax = taxableAmount * (1 + gstRate/100)
    taxableAmount = roundTo(netBeforeTax / (1 + gstRate / 100));
    totalTax = roundTo(netBeforeTax - taxableAmount);
    finalAmount = netBeforeTax;
  } else {
    // Exclusive: taxableAmount = netBeforeTax
    taxableAmount = netBeforeTax;
    totalTax = roundTo((taxableAmount * gstRate) / 100);
    finalAmount = roundTo(taxableAmount + totalTax);
  }

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstRate = gstRate;
    igstAmount = totalTax;
  } else {
    cgstRate = roundTo(gstRate / 2, 2);
    sgstRate = roundTo(gstRate / 2, 2);
    cgstAmount = roundTo(totalTax / 2, 2);
    sgstAmount = roundTo(totalTax - cgstAmount, 2); // Avoid rounding gap
  }

  return {
    name: item.name,
    description: item.description,
    hsnSac: item.hsnSac || "",
    unit: item.unit || "Nos",
    dimensions: item.dimensions,
    specifications: item.specifications,
    quantity: qty,
    unitRate: rate,
    discountType: item.discountType,
    discountValue: discountVal,
    discountAmount,
    grossAmount,
    taxableAmount,
    gstRate,
    isGstInclusive: item.isGstInclusive,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalTax,
    finalAmount,
  };
}

/**
 * Calculates complete document financial totals, itemized taxes, and HSN tax summaries.
 */
export function calculateDocumentFinancials(
  input: DocumentCalculationInput
): DocumentCalculationResult {
  const supplierState = (input.supplierStateCode || "29").trim();
  const placeOfSupply = (input.placeOfSupplyStateCode || supplierState).trim();
  const isInterState = supplierState !== placeOfSupply;

  const calculatedItems = (input.items || []).map((item) =>
    calculateItemFinancials(item, isInterState)
  );

  const subtotal = roundTo(
    calculatedItems.reduce((acc, it) => acc + it.grossAmount, 0)
  );
  const itemDiscountsTotal = roundTo(
    calculatedItems.reduce((acc, it) => acc + it.discountAmount, 0)
  );

  const baseTaxableSum = roundTo(
    calculatedItems.reduce((acc, it) => acc + it.taxableAmount, 0)
  );

  // Document level discount
  let documentDiscountAmount = 0;
  const docDiscVal = Number(input.documentDiscountValue) || 0;
  if (input.documentDiscountType === "PERCENTAGE") {
    documentDiscountAmount = roundTo(
      (baseTaxableSum * Math.min(100, Math.max(0, docDiscVal))) / 100
    );
  } else {
    documentDiscountAmount = roundTo(
      Math.min(baseTaxableSum, Math.max(0, docDiscVal))
    );
  }

  // If document discount exists, adjust taxable amount and taxes proportionally
  let totalTaxableAmount = baseTaxableSum;
  let totalCgstAmount = roundTo(
    calculatedItems.reduce((acc, it) => acc + it.cgstAmount, 0)
  );
  let totalSgstAmount = roundTo(
    calculatedItems.reduce((acc, it) => acc + it.sgstAmount, 0)
  );
  let totalIgstAmount = roundTo(
    calculatedItems.reduce((acc, it) => acc + it.igstAmount, 0)
  );

  if (documentDiscountAmount > 0 && baseTaxableSum > 0) {
    const discountRatio = (baseTaxableSum - documentDiscountAmount) / baseTaxableSum;
    totalTaxableAmount = roundTo(baseTaxableSum - documentDiscountAmount);
    totalCgstAmount = roundTo(totalCgstAmount * discountRatio);
    totalSgstAmount = roundTo(totalSgstAmount * discountRatio);
    totalIgstAmount = roundTo(totalIgstAmount * discountRatio);
  }

  const totalTaxAmount = isInterState
    ? totalIgstAmount
    : roundTo(totalCgstAmount + totalSgstAmount);

  const rawTotalAmount = roundTo(totalTaxableAmount + totalTaxAmount);

  let roundOff = 0;
  let totalAmount = rawTotalAmount;

  if (input.enableRoundOff !== false) {
    const rounded = Math.round(rawTotalAmount);
    roundOff = roundTo(rounded - rawTotalAmount);
    totalAmount = rounded;
  }

  // Aggregate Tax Summary by HSN/SAC and GST Rate
  const summaryMap = new Map<string, TaxSummaryBreakdown>();
  for (const it of calculatedItems) {
    const key = `${it.hsnSac || "NA"}_${it.gstRate}`;
    const existing = summaryMap.get(key) || {
      hsnSac: it.hsnSac || "NA",
      gstRate: it.gstRate,
      taxableAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalTax: 0,
    };

    let itemTaxable = it.taxableAmount;
    let itemCgst = it.cgstAmount;
    let itemSgst = it.sgstAmount;
    let itemIgst = it.igstAmount;

    if (documentDiscountAmount > 0 && baseTaxableSum > 0) {
      const discountRatio = (baseTaxableSum - documentDiscountAmount) / baseTaxableSum;
      itemTaxable = roundTo(itemTaxable * discountRatio);
      itemCgst = roundTo(itemCgst * discountRatio);
      itemSgst = roundTo(itemSgst * discountRatio);
      itemIgst = roundTo(itemIgst * discountRatio);
    }

    existing.taxableAmount = roundTo(existing.taxableAmount + itemTaxable);
    existing.cgstAmount = roundTo(existing.cgstAmount + itemCgst);
    existing.sgstAmount = roundTo(existing.sgstAmount + itemSgst);
    existing.igstAmount = roundTo(existing.igstAmount + itemIgst);
    existing.totalTax = isInterState
      ? existing.igstAmount
      : roundTo(existing.cgstAmount + existing.sgstAmount);

    summaryMap.set(key, existing);
  }

  const taxSummaries = Array.from(summaryMap.values());

  return {
    isInterState,
    items: calculatedItems,
    subtotal,
    itemDiscountsTotal,
    documentDiscountAmount,
    totalTaxableAmount,
    totalCgstAmount,
    totalSgstAmount,
    totalIgstAmount,
    totalTaxAmount,
    rawTotalAmount,
    roundOff,
    totalAmount,
    taxSummaries,
  };
}
