import { memo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { CategorySummary } from "@/services/analytics";

const COLORS = [
  "hsl(173, 58%, 39%)",
  "hsl(199, 89%, 48%)",
  "hsl(262, 52%, 47%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(152, 60%, 40%)",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/30 bg-card/90 backdrop-blur-xl p-3 shadow-xl">
      <p className="font-semibold text-foreground">{payload[0]?.payload?.category}</p>
      <p className="text-sm text-muted-foreground">₹{payload[0]?.value?.toLocaleString()} ({payload[0]?.payload?.percentage?.toFixed(1)}%)</p>
    </div>
  );
};

const HorizontalCategoryChart = ({ categories }: { categories: CategorySummary[] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-6"
      style={{ boxShadow: "0 0 30px -10px hsla(38, 92%, 50%, 0.15)" }}
    >
      <h3 className="text-base font-semibold text-foreground mb-4">Category Comparison</h3>
      {categories.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categories} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="category" tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }} width={90} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" radius={[0, 6, 6, 0]} animationDuration={1200} name="Total">
              {categories.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="py-16 text-center text-sm text-muted-foreground">No category data yet.</p>
      )}
    </motion.div>
  );
};

export default memo(HorizontalCategoryChart);
