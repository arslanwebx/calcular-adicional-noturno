import { describe, expect, it } from "vitest";
import {
  calculateNightPremium,
  nightOverlapMinutes,
  validateCalculatorInput,
  type CalculatorInput
} from "./calculator";

const base: CalculatorInput = {
  salary: 2200,
  divisor: 220,
  premiumPercent: 20,
  method: "monthly",
  monthlyHours: 35,
  monthlyHoursType: "clock",
  applyReducedHour: true
};

describe("night overlap", () => {
  it.each([
    ["22:00", "05:00", 420],
    ["23:00", "04:00", 300],
    ["20:00", "02:00", 240],
    ["04:00", "08:00", 60],
    ["08:00", "18:00", 0]
  ])("%s–%s overlaps by %i minutes", (start, end, expected) => {
    expect(nightOverlapMinutes(start, end)).toBe(expected);
  });

  it("rejects an equal start and end by returning no duration", () => {
    expect(nightOverlapMinutes("22:00", "22:00")).toBe(0);
  });
});

describe("calculator", () => {
  it("calculates 35 actual hours with reduced-hour conversion", () => {
    const result = calculateNightPremium(base);
    expect(result.convertedNightHours).toBeCloseTo(40);
    expect(result.nightPremium).toBeCloseTo(80);
  });

  it("multiplies an in-period shift by monthly shifts", () => {
    const result = calculateNightPremium({
      ...base,
      method: "shift",
      shiftStart: "23:00",
      shiftEnd: "04:00",
      shifts: 10
    });
    expect(result.clockNightHours).toBe(50);
  });

  it("does not convert already-converted hours twice", () => {
    const result = calculateNightPremium({
      ...base,
      monthlyHours: 40,
      monthlyHoursType: "converted"
    });
    expect(result.convertedNightHours).toBe(40);
  });

  it("can disable the reduced night hour", () => {
    const result = calculateNightPremium({ ...base, applyReducedHour: false });
    expect(result.convertedNightHours).toBe(35);
    expect(result.nightPremium).toBe(70);
  });

  it("supports custom percentage and decimal values", () => {
    const result = calculateNightPremium({
      ...base,
      salary: 2345.67,
      monthlyHours: 12.5,
      premiumPercent: 30
    });
    expect(result.nightPremium).toBeGreaterThan(0);
  });

  it("calculates optional night overtime separately", () => {
    const result = calculateNightPremium({
      ...base,
      overtimeNightHours: 2,
      overtimePercent: 50
    });
    expect(result.overtimePremium).toBeCloseTo(13.7142857);
    expect(result.overtimeComponent).toBeCloseTo(41.1428571);
  });

  it("reports negative and invalid inputs", () => {
    expect(
      validateCalculatorInput({ ...base, salary: -1, monthlyHours: -2 })
    ).toHaveLength(2);
  });
});
