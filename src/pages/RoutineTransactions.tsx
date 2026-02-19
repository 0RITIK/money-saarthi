import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  routineApi,
  getNextExecDateForRoutine,
  type RoutineTransaction,
  type Frequency,
} from "@/services/routineTransactions";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/services/api";
import DashboardLayout from "@/components/DashboardLayout";
import FloatingParticles from "@/components/dashboard/FloatingParticles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  Trash2,
  Plus,
  CalendarClock,
  Repeat,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const RoutineTransactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [routines, setRoutines] = useState<RoutineTransaction[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("Bills");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchRoutines = useCallback(() => {
    if (!user) return;
    setRoutines(routineApi.getAll(user.id));
  }, [user]);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !description) return;
    setLoading(true);
    try {
      routineApi.create(user.id, {
        type,
        amount: parseFloat(amount),
        category: type === "expense" ? category : description,
        description,
        frequency,
        startDate,
        endDate: endDate || undefined,
        isActive,
      });
      toast({ title: "Routine transaction created!" });
      setAmount("");
      setDescription("");
      setEndDate("");
      fetchRoutines();
    } catch {
      toast({ title: "Failed to create routine", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id: string) => {
    routineApi.toggleActive(id);
    fetchRoutines();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    routineApi.delete(deleteTarget);
    setDeleteTarget(null);
    fetchRoutines();
    toast({ title: "Routine deleted" });
  };

  return (
    <DashboardLayout>
      <FloatingParticles />
      <div className="relative z-10 mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Repeat className="h-6 w-6 text-primary" />
            Routine Transactions
          </h1>
          <p className="text-sm text-muted-foreground">
            Schedule auto-credits and auto-debits like a smart banking system.
          </p>
        </div>

        {/* ─── Create Form ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 text-primary" /> Create New Routine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="grid gap-4 sm:grid-cols-2"
              >
                {/* Type */}
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as "income" | "expense")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income (Credit)</SelectItem>
                      <SelectItem value="expense">Expense (Debit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="5000"
                    required
                  />
                </div>

                {/* Category (expense only) */}
                {type === "expense" && (
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={category}
                      onValueChange={setCategory}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Rent, Salary, Netflix…"
                    required
                  />
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={frequency}
                    onValueChange={(v) => setFrequency(v as Frequency)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    min={todayStr}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label>End Date (optional)</Label>
                  <Input
                    type="date"
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label className="cursor-pointer">
                    {isActive ? "Active" : "Paused"}
                  </Label>
                </div>

                {/* Submit */}
                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold"
                  >
                    {loading ? "Creating…" : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Create Routine Transaction
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Active Routines List ────────────────── */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Active Routines ({routines.length})
          </h2>

          {routines.length === 0 ? (
            <Card className="glass-card py-10 text-center">
              <p className="text-muted-foreground">
                No routine transactions yet. Create one above!
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {routines.map((rt, i) => {
                  const nextExec = getNextExecDateForRoutine(rt);
                  const isIncome = rt.type === "income";
                  return (
                    <motion.div
                      key={rt.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <Card
                        className={`glass-card relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                          rt.isActive
                            ? isIncome
                              ? "border-success/30 shadow-success/5"
                              : "border-destructive/30 shadow-destructive/5"
                            : "opacity-60 border-muted"
                        }`}
                      >
                        {/* Glow bar */}
                        <div
                          className={`absolute top-0 left-0 right-0 h-0.5 ${
                            rt.isActive
                              ? isIncome
                                ? "bg-gradient-to-r from-success/80 to-primary/80"
                                : "bg-gradient-to-r from-destructive/80 to-warning/80"
                              : "bg-muted"
                          }`}
                        />

                        <CardContent className="p-4 space-y-3">
                          {/* Top row */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {isIncome ? (
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                                  <TrendingUp className="h-4 w-4 text-success" />
                                </div>
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                                  <TrendingDown className="h-4 w-4 text-destructive" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-foreground text-sm">
                                  {rt.description}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {rt.frequency} • {rt.category}
                                </p>
                              </div>
                            </div>
                            <p
                              className={`text-lg font-bold ${
                                isIncome ? "text-success" : "text-destructive"
                              }`}
                            >
                              {isIncome ? "+" : "-"}₹{rt.amount.toLocaleString()}
                            </p>
                          </div>

                          {/* Meta */}
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>
                              Next: {nextExec.toLocaleDateString()}
                            </span>
                            {rt.endDate && (
                              <span>
                                Ends: {new Date(rt.endDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rt.isActive}
                                onCheckedChange={() => handleToggle(rt.id)}
                              />
                              <Badge
                                variant={rt.isActive ? "default" : "secondary"}
                                className="text-[10px]"
                              >
                                {rt.isActive ? "Active" : "Paused"}
                              </Badge>
                            </div>
                            <button
                              onClick={() => setDeleteTarget(rt.id)}
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              title="Delete routine"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Routine Transaction</DialogTitle>
            <DialogDescription>
              This will permanently remove this routine. Any previously
              auto-generated transactions will remain in your history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default RoutineTransactions;
