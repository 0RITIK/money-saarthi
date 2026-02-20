import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { loanApi, type Loan, type LoanStatus } from "@/services/payment";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, Plus, Trash2, Loader2, IndianRupee, CalendarDays, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusConfig: Record<LoanStatus, { color: string; icon: typeof CheckCircle2 }> = {
  Active: { color: "default", icon: Clock },
  Completed: { color: "secondary", icon: CheckCircle2 },
  Overdue: { color: "destructive", icon: AlertTriangle },
};

const LoanManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanName, setLoanName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [emiAmount, setEmiAmount] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const autoEMIs = useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e <= s) return null;
    return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  }, [startDate, endDate]);

  const fetchLoans = useCallback(async () => {
    if (!user) return;
    setLoans(await loanApi.getAll(user.id));
  }, [user]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    try {
      await loanApi.create(user.id, {
        loanName,
        totalAmount: parseFloat(totalAmount),
        emiAmount: parseFloat(emiAmount),
        startDate,
        endDate,
      });
      toast({ title: "Loan created" });
      setLoanName(""); setTotalAmount(""); setEmiAmount(""); setEndDate("");
      fetchLoans();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setCreating(false); }
  };

  const handlePayEmi = async (loanId: string) => {
    if (!user) return;
    setPayingId(loanId);
    try {
      const expense = await loanApi.payEmi(user.id, loanId);
      toast({ title: "EMI Paid!", description: `₹${expense.amount.toLocaleString()} debited via Razorpay.` });
      fetchLoans();
    } catch (err: any) {
      toast({ title: "EMI payment failed", description: err.message, variant: "destructive" });
    } finally { setPayingId(null); }
  };

  const handleDelete = async (id: string) => {
    await loanApi.delete(id);
    fetchLoans();
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Loan & EMI Manager</h1>
        <p className="text-sm text-muted-foreground">Track loans, pay EMIs via Razorpay, auto-log to expenses.</p>

        {/* Create loan form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4" /> Create Loan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Loan Name</Label>
                  <Input value={loanName} onChange={(e) => setLoanName(e.target.value)} placeholder="Home Loan, Car Loan…" required />
                </div>
                <div className="space-y-2">
                  <Label>Total Amount (₹)</Label>
                  <Input type="number" min="1" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="500000" required />
                </div>
                <div className="space-y-2">
                  <Label>EMI Amount (₹)</Label>
                  <Input type="number" min="1" value={emiAmount} onChange={(e) => setEmiAmount(e.target.value)} placeholder="15000" required />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} required />
                </div>
                {autoEMIs !== null && (
                  <div className="sm:col-span-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                    Duration: <span className="font-medium text-foreground">{autoEMIs} months</span> • 
                    Total EMIs: <span className="font-medium text-foreground">{autoEMIs}</span>
                  </div>
                )}
                <div className="flex items-end sm:col-span-2">
                  <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent" disabled={creating}>
                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Loan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loan list */}
        <AnimatePresence>
          {loans.map((loan, i) => <LoanCard key={loan.id} loan={loan} index={i} payingId={payingId} onPay={handlePayEmi} onDelete={handleDelete} />)}
        </AnimatePresence>

        {loans.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No loans yet. Create one above.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

function LoanCard({ loan, index, payingId, onPay, onDelete }: {
  loan: Loan; index: number; payingId: string | null;
  onPay: (id: string) => void; onDelete: (id: string) => void;
}) {
  const paidPct = ((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100;
  const cfg = statusConfig[loan.loanStatus] || statusConfig.Active;
  const StatusIcon = cfg.icon;

  // Timeline progress (time elapsed vs total duration)
  const now = new Date();
  const start = new Date(loan.startDate);
  const end = new Date(loan.endDate);
  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.max(0, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const timelinePct = Math.min(100, (elapsedDays / totalDays) * 100);
  const remainingMonths = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.05 }}
    >
      <Card className="glass-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none" />
        <CardContent className="relative p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{loan.loanName}</p>
                <p className="text-xs text-muted-foreground">
                  EMI: ₹{loan.emiAmount.toLocaleString()} • Total: ₹{loan.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={cfg.color as any} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {loan.loanStatus}
              </Badge>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Loan</AlertDialogTitle>
                    <AlertDialogDescription>Remove "{loan.loanName}" permanently?</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(loan.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Amount progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Remaining: ₹{loan.remainingAmount.toLocaleString()}</span>
              <span>{paidPct.toFixed(0)}% paid ({loan.completedEMIs}/{loan.totalEMIs} EMIs)</span>
            </div>
            <Progress value={paidPct} className="h-2" />
          </div>

          {/* Timeline progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {loan.startDate}</span>
              <span>{remainingMonths > 0 ? `${remainingMonths}mo remaining` : "Ended"}</span>
              <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {loan.endDate}</span>
            </div>
            <div className="relative h-2 w-full rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-accent/60 transition-all"
                style={{ width: `${timelinePct}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              Next due: {new Date(loan.nextDueDate).toLocaleDateString()}
            </div>
            {loan.loanStatus === "Active" && (
              <Button size="sm" onClick={() => onPay(loan.id)} disabled={payingId === loan.id} className="bg-gradient-to-r from-primary to-accent">
                {payingId === loan.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <IndianRupee className="mr-1 h-3 w-3" />}
                Pay EMI
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default LoanManager;
