import { describe, expect, it } from "vitest";
import { stockLevelViewMap } from "./inventory.model";

describe("stockLevelViewMap（分級 → 畫面對照表）", () => {
  it("三個分級都有對照（Record 型別已在編譯期保證，這裡驗 label / 語意色）", () => {
    expect(stockLevelViewMap.Healthy.color).toBe("success");
    expect(stockLevelViewMap.Warning.color).toBe("warning");
    expect(stockLevelViewMap.Critical.color).toBe("error");
    expect(Object.values(stockLevelViewMap).every((meta) => meta.label.length > 0)).toBe(true);
  });
});
