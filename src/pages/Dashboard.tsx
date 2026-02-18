import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { incomeApi, expenseApi, type Income, type Expense } from "@/services/api";
import {
  getMonthlyAggregates,
  getCategorySummaries,
  getYearlySummary,
  getFinancialHealthScore,
  getCurrentMonthStats,
  getPredictions,
  getStackedCategoryData,
} from "@/services/analytics";
import { generateInsights } from "@/services/insights";
import DashboardLayout from "@/components/DashboardLayout";
import AnimatedStatCards from "@/components/dashboard/AnimatedStatCards";
import FloatingParticles from "@/components/dashboard/FloatingParticles";

// Lazy load heavy chart components
const MonthlyComparisonChart = lazy(() => import("@/components/dashboard/MonthlyComparisonChart"));
const SavingsTrendChart = lazy(() => import("@/components/dashboard/SavingsTrendChart"));
const CategoryBreakdownChart = lazy(() => import("@/components/dashboard/CategoryBreakdownChart"));
const HorizontalCategoryChart = lazy(() => import("@/components/dashboard/HorizontalCategoryChart"));
const StackedCategoryChart = lazy(() => import("@/components/dashboard/StackedCategoryChart"));
const PredictionsChart = lazy(() => import("@/components/dashboard/PredictionsChart"));
const YearlyOverviewChart = lazy(() => import("@/components/dashboard/YearlyOverviewChart"));
const FinancialHealthGauge = lazy(() => import("@/components/dashboard/FinancialHealthGauge"));
const InsightsPanel = lazy(() => import("@/components/dashboard/InsightsPanel"));

const ChartLoader = () => (
  <div className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-6 animate-pulse">
    <div className="h-4 w-40 rounded bg-muted mb-4" />
    <div className="h-64 rounded-xl bg-muted/50" />
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([incomeApi.getAll(user.id), expenseApi.getAll(user.id)]).then(
      ([inc, exp]) => {
        setIncomes(inc);
        setExpenses(exp);
        setLoading(false);
      }
    );
  }, [user]);

  // Memoize expensive calculations
  const monthly = useMemo(() => getMonthlyAggregates(incomes, expenses), [incomes, expenses]);
  const categories = useMemo(() => getCategorySummaries(expenses), [expenses]);
  const yearly = useMemo(() => getYearlySummary(incomes, expenses), [incomes, expenses]);
  const health = useMemo(() => getFinancialHealthScore(incomes, expenses), [incomes, expenses]);
  const currentMonth = useMemo(() => getCurrentMonthStats(incomes, expenses), [incomes, expenses]);
  const predictions = useMemo(() => getPredictions(incomes, expenses), [incomes, expenses]);
  const stacked = useMemo(() => getStackedCategoryData(expenses), [expenses]);
  const insights = useMemo(() => generateInsights(incomes, expenses), [incomes, expenses]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted/50" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <FloatingParticles />
      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user?.name}. Here's your premium financial overview.
          </p>
        </div>

        {/* Animated Stats Grid - 8 cards */}
        <AnimatedStatCards yearly={yearly} currentMonth={currentMonth} health={health} />

        {/* Row 1: Monthly Comparison + Savings Trend */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<ChartLoader />}>
            <MonthlyComparisonChart data={monthly} />
          </Suspense>
          <Suspense fallback={<ChartLoader />}>
            <SavingsTrendChart data={monthly} />
          </Suspense>
        </div>

        {/* Row 2: Category Donut + Horizontal Bars */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<ChartLoader />}>
            <CategoryBreakdownChart categories={categories} />
          </Suspense>
          <Suspense fallback={<ChartLoader />}>
            <HorizontalCategoryChart categories={categories} />
          </Suspense>
        </div>

        {/* Row 3: Stacked Category + Predictions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<ChartLoader />}>
            <StackedCategoryChart data={stacked.data} categories={stacked.categories} />
          </Suspense>
          <Suspense fallback={<ChartLoader />}>
            <PredictionsChart predictions={predictions} monthlyData={monthly} />
          </Suspense>
        </div>

        {/* Row 4: Yearly Overview + Health Gauge */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<ChartLoader />}>
            <YearlyOverviewChart data={monthly} />
          </Suspense>
          <Suspense fallback={<ChartLoader />}>
            <FinancialHealthGauge health={health} />
          </Suspense>
        </div>

        {/* AI Insights Panel */}
        <Suspense fallback={<ChartLoader />}>
          <InsightsPanel insights={insights} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
