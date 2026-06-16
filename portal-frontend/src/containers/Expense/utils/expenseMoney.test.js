import {
  assertGrossNetVatConsistent,
  calculateExcludingVatAmountFromTotal,
  calculateExpenseTotal,
  calculateVatAmountFromTotal,
  getSplitVatFromGrossAmount,
  parseExpenseLineUnitPrice,
  parseMoney,
  splitVatFromGrossMinor,
} from "./expenseMoney";

describe("expenseMoney — KDV / brüt–net tutarlılığı", () => {
  test("120 brüt + %20 → net 100, KDV 20", () => {
    expect(calculateExcludingVatAmountFromTotal(120, 20)).toBe(100);
    expect(calculateVatAmountFromTotal(120, 20)).toBe(20);
    expect(
      assertGrossNetVatConsistent(120, 100, 20)
    ).toBe(true);
  });

  test("sadece net 100 + %20 → brüt 120", () => {
    expect(calculateExpenseTotal(100, 20)).toBe(120);
  });

  test("edge: 119,99 brüt + %20 — net yuvarlanır, KDV kalıntı", () => {
    const grossMinor = 11999; // 119,99 TL
    const split = splitVatFromGrossMinor(grossMinor, 20);
    expect(split).not.toBeNull();
    expect(split.netMinor).toBe(9999); // 99,99
    expect(split.vatMinor).toBe(2000); // 20,00
    expect(split.netMinor + split.vatMinor).toBe(grossMinor);

    expect(calculateExcludingVatAmountFromTotal(119.99, 20)).toBe(99.99);
    expect(calculateVatAmountFromTotal(119.99, 20)).toBe(20);
  });

  test("parseMoney — string ve sembol temizliği", () => {
    expect(parseMoney("120,50")).toBe(120.5);
    expect(parseMoney("1.234,56")).toBe(1234.56);
    expect(parseMoney("102,27")).toBe(102.27);
    expect(parseMoney("102.27")).toBe(102.27);
    expect(parseMoney("1,234.56")).toBe(1234.56);
    expect(parseMoney(" 120 ")).toBe(120);
  });

  test("parseExpenseLineUnitPrice — snake_case + string", () => {
    expect(
      parseExpenseLineUnitPrice({ unit_price: "102,27", quantity: 1 })
    ).toBe(102.27);
    expect(
      parseExpenseLineUnitPrice({ unitPrice: "1.234,56" })
    ).toBe(1234.56);
  });

  test("getSplitVatFromGrossAmount — matrah + KDV tek split", () => {
    const s = getSplitVatFromGrossAmount(100, 20);
    expect(s).not.toBeNull();
    expect(s.excludingVatAmount + s.vat).toBeCloseTo(100, 5);
    expect(s.vat).toBeCloseTo(16.67, 2);
    expect(s.excludingVatAmount).toBeCloseTo(83.33, 2);
  });
});
