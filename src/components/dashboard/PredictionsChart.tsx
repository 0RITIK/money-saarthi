import { memo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Prediction, MonthlyAggregate } from "@/services/analytics";

const trendIcon = {
  improving: <TrendingUp className="h-4 w-4 text-success" />,
  declining: <TrendingDown className="h-4 w-4 text-destructive" />,
  stable: <Minus className="h-4 w-4 text-muted-foreground" />,
};

const trendLabel = {
  improving: "Improving",
  declining: "Declining",
  stable: "Stable",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/30 bg-card/90 backdrop-blur-xl p-3 shadow-xl">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: p.stroke || p.color }}>
          {p.name}: ₹{p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

interface Props {
  predictions: Prediction;
  monthlyData: MonthlyAggregate[];
}

const PredictionsChart = ({ predictions, monthlyData }: Props) => {
  const active = monthlyData.filter((m) => m.income > 0 || m.expenses > 0);
  const last3 = active.slice(-3);

  // Combine history + projections
  const chartData = [
    ...last3.map((m) => ({ month: m.month, income: m.income, expenses: m.expenses, type: "actual" })),
    ...predictions.threeMonthProjection.map((p) => ({ month: p.month, income: p.income, expenses: p.expenses, type: "predicted" })),
  ];

  const hasData = predictions.threeMonthProjection.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
      className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-6"
      style={{ boxShadow: "0 0 30px -10px hsla(173, 58%, 50%, 0.2)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Future Predictions</h3>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {trendIcon[predictions.trend]}
          <span>{trendLabel[predictions.trend]}</span>
        </div>
      </div>

      {hasData ? (
        <>
          {/* Prediction summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl bg-success/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">Next Month Income</p>
              <p className="text-sm font-bold text-success">₹{predictions.nextMonthIncome.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-destructive/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">Next Month Expense</p>
              <p className="text-sm font-bold text-destructive">₹{predictions.nextMonthExpense.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">Predicted Savings</p>
              <p className="text-sm font-bold text-primary">{predictions.nextMonthSavingsRate.toFixed(1)}%</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(220, 13%, 50%, 0.15)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="income" stroke="hsl(152, 60%, 40%)" fill="url(#incomeGrad)" strokeWidth={2} name="Income" animationDuration={1500} />
              <Area type="monotone" dataKey="expenses" stroke="hsl(0, 72%, 51%)" fill="url(#expenseGrad)" strokeWidth={2} strokeDasharray="5 5" name="Expenses" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground text-center mt-2">Dashed lines indicate predicted values</p>
        </>
      ) : (
        <p className="py-16 text-center text-sm text-muted-foreground">Need at least 2 months of data for predictions.</p>
      )}
    </motion.div>
  );
};

export default memo(PredictionsChart);
