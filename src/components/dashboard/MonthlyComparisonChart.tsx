import { memo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { MonthlyAggregate } from "@/services/analytics";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const income = payload.find((p: any) => p.dataKey === "income");
  const expenses = payload.find((p: any) => p.dataKey === "expenses");
  const change = income && expenses && income.value > 0
    ? (((income.value - expenses.value) / income.value) * 100).toFixed(1)
    : "0";

  return (
    <div className="rounded-xl border border-border/30 bg-card/90 backdrop-blur-xl p-3 shadow-xl">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-sm text-success">Income: ₹{income?.value?.toLocaleString()}</p>
      <p className="text-sm text-destructive">Expenses: ₹{expenses?.value?.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground mt-1">Savings: {change}%</p>
    </div>
  );
};

const MonthlyComparisonChart = ({ data }: { data: MonthlyAggregate[] }) => {
  const hasData = data.some((d) => d.income > 0 || d.expenses > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-6"
      style={{ boxShadow: "0 0 30px -10px hsla(173, 58%, 39%, 0.15)" }}
    >
      <h3 className="text-base font-semibold text-foreground mb-4">Monthly Income vs Expenses</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(220, 13%, 50%, 0.15)" />
            <XAxis dataKey="month" tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="income" fill="hsl(152, 60%, 40%)" radius={[6, 6, 0, 0]} name="Income" animationDuration={1200} />
            <Bar dataKey="expenses" fill="hsl(0, 72%, 51%)" radius={[6, 6, 0, 0]} name="Expenses" animationDuration={1200} animationBegin={200} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="py-16 text-center text-sm text-muted-foreground">Add income & expenses to see monthly comparison.</p>
      )}
    </motion.div>
  );
};

export default memo(MonthlyComparisonChart);
