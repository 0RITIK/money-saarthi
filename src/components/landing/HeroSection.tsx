import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { FinanceOrb } from "./FinanceOrb";

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#050816] via-[#0a0e2a] to-[#0d0630]" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(103,232,249,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 w-full grid lg:grid-cols-2 gap-12 items-center pt-24 pb-16">
        {/* Left: Text */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-300 text-xs font-medium"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Autonomous Finance · AI-Powered
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight"
          >
            <span className="text-white">Your</span>{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Autonomous
            </span>
            <br />
            <span className="text-white">Financial Brain</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-gray-400 max-w-lg leading-relaxed"
          >
            Money Saarthi analyzes, predicts, and optimizes your money —
            automatically. Take control with intelligent insights.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              to="/register"
              className="group relative px-8 py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-violet-600 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-1 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                Get Started
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              to="/dashboard"
              className="group px-8 py-3.5 rounded-2xl font-semibold text-cyan-300 border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 hover:-translate-y-1 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                View Dashboard
              </span>
            </Link>
          </motion.div>

          {/* Trust stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex gap-8 pt-4"
          >
            {[
              { value: "10K+", label: "Users" },
              { value: "99.9%", label: "Uptime" },
              { value: "$2M+", label: "Tracked" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: 3D Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative h-[400px] lg:h-[550px]"
        >
          <FinanceOrb />
          {/* Glow behind orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
