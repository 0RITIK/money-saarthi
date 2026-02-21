/**
 * Purchase Planner Service
 * Provides EMI vs Savings simulation, feasibility analysis, purchase scoring,
 * and intelligent insights for financial decision-making.
 */

// ─── Types ────────────────────────────────────────────────────

export type PurchaseMode = "emi" | "savings" | "save-extra";

export interface FinancialProfile {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyRoutineBills: number;
  existingSavings: number;
  extraSavingPerMonth: number;
}

export interface PurchaseDetails {
  itemName: string;
  actualPrice: number;
  mode: PurchaseMode;
  // EMI fields
  downPayment?: number;
  emiTenureMonths?: number;
  interestRate?: number;
  // Savings fields
  startDate?: string;
  monthlySavingForPurchase?: number;
}

export interface EMIAnalysis {
  emiAmount: number;
  totalAmountWithInterest: number;
  totalInterestPaid: number;
  emiBurdenPercent: number;
  newSavingsRate: number;
  isAffordable: boolean;
  impactOnYearlySavings: number;
  disposableIncome: number;
  emiToDisposableRatio: number;
}

export interface SavingsAnalysis {
  monthsRequired: number;
  projectedPurchaseDate: string;
  yearsRequired: number;
  isFeasibleWithinYear: boolean;
  savingsGrowthTimeline: { month: number; accumulated: number; remaining: number }[];
  delayBenefitAmount: number;
}

export interface ComparisonData {
  totalCostEMI: number;
  totalCostSavings: number;
  timeDifferenceMonths: number;
  monthlyBurdenEMI: number;
  monthlyBurdenSavings: number;
  interestSaved: number;
  breakEvenMonth: number;
}

export type FeasibilityLevel = "safe" | "moderate" | "risky";

export interface PurchaseScore {
  score: number; // 0-100
  feasibility: FeasibilityLevel;
  factors: { label: string; score: number; weight: number }[];
}

export interface PlannerInsight {
  type: "success" | "warning" | "danger" | "info" | "tip";
  message: string;
}

export interface SimulationResult {
  id: string;
  createdAt: string;
  financialProfile: FinancialProfile;
  purchaseDetails: PurchaseDetails;
  emiAnalysis?: EMIAnalysis;
  savingsAnalysis?: SavingsAnalysis;
  comparison?: ComparisonData;
  purchaseScore: PurchaseScore;
  insights: PlannerInsight[];
}

// ─── Helpers ──────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).substring(2, 11);

const fmt = (n: number) => Math.round(n);

// ─── EMI Calculator ──────────────────────────────────────────

export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (annualRate === 0) return principal / tenureMonths;
  const r = annualRate / 12 / 100;
  return (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
}

// ─── EMI Analysis ────────────────────────────────────────────

export function analyzeEMI(profile: FinancialProfile, details: PurchaseDetails): EMIAnalysis {
  const principal = details.actualPrice - (details.downPayment || 0);
  const tenure = details.emiTenureMonths || 12;
  const rate = details.interestRate || 0;

  const emi = calculateEMI(principal, rate, tenure);
  const totalWithInterest = emi * tenure + (details.downPayment || 0);
  const totalInterest = totalWithInterest - details.actualPrice;

  const disposable = profile.monthlyIncome - profile.monthlyExpenses - profile.monthlyRoutineBills;
  const emiBurden = disposable > 0 ? (emi / disposable) * 100 : 100;
  const newMonthlySavings = disposable - emi;
  const newSavingsRate = profile.monthlyIncome > 0 ? (newMonthlySavings / profile.monthlyIncome) * 100 : 0;
  const currentSavings = disposable;
  const yearlyImpact = (currentSavings - newMonthlySavings) * 12;

  return {
    emiAmount: fmt(emi),
    totalAmountWithInterest: fmt(totalWithInterest),
    totalInterestPaid: fmt(totalInterest),
    emiBurdenPercent: Math.round(emiBurden * 10) / 10,
    newSavingsRate: Math.round(newSavingsRate * 10) / 10,
    isAffordable: emiBurden < 40,
    impactOnYearlySavings: fmt(yearlyImpact),
    disposableIncome: fmt(disposable),
    emiToDisposableRatio: Math.round((emi / Math.max(disposable, 1)) * 100) / 100,
  };
}

