import { motion } from "framer-motion";
import { Brain, BarChart3, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Brain,
    title: "Smart Budgeting",
    description:
      "Our AI analyzes your income patterns and creates dynamic, personalized budgets that adapt to your lifestyle.",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    icon: BarChart3,
    title: "Intelligent Spending Analysis",
    description:
      "Real-time categorization and spending pattern detection highlights where your money goes every month.",
    gradient: "from-violet-400 to-purple-500",
  },
  {
    icon: TrendingUp,
    title: "Predictive AI Insights",
    description:
      "Rule-based algorithms forecast trends, detect overspending risks, and suggest optimization strategies.",
    gradient: "from-cyan-400 to-emerald-400",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.2 },
  }),
};

export function HowItWorks() {
  return (
    <section id="features" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050816] via-[#080c20] to-[#050816]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-cyan-400 text-sm font-medium uppercase tracking-widest mb-3">
            How It Works
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white">
            Three Steps to{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
              Financial Clarity
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="group relative rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-sm p-8 hover:border-cyan-500/20 hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-cyan-500/5"
            >
              {/* Glow border on hover */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 pointer-events-none" />

              <div
                className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${step.gradient} mb-6`}
              >
                <step.icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
