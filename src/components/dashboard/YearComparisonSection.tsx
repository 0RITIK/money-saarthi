import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Crown, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import type { MonthlyAggregate, PeakAnalysis, QuarterData } from "@/services/analytics";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Line,
  ComposedChart,
} from "recharts";

interface Props {
  monthly: MonthlyAggregate[];
  peaks: PeakAnalysis;
  quarters: QuarterData[];
}

const fmt = (n: number) => `₹${Math.abs(Math.round(n)).toLocaleString()}`;
const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

const PeakCard = memo(
  ({
    title,
    icon: Icon,
    month,
    value,
    percentAboveAvg,
    accentClass,
    glowColor,
    delay,
  }: {
    title: string;
    icon: React.ElementType;
    month: string;
    value: number;
    percentAboveAvg: number;
    accentClass: string;
    glowColor: string;
    delay: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-5"
      style={{ boxShadow: `0 0 20px -5px ${glowColor}` }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${glowColor}, transparent)` }}
      />
      <div className="flex items-center gap-3 mb-3">
        <div
          className="rounded-xl p-2.5"
          style={{ background: `linear-gradient(135deg, ${glowColor}, transparent)` }}
        >
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      </div>
      <p className="text-2xl font-bold text-foreground">{month}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className={`text-lg font-semibold ${accentClass}`}>{fmt(value)}</span>
        <span className="text-xs text-muted-foreground">
          ({pct(percentAboveAvg)} vs avg)
        </span>
      </div>
      <div
        className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 blur-xl group-hover:opacity-40 transition-opacity"
        style={{ background: glowColor }}
      />
    </motion.div>
  )
);
PeakCard.displayName = "PeakCard";

const YearComparisonSection = ({ monthly, peaks, quarters }: Props) => {
  const chartData = useMemo(
    () =>
      monthly.map((m) => ({
        month: m.month,
        income: m.income,
        expenses: m.expenses,
        savings: m.savings,
      })),
    [monthly]
  );

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Crown className="h-5 w-5 text-warning" />
          Yearly Financial Intelligence
        </h2>
        <p className="text-sm text-muted-foreground">
          Peak month detection & year-over-year analysis
        </p>
      </motion.div>

      {/* Peak Month Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <PeakCard
          title="Peak Income Month"
          icon={TrendingUp}
          month={peaks.peakIncome.month}
          value={peaks.peakIncome.value}
          percentAboveAvg={peaks.peakIncome.percentAboveAvg}
          accentClass="text-success"
          glowColor="hsla(152, 60%, 40%, 0.3)"
          delay={0}
        />
        <PeakCard
          title="Peak Expense Month"
          icon={TrendingDown}
          month={peaks.peakExpense.month}
          value={peaks.peakExpense.value}
          percentAboveAvg={peaks.peakExpense.percentAboveAvg}
          accentClass="text-destructive"
          glowColor="hsla(0, 72%, 51%, 0.3)"
          delay={0.1}
        />
        <PeakCard
          title="Peak Savings Month"
          icon={PiggyBank}
          month={peaks.peakSavings.month}
          value={peaks.peakSavings.value}
          percentAboveAvg={peaks.peakSavings.percentAboveAvg}
          accentClass="text-primary"
          glowColor="hsla(173, 58%, 50%, 0.3)"
          delay={0.2}
        />
      </div>

      {/* Year Comparison Area Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-6"
      >
        <h3 className="text-base font-semibold text-foreground mb-4">
          12-Month Income, Expense & Savings Overlay
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="incArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 40%, 18%)" />
            <XAxis dataKey="month" tick={{ fill: "hsl(220, 20%, 65%)", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(220, 20%, 65%)", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: "hsl(222, 47%, 9%)",
                border: "1px solid hsl(222, 40%, 18%)",
                borderRadius: "12px",
                color: "hsl(210, 40%, 98%)",
              }}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, undefined]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="hsl(152, 60%, 40%)"
              fill="url(#incArea)"
              strokeWidth={2}
              animationDuration={1200}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="hsl(0, 72%, 51%)"
              fill="url(#expArea)"
              strokeWidth={2}
              animationDuration={1200}
            />
            <Line
              type="monotone"
              dataKey="savings"
              name="Savings"
              stroke="hsl(173, 58%, 50%)"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={{ fill: "hsl(173, 58%, 50%)", r: 3 }}
              animationDuration={1500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Quarter Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-6"
      >
        <h3 className="text-base font-semibold text-foreground mb-4">
          Quarterly Performance
        </h3>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-4">
          {quarters.map((q, i) => (
            <motion.div
              key={q.quarter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="rounded-xl border border-border/30 bg-card/40 p-3 text-center"
            >
              <p className="text-xs font-medium text-muted-foreground mb-1">{q.quarter}</p>
              <p className="text-sm font-semibold text-success">+₹{q.income.toLocaleString()}</p>
              <p className="text-sm font-semibold text-destructive">-₹{q.expenses.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Savings: {q.savingsRate.toFixed(1)}%
              </p>
            </motion.div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={quarters}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 40%, 18%)" />
            <XAxis dataKey="quarter" tick={{ fill: "hsl(220, 20%, 65%)", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(220, 20%, 65%)", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: "hsl(222, 47%, 9%)",
                border: "1px solid hsl(222, 40%, 18%)",
                borderRadius: "12px",
                color: "hsl(210, 40%, 98%)",
              }}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, undefined]}
            />
            <Legend />
            <Bar dataKey="income" name="Income" fill="hsl(152, 60%, 40%)" radius={[6, 6, 0, 0]} animationDuration={1000} />
            <Bar dataKey="expenses" name="Expenses" fill="hsl(0, 72%, 51%)" radius={[6, 6, 0, 0]} animationDuration={1000} />
            <Bar dataKey="savings" name="Savings" fill="hsl(173, 58%, 50%)" radius={[6, 6, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default memo(YearComparisonSection);