// ─── Savings Analysis ────────────────────────────────────────

export function analyzeSavings(profile: FinancialProfile, details: PurchaseDetails): SavingsAnalysis {
  const monthlySaving = details.monthlySavingForPurchase || profile.extraSavingPerMonth || 1;
  const target = details.actualPrice;
  const existing = profile.existingSavings;
  const remaining = Math.max(0, target - existing);

  const monthsReq = remaining > 0 ? Math.ceil(remaining / monthlySaving) : 0;
  const startDate = details.startDate ? new Date(details.startDate) : new Date();
  const projDate = new Date(startDate);
  projDate.setMonth(projDate.getMonth() + monthsReq);

  const timeline: SavingsAnalysis["savingsGrowthTimeline"] = [];
  for (let i = 0; i <= Math.min(monthsReq, 60); i++) {
    const accumulated = existing + monthlySaving * i;
    timeline.push({ month: i, accumulated: Math.min(accumulated, target), remaining: Math.max(0, target - accumulated) });
  }

  // Interest saved by not taking EMI (assume 12% average)
  const hypotheticalInterest = target * 0.12 * (monthsReq / 12);

  return {
    monthsRequired: monthsReq,
    projectedPurchaseDate: projDate.toISOString().split("T")[0],
    yearsRequired: Math.round((monthsReq / 12) * 10) / 10,
    isFeasibleWithinYear: monthsReq <= 12,
    savingsGrowthTimeline: timeline,
    delayBenefitAmount: fmt(hypotheticalInterest),
  };
}

// ─── Comparison ──────────────────────────────────────────────

export function generateComparison(emi: EMIAnalysis, savings: SavingsAnalysis, details: PurchaseDetails): ComparisonData {
  const emiTenure = details.emiTenureMonths || 12;
  const savingsMonths = savings.monthsRequired;

  // Break-even: month where cumulative savings cost < cumulative EMI cost
  const monthlySaving = details.monthlySavingForPurchase || 0;
  let breakEven = 0;
  let cumulEMI = 0;
  let cumulSave = 0;
  for (let m = 1; m <= Math.max(emiTenure, savingsMonths, 60); m++) {
    cumulEMI += emi.emiAmount;
    cumulSave += monthlySaving;
    if (cumulSave >= cumulEMI && breakEven === 0) {
      breakEven = m;
    }
  }

  return {
    totalCostEMI: emi.totalAmountWithInterest,
    totalCostSavings: details.actualPrice,
    timeDifferenceMonths: Math.abs(savingsMonths - emiTenure),
    monthlyBurdenEMI: emi.emiAmount,
    monthlyBurdenSavings: fmt(monthlySaving),
    interestSaved: emi.totalInterestPaid,
    breakEvenMonth: breakEven || savingsMonths,
  };
}

// ─── Purchase Score ──────────────────────────────────────────

