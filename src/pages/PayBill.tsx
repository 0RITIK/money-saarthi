import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/services/api";
import { paymentApi } from "@/services/payment";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, CheckCircle, XCircle, Loader2 } from "lucide-react";

const PayBill = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Bills");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) return;
    setLoading(true);
    setStatus("processing");
    try {
      await paymentApi.payBill(user.id, parseFloat(amount), category, description || "Bill Payment");
      setStatus("success");
      toast({ title: "Payment successful!", description: `₹${parseFloat(amount).toLocaleString()} paid via Razorpay.` });
      setAmount("");
      setDescription("");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setStatus("failed");
      toast({ title: "Payment failed", description: err.message, variant: "destructive" });
      setTimeout(() => setStatus("idle"), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Pay Bill</h1>
        <p className="text-sm text-muted-foreground">Pay bills instantly via Razorpay. Auto-logged to your expense history.</p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5 text-primary" /> Bill Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePay} className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" required />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Electricity bill, Rent…" />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</> : "Pay with Razorpay"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status feedback */}
        <AnimatePresence>
          {status === "success" && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-4">
              <CheckCircle className="h-6 w-6 text-success" />
              <div>
                <p className="font-medium text-foreground">Payment Successful</p>
                <p className="text-sm text-muted-foreground">Expense auto-logged to your dashboard.</p>
              </div>
            </motion.div>
          )}
          {status === "failed" && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
              <XCircle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-medium text-foreground">Payment Failed</p>
                <p className="text-sm text-muted-foreground">Please try again.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default PayBill;
