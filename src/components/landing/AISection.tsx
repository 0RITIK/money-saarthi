import { motion } from "framer-motion";
import { Zap, Shield, PiggyBank, Activity } from "lucide-react";

const features = [
  { icon: Zap, label: "Real-time Spending Detection" },
  { icon: Shield, label: "Risk Pattern Analysis" },
  { icon: PiggyBank, label: "Smart Savings Optimization" },
  { icon: Activity, label: "Monthly Financial Health Score" },
];

export function AISection() {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050816] via-[#080c20] to-[#050816]" />

      {/* Neural pattern background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 25% 50%, rgba(103,232,249,0.4) 1px, transparent 1px),
                          radial-gradient(circle at 75% 25%, rgba(139,92,246,0.4) 1px, transparent 1px),
                          radial-gradient(circle at 50% 75%, rgba(103,232,249,0.4) 1px, transparent 1px)`,
        backgroundSize: "100px 100px, 80px 80px, 120px 120px",
      }} />

      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[150px]" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: visual */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative flex justify-center"
        >
          <div className="relative w-72 h-72">
            {/* Animated concentric rings */}
            {[1, 1.5, 2, 2.5].map((scale, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-cyan-500/10"
                style={{ transform: `scale(${scale})` }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 blur-xl opacity-40" />
              <div className="absolute h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: text */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-cyan-400 text-sm font-medium uppercase tracking-widest mb-3">
              AI Intelligence
            </p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
              Powered by{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                Intelligent Financial Algorithms
              </span>
            </h2>
          </motion.div>

          <div className="space-y-5">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex items-center gap-4 group"
              >
                <div className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/5 group-hover:border-cyan-500/20 transition-colors">
                  <f.icon className="h-5 w-5 text-cyan-400" />
                </div>
                <span className="text-gray-300 font-medium">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