export function calculatePurchaseScore(
  profile: FinancialProfile,
  emiAnalysis?: EMIAnalysis,
  savingsAnalysis?: SavingsAnalysis
): PurchaseScore {
  const disposable = profile.monthlyIncome - profile.monthlyExpenses - profile.monthlyRoutineBills;

  // Factor 1: Affordability (30%)
  let affordScore = 50;
  if (emiAnalysis) {
    affordScore = emiAnalysis.emiBurdenPercent < 20 ? 95 : emiAnalysis.emiBurdenPercent < 30 ? 75 : emiAnalysis.emiBurdenPercent < 40 ? 55 : emiAnalysis.emiBurdenPercent < 60 ? 30 : 10;
  } else if (savingsAnalysis) {
    affordScore = savingsAnalysis.monthsRequired <= 3 ? 95 : savingsAnalysis.monthsRequired <= 6 ? 80 : savingsAnalysis.monthsRequired <= 12 ? 60 : savingsAnalysis.monthsRequired <= 24 ? 35 : 15;
  }

  // Factor 2: Savings impact (25%)
  const currentSavingsRate = profile.monthlyIncome > 0 ? (disposable / profile.monthlyIncome) * 100 : 0;
  const newRate = emiAnalysis ? emiAnalysis.newSavingsRate : currentSavingsRate;
  const savingsImpact = newRate >= 20 ? 90 : newRate >= 10 ? 65 : newRate >= 0 ? 35 : 10;

  // Factor 3: Financial cushion (20%)
  const cushionMonths = disposable > 0 ? profile.existingSavings / disposable : 0;
  const cushionScore = cushionMonths >= 6 ? 95 : cushionMonths >= 3 ? 70 : cushionMonths >= 1 ? 40 : 15;

  // Factor 4: Time efficiency (15%)
  const timeScore = savingsAnalysis
    ? (savingsAnalysis.monthsRequired <= 6 ? 90 : savingsAnalysis.monthsRequired <= 12 ? 70 : savingsAnalysis.monthsRequired <= 24 ? 45 : 20)
    : 60;

  // Factor 5: Debt risk (10%)
  const debtRisk = emiAnalysis
    ? (emiAnalysis.isAffordable ? 85 : emiAnalysis.emiBurdenPercent < 60 ? 40 : 10)
    : 90;

  const factors = [
    { label: "Affordability", score: affordScore, weight: 0.3 },
    { label: "Savings Impact", score: savingsImpact, weight: 0.25 },
    { label: "Financial Cushion", score: cushionScore, weight: 0.2 },
    { label: "Time Efficiency", score: timeScore, weight: 0.15 },
    { label: "Debt Risk", score: debtRisk, weight: 0.1 },
  ];

  const score = Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0));
  const feasibility: FeasibilityLevel = score >= 65 ? "safe" : score >= 40 ? "moderate" : "risky";

  return { score, feasibility, factors };
}

// ─── Insight Templates (25+) ─────────────────────────────────

