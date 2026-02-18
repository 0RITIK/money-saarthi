import { memo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = [
  "hsl(173, 58%, 39%)",
  "hsl(199, 89%, 48%)",
  "hsl(262, 52%, 47%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(152, 60%, 40%)",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/30 bg-card/90 backdrop-blur-xl p-3 shadow-xl">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: p.color }}>
          {p.dataKey}: ₹{p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

interface Props {
  data: Record<string, any>[];
  categories: string[];
}

const StackedCategoryChart = ({ data, categories }: Props) => {
  const hasData = data.some((d) => categories.some((c) => d[c] > 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-6"
      style={{ boxShadow: "0 0 30px -10px hsla(262, 52%, 47%, 0.15)" }}
    >
      <h3 className="text-base font-semibold text-foreground mb-4">Monthly Category Breakdown</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(220, 13%, 50%, 0.15)" />
            <XAxis dataKey="month" tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {categories.map((cat, i) => (
              <Bar
                key={cat}
                dataKey={cat}
                stackId="a"
                fill={COLORS[i % COLORS.length]}
                radius={i === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                animationDuration={1200}
                animationBegin={i * 100}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="py-16 text-center text-sm text-muted-foreground">Add expenses to see category trends.</p>
      )}
    </motion.div>
  );
};

export default memo(StackedCategoryChart);
