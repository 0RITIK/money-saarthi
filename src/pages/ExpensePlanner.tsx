import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { incomeApi, expenseApi } from "@/services/api";
import { routineApi } from "@/services/routineTransactions";
import { getYearlySummary } from "@/services/analytics";
import {
  runSimulation,
  saveSimulation,
  getSimulationHistory,
  type FinancialProfile,
  type PurchaseDetails,
  type PurchaseMode,
  type SimulationResult,
  type PlannerInsight,
} from "@/services/purchasePlanner";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, RadialBarChart, RadialBar,
  ResponsiveContainer, Legend, Area, AreaChart, Cell,
} from "recharts";
import {
  Calculator, TrendingUp, TrendingDown, ShieldCheck, AlertTriangle, Lightbulb,
  Target, Clock, IndianRupee, Save, History, Lock, Sparkles, ArrowRight,
  CheckCircle2, XCircle, Zap, BarChart3, PiggyBank,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Feasibility Gauge Component ─────────────────────────────

function FeasibilityGauge({ score, feasibility }: { score: number; feasibility: string }) {
  const color = feasibility === "safe" ? "hsl(var(--success))" : feasibility === "moderate" ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  const data = [{ name: "Score", value: score, fill: color }];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-40 w-40">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={180} endAngle={0} data={data} barSize={12}>
            <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "hsl(var(--muted))" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <Badge
        variant="outline"
        className={`text-xs ${feasibility === "safe" ? "border-green-500 text-green-500" : feasibility === "moderate" ? "border-yellow-500 text-yellow-500" : "border-red-500 text-red-500"}`}
      >
        {feasibility === "safe" ? "✅ Safe to Buy" : feasibility === "moderate" ? "⚠️ Moderate Risk" : "🔴 High Risk"}
      </Badge>
    </div>
  );
}

// ─── Insight Card ────────────────────────────────────────────

function InsightItem({ insight, index }: { insight: PlannerInsight; index: number }) {
  const iconMap = {
    success: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />,
    danger: <XCircle className="h-4 w-4 text-red-500 shrink-0" />,
    info: <Lightbulb className="h-4 w-4 text-blue-400 shrink-0" />,
    tip: <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />,
  };
  const bgMap = {
    success: "border-green-500/20 bg-green-500/5",
    warning: "border-yellow-500/20 bg-yellow-500/5",
    danger: "border-red-500/20 bg-red-500/5",
    info: "border-blue-400/20 bg-blue-400/5",
    tip: "border-purple-400/20 bg-purple-400/5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-start gap-3 rounded-lg border p-3 ${bgMap[insight.type]}`}
    >
      {iconMap[insight.type]}
      <span className="text-sm text-foreground/90">{insight.message}</span>
    </motion.div>
  );
}

// ─── Pro Lock Overlay ────────────────────────────────────────

