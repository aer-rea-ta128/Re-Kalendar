/**
 * 労働時間および給与計算を行うカスタムフック/ユーティリティ
 */

interface WageRule {
  start?: string;
  end?: string;
  wage?: string;
}

interface CalculateWageParams {
  actualStartH: string;
  actualStartM: string;
  actualEndH: string;
  actualEndM: string;
  breakTimeMinutes: number;
  wageRules: WageRule[];
  pastWorkMinutes?: number;
  applyOvertime?: boolean;
  applyNight?: boolean;
}

export function useWageCalculator() {
  const calculateWage = ({
    actualStartH,
    actualStartM,
    actualEndH,
    actualEndM,
    breakTimeMinutes,
    wageRules,
    pastWorkMinutes = 0,
    applyOvertime = true,
    applyNight = true,
  }: CalculateWageParams) => {
    let workStart = parseInt(actualStartH, 10) * 60 + parseInt(actualStartM, 10);
    let workEnd = parseInt(actualEndH, 10) * 60 + parseInt(actualEndM, 10);
    if (workEnd <= workStart) workEnd += 1440;

    let stayMinutes = workEnd - workStart;
    let breakTime = breakTimeMinutes;
    if (breakTime > stayMinutes) breakTime = stayMinutes;

    let minuteWages: number[] = [];
    for (let m = workStart; m < workEnd; m++) {
      let dayM = m % 1440;
      let matchedWage = 0;
      wageRules?.forEach((rule) => {
        if (!rule.start || !rule.end || !rule.wage) return;
        let rs = parseInt(rule.start.split(":")[0], 10) * 60 + parseInt(rule.start.split(":")[1].replace("59", "00"), 10);
        let re = parseInt(rule.end.split(":")[0], 10) * 60 + parseInt(rule.end.split(":")[1].replace("59", "00"), 10);
        if (re <= rs) re += 1440;
        let inRule = false;
        if (re > 1440) {
          if ((dayM >= rs && dayM < 1440) || (dayM >= 0 && dayM < re - 1440)) inRule = true;
        } else {
          if (dayM >= rs && dayM < re) inRule = true;
        }
        if (inRule) matchedWage = Math.max(matchedWage, parseInt(rule.wage, 10));
      });
      minuteWages.push(matchedWage);
    }

    let breakStartIdx = Math.floor((stayMinutes - breakTime) / 2);
    for (let i = 0; i < breakTime; i++) {
      minuteWages[breakStartIdx + i] = 0;
    }

    let totalWage = 0;
    let actualWorkCount = pastWorkMinutes;

    for (let i = 0; i < stayMinutes; i++) {
      let currentMin = (workStart + i) % 1440;
      let w = minuteWages[i];
      if (w > 0) {
        actualWorkCount++;
        let multiplier = 1.0;
        if (applyOvertime && actualWorkCount > 480) multiplier += 0.25;
        if (applyNight && (currentMin >= 1320 || currentMin < 300)) multiplier += 0.25;
        totalWage += (w * multiplier) / 60;
      }
    }

    let actualHours = Math.round((actualWorkCount / 60) * 100) / 100;

    return {
      calculatedWage: Math.round(totalWage),
      hours: actualHours,
    };
  };

  return { calculateWage };
}