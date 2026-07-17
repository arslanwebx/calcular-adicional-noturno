export const URBAN_DEFAULTS = {
  divisor: 220,
  premiumPercent: 20,
  nightStart: "22:00",
  nightEnd: "05:00",
  reducedNightHourMinutes: 52.5
} as const;

export const REDUCED_HOUR_FACTOR = 60 / URBAN_DEFAULTS.reducedNightHourMinutes;

export type HoursMethod = "monthly" | "shift";
export type MonthlyHoursType = "clock" | "converted";

export interface CalculatorInput {
  salary: number;
  divisor: number;
  premiumPercent: number;
  method: HoursMethod;
  monthlyHours?: number;
  monthlyHoursType?: MonthlyHoursType;
  shiftStart?: string;
  shiftEnd?: string;
  shifts?: number;
  nightStart?: string;
  nightEnd?: string;
  applyReducedHour: boolean;
  includeExtension?: boolean;
  extensionHours?: number;
  overtimePercent?: number;
  overtimeNightHours?: number;
}

export interface CalculatorResult {
  hourlyRate: number;
  clockNightHours: number;
  convertedNightHours: number;
  premiumPerHour: number;
  nightPremium: number;
  overtimeNightPremium: number;
  overtimePremium: number;
  overtimeComponent: number;
  totalAdditional: number;
  totalComponent: number;
  hoursPerShift: number;
  shifts: number;
  conversionFactor: number;
}

export function parseTime(time: string): number | null {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function overlap(startA: number, endA: number, startB: number, endB: number) {
  return Math.max(0, Math.min(endA, endB) - Math.max(startA, startB));
}

export function nightOverlapMinutes(
  shiftStart: string,
  shiftEnd: string,
  nightStart: string = URBAN_DEFAULTS.nightStart,
  nightEnd: string = URBAN_DEFAULTS.nightEnd
): number {
  const workStart = parseTime(shiftStart);
  const rawWorkEnd = parseTime(shiftEnd);
  const baseNightStart = parseTime(nightStart);
  const rawNightEnd = parseTime(nightEnd);
  if (
    workStart === null ||
    rawWorkEnd === null ||
    baseNightStart === null ||
    rawNightEnd === null ||
    workStart === rawWorkEnd ||
    baseNightStart === rawNightEnd
  ) {
    return 0;
  }

  const workEnd = rawWorkEnd <= workStart ? rawWorkEnd + 1440 : rawWorkEnd;
  const nightEndAdjusted =
    rawNightEnd <= baseNightStart ? rawNightEnd + 1440 : rawNightEnd;

  let minutes = 0;
  for (const dayOffset of [-1440, 0, 1440]) {
    minutes += overlap(
      workStart,
      workEnd,
      baseNightStart + dayOffset,
      nightEndAdjusted + dayOffset
    );
  }
  return Math.min(minutes, workEnd - workStart);
}

export function validateCalculatorInput(input: CalculatorInput): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(input.salary) || input.salary <= 0)
    errors.push("Informe um salário-base maior que zero.");
  if (!Number.isFinite(input.divisor) || input.divisor <= 0)
    errors.push("Informe um divisor mensal maior que zero.");
  if (!Number.isFinite(input.premiumPercent) || input.premiumPercent < 0)
    errors.push("O percentual do adicional não pode ser negativo.");

  if (input.method === "monthly") {
    if (!Number.isFinite(input.monthlyHours) || (input.monthlyHours ?? 0) <= 0)
      errors.push("Informe o total de horas noturnas do mês.");
  } else {
    if (
      parseTime(input.shiftStart ?? "") === null ||
      parseTime(input.shiftEnd ?? "") === null
    )
      errors.push("Informe horários de entrada e saída válidos.");
    if (input.shiftStart === input.shiftEnd)
      errors.push("Entrada e saída não podem ter o mesmo horário.");
    if (!Number.isInteger(input.shifts) || (input.shifts ?? 0) <= 0)
      errors.push("Informe uma quantidade válida de turnos.");
    const nightStart = input.nightStart ?? URBAN_DEFAULTS.nightStart;
    const nightEnd = input.nightEnd ?? URBAN_DEFAULTS.nightEnd;
    if (
      parseTime(nightStart) === null ||
      parseTime(nightEnd) === null ||
      nightStart === nightEnd
    )
      errors.push("Informe um período noturno válido.");
  }

  for (const [value, message] of [
    [input.extensionHours, "As horas prorrogadas não podem ser negativas."],
    [input.overtimePercent, "O adicional de hora extra não pode ser negativo."],
    [input.overtimeNightHours, "As horas extras noturnas não podem ser negativas."]
  ] as const) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0))
      errors.push(message);
  }
  return errors;
}

export function calculateNightPremium(input: CalculatorInput): CalculatorResult {
  const errors = validateCalculatorInput(input);
  if (errors.length) throw new Error(errors.join(" "));

  const factor = input.applyReducedHour ? REDUCED_HOUR_FACTOR : 1;
  const shifts = input.method === "shift" ? input.shifts ?? 1 : 1;
  let clockNightHours = 0;
  let convertedNightHours = 0;
  let hoursPerShift = 0;

  if (input.method === "monthly") {
    const enteredHours = input.monthlyHours ?? 0;
    if (input.monthlyHoursType === "converted") {
      convertedNightHours = enteredHours;
      clockNightHours = input.applyReducedHour ? enteredHours / factor : enteredHours;
    } else {
      clockNightHours = enteredHours;
      convertedNightHours = enteredHours * factor;
    }
  } else {
    hoursPerShift =
      nightOverlapMinutes(
        input.shiftStart!,
        input.shiftEnd!,
        input.nightStart,
        input.nightEnd
      ) / 60;
    clockNightHours = hoursPerShift * shifts;
    convertedNightHours = clockNightHours * factor;
  }

  const extensionClockHours = input.includeExtension
    ? input.extensionHours ?? 0
    : 0;
  clockNightHours += extensionClockHours;
  convertedNightHours += extensionClockHours * factor;

  const hourlyRate = input.salary / input.divisor;
  const premiumRate = input.premiumPercent / 100;
  const premiumPerHour = hourlyRate * premiumRate;
  const nightPremium = convertedNightHours * premiumPerHour;

  const overtimeClockHours = input.overtimeNightHours ?? 0;
  const overtimeHours = overtimeClockHours * factor;
  const overtimeRate = (input.overtimePercent ?? 0) / 100;
  const overtimeBase = overtimeHours * hourlyRate;
  const overtimeNightPremium = overtimeBase * premiumRate;
  const overtimePremium = (overtimeBase + overtimeNightPremium) * overtimeRate;
  const overtimeComponent =
    overtimeBase + overtimeNightPremium + overtimePremium;

  return {
    hourlyRate,
    clockNightHours,
    convertedNightHours,
    premiumPerHour,
    nightPremium,
    overtimeNightPremium,
    overtimePremium,
    overtimeComponent,
    totalAdditional: nightPremium + overtimeNightPremium + overtimePremium,
    totalComponent: nightPremium + overtimeComponent,
    hoursPerShift,
    shifts,
    conversionFactor: factor
  };
}
