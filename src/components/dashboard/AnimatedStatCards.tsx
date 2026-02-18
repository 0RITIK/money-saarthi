import { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Crown,
  Heart,
  Calendar,
  Target,
} from "lucide-react";
import type { YearlySummary, FinancialHealthScore } from "@/services/analytics";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: React.ElementType;
  color: string;
  glowColor: string;
  delay: number;
}

const CountUp = ({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setVal(target);
        clearInterval(timer);
      } else {
        setVal(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <span>
      {prefix}
      {Math.round(val).toLocaleString()}
      {suffix}
    </span>
  );
};

const StatCard = memo(({ label, value, suffix, prefix, icon: Icon, color, glowColor, delay }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
    className="group relative overflow-hidden rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-5"
    style={{
      boxShadow: `0 0 20px -5px ${glowColor}`,
    }}
  >
    {/* Gradient border effect */}
    <div
      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{
        background: `linear-gradient(135deg, ${glowColor}, transparent 60%)`,
        padding: "1px",
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "exclude",
        WebkitMaskComposite: "xor",
      }}
    />

    <div className="relative z-10 flex items-center gap-4">
      <div
        className="rounded-xl p-3 transition-transform duration-300 group-hover:scale-110"
        style={{ background: `linear-gradient(135deg, ${glowColor}, transparent)` }}
      >
        <Icon className="h-5 w-5 text-foreground" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">
          <CountUp target={value} prefix={prefix} suffix={suffix} />
        </p>
      </div>
    </div>

    {/* Corner glow */}
    <div
      className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 blur-xl group-hover:opacity-40 transition-opacity"
      style={{ background: glowColor }}
    />
  </motion.div>
));
StatCard.displayName = "StatCard";

interface Props {
  yearly: YearlySummary;
  currentMonth: { income: number; expenses: number; savings: number; savingsRate: number };
  health: FinancialHealthScore;
}

const AnimatedStatCards = ({ yearly, currentMonth, health }: Props) => {
  const stats: StatCardProps[] = [
    { label: "Year Income", value: yearly.totalIncome, prefix: "₹", icon: TrendingUp, color: "text-success", glowColor: "hsla(152, 60%, 40%, 0.3)", delay: 0 },
    { label: "Year Expenses", value: yearly.totalExpenses, prefix: "₹", icon: TrendingDown, color: "text-destructive", glowColor: "hsla(0, 72%, 51%, 0.3)", delay: 0.05 },
    { label: "Month Income", value: currentMonth.income, prefix: "₹", icon: Calendar, color: "text-primary", glowColor: "hsla(173, 58%, 39%, 0.3)", delay: 0.1 },
    { label: "Month Expenses", value: currentMonth.expenses, prefix: "₹", icon: DollarSign, color: "text-warning", glowColor: "hsla(38, 92%, 50%, 0.3)", delay: 0.15 },
    { label: "Month Savings", value: Math.round(currentMonth.savingsRate), suffix: "%", icon: Percent, color: "text-primary", glowColor: "hsla(173, 58%, 39%, 0.3)", delay: 0.2 },
    { label: "Year Savings", value: Math.round(yearly.savingsRate), suffix: "%", icon: Target, color: "text-success", glowColor: "hsla(152, 60%, 40%, 0.3)", delay: 0.25 },
    { label: "Top Category", value: yearly.highestSpendingAmount, prefix: "₹", icon: Crown, color: "text-warning", glowColor: "hsla(38, 92%, 50%, 0.3)", delay: 0.3 },
    { label: "Health Score", value: health.score, suffix: "/100", icon: Heart, color: "text-primary", glowColor: "hsla(173, 58%, 50%, 0.3)", delay: 0.35 },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
};

export default memo(AnimatedStatCards);
