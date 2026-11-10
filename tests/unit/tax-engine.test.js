const test = require("node:test");
const assert = require("node:assert");

// Import compiled or transpiled tax engine logic
function roundTo(val, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

function calculateItemFinancials(item, isInterState) {
  const qty = Number(item.quantity) || 0;
  const rate = Number(item.unitRate) || 0;
  const gstRate = Number(item.gstRate) || 0;
  const discountVal = Number(item.discountValue) || 0;

  const grossAmount = roundTo(qty * rate);

  let discountAmount = 0;
  if (item.discountType === "PERCENTAGE") {
    discountAmount = roundTo((grossAmount * Math.min(100, Math.max(0, discountVal))) / 100);
  } else {
    discountAmount = roundTo(Math.min(grossAmount, Math.max(0, discountVal)));
  }

  const netBeforeTax = Math.max(0, grossAmount - discountAmount);

  let taxableAmount = 0;
  let totalTax = 0;
  let finalAmount = 0;

  if (item.isGstInclusive && gstRate > 0) {
    taxableAmount = roundTo(netBeforeTax / (1 + gstRate / 100));
    totalTax = roundTo(netBeforeTax - taxableAmount);
    finalAmount = netBeforeTax;
  } else {
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
    sgstAmount = roundTo(totalTax - cgstAmount, 2);
  }

  return {
    quantity: qty,
    unitRate: rate,
    grossAmount,
    discountAmount,
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

test("Intra-State GST: 18% splits equally into 9% CGST and 9% SGST", () => {
  const item = {
    quantity: 10,
    unitRate: 1000,
    discountType: "PERCENTAGE",
    discountValue: 0,
    gstRate: 18,
    isGstInclusive: false,
  };
  const result = calculateItemFinancials(item, false); // Intra-state (Karnataka to Karnataka)
  assert.strictEqual(result.grossAmount, 10000.00);
  assert.strictEqual(result.taxableAmount, 10000.00);
  assert.strictEqual(result.cgstRate, 9.00);
  assert.strictEqual(result.sgstRate, 9.00);
  assert.strictEqual(result.cgstAmount, 900.00);
  assert.strictEqual(result.sgstAmount, 900.00);
  assert.strictEqual(result.igstAmount, 0.00);
  assert.strictEqual(result.totalTax, 1800.00);
  assert.strictEqual(result.finalAmount, 11800.00);
});

test("Inter-State GST: 18% applies fully as 18% IGST with 0 CGST and SGST", () => {
  const item = {
    quantity: 10,
    unitRate: 1000,
    discountType: "PERCENTAGE",
    discountValue: 0,
    gstRate: 18,
    isGstInclusive: false,
  };
  const result = calculateItemFinancials(item, true); // Inter-state (Karnataka to Maharashtra)
  assert.strictEqual(result.grossAmount, 10000.00);
  assert.strictEqual(result.taxableAmount, 10000.00);
  assert.strictEqual(result.cgstAmount, 0.00);
  assert.strictEqual(result.sgstAmount, 0.00);
  assert.strictEqual(result.igstRate, 18.00);
  assert.strictEqual(result.igstAmount, 1800.00);
  assert.strictEqual(result.totalTax, 1800.00);
  assert.strictEqual(result.finalAmount, 11800.00);
});

test("Item-level percentage discount reduces taxable value before tax", () => {
  const item = {
    quantity: 5,
    unitRate: 2000, // Gross 10,000
    discountType: "PERCENTAGE",
    discountValue: 10, // 10% discount = 1,000
    gstRate: 18,
    isGstInclusive: false,
  };
  const result = calculateItemFinancials(item, false);
  assert.strictEqual(result.grossAmount, 10000.00);
  assert.strictEqual(result.discountAmount, 1000.00);
  assert.strictEqual(result.taxableAmount, 9000.00);
  assert.strictEqual(result.cgstAmount, 810.00);
  assert.strictEqual(result.sgstAmount, 810.00);
  assert.strictEqual(result.totalTax, 1620.00);
  assert.strictEqual(result.finalAmount, 10620.00);
});

test("Item-level fixed amount discount reduces taxable value", () => {
  const item = {
    quantity: 2,
    unitRate: 5000, // Gross 10,000
    discountType: "FIXED",
    discountValue: 1500, // Fixed 1,500 off
    gstRate: 18,
    isGstInclusive: false,
  };
  const result = calculateItemFinancials(item, false);
  assert.strictEqual(result.grossAmount, 10000.00);
  assert.strictEqual(result.discountAmount, 1500.00);
  assert.strictEqual(result.taxableAmount, 8500.00);
  assert.strictEqual(result.cgstAmount, 765.00);
  assert.strictEqual(result.sgstAmount, 765.00);
  assert.strictEqual(result.totalTax, 1530.00);
  assert.strictEqual(result.finalAmount, 10030.00);
});

test("GST-Inclusive item calculates taxable and tax correctly from gross total", () => {
  const item = {
    quantity: 1,
    unitRate: 1180, // Total inclusive 1180
    discountType: "PERCENTAGE",
    discountValue: 0,
    gstRate: 18,
    isGstInclusive: true,
  };
  const result = calculateItemFinancials(item, false);
  assert.strictEqual(result.grossAmount, 1180.00);
  assert.strictEqual(result.taxableAmount, 1000.00);
  assert.strictEqual(result.cgstAmount, 90.00);
  assert.strictEqual(result.sgstAmount, 90.00);
  assert.strictEqual(result.totalTax, 180.00);
  assert.strictEqual(result.finalAmount, 1180.00);
});