function ProLock({ children, isPro }: { children: React.ReactNode; isPro: boolean }) {
  if (isPro) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none blur-sm opacity-50">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/60 backdrop-blur-sm">
        <Lock className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">PRO Feature</p>
        <Button variant="outline" size="sm" className="pointer-events-auto" onClick={() => window.location.href = "/upgrade"}>
          Upgrade to PRO
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function ExpensePlanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isPro = user?.role === "PRO" || user?.isProActive === true;

  // Financial Profile
  const [useAutoFill, setUseAutoFill] = useState(true);
  const [profile, setProfile] = useState<FinancialProfile>({
    monthlyIncome: 0, monthlyExpenses: 0, monthlyRoutineBills: 0, existingSavings: 0, extraSavingPerMonth: 0,
  });

  // Purchase Details
  const [purchase, setPurchase] = useState<PurchaseDetails>({
    itemName: "", actualPrice: 0, mode: "emi",
    downPayment: 0, emiTenureMonths: 12, interestRate: 12,
    monthlySavingForPurchase: 0, startDate: new Date().toISOString().split("T")[0],
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<SimulationResult[]>([]);
  const [activeTab, setActiveTab] = useState("input");

  // Auto-fill from dashboard data
  useEffect(() => {
    if (!useAutoFill || !user) return;
    (async () => {
      try {
        const [incomes, expenses] = await Promise.all([
          incomeApi.getAll(user.id),
          expenseApi.getAll(user.id),
        ]);
        const routines = routineApi.getAll(user.id);
        const yearly = getYearlySummary(incomes, expenses);

        const routineBills = routines
          .filter((r) => r.type === "expense" && r.isActive)
          .reduce((s, r) => {
            if (r.frequency === "monthly") return s + r.amount;
            if (r.frequency === "weekly") return s + r.amount * 4;
            if (r.frequency === "daily") return s + r.amount * 30;
            return s;
          }, 0);

        setProfile({
          monthlyIncome: Math.round(yearly.averageMonthlyIncome),
          monthlyExpenses: Math.round(yearly.averageMonthlyExpense),
          monthlyRoutineBills: Math.round(routineBills),
          existingSavings: Math.max(0, yearly.totalSavings),
          extraSavingPerMonth: Math.round(Math.max(0, yearly.averageMonthlyIncome - yearly.averageMonthlyExpense) * 0.3),
        });
      } catch {
        // Silently fail — user can enter manually
      }
    })();
  }, [useAutoFill, user]);

  // Load history
  useEffect(() => {
    if (user) setHistory(getSimulationHistory(user.id));
  }, [user]);

  // ── Handlers ─────────────────────────────────────────────

  const handleSimulate = useCallback(() => {
    if (!purchase.itemName || purchase.actualPrice <= 0) {
      toast({ title: "Missing Info", description: "Enter item name and price.", variant: "destructive" });
      return;
    }
    if (profile.monthlyIncome <= 0) {
      toast({ title: "Missing Income", description: "Enter your monthly income first.", variant: "destructive" });
      return;
    }
    const sim = runSimulation(profile, purchase);
    setResult(sim);
    setActiveTab("results");
  }, [profile, purchase, toast]);

  const handleSave = useCallback(() => {
    if (!result || !user) return;
    saveSimulation(user.id, result);
    setHistory(getSimulationHistory(user.id));
    toast({ title: "Simulation Saved", description: `"${result.purchaseDetails.itemName}" saved to history.` });
  }, [result, user, toast]);

  const loadFromHistory = useCallback((sim: SimulationResult) => {
    setProfile(sim.financialProfile);
    setPurchase(sim.purchaseDetails);
    setResult(sim);
    setActiveTab("results");
    setUseAutoFill(false);
  }, []);

  // ── Derived ──────────────────────────────────────────────

  const disposable = profile.monthlyIncome - profile.monthlyExpenses - profile.monthlyRoutineBills;

  // EMI auto-calculate preview
  const emiPreview = useMemo(() => {
    if (purchase.mode !== "emi" || !purchase.actualPrice) return null;
    const principal = purchase.actualPrice - (purchase.downPayment || 0);
    if (principal <= 0) return null;
    const r = (purchase.interestRate || 0) / 12 / 100;
    const n = purchase.emiTenureMonths || 12;
    const emi = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return { emi: Math.round(emi), total: Math.round(emi * n + (purchase.downPayment || 0)) };
  }, [purchase]);

  // Savings auto-calc preview
  const savingsPreview = useMemo(() => {
    if ((purchase.mode !== "savings" && purchase.mode !== "save-extra") || !purchase.actualPrice) return null;
    const saving = purchase.monthlySavingForPurchase || profile.extraSavingPerMonth || 1;
    const remaining = Math.max(0, purchase.actualPrice - profile.existingSavings);
    const months = Math.ceil(remaining / saving);
    return { months, years: Math.round((months / 12) * 10) / 10 };
  }, [purchase, profile]);

  // ── Chart configs ────────────────────────────────────────

  const comparisonChartConfig = {
    emi: { label: "EMI", color: "hsl(var(--chart-5))" },
    savings: { label: "Savings", color: "hsl(var(--chart-6))" },
  };

  const timelineChartConfig = {
    accumulated: { label: "Savings Accumulated", color: "hsl(var(--chart-1))" },
    remaining: { label: "Remaining", color: "hsl(var(--chart-4))" },
  };

  // ── Comparison chart data ────────────────────────────────

  const comparisonBarData = useMemo(() => {
    if (!result?.comparison) return [];
    return [
      { metric: "Total Cost", emi: result.comparison.totalCostEMI, savings: result.comparison.totalCostSavings },
      { metric: "Monthly Burden", emi: result.comparison.monthlyBurdenEMI * 12, savings: result.comparison.monthlyBurdenSavings * 12 },
    ];
  }, [result]);

  const scoreFactorsData = useMemo(() => {
    if (!result) return [];
    return result.purchaseScore.factors.map((f) => ({
      name: f.label,
      score: f.score,
      fill: f.score >= 70 ? "hsl(var(--success))" : f.score >= 40 ? "hsl(var(--warning))" : "hsl(var(--destructive))",
    }));
  }, [result]);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            Smart Purchase Planner
          </h1>
          <p className="text-sm text-muted-foreground">Simulate whether to buy via EMI or savings — an AI-powered financial decision engine.</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="glass-card w-full justify-start gap-1 p-1">
            <TabsTrigger value="input" className="gap-2"><Target className="h-4 w-4" /> Plan Purchase</TabsTrigger>
            <TabsTrigger value="results" className="gap-2" disabled={!result}><BarChart3 className="h-4 w-4" /> Results</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4" /> History</TabsTrigger>
          </TabsList>

          {/* ═══ INPUT TAB ═══ */}
          <TabsContent value="input" className="space-y-6 mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Financial Profile Card */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="glass-card overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <PiggyBank className="h-5 w-5 text-primary" /> Financial Profile
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="autofill" className="text-xs text-muted-foreground">Use My Data</Label>
                        <Switch id="autofill" checked={useAutoFill} onCheckedChange={setUseAutoFill} />
                      </div>
                    </div>
                    <CardDescription>
                      {useAutoFill ? "Auto-filled from your dashboard data" : "Enter your financial details manually"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Monthly Income (avg)</Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number" className="pl-9" value={profile.monthlyIncome || ""}
                            onChange={(e) => setProfile((p) => ({ ...p, monthlyIncome: +e.target.value }))}
                            disabled={useAutoFill} placeholder="50000"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Monthly Expenses (avg)</Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number" className="pl-9" value={profile.monthlyExpenses || ""}
                            onChange={(e) => setProfile((p) => ({ ...p, monthlyExpenses: +e.target.value }))}
                            disabled={useAutoFill} placeholder="30000"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Routine Bills / Month</Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number" className="pl-9" value={profile.monthlyRoutineBills || ""}
                            onChange={(e) => setProfile((p) => ({ ...p, monthlyRoutineBills: +e.target.value }))}
                            disabled={useAutoFill} placeholder="5000"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Existing Savings</Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number" className="pl-9" value={profile.existingSavings || ""}
                            onChange={(e) => setProfile((p) => ({ ...p, existingSavings: +e.target.value }))}
                            disabled={useAutoFill} placeholder="100000"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Extra Saving per Month (planned)</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number" className="pl-9" value={profile.extraSavingPerMonth || ""}
                          onChange={(e) => setProfile((p) => ({ ...p, extraSavingPerMonth: +e.target.value }))}
                          placeholder="5000"
                        />
                      </div>
                    </div>

                    {/* Disposable income indicator */}
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Disposable Income</span>
                        <span className={`font-bold ${disposable >= 0 ? "text-green-500" : "text-red-500"}`}>
                          ₹{disposable.toLocaleString()}/mo
                        </span>
                      </div>
                      <Progress value={Math.min(100, Math.max(0, (disposable / Math.max(profile.monthlyIncome, 1)) * 100))} className="mt-2 h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Purchase Details Card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="glass-card overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-primary" /> Purchase Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Item Name</Label>
                        <Input
                          value={purchase.itemName}
                          onChange={(e) => setPurchase((p) => ({ ...p, itemName: e.target.value }))}
                          placeholder="e.g., iPhone 16 Pro"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Actual Price</Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number" className="pl-9" value={purchase.actualPrice || ""}
                            onChange={(e) => setPurchase((p) => ({ ...p, actualPrice: +e.target.value }))}
                            placeholder="120000"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mode selector */}
                    <div className="space-y-2">
                      <Label className="text-xs">Purchase Mode</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { value: "emi", label: "Buy with EMI", icon: CreditCardIcon },
                          { value: "savings", label: "Use Savings", icon: PiggyBank },
                          { value: "save-extra", label: "Save & Buy", icon: TrendingUp },
                        ] as const).map((m) => (
                          <button
                            key={m.value}
                            onClick={() => setPurchase((p) => ({ ...p, mode: m.value }))}
                            className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-all ${
                              purchase.mode === m.value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/50 text-muted-foreground hover:border-primary/30"
                            }`}
                          >
                            <m.icon className="h-4 w-4" />
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* EMI fields */}
                    <AnimatePresence mode="wait">
                      {purchase.mode === "emi" && (
                        <motion.div
                          key="emi" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden"
                        >
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Down Payment</Label>
                              <Input type="number" value={purchase.downPayment || ""} onChange={(e) => setPurchase((p) => ({ ...p, downPayment: +e.target.value }))} placeholder="0" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Tenure (months)</Label>
                              <Input type="number" value={purchase.emiTenureMonths || ""} onChange={(e) => setPurchase((p) => ({ ...p, emiTenureMonths: +e.target.value }))} placeholder="12" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Interest Rate (%)</Label>
                              <Input type="number" step="0.1" value={purchase.interestRate || ""} onChange={(e) => setPurchase((p) => ({ ...p, interestRate: +e.target.value }))} placeholder="12" />
                            </div>
                          </div>
                          {emiPreview && (
                            <div className="flex gap-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                              <div className="flex-1 text-center">
                                <p className="text-xs text-muted-foreground">Monthly EMI</p>
                                <p className="text-lg font-bold text-primary">₹{emiPreview.emi.toLocaleString()}</p>
                              </div>
                              <div className="flex-1 text-center">
                                <p className="text-xs text-muted-foreground">Total Payable</p>
                                <p className="text-lg font-bold text-foreground">₹{emiPreview.total.toLocaleString()}</p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                      {(purchase.mode === "savings" || purchase.mode === "save-extra") && (
                        <motion.div
                          key="savings" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden"
                        >
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Start Date</Label>
                              <Input type="date" value={purchase.startDate || ""} onChange={(e) => setPurchase((p) => ({ ...p, startDate: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Monthly Saving for This</Label>
                              <Input type="number" value={purchase.monthlySavingForPurchase || ""} onChange={(e) => setPurchase((p) => ({ ...p, monthlySavingForPurchase: +e.target.value }))} placeholder="5000" />
                            </div>
                          </div>
                          {savingsPreview && (
                            <div className="flex gap-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                              <div className="flex-1 text-center">
                                <p className="text-xs text-muted-foreground">Months Needed</p>
                                <p className="text-lg font-bold text-primary">{savingsPreview.months}</p>
                              </div>
                              <div className="flex-1 text-center">
                                <p className="text-xs text-muted-foreground">Years</p>
                                <p className="text-lg font-bold text-foreground">{savingsPreview.years}</p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Simulate button */}
                    <Button onClick={handleSimulate} className="w-full gap-2" size="lg">
                      <Zap className="h-4 w-4" /> Run Simulation
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* ═══ RESULTS TAB ═══ */}
          <TabsContent value="results" className="space-y-6 mt-4">
            {result && (
              <>
                {/* Top row: Score + Quick Stats */}
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Purchase Score */}
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="glass-card h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-center text-sm text-muted-foreground">Purchase Score</CardTitle>
                      </CardHeader>
                      <CardContent className="flex justify-center pb-4">
                        <FeasibilityGauge score={result.purchaseScore.score} feasibility={result.purchaseScore.feasibility} />
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Quick Stats */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-2">
                    <Card className="glass-card h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" /> Quick Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {result.emiAnalysis && (
                            <>
                              <div className="rounded-lg border border-border/50 p-3 text-center">
                                <p className="text-xs text-muted-foreground">EMI Amount</p>
                                <p className="text-xl font-bold text-foreground">₹{result.emiAnalysis.emiAmount.toLocaleString()}</p>
                                <p className="text-[10px] text-muted-foreground">/month</p>
                              </div>
                              <div className="rounded-lg border border-border/50 p-3 text-center">
                                <p className="text-xs text-muted-foreground">Interest Paid</p>
                                <p className="text-xl font-bold text-red-400">₹{result.emiAnalysis.totalInterestPaid.toLocaleString()}</p>
                                <p className="text-[10px] text-muted-foreground">extra cost</p>
                              </div>
                            </>
                          )}
                          {result.savingsAnalysis && (
                            <>
                              <div className="rounded-lg border border-border/50 p-3 text-center">
                                <p className="text-xs text-muted-foreground">Months to Save</p>
                                <p className="text-xl font-bold text-primary">{result.savingsAnalysis.monthsRequired}</p>
                                <p className="text-[10px] text-muted-foreground">{result.savingsAnalysis.yearsRequired} years</p>
                              </div>
                              <div className="rounded-lg border border-border/50 p-3 text-center">
                                <p className="text-xs text-muted-foreground">Interest Avoided</p>
                                <p className="text-xl font-bold text-green-400">₹{result.savingsAnalysis.delayBenefitAmount.toLocaleString()}</p>
                                <p className="text-[10px] text-muted-foreground">saved by waiting</p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Pro-gated: Charts Section */}
                <ProLock isPro={isPro}>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* EMI vs Savings Comparison */}
                    {result.comparison && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="glass-card">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-primary" /> EMI vs Savings Comparison
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ChartContainer config={comparisonChartConfig} className="h-64">
                              <BarChart data={comparisonBarData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="emi" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="savings" fill="hsl(var(--chart-6))" radius={[4, 4, 0, 0]} />
                                <Legend />
                              </BarChart>
                            </ChartContainer>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Savings Timeline */}
                    {result.savingsAnalysis && result.savingsAnalysis.savingsGrowthTimeline.length > 1 && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card className="glass-card">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-primary" /> Savings Growth Timeline
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ChartContainer config={timelineChartConfig} className="h-64">
                              <AreaChart data={result.savingsAnalysis.savingsGrowthTimeline}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} label={{ value: "Months", position: "insideBottom", offset: -5 }} />
                                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area type="monotone" dataKey="accumulated" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1) / 0.2)" strokeWidth={2} />
                                <Area type="monotone" dataKey="remaining" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4) / 0.1)" strokeWidth={2} />
                                <Legend />
                              </AreaChart>
                            </ChartContainer>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </div>

                  {/* Score Factors */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="glass-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-primary" /> Purchase Score Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {result.purchaseScore.factors.map((f, i) => (
                            <div key={f.label} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{f.label} ({Math.round(f.weight * 100)}%)</span>
                                <span className="font-medium text-foreground">{f.score}/100</span>
                              </div>
                              <Progress
                                value={f.score}
                                className={`h-2 ${f.score >= 70 ? "[&>div]:bg-green-500" : f.score >= 40 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"}`}
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </ProLock>

                {/* Insights — FREE gets basic, PRO gets all */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-primary" /> Smart Insights
                          <Badge variant="outline" className="text-[10px]">{result.insights.length} insights</Badge>
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={handleSave} className="gap-1">
                          <Save className="h-3 w-3" /> Save
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(isPro ? result.insights : result.insights.slice(0, 5)).map((ins, i) => (
                          <InsightItem key={i} insight={ins} index={i} />
                        ))}
                        {!isPro && result.insights.length > 5 && (
                          <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 p-4 text-sm text-muted-foreground">
                            <Lock className="h-4 w-4" />
                            {result.insights.length - 5} more insights available with PRO
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </TabsContent>

          {/* ═══ HISTORY TAB ═══ */}
          <TabsContent value="history" className="space-y-4 mt-4">
            {history.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center gap-3 py-12">
                  <History className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No saved simulations yet. Run and save a simulation to see it here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {history.map((sim, i) => (
                  <motion.div key={sim.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card
                      className="glass-card cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg"
                      onClick={() => loadFromHistory(sim)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{sim.purchaseDetails.itemName}</p>
                            <p className="text-xs text-muted-foreground">
                              ₹{sim.purchaseDetails.actualPrice.toLocaleString()} • {sim.purchaseDetails.mode.toUpperCase()}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-[10px] ${sim.purchaseScore.feasibility === "safe" ? "border-green-500/50 text-green-500" : sim.purchaseScore.feasibility === "moderate" ? "border-yellow-500/50 text-yellow-500" : "border-red-500/50 text-red-500"}`}
                          >
                            {sim.purchaseScore.score}/100
                          </Badge>
                        </div>
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          {new Date(sim.createdAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Inline icon helper
function CreditCardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
