import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { expenseApi, EXPENSE_CATEGORIES, type Expense, type ExpenseCategory } from "@/services/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AddExpense = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const fetchExpenses = async () => {
    if (!user) return;
    setExpenses(await expenseApi.getAll(user.id));
  };

  useEffect(() => { fetchExpenses(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) return;
    setLoading(true);
    try {
      await expenseApi.add(user.id, { amount: parseFloat(amount), category, description, date });
      toast({ title: "Expense added successfully" });
      setAmount("");
      setDescription("");
      fetchExpenses();
    } catch {
      toast({ title: "Failed to add expense", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await expenseApi.delete(id);
    fetchExpenses();
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Expense Management</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4" /> Add Expense
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" required />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Lunch, Uber ride…" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Adding…" : "Add Expense"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="stat-gradient">
            <CardHeader>
              <CardTitle className="text-base">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">₹{totalExpenses.toLocaleString()}</p>
              <p className="mt-1 text-sm text-muted-foreground">{expenses.length} entries</p>
            </CardContent>
          </Card>
        </div>

        {expenses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expenses
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium text-foreground">{(exp.description || exp.category).replace(" [Auto]", "")}</p>
                          <p className="text-xs text-muted-foreground">{exp.category} • {new Date(exp.date).toLocaleDateString()}</p>
                        </div>
                        {exp.description?.includes("[Auto]") && (
                          <Badge variant="secondary" className="text-[10px]">Auto Generated</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-destructive">-₹{exp.amount.toLocaleString()}</span>
                        <button onClick={() => handleDelete(exp.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AddExpense;
