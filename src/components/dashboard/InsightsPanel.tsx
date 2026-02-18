import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, AlertTriangle, XCircle, CheckCircle2, Info, Sparkles } from "lucide-react";
import type { AIInsight } from "@/services/api";

const insightIcon = {
  warning: <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />,
  danger: <XCircle className="h-4 w-4 shrink-0 text-destructive" />,
  success: <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />,
  info: <Info className="h-4 w-4 shrink-0 text-primary" />,
};

const insightBorder = {
  warning: "border-l-warning",
  danger: "border-l-destructive",
  success: "border-l-success",
  info: "border-l-primary",
};

const insightGlow = {
  warning: "hsla(38, 92%, 50%, 0.06)",
  danger: "hsla(0, 72%, 51%, 0.06)",
  success: "hsla(152, 60%, 40%, 0.06)",
  info: "hsla(173, 58%, 50%, 0.06)",
};

const InsightsPanel = ({ insights }: { insights: AIInsight[] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55 }}
      className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-6"
      style={{ boxShadow: "0 0 30px -10px hsla(262, 52%, 47%, 0.15)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-lg bg-primary/10 p-1.5">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground">AI CFO Insights</h3>
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          {insights.length} insights
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        <AnimatePresence>
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 1) }}
              className={`flex items-start gap-3 rounded-lg border-l-4 p-3 ${insightBorder[insight.type]}`}
              style={{ background: insightGlow[insight.type] }}
            >
              {insightIcon[insight.type]}
              <p className="text-sm text-foreground leading-relaxed">{insight.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default memo(InsightsPanel);
