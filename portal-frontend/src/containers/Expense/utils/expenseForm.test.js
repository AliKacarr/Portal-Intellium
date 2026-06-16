import {
  getComputedExpenseAmounts,
  hasValidExpenseVatRate,
  omitExcludingVatAmount,
  pickComputedExpenseFormFields,
} from "./expenseForm";

jest.mock("../constants/expenseSettings", () => ({
  getExpenseSettings: () => ({
    mealAcceptedDailyAmount: 250,
    previousPeriodCutoffDay: 5,
    vatRates: [1, 10, 20],
  }),
}));

describe("hasValidExpenseVatRate", () => {
  test("boş veya tanımsız oran geçersiz", () => {
    expect(hasValidExpenseVatRate(undefined)).toBe(false);
    expect(hasValidExpenseVatRate("")).toBe(false);
    expect(hasValidExpenseVatRate("  ")).toBe(false);
  });

  test("%0 ve pozitif oranlar geçerli", () => {
    expect(hasValidExpenseVatRate(0)).toBe(true);
    expect(hasValidExpenseVatRate(10)).toBe(true);
    expect(hasValidExpenseVatRate("20")).toBe(true);
  });
});

describe("getComputedExpenseAmounts — brüt odaklı", () => {
  test("brüt 200 + %10 KDV dahil → KDV 18,18 (kuruş tutarlı)", () => {
    const a = getComputedExpenseAmounts({
      totalAmount: 200,
      vatRate: 10,
      amountInputMode: "totalAmount",
      invoiceTitle: "Yemek",
    });
    expect(a.totalAmount).toBe(200);
    expect(a.vat).toBeCloseTo(18.18, 2);
    expect(a.excludingVatAmount).toBeCloseTo(181.82, 2);
  });

  test("totalAmount modunda brüt yokken eski net ile brüt üretme (200→198 bug’ı)", () => {
    const a = getComputedExpenseAmounts({
      totalAmount: undefined,
      excludingVatAmount: 180,
      vatRate: 10,
      amountInputMode: "totalAmount",
    });
    expect(a.totalAmount).toBeUndefined();
    expect(a.vat).toBeUndefined();
  });

  test("kullanıcı brütü temizledi (boş string)", () => {
    const a = getComputedExpenseAmounts({
      totalAmount: "",
      vatRate: 10,
      amountInputMode: "totalAmount",
    });
    expect(a.totalAmount).toBeUndefined();
  });

  test("pickComputedExpenseFormFields — totalAmount / excluding formda yok", () => {
    const a = getComputedExpenseAmounts({
      totalAmount: 200,
      vatRate: 20,
      amountInputMode: "totalAmount",
    });
    const picked = pickComputedExpenseFormFields(a);
    expect(picked).not.toHaveProperty("totalAmount");
    expect(picked).not.toHaveProperty("excludingVatAmount");
    expect(picked.vat).toBeCloseTo(33.33, 2);
  });

  test("omitExcludingVatAmount — stale net kaldırılır", () => {
    const row = omitExcludingVatAmount({
      totalAmount: 200,
      excludingVatAmount: 165,
      vatRate: 20,
    });
    expect(row.excludingVatAmount).toBeUndefined();
    expect(row.totalAmount).toBe(200);
  });

  test("KDV oranı yokken brüt varken KDV hesaplanmaz (0% ile karışmasın)", () => {
    const a = getComputedExpenseAmounts({
      totalAmount: 200,
      vatRate: undefined,
      amountInputMode: "totalAmount",
    });
    expect(a.vat).toBeUndefined();
    expect(a.excludingVatAmount).toBeUndefined();
  });
});
