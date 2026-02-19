/**
 * Analytics & Aggregation Layer
 * Provides 12-month data analysis, monthly/yearly summaries, category breakdowns,
 * and predictive analytics for the dashboard.
 */

import type { Income, Expense } from "./api";

// ─── Types ────────────────────────────────────────────────────

export interface MonthlyAggregate {
  month: string; // "Jan", "Feb", etc.
  monthIndex: number;
  year: number;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
}

export interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
  monthlyBreakdown: Record<string, number>;
  growth: number; // % change from previous period
}

export interface YearlySummary {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  savingsRate: number;
  highestSpendingCategory: string;
  highestSpendingAmount: number;
  bestMonth: string;
  worstMonth: string;
  averageMonthlyExpense: number;
  averageMonthlyIncome: number;
  monthsTracked: number;
}

export interface PeakMonthInfo {
  month: string;
  value: number;
  percentAboveAvg: number;
}

export interface PeakAnalysis {
  peakIncome: PeakMonthInfo;
  peakExpense: PeakMonthInfo;
  peakSavings: PeakMonthInfo;
}

export interface QuarterData {
  quarter: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
}

export interface Prediction {
  nextMonthIncome: number;
  nextMonthExpense: number;
  nextMonthSavingsRate: number;
  threeMonthProjection: { month: string; income: number; expenses: number; savings: number }[];
  trend: "improving" | "declining" | "stable";
}

export interface FinancialHealthScore {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  factors: { label: string; score: number; weight: number }[];
}

// ─── Constants ────────────────────────────────────────────────

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Helpers ──────────────────────────────────────────────────

