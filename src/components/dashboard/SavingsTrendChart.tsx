import { memo } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { MonthlyAggregate } from "@/services/analytics";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/30 bg-card/90 backdrop-blur-xl p-3 shadow-xl">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-sm" style={{ color: "hsl(173, 58%, 50%)" }}>
        Savings: ₹{payload[0]?.value?.toLocaleString()}
      </p>
      {payload[1] && (
        <p className="text-sm text-muted-foreground">
          Rate: {payload[1]?.value?.toFixed(1)}%
        </p>
      )}
    </div>
  );
};

const SavingsTrendChart = ({ data }: { data: MonthlyAggregate[] }) => {
  const hasData = data.some((d) => d.savings !== 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-6"
      style={{ boxShadow: "0 0 30px -10px hsla(262, 52%, 47%, 0.15)" }}
    >
      <h3 className="text-base font-semibold text-foreground mb-4">Savings Trend (12 Months)</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <defs>
              <linearGradient id="savingsGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(173, 58%, 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(173, 58%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(220, 13%, 50%, 0.15)" />
            <XAxis dataKey="month" tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="savings"
              stroke="hsl(173, 58%, 50%)"
              strokeWidth={3}
              dot={{ fill: "hsl(173, 58%, 50%)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "hsl(173, 58%, 50%)", stroke: "hsl(173, 58%, 70%)", strokeWidth: 3 }}
              animationDuration={1500}
              name="Savings"
            />
            <Line
              type="monotone"
              dataKey="savingsRate"
              stroke="hsl(262, 52%, 47%)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              animationDuration={1500}
              animationBegin={300}
              name="Savings Rate %"
              yAxisId={0}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="py-16 text-center text-sm text-muted-foreground">Add data to see your savings trend.</p>
      )}
    </motion.div>
  );
};

export default memo(SavingsTrendChart);
