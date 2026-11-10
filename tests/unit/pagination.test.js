const test = require("node:test");
const assert = require("node:assert/strict");

function getItemWeight(item) {
  let weight = 36;
  if (item.description && item.description.trim().length > 0) {
    const chars = item.description.trim().length;
    weight += Math.max(16, Math.ceil(chars / 65) * 14);
  }
  if (item.dimensions || item.specifications) {
    weight += 24;
  }
  return weight;
}

function paginateInvoiceItems(items) {
  const SINGLE_PAGE_MAX_WEIGHT = 150;
  const PAGE1_BUDGET = 620;
  const CONTINUATION_BUDGET = 860;
  const LAST_PAGE_BUDGET_WITH_SUMMARY = 420;

  if (!items || items.length === 0) {
    return [
      {
        pageNumber: 1,
        items: [],
        startIndex: 0,
        isFirstPage: true,
        isLastPage: true,
        isContinuation: false,
        showCommercialSummary: true,
      },
    ];
  }

  const weights = items.map(getItemWeight);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  if (totalWeight <= SINGLE_PAGE_MAX_WEIGHT) {
    return [
      {
        pageNumber: 1,
        items,
        startIndex: 0,
        isFirstPage: true,
        isLastPage: true,
        isContinuation: false,
        showCommercialSummary: true,
      },
    ];
  }

  const pages = [];
  let currentIndex = 0;
  let pageNumber = 1;

  while (currentIndex < items.length) {
    const isFirstPage = pageNumber === 1;
    const startIndex = currentIndex;
    const pageItems = [];
    let accumulated = 0;

    const remainingItems = items.slice(currentIndex);
    const remainingWeight = weights.slice(currentIndex).reduce((a, b) => a + b, 0);

    if (!isFirstPage && remainingWeight <= LAST_PAGE_BUDGET_WITH_SUMMARY) {
      pages.push({
        pageNumber,
        items: remainingItems,
        startIndex,
        isFirstPage: false,
        isLastPage: true,
        isContinuation: true,
        showCommercialSummary: true,
      });
      break;
    }

    const budget = isFirstPage ? PAGE1_BUDGET : CONTINUATION_BUDGET;

    while (currentIndex < items.length) {
      const w = weights[currentIndex];
      const itemsLeftAfterThis = items.length - (currentIndex + 1);

      if (pageItems.length > 0 && accumulated + w > budget) {
        break;
      }

      if (itemsLeftAfterThis < 1) {
        break;
      }

      pageItems.push(items[currentIndex]);
      accumulated += w;
      currentIndex++;
    }

    const isLast = currentIndex >= items.length;
    const canFitSummary = isLast && !isFirstPage && accumulated <= LAST_PAGE_BUDGET_WITH_SUMMARY;

    pages.push({
      pageNumber,
      items: pageItems,
      startIndex,
      isFirstPage,
      isLastPage: isLast && canFitSummary,
      isContinuation: !isFirstPage,
      showCommercialSummary: canFitSummary,
    });

    pageNumber++;
  }

  const lastPage = pages[pages.length - 1];
  if (!lastPage.showCommercialSummary) {
    pages.push({
      pageNumber: pages.length + 1,
      items: [],
      startIndex: items.length,
      isFirstPage: false,
      isLastPage: true,
      isContinuation: true,
      showCommercialSummary: true,
    });
  }

  return pages;
}

test("Single compact item fits on 1 sheet", () => {
  const single = [{ name: "Acrylic Board", unitRate: 1500, quantity: 1 }];
  const pages = paginateInvoiceItems(single);
  assert.equal(pages.length, 1);
  assert.equal(pages[0].showCommercialSummary, true);
  assert.equal(pages[0].items.length, 1);
});

test("7 detailed signage items utilize Page 1 up to 6 items and overflow cleanly", () => {
  const items7 = [
    { name: "Glass Frosting", description: "Architectural frosted/dusted vinyl", dimensions: "12 ft", specifications: "Cast acrylic" },
    { name: "Vinyl Banners", description: "Heavy duty 440 GSM frontlit", specifications: "3mm acp" },
    { name: "Directional Signs", description: "Modular curved aluminium wayfinding" },
    { name: "Vehicle Stickering", description: "Precision contour-cut Avery/3M vinyl" },
    { name: "Sun Board Printing", description: "Direct UV flatbed printing on 3mm / 5mm" },
    { name: "Vinyl Banners", description: "Heavy duty 440 GSM frontlit" },
    { name: "Custom Signs", description: "Architectural bespoke sign assembly" },
  ];

  const pages = paginateInvoiceItems(items7);
  assert.equal(pages.length, 2);
  assert.equal(pages[0].items.length, 6, "Page 1 should utilize available space by fitting 6 items");
  assert.equal(pages[0].showCommercialSummary, false);
  assert.equal(pages[1].items.length, 1, "Page 2 should host remaining 1 item alongside commercial summary");
  assert.equal(pages[1].showCommercialSummary, true);
  assert.equal(pages[1].startIndex, 6);
});

test("16 items span multiple sheets with continuation headers and final summary", () => {
  const items16 = Array.from({ length: 16 }, (_, i) => ({
    name: `Signage Service Item #${i + 1}`,
    description: `Comprehensive fabrication specification for line item ${i + 1}`,
  }));

  const pages = paginateInvoiceItems(items16);
  assert.equal(pages.length >= 2, true);
  assert.equal(pages[0].isFirstPage, true);
  assert.equal(pages[pages.length - 1].isLastPage, true);
  assert.equal(pages[pages.length - 1].showCommercialSummary, true);

  const totalItemCount = pages.reduce((sum, p) => sum + p.items.length, 0);
  assert.equal(totalItemCount, 16);
});