const getMonthKey = (date: string) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}`;
};

const getMonthLabel = (date: string) => MONTH_NAMES[new Date(date).getMonth()];

// ─── Monthly Aggregation ─────────────────────────────────────

export function getMonthlyAggregates(incomes: Income[], expenses: Expense[]): MonthlyAggregate[] {
  const map = new Map<string, MonthlyAggregate>();

  // Initialize last 12 months
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    map.set(key, {
      month: MONTH_NAMES[d.getMonth()],
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      income: 0,
      expenses: 0,
      savings: 0,
      savingsRate: 0,
    });
  }

  incomes.forEach((i) => {
    const key = getMonthKey(i.date);
    const agg = map.get(key);
    if (agg) agg.income += i.amount;
  });

  expenses.forEach((e) => {
    const key = getMonthKey(e.date);
    const agg = map.get(key);
    if (agg) agg.expenses += e.amount;
  });

  // Calculate savings
  map.forEach((agg) => {
    agg.savings = agg.income - agg.expenses;
    agg.savingsRate = agg.income > 0 ? (agg.savings / agg.income) * 100 : 0;
  });

  return Array.from(map.values());
}

// ─── Current Month Stats ─────────────────────────────────────

export function getCurrentMonthStats(incomes: Income[], expenses: Expense[]) {
  const now = new Date();
  const cm = now.getMonth();
  const cy = now.getFullYear();

  const monthIncome = incomes
    .filter((i) => { const d = new Date(i.date); return d.getMonth() === cm && d.getFullYear() === cy; })
    .reduce((s, i) => s + i.amount, 0);

  const monthExpenses = expenses
    .filter((e) => { const d = new Date(e.date); return d.getMonth() === cm && d.getFullYear() === cy; })
    .reduce((s, e) => s + e.amount, 0);

  return {
    income: monthIncome,
    expenses: monthExpenses,
    savings: monthIncome - monthExpenses,
    savingsRate: monthIncome > 0 ? ((monthIncome - monthExpenses) / monthIncome) * 100 : 0,
  };
}

// ─── Category Analysis ───────────────────────────────────────

export function getCategorySummaries(expenses: Expense[]): CategorySummary[] {
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
  const catMap = new Map<string, CategorySummary>();

  expenses.forEach((e) => {
    if (!catMap.has(e.category)) {
      catMap.set(e.category, { category: e.category, total: 0, percentage: 0, monthlyBreakdown: {}, growth: 0 });
    }
    const cat = catMap.get(e.category)!;
    cat.total += e.amount;
    const ml = getMonthLabel(e.date);
    cat.monthlyBreakdown[ml] = (cat.monthlyBreakdown[ml] || 0) + e.amount;
  });

  // Calculate percentages and growth
  const now = new Date();
  const thisMonth = now.getMonth();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;

  catMap.forEach((cat) => {
    cat.percentage = totalAll > 0 ? (cat.total / totalAll) * 100 : 0;

    const thisM = MONTH_NAMES[thisMonth];
    const lastM = MONTH_NAMES[lastMonth];
    const thisVal = cat.monthlyBreakdown[thisM] || 0;
    const lastVal = cat.monthlyBreakdown[lastM] || 0;
    cat.growth = lastVal > 0 ? ((thisVal - lastVal) / lastVal) * 100 : 0;
  });

  return Array.from(catMap.values()).sort((a, b) => b.total - a.total);
}

// ─── Yearly Summary ──────────────────────────────────────────

export function getYearlySummary(incomes: Income[], expenses: Expense[]): YearlySummary {
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  const categories = getCategorySummaries(expenses);
  const highestCat = categories[0];

  const monthly = getMonthlyAggregates(incomes, expenses);
  const activeMonths = monthly.filter((m) => m.income > 0 || m.expenses > 0);

  let bestMonth = monthly[0];
  let worstMonth = monthly[0];
  activeMonths.forEach((m) => {
    if (m.savingsRate > bestMonth.savingsRate) bestMonth = m;
    if (m.expenses > worstMonth.expenses) worstMonth = m;
  });

  return {
    totalIncome,
    totalExpenses,
    totalSavings,
    savingsRate,
    highestSpendingCategory: highestCat?.category || "N/A",
    highestSpendingAmount: highestCat?.total || 0,
    bestMonth: bestMonth?.month || "N/A",
    worstMonth: worstMonth?.month || "N/A",
    averageMonthlyExpense: activeMonths.length > 0 ? totalExpenses / activeMonths.length : 0,
    averageMonthlyIncome: activeMonths.length > 0 ? totalIncome / activeMonths.length : 0,
    monthsTracked: activeMonths.length,
  };
}

// ─── Financial Health Score ──────────────────────────────────

export function getFinancialHealthScore(incomes: Income[], expenses: Expense[]): FinancialHealthScore {
  const yearly = getYearlySummary(incomes, expenses);
  const categories = getCategorySummaries(expenses);
  const monthly = getMonthlyAggregates(incomes, expenses);

  // Factor 1: Savings rate (weight 35)
  const savingsScore = Math.min(100, Math.max(0, yearly.savingsRate * 3.33));

  // Factor 2: Expense diversity (weight 20) - lower concentration = better
  const maxCatPct = categories[0]?.percentage || 0;
  const diversityScore = Math.max(0, 100 - maxCatPct);

  // Factor 3: Spending consistency (weight 20) - lower variance = better
  const activeMonths = monthly.filter((m) => m.expenses > 0);
  let consistencyScore = 80;
  if (activeMonths.length > 1) {
    const avg = activeMonths.reduce((s, m) => s + m.expenses, 0) / activeMonths.length;
    const variance = activeMonths.reduce((s, m) => s + Math.pow(m.expenses - avg, 2), 0) / activeMonths.length;
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 0;
    consistencyScore = Math.max(0, Math.min(100, 100 - cv * 100));
  }

  // Factor 4: Income stability (weight 15)
  const incomeMonths = monthly.filter((m) => m.income > 0);
  const incomeStability = incomeMonths.length >= 3 ? 80 : incomeMonths.length * 25;

  // Factor 5: Positive trend (weight 10)
  let trendScore = 50;
  if (activeMonths.length >= 2) {
    const last = activeMonths[activeMonths.length - 1];
    const prev = activeMonths[activeMonths.length - 2];
    if (last.savingsRate > prev.savingsRate) trendScore = 90;
    else if (last.savingsRate < prev.savingsRate) trendScore = 20;
  }

  const factors = [
    { label: "Savings Rate", score: savingsScore, weight: 0.35 },
    { label: "Expense Diversity", score: diversityScore, weight: 0.2 },
    { label: "Spending Consistency", score: consistencyScore, weight: 0.2 },
    { label: "Income Stability", score: incomeStability, weight: 0.15 },
    { label: "Financial Trend", score: trendScore, weight: 0.1 },
  ];

  const score = Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0));
  const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "F";

  return { score, grade, factors };
}

// ─── Predictions ─────────────────────────────────────────────

export function getPredictions(incomes: Income[], expenses: Expense[]): Prediction {
  const monthly = getMonthlyAggregates(incomes, expenses);
  const active = monthly.filter((m) => m.income > 0 || m.expenses > 0);

  if (active.length < 2) {
    return {
      nextMonthIncome: 0,
      nextMonthExpense: 0,
      nextMonthSavingsRate: 0,
      threeMonthProjection: [],
      trend: "stable",
    };
  }

  // Simple weighted moving average (recent months weighted more)
  const weights = active.map((_, i) => i + 1);
  const totalWeight = weights.reduce((s, w) => s + w, 0);

  const avgIncome = active.reduce((s, m, i) => s + m.income * weights[i], 0) / totalWeight;
  const avgExpense = active.reduce((s, m, i) => s + m.expenses * weights[i], 0) / totalWeight;

  // Trend from last 3 months
  const last3 = active.slice(-3);
  const incomeGrowth = last3.length >= 2
    ? (last3[last3.length - 1].income - last3[0].income) / Math.max(last3[0].income, 1) / last3.length
    : 0;
  const expenseGrowth = last3.length >= 2
    ? (last3[last3.length - 1].expenses - last3[0].expenses) / Math.max(last3[0].expenses, 1) / last3.length
    : 0;

  const now = new Date();
  const projection: Prediction["threeMonthProjection"] = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const income = Math.round(avgIncome * (1 + incomeGrowth * i));
    const exp = Math.round(avgExpense * (1 + expenseGrowth * i));
    projection.push({
      month: MONTH_NAMES[d.getMonth()],
      income,
      expenses: exp,
      savings: income - exp,
    });
  }

  const nextIncome = projection[0]?.income || 0;
  const nextExpense = projection[0]?.expenses || 0;
  const nextSavingsRate = nextIncome > 0 ? ((nextIncome - nextExpense) / nextIncome) * 100 : 0;

  const savingsTrend = last3.length >= 2
    ? last3[last3.length - 1].savingsRate - last3[0].savingsRate
    : 0;

  return {
    nextMonthIncome: nextIncome,
    nextMonthExpense: nextExpense,
    nextMonthSavingsRate: nextSavingsRate,
    threeMonthProjection: projection,
    trend: savingsTrend > 3 ? "improving" : savingsTrend < -3 ? "declining" : "stable",
  };
}

// ─── Stacked Category Monthly Data ───────────────────────────

export function getStackedCategoryData(expenses: Expense[]) {
  const months = new Map<string, Record<string, number>>();
  const allCategories = new Set<string>();

  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.set(MONTH_NAMES[d.getMonth()], {});
  }

  expenses.forEach((e) => {
    const ml = getMonthLabel(e.date);
    if (months.has(ml)) {
      const m = months.get(ml)!;
      m[e.category] = (m[e.category] || 0) + e.amount;
      allCategories.add(e.category);
    }
  });

  const data = Array.from(months.entries()).map(([month, cats]) => ({ month, ...cats }));
  return { data, categories: Array.from(allCategories) };
}

// ─── Peak Month Analysis ─────────────────────────────────────

export function getPeakAnalysis(incomes: Income[], expenses: Expense[]): PeakAnalysis {
  const monthly = getMonthlyAggregates(incomes, expenses);
  const active = monthly.filter((m) => m.income > 0 || m.expenses > 0);

  const defaultPeak: PeakMonthInfo = { month: "N/A", value: 0, percentAboveAvg: 0 };

  if (active.length === 0) {
    return { peakIncome: defaultPeak, peakExpense: defaultPeak, peakSavings: defaultPeak };
  }

  const avgIncome = active.reduce((s, m) => s + m.income, 0) / active.length;
  const avgExpense = active.reduce((s, m) => s + m.expenses, 0) / active.length;
  const avgSavings = active.reduce((s, m) => s + m.savings, 0) / active.length;

  const peakIncomeMonth = active.reduce((a, b) => (a.income > b.income ? a : b));
  const peakExpenseMonth = active.reduce((a, b) => (a.expenses > b.expenses ? a : b));
  const peakSavingsMonth = active.reduce((a, b) => (a.savings > b.savings ? a : b));

  return {
    peakIncome: {
      month: peakIncomeMonth.month,
      value: peakIncomeMonth.income,
      percentAboveAvg: avgIncome > 0 ? ((peakIncomeMonth.income - avgIncome) / avgIncome) * 100 : 0,
    },
    peakExpense: {
      month: peakExpenseMonth.month,
      value: peakExpenseMonth.expenses,
      percentAboveAvg: avgExpense > 0 ? ((peakExpenseMonth.expenses - avgExpense) / avgExpense) * 100 : 0,
    },
    peakSavings: {
      month: peakSavingsMonth.month,
      value: peakSavingsMonth.savings,
      percentAboveAvg: avgSavings > 0 ? ((peakSavingsMonth.savings - avgSavings) / avgSavings) * 100 : 0,
    },
  };
}

// ─── Quarter Analysis ────────────────────────────────────────

export function getQuarterData(incomes: Income[], expenses: Expense[]): QuarterData[] {
  const quarters: QuarterData[] = [
    { quarter: "Q1", income: 0, expenses: 0, savings: 0, savingsRate: 0 },
    { quarter: "Q2", income: 0, expenses: 0, savings: 0, savingsRate: 0 },
    { quarter: "Q3", income: 0, expenses: 0, savings: 0, savingsRate: 0 },
    { quarter: "Q4", income: 0, expenses: 0, savings: 0, savingsRate: 0 },
  ];

  const year = new Date().getFullYear();

  incomes.forEach((i) => {
    const d = new Date(i.date);
    if (d.getFullYear() === year) {
      const qi = Math.floor(d.getMonth() / 3);
      quarters[qi].income += i.amount;
    }
  });

  expenses.forEach((e) => {
    const d = new Date(e.date);
    if (d.getFullYear() === year) {
      const qi = Math.floor(d.getMonth() / 3);
      quarters[qi].expenses += e.amount;
    }
  });

  quarters.forEach((q) => {
    q.savings = q.income - q.expenses;
    q.savingsRate = q.income > 0 ? (q.savings / q.income) * 100 : 0;
  });

  return quarters;
}
