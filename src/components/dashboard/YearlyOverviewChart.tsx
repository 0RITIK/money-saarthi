import { memo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { MonthlyAggregate } from "@/services/analytics";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/30 bg-card/90 backdrop-blur-xl p-3 shadow-xl">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: p.stroke }}>
          {p.name}: ₹{p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const YearlyOverviewChart = ({ data }: { data: MonthlyAggregate[] }) => {
  const hasData = data.some((d) => d.income > 0 || d.expenses > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-6"
      style={{ boxShadow: "0 0 30px -10px hsla(152, 60%, 40%, 0.15)" }}
    >
      <h3 className="text-base font-semibold text-foreground mb-4">Yearly Overview</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="yearIncGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(173, 58%, 50%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(173, 58%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="yearExpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(262, 52%, 47%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(262, 52%, 47%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(220, 13%, 50%, 0.15)" />
            <XAxis dataKey="month" tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="income" stroke="hsl(173, 58%, 50%)" fill="url(#yearIncGrad)" strokeWidth={2} name="Income" animationDuration={1500} />
            <Area type="monotone" dataKey="expenses" stroke="hsl(262, 52%, 47%)" fill="url(#yearExpGrad)" strokeWidth={2} name="Expenses" animationDuration={1500} animationBegin={300} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="py-16 text-center text-sm text-muted-foreground">No yearly data to display yet.</p>
      )}
    </motion.div>
  );
};

export default memo(YearlyOverviewChart);
