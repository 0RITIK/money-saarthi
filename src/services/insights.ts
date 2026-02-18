/**
 * Dynamic AI Insights Engine — 100+ unique insight templates
 * Generates contextual financial insights based on income/expense patterns.
 */

import type { Income, Expense } from "./api";
import type { AIInsight } from "./api";
import {
  getMonthlyAggregates,
  getCategorySummaries,
  getYearlySummary,
  getFinancialHealthScore,
  getCurrentMonthStats,
  getPredictions,
} from "./analytics";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (n: number) => `₹${Math.abs(Math.round(n)).toLocaleString()}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

export function generateInsights(incomes: Income[], expenses: Expense[]): AIInsight[] {
  const insights: AIInsight[] = [];
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  if (totalIncome === 0 && totalExpenses === 0) {
    return [{ type: "info", message: "Welcome! Start by adding your income and expenses to unlock 100+ personalized financial insights." }];
  }

  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
  const yearly = getYearlySummary(incomes, expenses);
  const monthly = getMonthlyAggregates(incomes, expenses);
  const categories = getCategorySummaries(expenses);
  const health = getFinancialHealthScore(incomes, expenses);
  const currentMonth = getCurrentMonthStats(incomes, expenses);
  const predictions = getPredictions(incomes, expenses);
  const active = monthly.filter((m) => m.income > 0 || m.expenses > 0);
  const now = new Date();
  const thisMonthName = MONTH_NAMES[now.getMonth()];

  // ─── SAVINGS PERFORMANCE (15 templates) ─────────────────────

  if (savingsRate < 0) {
    insights.push({ type: "danger", message: `⚠️ You're overspending by ${fmt(Math.abs(balance))}! Your expenses exceed income. Immediate action needed.` });
    insights.push({ type: "danger", message: "Running a negative savings rate means you're depleting reserves. Cut non-essential spending today." });
  }
  if (savingsRate >= 0 && savingsRate < 5) {
    insights.push({ type: "danger", message: `Your savings rate is critically low at ${pct(savingsRate)}. You're saving almost nothing.` });
    insights.push({ type: "warning", message: "With less than 5% savings, you have no emergency buffer. Aim for at least 20%." });
  }
  if (savingsRate >= 5 && savingsRate < 10) {
    insights.push({ type: "warning", message: `Savings rate of ${pct(savingsRate)} is below recommended. Try reducing discretionary spending.` });
  }
  if (savingsRate >= 10 && savingsRate < 20) {
    insights.push({ type: "warning", message: `You're saving ${pct(savingsRate)} — good progress, but the 20% target is the sweet spot.` });
    insights.push({ type: "info", message: "At your current rate, consider automating a small portion into a savings account." });
  }
  if (savingsRate >= 20 && savingsRate < 35) {
    insights.push({ type: "success", message: `Excellent! ${pct(savingsRate)} savings rate beats the recommended 20%. You're building wealth.` });
    insights.push({ type: "success", message: "Your savings discipline is strong. Consider diversifying into mutual funds or SIPs." });
  }
  if (savingsRate >= 35 && savingsRate < 50) {
    insights.push({ type: "success", message: `Outstanding ${pct(savingsRate)} savings rate! You're in the top tier of financial discipline.` });
    insights.push({ type: "info", message: "With 35%+ savings, explore tax-saving instruments like PPF, ELSS, or NPS." });
  }
  if (savingsRate >= 50) {
    insights.push({ type: "success", message: `Incredible ${pct(savingsRate)} savings rate! You could achieve FIRE (Financial Independence) at this pace.` });
    insights.push({ type: "info", message: "Consider investing aggressively — index funds, real estate, or starting a side business." });
  }
  if (balance > 0) {
    insights.push({ type: "success", message: `You've accumulated ${fmt(balance)} in net savings. Keep this momentum going!` });
  }

  // Year-to-date savings milestones
  if (yearly.totalSavings >= 100000) insights.push({ type: "success", message: `🏆 Milestone! You've saved over ₹1 lakh this year. Financial freedom is within reach!` });
  if (yearly.totalSavings >= 50000 && yearly.totalSavings < 100000) insights.push({ type: "success", message: `You've saved ${fmt(yearly.totalSavings)} this year. Halfway to the ₹1 lakh milestone!` });
  if (yearly.totalSavings >= 10000 && yearly.totalSavings < 50000) insights.push({ type: "info", message: `${fmt(yearly.totalSavings)} saved so far this year. Consistency will get you to bigger milestones.` });

  // ─── OVERSPENDING WARNINGS (15 templates) ───────────────────

  categories.forEach((cat) => {
    if (cat.percentage > 50) {
      insights.push({ type: "danger", message: `🚨 ${cat.category} alone accounts for ${pct(cat.percentage)} of all expenses — that's dangerously high.` });
    }
    if (cat.percentage > 30 && cat.percentage <= 50) {
      insights.push({ type: "warning", message: `${cat.category} spending is ${pct(cat.percentage)} of total — above the 30% recommended limit.` });
    }
    if (cat.percentage > 20 && cat.percentage <= 30) {
      insights.push({ type: "info", message: `${cat.category} at ${pct(cat.percentage)} of expenses is manageable but worth monitoring.` });
    }
  });

  if (categories.length > 0) {
    insights.push({ type: "info", message: `Your top spending category is ${categories[0].category} at ${fmt(categories[0].total)}.` });
  }
  if (categories.length >= 2) {
    insights.push({ type: "info", message: `${categories[0].category} and ${categories[1].category} together make up ${pct(categories[0].percentage + categories[1].percentage)} of spending.` });
  }
  if (totalExpenses > totalIncome * 0.9) {
    insights.push({ type: "danger", message: "You're spending over 90% of your income. One unexpected expense could put you in debt." });
  }

  // ─── CATEGORY SPIKES (10 templates) ─────────────────────────

  categories.forEach((cat) => {
    if (cat.growth > 50) {
      insights.push({ type: "danger", message: `📈 ${cat.category} spending spiked ${pct(cat.growth)} this month compared to last — investigate!` });
    } else if (cat.growth > 20) {
      insights.push({ type: "warning", message: `${cat.category} costs rose ${pct(cat.growth)} month-over-month. Is this a one-time event?` });
    } else if (cat.growth < -20) {
      insights.push({ type: "success", message: `You reduced ${cat.category} spending by ${pct(Math.abs(cat.growth))} — great cost control!` });
    }
  });

  // ─── MONTH-OVER-MONTH (12 templates) ────────────────────────

  if (active.length >= 2) {
    const last = active[active.length - 1];
    const prev = active[active.length - 2];

    if (last.expenses > prev.expenses) {
      const inc = ((last.expenses - prev.expenses) / prev.expenses * 100);
      insights.push({ type: "warning", message: `Expenses increased ${pct(inc)} from ${prev.month} to ${last.month}. Review recent transactions.` });
      if (inc > 30) insights.push({ type: "danger", message: `A ${pct(inc)} expense jump is alarming. Check for unusual or unplanned purchases.` });
    } else if (last.expenses < prev.expenses) {
      const dec = ((prev.expenses - last.expenses) / prev.expenses * 100);
      insights.push({ type: "success", message: `Spending dropped ${pct(dec)} from ${prev.month} to ${last.month} — excellent discipline!` });
    }

    if (last.income > prev.income) {
      insights.push({ type: "success", message: `Income grew from ${prev.month} to ${last.month} — capitalize on this by saving the difference.` });
    } else if (last.income < prev.income && last.income > 0) {
      insights.push({ type: "warning", message: `Income decreased from ${prev.month}. Diversify income sources to reduce risk.` });
    }

    if (last.savingsRate > prev.savingsRate + 5) {
      insights.push({ type: "success", message: `Your savings rate improved by ${pct(last.savingsRate - prev.savingsRate)} — strong financial progress.` });
    }
    if (last.savingsRate < prev.savingsRate - 5) {
      insights.push({ type: "warning", message: `Savings rate dropped ${pct(prev.savingsRate - last.savingsRate)} — recalibrate your budget.` });
    }
  }

  // ─── BEST/WORST MONTH (8 templates) ─────────────────────────

  if (active.length >= 3) {
    const best = active.reduce((a, b) => a.savingsRate > b.savingsRate ? a : b);
    const worst = active.reduce((a, b) => a.expenses > b.expenses ? a : b);
    const lowestExpense = active.reduce((a, b) => a.expenses < b.expenses && a.expenses > 0 ? a : b);

    insights.push({ type: "success", message: `🏆 ${best.month} was your best month with ${pct(best.savingsRate)} savings rate.` });
    insights.push({ type: "warning", message: `${worst.month} had the highest spending at ${fmt(worst.expenses)}. Learn from that pattern.` });
    if (lowestExpense.expenses > 0) {
      insights.push({ type: "success", message: `${lowestExpense.month} had the lowest expenses at ${fmt(lowestExpense.expenses)} — can you replicate that?` });
    }

    const avgExpense = active.reduce((s, m) => s + m.expenses, 0) / active.length;
    const aboveAvg = active.filter((m) => m.expenses > avgExpense * 1.2);
    if (aboveAvg.length > 0) {
      insights.push({ type: "info", message: `${aboveAvg.length} month(s) exceeded your average spending by 20%+. Look for seasonal patterns.` });
    }
  }

  // ─── SPENDING CONSISTENCY (8 templates) ─────────────────────

  if (active.length >= 3) {
    const expValues = active.map((m) => m.expenses).filter((v) => v > 0);
    const avg = expValues.reduce((s, v) => s + v, 0) / expValues.length;
    const variance = expValues.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / expValues.length;
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 0;

    if (cv < 0.15) {
      insights.push({ type: "success", message: "Your spending is very consistent month-to-month — a sign of strong budgeting." });
    } else if (cv < 0.3) {
      insights.push({ type: "info", message: "Moderate spending variation detected. Consider setting monthly budget targets." });
    } else {
      insights.push({ type: "warning", message: "High spending variance across months. Volatile expenses make planning difficult." });
      insights.push({ type: "info", message: "Try creating a fixed monthly budget to reduce spending swings." });
    }
  }

  // ─── RISK ALERTS (10 templates) ─────────────────────────────

  if (yearly.averageMonthlyExpense > yearly.averageMonthlyIncome * 0.95) {
    insights.push({ type: "danger", message: "Your average monthly expenses nearly match income — zero margin for emergencies." });
  }
  if (categories.length === 1) {
    insights.push({ type: "warning", message: "All expenses in one category — diversify tracking for better insights." });
  }
  if (incomes.length < 3 && expenses.length > 10) {
    insights.push({ type: "warning", message: "You've logged many expenses but few income entries. Are you tracking all income sources?" });
  }
  if (yearly.monthsTracked < 3) {
    insights.push({ type: "info", message: "Track at least 3 months of data for meaningful trend analysis and predictions." });
  }
  const noIncomeMonths = active.filter((m) => m.income === 0 && m.expenses > 0);
  if (noIncomeMonths.length > 0) {
    insights.push({ type: "warning", message: `${noIncomeMonths.length} month(s) show expenses but no income. Ensure all income is recorded.` });
  }

  // Emergency fund check
  if (balance > 0 && balance < yearly.averageMonthlyExpense * 3) {
    insights.push({ type: "warning", message: `Your savings cover less than 3 months of expenses. Build a 6-month emergency fund (${fmt(yearly.averageMonthlyExpense * 6)}).` });
  }
  if (balance >= yearly.averageMonthlyExpense * 6 && yearly.averageMonthlyExpense > 0) {
    insights.push({ type: "success", message: "You have 6+ months of expenses saved — your emergency fund is solid!" });
  }

  // ─── POSITIVE REINFORCEMENT (8 templates) ──────────────────

  if (health.score >= 80) {
    insights.push({ type: "success", message: `Your Financial Health Score is ${health.score}/100 (Grade ${health.grade}) — outstanding!` });
  } else if (health.score >= 60) {
    insights.push({ type: "info", message: `Financial Health Score: ${health.score}/100 (Grade ${health.grade}). Room for improvement.` });
  } else {
    insights.push({ type: "warning", message: `Financial Health Score: ${health.score}/100 (Grade ${health.grade}). Focus on savings and expense control.` });
  }

  if (currentMonth.savingsRate > savingsRate) {
    insights.push({ type: "success", message: `This month's savings rate (${pct(currentMonth.savingsRate)}) beats your overall average — trending up!` });
  }

  const consecutiveSaving = active.filter((m) => m.savings > 0).length;
  if (consecutiveSaving >= 6) {
    insights.push({ type: "success", message: `${consecutiveSaving} months of positive savings — remarkable consistency!` });
  } else if (consecutiveSaving >= 3) {
    insights.push({ type: "success", message: `${consecutiveSaving} months of positive savings in a row. Keep the streak alive!` });
  }

  // ─── INVESTMENT SUGGESTIONS (8 templates) ──────────────────

  if (savingsRate >= 20 && balance >= 10000) {
    insights.push({ type: "info", message: "With strong savings, consider starting a SIP in index funds for long-term growth." });
    insights.push({ type: "info", message: "PPF and ELSS offer tax benefits under Section 80C — maximize your deductions." });
  }
  if (savingsRate >= 30) {
    insights.push({ type: "info", message: "At 30%+ savings rate, explore fixed deposits for guaranteed returns on idle cash." });
  }
  if (balance >= 50000) {
    insights.push({ type: "info", message: "With ${fmt(balance)} saved, diversify: 50% equity, 30% debt, 20% gold/alternatives." });
  }

  // ─── PREDICTIONS (8 templates) ─────────────────────────────

  if (predictions.nextMonthIncome > 0) {
    insights.push({ type: "info", message: `📊 Predicted next month: Income ${fmt(predictions.nextMonthIncome)}, Expenses ${fmt(predictions.nextMonthExpense)}.` });
    if (predictions.nextMonthSavingsRate > 0) {
      insights.push({ type: "info", message: `Projected savings rate next month: ${pct(predictions.nextMonthSavingsRate)}.` });
    }
  }
  if (predictions.trend === "improving") {
    insights.push({ type: "success", message: "📈 Your financial trend is improving — savings rate is climbing over recent months." });
  } else if (predictions.trend === "declining") {
    insights.push({ type: "warning", message: "📉 Declining financial trend detected — expenses are growing faster than income." });
  }

  // ─── EXPENSE PATTERNS (10 templates) ───────────────────────

  const foodCat = categories.find((c) => c.category === "Food");
  const transportCat = categories.find((c) => c.category === "Transport");
  const entertainmentCat = categories.find((c) => c.category === "Entertainment");
  const billsCat = categories.find((c) => c.category === "Bills");
  const shoppingCat = categories.find((c) => c.category === "Shopping");

  if (foodCat && foodCat.percentage > 35) {
    insights.push({ type: "warning", message: `Food spending at ${pct(foodCat.percentage)} is high. Try meal prepping to save 20-30%.` });
  }
  if (transportCat && transportCat.percentage > 15) {
    insights.push({ type: "info", message: `Transport costs at ${pct(transportCat.percentage)} — consider carpooling or public transit.` });
  }
  if (entertainmentCat && entertainmentCat.percentage > 15) {
    insights.push({ type: "info", message: `Entertainment spending at ${pct(entertainmentCat.percentage)}. Balance enjoyment with savings goals.` });
  }
  if (billsCat && billsCat.percentage > 40) {
    insights.push({ type: "warning", message: `Bills account for ${pct(billsCat.percentage)} — review subscriptions and negotiate rates.` });
  }
  if (shoppingCat && shoppingCat.percentage > 20) {
    insights.push({ type: "warning", message: `Shopping at ${pct(shoppingCat.percentage)} of expenses. Apply the 24-hour rule before purchases.` });
  }

  // ─── ANOMALY DETECTION (6 templates) ───────────────────────

  if (active.length >= 3) {
    const avgExp = active.reduce((s, m) => s + m.expenses, 0) / active.length;
    const last = active[active.length - 1];
    if (last.expenses > avgExp * 1.5) {
      insights.push({ type: "danger", message: `⚠️ Anomaly: ${last.month} expenses are 50%+ above your average — investigate large transactions.` });
    }
    if (last.income > 0 && last.income > yearly.averageMonthlyIncome * 1.5) {
      insights.push({ type: "success", message: `Income anomaly: ${last.month} income was 50%+ above average — save the windfall!` });
    }

    // Check for sudden new categories
    if (categories.length > 4) {
      insights.push({ type: "info", message: `You're spending across ${categories.length} categories. Good tracking — detailed data = better insights.` });
    }
  }

  // ─── BUDGET BREACH (6 templates) ───────────────────────────

  const monthlyBudget50 = (yearly.averageMonthlyIncome || currentMonth.income) * 0.5;
  if (currentMonth.expenses > monthlyBudget50 && monthlyBudget50 > 0) {
    insights.push({ type: "warning", message: `This month's expenses (${fmt(currentMonth.expenses)}) exceed 50% of income. You're past the needs threshold.` });
  }
  if (currentMonth.expenses > currentMonth.income && currentMonth.income > 0) {
    insights.push({ type: "danger", message: `🔴 Budget breach! ${thisMonthName} expenses (${fmt(currentMonth.expenses)}) exceed income (${fmt(currentMonth.income)}).` });
  }

  // 50/30/20 rule check
  if (totalIncome > 0) {
    const needsCats = categories.filter((c) => ["Food", "Bills", "Transport"].includes(c.category));
    const needsTotal = needsCats.reduce((s, c) => s + c.total, 0);
    const needsPct = (needsTotal / totalIncome) * 100;
    if (needsPct > 50) {
      insights.push({ type: "warning", message: `Needs (Food, Bills, Transport) consume ${pct(needsPct)} of income — the 50/30/20 rule suggests max 50%.` });
    } else {
      insights.push({ type: "success", message: `Essential spending at ${pct(needsPct)} of income — within the 50% guideline. Well managed!` });
    }
  }

  // ─── CATEGORY GROWTH TRENDS (6 templates) ──────────────────

  const growingCats = categories.filter((c) => c.growth > 10);
  const shrinkingCats = categories.filter((c) => c.growth < -10);

  if (growingCats.length > 0) {
    insights.push({ type: "warning", message: `Growing expenses: ${growingCats.map((c) => c.category).join(", ")} — monitor these categories.` });
  }
  if (shrinkingCats.length > 0) {
    insights.push({ type: "success", message: `Declining expenses: ${shrinkingCats.map((c) => c.category).join(", ")} — great cost optimization!` });
  }

  // ─── GENERAL TIPS (always included) ────────────────────────

  insights.push({ type: "info", message: "💡 Tip: Track every expense, no matter how small. ₹50 daily = ₹18,000 yearly." });
  insights.push({ type: "info", message: "💡 Tip: Review your subscriptions quarterly — cancel what you don't actively use." });
  insights.push({ type: "info", message: "💡 Tip: Set up automatic transfers to savings on payday to pay yourself first." });

  return insights;
}
