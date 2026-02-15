import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const pieData = [
  { name: "Food", value: 30 },
  { name: "Transport", value: 15 },
  { name: "Bills", value: 25 },
  { name: "Shopping", value: 18 },
  { name: "Other", value: 12 },
];

const COLORS = ["#22d3ee", "#8b5cf6", "#06b6d4", "#a78bfa", "#67e8f9"];

const areaData = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
  income: 3000 + Math.random() * 2000,
  expense: 1500 + Math.random() * 1500,
}));

/** Animated radial health score */
function HealthRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          stroke="url(#healthGrad)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="healthGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-[10px] text-gray-400">Health</span>
      </div>
    </div>
  );
}

export function FeatureShowcase() {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050816] via-[#0a0e2a] to-[#050816]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-violet-500/5 blur-[150px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-violet-400 text-sm font-medium uppercase tracking-widest mb-3">
            Dashboard Preview
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white">
            Your Finances,{" "}
            <span className="bg-gradient-to-r from-violet-300 to-cyan-400 bg-clip-text text-transparent">
              Visualized
            </span>
          </h2>
        </motion.div>

        {/* Floating dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 md:p-10"
        >
          {/* Glow */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/10 blur-xl pointer-events-none" />

          <div className="relative grid md:grid-cols-3 gap-8">
            {/* Area chart */}
            <div className="md:col-span-2 rounded-2xl border border-white/5 bg-white/[0.03] p-6">
              <p className="text-sm text-gray-400 mb-4">Monthly Income vs Expenses</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="income" stroke="#22d3ee" fill="url(#incGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expense" stroke="#8b5cf6" fill="url(#expGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Pie */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <p className="text-sm text-gray-400 mb-2">Expense Breakdown</p>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={55} innerRadius={35} dataKey="value" stroke="none">
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Health score */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <p className="text-sm text-gray-400 mb-3">Financial Health</p>
                <HealthRing score={82} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