export function generateInsights(
  profile: FinancialProfile,
  details: PurchaseDetails,
  emiAnalysis?: EMIAnalysis,
  savingsAnalysis?: SavingsAnalysis,
  purchaseScore?: PurchaseScore
): PlannerInsight[] {
  const insights: PlannerInsight[] = [];
  const disposable = profile.monthlyIncome - profile.monthlyExpenses - profile.monthlyRoutineBills;
  const priceToIncome = details.actualPrice / Math.max(profile.monthlyIncome, 1);

  // 1. Overall affordability
  if (purchaseScore && purchaseScore.score >= 75) {
    insights.push({ type: "success", message: "This purchase looks financially comfortable for you." });
  } else if (purchaseScore && purchaseScore.score >= 50) {
    insights.push({ type: "warning", message: "This purchase is feasible but will stretch your budget. Plan carefully." });
  } else if (purchaseScore) {
    insights.push({ type: "danger", message: "This purchase is not recommended based on your current financial health." });
  }

  // 2. Price-to-income ratio
  if (priceToIncome > 6) {
    insights.push({ type: "danger", message: `This item costs ${priceToIncome.toFixed(1)}x your monthly income — a significant financial commitment.` });
  } else if (priceToIncome > 3) {
    insights.push({ type: "warning", message: `At ${priceToIncome.toFixed(1)}x your monthly income, this requires careful planning.` });
  } else {
    insights.push({ type: "info", message: `This item costs ${priceToIncome.toFixed(1)}x your monthly income — relatively manageable.` });
  }

  // EMI-specific insights (3-12)
  if (emiAnalysis) {
    if (emiAnalysis.isAffordable) {
      insights.push({ type: "success", message: "You can afford this EMI comfortably." });
    } else {
      insights.push({ type: "danger", message: `This EMI takes ${emiAnalysis.emiBurdenPercent.toFixed(0)}% of your disposable income — above the safe 40% limit.` });
    }

    if (emiAnalysis.newSavingsRate < 15) {
      insights.push({ type: "warning", message: `This EMI will reduce your savings rate below 15% to ${emiAnalysis.newSavingsRate.toFixed(1)}%.` });
    }

    if (emiAnalysis.newSavingsRate < 0) {
      insights.push({ type: "danger", message: "Taking this EMI will push you into negative savings — you'll be spending more than you earn." });
    }

    if (emiAnalysis.totalInterestPaid > 0) {
      insights.push({ type: "info", message: `You'll pay ₹${emiAnalysis.totalInterestPaid.toLocaleString()} extra in interest over the EMI period.` });
    }

    if (emiAnalysis.impactOnYearlySavings > 0) {
      insights.push({ type: "warning", message: `This EMI will reduce your yearly savings by ₹${emiAnalysis.impactOnYearlySavings.toLocaleString()}.` });
    }

    if (emiAnalysis.emiBurdenPercent > 50) {
      insights.push({ type: "danger", message: "EMI burden exceeds 50% — high risk of financial stress and missed payments." });
    }

    if (emiAnalysis.emiBurdenPercent <= 25) {
      insights.push({ type: "success", message: "EMI burden is under 25% — a comfortable and sustainable debt level." });
    }

    // Compromise: increase tenure
    if (!emiAnalysis.isAffordable && details.emiTenureMonths && details.emiTenureMonths < 36) {
      const longerTenure = details.emiTenureMonths + 6;
      const newEmi = calculateEMI(details.actualPrice - (details.downPayment || 0), details.interestRate || 0, longerTenure);
      insights.push({ type: "tip", message: `Extending tenure to ${longerTenure} months reduces EMI to ₹${Math.round(newEmi).toLocaleString()}/month.` });
    }

    // Compromise: increase down payment
    if (!emiAnalysis.isAffordable && profile.existingSavings > (details.downPayment || 0)) {
      const suggestedDP = Math.min(profile.existingSavings * 0.5, details.actualPrice * 0.5);
      insights.push({ type: "tip", message: `Increasing down payment to ₹${Math.round(suggestedDP).toLocaleString()} would significantly reduce your EMI.` });
    }
  }

  // Savings-specific insights (13-20)
  if (savingsAnalysis) {
    if (savingsAnalysis.isFeasibleWithinYear) {
      insights.push({ type: "success", message: `You can save for this item in ${savingsAnalysis.monthsRequired} months — completely interest-free!` });
    } else {
      insights.push({ type: "warning", message: `Saving requires ${savingsAnalysis.monthsRequired} months (${savingsAnalysis.yearsRequired} years) — consider if you can wait that long.` });
    }

    if (savingsAnalysis.delayBenefitAmount > 0 && emiAnalysis) {
      insights.push({ type: "info", message: `Saving for ${savingsAnalysis.monthsRequired} months avoids ₹${savingsAnalysis.delayBenefitAmount.toLocaleString()} in interest.` });
    }

    if (savingsAnalysis.monthsRequired > 36) {
      insights.push({ type: "danger", message: "Saving for 3+ years is impractical. Consider EMI with a higher down payment instead." });
    }

    if (savingsAnalysis.monthsRequired <= 3) {
      insights.push({ type: "success", message: "You're very close! Just 3 more months of saving and you can buy outright." });
    }

    // Compromise: increase monthly savings
    const currentSaving = details.monthlySavingForPurchase || profile.extraSavingPerMonth || 0;
    if (savingsAnalysis.monthsRequired > 12 && currentSaving > 0) {
      const boostAmount = Math.round(currentSaving * 0.5);
      const boostedMonths = Math.ceil((details.actualPrice - profile.existingSavings) / (currentSaving + boostAmount));
      insights.push({ type: "tip", message: `Increase savings by ₹${boostAmount.toLocaleString()}/month to reduce timeline to ${boostedMonths} months.` });
    }

    if (profile.existingSavings >= details.actualPrice) {
      insights.push({ type: "success", message: "You already have enough savings to buy this outright! No EMI or waiting needed." });
    }

    if (profile.existingSavings >= details.actualPrice * 0.5) {
      insights.push({ type: "info", message: `Your existing savings cover ${Math.round((profile.existingSavings / details.actualPrice) * 100)}% of the price.` });
    }
  }

  // General insights (21-30)
  if (disposable <= 0) {
    insights.push({ type: "danger", message: "Your expenses exceed your income. Focus on reducing expenses before new purchases." });
  }

  const emergencyMonths = disposable > 0 ? profile.existingSavings / (profile.monthlyExpenses + profile.monthlyRoutineBills) : 0;
  if (emergencyMonths < 3) {
    insights.push({ type: "warning", message: `You only have ${emergencyMonths.toFixed(1)} months of emergency fund. Build this up before large purchases.` });
  } else if (emergencyMonths >= 6) {
    insights.push({ type: "success", message: "You have a strong emergency fund — this purchase won't compromise your safety net." });
  }

  // Delay recommendation
  if (purchaseScore && purchaseScore.score < 50) {
    insights.push({ type: "tip", message: "Delay by 6 months for better financial stability before committing." });
  }

  // Budget reallocation
  if (emiAnalysis && !emiAnalysis.isAffordable) {
    const cutNeeded = emiAnalysis.emiAmount - disposable * 0.4;
    if (cutNeeded > 0) {
      insights.push({ type: "tip", message: `Cut ₹${Math.round(cutNeeded).toLocaleString()}/month from discretionary expenses to make this EMI feasible.` });
    }
  }

  // Normal saving years
  if (disposable > 0 && details.actualPrice > 0) {
    const normalYears = (details.actualPrice / (disposable * 12));
    if (normalYears > 0) {
      insights.push({ type: "info", message: `With normal saving alone (no extra effort), this purchase would take ${normalYears.toFixed(1)} years.` });
    }
  }

  return insights;
}

