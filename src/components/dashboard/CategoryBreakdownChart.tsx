import { memo } from "react";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
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
  const { name, value } = payload[0];
  return (
    <div className="rounded-xl border border-border/30 bg-card/90 backdrop-blur-xl p-3 shadow-xl">
      <p className="font-semibold text-foreground">{name}</p>
      <p className="text-sm text-muted-foreground">₹{value?.toLocaleString()}</p>
    </div>
  );
};

const CustomLegend = ({ payload }: any) => (
  <div className="flex flex-wrap justify-center gap-3 mt-2">
    {payload?.map((entry: any, i: number) => (
      <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <div className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
        {entry.value}
      </div>
    ))}
  </div>
);

const CategoryBreakdownChart = ({ categories }: { categories: CategorySummary[] }) => {
  const pieData = categories.map((c) => ({ name: c.category, value: c.total }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-6"
      style={{ boxShadow: "0 0 30px -10px hsla(199, 89%, 48%, 0.15)" }}
    >
      <h3 className="text-base font-semibold text-foreground mb-4">Category Distribution</h3>
      {pieData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="45%"
              innerRadius={65}
              outerRadius={105}
              paddingAngle={3}
              dataKey="value"
              animationDuration={1200}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="py-16 text-center text-sm text-muted-foreground">Add expenses to see category breakdown.</p>
      )}
    </motion.div>
  );
};

export default memo(CategoryBreakdownChart);
