import { useEffect, useState, useMemo, lazy, Suspense, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { incomeApi, expenseApi, type Income, type Expense } from "@/services/api";
import { routineApi, type ExecutionResult } from "@/services/routineTransactions";
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
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

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

/** Floating alert for auto-executed routine transactions */
const RoutineAlert = ({ result, onDone }: { result: ExecutionResult; onDone: () => void }) => {
  const isIncome = result.type === "income";
  useEffect(() => {
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md ${
        isIncome
          ? "border-success/40 bg-success/10 shadow-success/10"
          : "border-destructive/40 bg-destructive/10 shadow-destructive/10"
      }`}
    >
      {isIncome ? (
        <TrendingUp className="h-5 w-5 text-success shrink-0" />
      ) : (
        <TrendingDown className="h-5 w-5 text-destructive shrink-0" />
      )}
      <p className="text-sm font-medium text-foreground">
        ₹{result.amount.toLocaleString()} {result.description}{" "}
        {isIncome ? "auto-credited" : "auto-debited"} successfully.
      </p>
    </motion.div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<(ExecutionResult & { _key: string })[]>([]);

  const removeAlert = useCallback((key: string) => {
    setAlerts((prev) => prev.filter((a) => a._key !== key));
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    // Execute due routine transactions, then fetch all data
    routineApi.executedue(user.id).then((results) => {
      if (results.length > 0) {
        setAlerts(results.map((r, i) => ({ ...r, _key: `${r.routineId}-${i}-${Date.now()}` })));
      }
      return Promise.all([incomeApi.getAll(user.id), expenseApi.getAll(user.id)] as const);
    }).then(([inc, exp]) => {
      setIncomes(inc);
      setExpenses(exp);
      setLoading(false);
    });
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

      {/* Routine execution alerts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {alerts.map((a) => (
            <RoutineAlert key={a._key} result={a} onDone={() => removeAlert(a._key)} />
          ))}
        </AnimatePresence>
      </div>

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
