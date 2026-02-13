import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  incomeApi,
  expenseApi,
  insightsApi,
  type Income,
  type Expense,
  type AIInsight,
} from "@/services/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Percent,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// Chart colors matching our design tokens
const COLORS = [
  "hsl(173, 58%, 39%)",
  "hsl(199, 89%, 48%)",
  "hsl(262, 52%, 47%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(152, 60%, 40%)",
];

const insightIcon = {
  warning: <AlertTriangle className="h-5 w-5 text-warning" />,
  danger: <XCircle className="h-5 w-5 text-destructive" />,
  success: <CheckCircle2 className="h-5 w-5 text-success" />,
  info: <Info className="h-5 w-5 text-primary" />,
};

const insightBg = {
  warning: "border-l-warning bg-warning/5",
  danger: "border-l-destructive bg-destructive/5",
  success: "border-l-success bg-success/5",
  info: "border-l-primary bg-primary/5",
};

const Dashboard = () => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([incomeApi.getAll(user.id), expenseApi.getAll(user.id)]).then(
      ([inc, exp]) => {
        setIncomes(inc);
        setExpenses(exp);
        setInsights(insightsApi.generate(inc, exp));
      }
    );
  }, [user]);

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : "0.0";

  // Pie chart data
  const categoryData = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  // Monthly bar chart data
  const monthlyData: Record<string, { income: number; expenses: number }> = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  incomes.forEach((i) => {
    const m = monthNames[new Date(i.date).getMonth()];
    if (!monthlyData[m]) monthlyData[m] = { income: 0, expenses: 0 };
    monthlyData[m].income += i.amount;
  });
  expenses.forEach((e) => {
    const m = monthNames[new Date(e.date).getMonth()];
    if (!monthlyData[m]) monthlyData[m] = { income: 0, expenses: 0 };
    monthlyData[m].expenses += e.amount;
  });
  const barData = Object.entries(monthlyData).map(([month, d]) => ({ month, ...d }));

  const stats = [
    { label: "Total Income", value: totalIncome, icon: TrendingUp, color: "text-success" },
    { label: "Total Expenses", value: totalExpenses, icon: TrendingDown, color: "text-destructive" },
    { label: "Balance", value: balance, icon: DollarSign, color: "text-primary" },
    { label: "Savings Rate", value: savingsRate + "%", icon: Percent, color: "text-primary", raw: true },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {user?.name}. Here's your financial overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="stat-gradient">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`rounded-xl bg-background p-3 ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold text-foreground">
                    {s.raw ? s.value : `₹${Number(s.value).toLocaleString()}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Expense Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  No expense data yet. Add expenses to see the breakdown.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Monthly Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                    <Bar dataKey="income" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} name="Income" />
                    <Bar dataKey="expenses" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  No data to display yet. Add income and expenses to see monthly trends.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI CFO Insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">AI CFO Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-lg border-l-4 p-4 ${insightBg[insight.type]}`}
              >
                {insightIcon[insight.type]}
                <p className="text-sm text-foreground">{insight.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
