import {
  buildExpenseExportQuery,
  resolveExpenseExportFilterUserId,
} from "./expenseExportParams";

describe("resolveExpenseExportFilterUserId — liste (getAllForAdmin) ile aynı kapsam", () => {
  const base = { canUseAdminView: true, authUserId: 99 };

  test("admin, kullanıcı seçilmedi → tüm şirket (userId yok)", () => {
    expect(resolveExpenseExportFilterUserId({ ...base, userId: undefined })).toBeUndefined();
  });

  test("admin, userId=all → tüm şirket", () => {
    expect(resolveExpenseExportFilterUserId({ ...base, userId: "all" })).toBeUndefined();
  });

  test("admin, çalışan X seçili → userId=X", () => {
    expect(resolveExpenseExportFilterUserId({ ...base, userId: 42 })).toBe(42);
  });

  test("çalışan / admin worker modu → export userId=authUserId", () => {
    expect(
      resolveExpenseExportFilterUserId({
        canUseAdminView: false,
        userId: undefined,
        authUserId: 7,
      })
    ).toBe(7);
  });
});

describe("buildExpenseExportQuery", () => {
  test("admin tüm şirket → includeAllUsers=true ve period", () => {
    const q = buildExpenseExportQuery({
      canUseAdminView: true,
      authUserId: 1,
      userId: undefined,
      period: "2025-01",
    }).toString();
    expect(q).toContain("includeAllUsers=true");
    expect(q).toContain("period=2025-01");
    expect(q).not.toContain("userId=");
  });

  test("admin çalışan 42 → userId=42", () => {
    const q = buildExpenseExportQuery({
      canUseAdminView: true,
      authUserId: 1,
      userId: 42,
      period: "2025-02",
    }).toString();
    expect(q).toContain("userId=42");
    expect(q).toContain("period=2025-02");
    expect(q).not.toContain("includeAllUsers");
  });

  test("çalışan görünümü → userId auth kullanıcı", () => {
    const q = buildExpenseExportQuery({
      canUseAdminView: false,
      authUserId: 7,
      userId: undefined,
      period: "2025-02",
    }).toString();
    expect(q).toContain("userId=7");
    expect(q).toContain("period=2025-02");
    expect(q).not.toContain("includeAllUsers");
  });
});
