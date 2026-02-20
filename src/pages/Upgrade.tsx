import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscriptionApi } from "@/services/payment";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Crown, Check, Loader2, Sparkles } from "lucide-react";

const PRO_PRICE = 499;

const FREE_FEATURES = ["Basic Dashboard", "Manual Transactions", "5 AI Insights", "Monthly Charts"];
const PRO_FEATURES = [
  "Everything in Free",
  "Advanced Year Comparison",
  "100+ AI Insights",
  "Peak Month Detection",
  "Quarterly Analysis",
  "Future Predictions",
  "Priority Support",
  "Export Data (CSV)",
];

const Upgrade = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isPro = user ? subscriptionApi.isPro(user.id) : false;

  const handleUpgrade = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const info = await subscriptionApi.upgradeToPro(user.id, PRO_PRICE);
      toast({
        title: "Welcome to Pro! 🎉",
        description: `Subscription active until ${new Date(info.expiryDate).toLocaleDateString()}`,
      });
    } catch (err: any) {
      toast({ title: "Upgrade failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Upgrade Your Plan</h1>
          <p className="mt-2 text-muted-foreground">Unlock the full power of AI Personal CFO</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Free Plan */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="glass-card h-full">
              <CardHeader>
                <CardTitle className="text-lg">Free</CardTitle>
                <p className="text-3xl font-bold text-foreground">₹0<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                {!isPro && (
                  <Badge variant="secondary" className="mt-6">Current Plan</Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro Plan */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="relative overflow-hidden border-primary/30 shadow-lg shadow-primary/10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
              <CardHeader className="relative">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Pro</CardTitle>
                  <Crown className="h-5 w-5 text-warning" />
                </div>
                <p className="text-3xl font-bold text-foreground">₹{PRO_PRICE}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-3">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Sparkles className="h-4 w-4 text-warning" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {isPro ? (
                    <Badge className="bg-success text-success-foreground">Active</Badge>
                  ) : (
                    <Button
                      onClick={handleUpgrade}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-primary to-accent"
                    >
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</> : "Upgrade to Pro"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Upgrade;
