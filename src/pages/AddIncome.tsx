import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { incomeApi, type Income } from "@/services/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AddIncome = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const fetchIncomes = async () => {
    if (!user) return;
    setIncomes(await incomeApi.getAll(user.id));
  };

  useEffect(() => { fetchIncomes(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !source) return;
    setLoading(true);
    try {
      await incomeApi.add(user.id, { amount: parseFloat(amount), source, date });
      toast({ title: "Income added successfully" });
      setAmount("");
      setSource("");
      fetchIncomes();
    } catch {
      toast({ title: "Failed to add income", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await incomeApi.delete(id);
    fetchIncomes();
  };

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Income Management</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Add Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4" /> Add Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" required />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Salary, Freelance…" required />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Adding…" : "Add Income"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="stat-gradient">
            <CardHeader>
              <CardTitle className="text-base">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">₹{totalIncome.toLocaleString()}</p>
              <p className="mt-1 text-sm text-muted-foreground">{incomes.length} entries</p>
            </CardContent>
          </Card>
        </div>

        {/* Income List */}
        {incomes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {incomes
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((inc) => (
                    <div key={inc.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium text-foreground">{inc.source.replace(" [Auto]", "")}</p>
                          <p className="text-xs text-muted-foreground">{new Date(inc.date).toLocaleDateString()}</p>
                        </div>
                        {inc.source.includes("[Auto]") && (
                          <Badge variant="secondary" className="text-[10px]">Auto Generated</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-success">+₹{inc.amount.toLocaleString()}</span>
                        <button onClick={() => handleDelete(inc.id)} className="text-muted-foreground hover:text-destructive">
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

export default AddIncome;
