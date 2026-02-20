import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { loanApi, type Loan } from "@/services/payment";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, Plus, Trash2, Loader2, IndianRupee, CalendarDays } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const LoanManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanName, setLoanName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [emiAmount, setEmiAmount] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [creating, setCreating] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

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
      });
      toast({ title: "Loan created" });
      setLoanName("");
      setTotalAmount("");
      setEmiAmount("");
      fetchLoans();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
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
    } finally {
      setPayingId(null);
    }
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
                  <Input type="date" value={startDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div className="flex items-end">
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
          {loans.map((loan, i) => {
            const paidPct = ((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100;
            return (
              <motion.div
                key={loan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="glass-card relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none" />
                  <CardContent className="relative p-5">
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
                        <Badge variant={loan.isActive ? "default" : "secondary"}>
                          {loan.isActive ? "Active" : "Paid Off"}
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Loan</AlertDialogTitle>
                              <AlertDialogDescription>Remove "{loan.loanName}" permanently?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(loan.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Remaining: ₹{loan.remainingAmount.toLocaleString()}</span>
                        <span>{paidPct.toFixed(0)}% paid</span>
                      </div>
                      <Progress value={paidPct} className="h-2" />
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        Next due: {new Date(loan.nextDueDate).toLocaleDateString()}
                      </div>
                      {loan.isActive && (
                        <Button
                          size="sm"
                          onClick={() => handlePayEmi(loan.id)}
                          disabled={payingId === loan.id}
                          className="bg-gradient-to-r from-primary to-accent"
                        >
                          {payingId === loan.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <IndianRupee className="mr-1 h-3 w-3" />}
                          Pay EMI
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loans.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No loans yet. Create one above.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LoanManager;