// ─── Full Simulation ─────────────────────────────────────────

export function runSimulation(profile: FinancialProfile, details: PurchaseDetails): SimulationResult {
  let emiAnalysis: EMIAnalysis | undefined;
  let savingsAnalysis: SavingsAnalysis | undefined;
  let comparison: ComparisonData | undefined;

  if (details.mode === "emi") {
    emiAnalysis = analyzeEMI(profile, details);
    // Also calculate savings for comparison
    const savingsDetails = { ...details, mode: "savings" as PurchaseMode, monthlySavingForPurchase: profile.extraSavingPerMonth || emiAnalysis.emiAmount };
    savingsAnalysis = analyzeSavings(profile, savingsDetails);
    comparison = generateComparison(emiAnalysis, savingsAnalysis, savingsDetails);
  } else if (details.mode === "savings" || details.mode === "save-extra") {
    savingsAnalysis = analyzeSavings(profile, details);
    // Also calculate EMI for comparison (assume 12% and 12 months)
    const emiDetails = { ...details, mode: "emi" as PurchaseMode, emiTenureMonths: 12, interestRate: 12 };
    emiAnalysis = analyzeEMI(profile, emiDetails);
    comparison = generateComparison(emiAnalysis, savingsAnalysis, details);
  }

  const purchaseScore = calculatePurchaseScore(profile, emiAnalysis, savingsAnalysis);
  const insights = generateInsights(profile, details, emiAnalysis, savingsAnalysis, purchaseScore);

  return {
    id: generateId(),
    createdAt: new Date().toISOString(),
    financialProfile: profile,
    purchaseDetails: details,
    emiAnalysis,
    savingsAnalysis,
    comparison,
    purchaseScore,
    insights,
  };
}

// ─── Simulation History (localStorage) ───────────────────────

const HISTORY_KEY = "cfo_planner_history";

export function saveSimulation(userId: string, result: SimulationResult) {
  const key = `${HISTORY_KEY}_${userId}`;
  const history: SimulationResult[] = JSON.parse(localStorage.getItem(key) || "[]");
  history.unshift(result);
  if (history.length > 20) history.pop();
  localStorage.setItem(key, JSON.stringify(history));
}

export function getSimulationHistory(userId: string): SimulationResult[] {
  const key = `${HISTORY_KEY}_${userId}`;
  return JSON.parse(localStorage.getItem(key) || "[]");
}

export function clearSimulationHistory(userId: string) {
  localStorage.removeItem(`${HISTORY_KEY}_${userId}`);
}
