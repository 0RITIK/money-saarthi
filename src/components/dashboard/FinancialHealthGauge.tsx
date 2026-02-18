import { memo } from "react";
import { motion } from "framer-motion";
import type { FinancialHealthScore } from "@/services/analytics";

const gradeColors: Record<string, string> = {
  A: "hsl(152, 60%, 40%)",
  B: "hsl(173, 58%, 50%)",
  C: "hsl(38, 92%, 50%)",
  D: "hsl(25, 85%, 50%)",
  F: "hsl(0, 72%, 51%)",
};

const FinancialHealthGauge = ({ health }: { health: FinancialHealthScore }) => {
  const color = gradeColors[health.grade] || gradeColors.C;
  const circumference = 2 * Math.PI * 70;
  const dashOffset = circumference - (health.score / 100) * circumference * 0.75; // 270° arc

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-6"
      style={{ boxShadow: `0 0 30px -10px ${color}40` }}
    >
      <h3 className="text-base font-semibold text-foreground mb-4">Financial Health</h3>

      <div className="flex flex-col items-center">
        {/* SVG Gauge */}
        <div className="relative h-44 w-44">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-[135deg]">
            {/* Background arc */}
            <circle
              cx="80" cy="80" r="70"
              fill="none"
              stroke="hsla(220, 13%, 50%, 0.15)"
              strokeWidth="12"
              strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
              strokeLinecap="round"
            />
            {/* Score arc */}
            <motion.circle
              cx="80" cy="80" r="70"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{health.score}</span>
            <span className="text-lg font-bold" style={{ color }}>
              {health.grade}
            </span>
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="mt-4 w-full space-y-2">
          {health.factors.map((f) => (
            <div key={f.label} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-32 shrink-0">{f.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${f.score}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(f.score)}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default memo(FinancialHealthGauge);
