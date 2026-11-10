const test = require("node:test");
const assert = require("node:assert/strict");

function getItemWeight(item) {
  let weight = 44;
  if (item.description && item.description.trim().length > 0) {
    const chars = item.description.trim().length;
    weight += Math.min(60, Math.ceil(chars / 65) * 16);
  }
  if (item.dimensions || item.specifications) {
    weight += 28;
  }
  return weight;
}

function paginateInvoiceItems(items) {
  const SINGLE_PAGE_MAX_WEIGHT = 110;
  const PAGE1_BUDGET = 420;
  const CONTINUATION_BUDGET = 680;
  const LAST_PAGE_BUDGET_WITH_SUMMARY = 340;

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

    // If on a continuation page and all remaining items fit WITH the commercial summary:
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

      // If multi-page and we are filling a page that won't be the final summary page,
      // leave at least 2 items for the subsequent page so it's never an orphan summary page
      if (itemsLeftAfterThis < 2 && remainingWeight > LAST_PAGE_BUDGET_WITH_SUMMARY) {
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

test("7 detailed signage items paginate onto 2 sheets without cut-off", () => {
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
  assert.equal(pages[0].items.length, 5);
  assert.equal(pages[0].showCommercialSummary, false);
  assert.equal(pages[1].items.length, 2);
  assert.equal(pages[1].showCommercialSummary, true);
  assert.equal(pages[1].startIndex, 5);
});

test("15 items span 3 sheets with continuation headers and final summary", () => {
  const items15 = Array.from({ length: 15 }, (_, i) => ({
    name: `Signage Service Item #${i + 1}`,
    description: `Comprehensive fabrication specification for line item ${i + 1}`,
  }));

  const pages = paginateInvoiceItems(items15);
  assert.equal(pages.length, 3);
  assert.equal(pages[0].isFirstPage, true);
  assert.equal(pages[1].isContinuation, true);
  assert.equal(pages[2].isLastPage, true);
  assert.equal(pages[2].showCommercialSummary, true);

  const totalItemCount = pages.reduce((sum, p) => sum + p.items.length, 0);
  assert.equal(totalItemCount, 15);
});
