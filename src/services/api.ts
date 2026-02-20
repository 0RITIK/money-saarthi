/**
 * Mock API Service Layer
 * 
 * This module simulates backend API calls using localStorage.
 * It's designed to be easily swapped with a real Express.js backend
 * by changing the implementation of each function to use Axios HTTP calls.
 * 
 * In production, replace localStorage calls with:
 *   axios.get('/api/expenses', { headers: { Authorization: `Bearer ${token}` } })
 */

// ─── Types ────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: "FREE" | "PRO";
  subscriptionId?: string;
  subscriptionStartDate?: string;
  subscriptionExpiryDate?: string;
  isProActive?: boolean;
}

export interface Income {
  id: string;
  userId: string;
  amount: number;
  source: string;
  date: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentType?: "Bill" | "EMI" | "Subscription" | "Manual";
  paymentMethod?: "Razorpay" | "Manual";
  status?: "Pending" | "Completed" | "Failed";
  isOnlinePayment?: boolean;
}

export type ExpenseCategory =
  | "Food"
  | "Transport"
  | "Entertainment"
  | "Bills"
  | "Shopping"
  | "Others";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Food",
  "Transport",
  "Entertainment",
  "Bills",
  "Shopping",
  "Others",
];

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AIInsight {
  type: "warning" | "danger" | "success" | "info";
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).substring(2, 11);

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

const getStore = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};

const setStore = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ─── Auth API ─────────────────────────────────────────────────

export const authApi = {
  /** Register a new user */
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    await delay();
    const users = getStore<User & { password: string }>("cfo_users");
    if (users.find((u) => u.email === email)) {
      throw new Error("Email already registered");
    }
    const user = { id: generateId(), name, email, password, role: "FREE" as const };
    users.push(user);
    setStore("cfo_users", users);
    const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 86400000 }));
    return { user: { id: user.id, name, email, role: "FREE" }, token };
  },

  /** Login an existing user */
  async login(email: string, password: string): Promise<AuthResponse> {
    await delay();
    const users = getStore<User & { password: string }>("cfo_users");
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) throw new Error("Invalid email or password");
    const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 86400000 }));
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role || "FREE" }, token };
  },

  /** Validate token and return user */
  async getUser(token: string): Promise<User | null> {
    try {
      const { userId } = JSON.parse(atob(token));
      const users = getStore<User>("cfo_users");
      return users.find((u) => u.id === userId) || null;
    } catch {
      return null;
    }
  },
};

// ─── Income API ───────────────────────────────────────────────

export const incomeApi = {
  async getAll(userId: string): Promise<Income[]> {
    await delay(200);
    return getStore<Income>("cfo_incomes").filter((i) => i.userId === userId);
  },

  async add(userId: string, data: Omit<Income, "id" | "userId">): Promise<Income> {
    await delay();
    const incomes = getStore<Income>("cfo_incomes");
    const income: Income = { id: generateId(), userId, ...data };
    incomes.push(income);
    setStore("cfo_incomes", incomes);
    return income;
  },

  async delete(id: string): Promise<void> {
    await delay(200);
    const incomes = getStore<Income>("cfo_incomes").filter((i) => i.id !== id);
    setStore("cfo_incomes", incomes);
  },
};

// ─── Expense API ──────────────────────────────────────────────

export const expenseApi = {
  async getAll(userId: string): Promise<Expense[]> {
    await delay(200);
    return getStore<Expense>("cfo_expenses").filter((e) => e.userId === userId);
  },

  async add(userId: string, data: Omit<Expense, "id" | "userId">): Promise<Expense> {
    await delay();
    const expenses = getStore<Expense>("cfo_expenses");
    const expense: Expense = { id: generateId(), userId, ...data };
    expenses.push(expense);
    setStore("cfo_expenses", expenses);
    return expense;
  },

  async delete(id: string): Promise<void> {
    await delay(200);
    const expenses = getStore<Expense>("cfo_expenses").filter((e) => e.id !== id);
    setStore("cfo_expenses", expenses);
  },
};

// ─── AI Insights Engine (Rule-Based) ─────────────────────────

export const insightsApi = {
  /**
   * Generates intelligent financial insights using rule-based logic.
   * In a production app, this would call an AI/ML endpoint.
   */
  generate(incomes: Income[], expenses: Expense[]): AIInsight[] {
    const insights: AIInsight[] = [];

    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

    // No data yet
    if (totalIncome === 0 && totalExpenses === 0) {
      return [{ type: "info", message: "Start by adding your income and expenses to get personalized financial insights." }];
    }

    // Savings rate analysis
    if (savingsRate < 0) {
      insights.push({ type: "danger", message: "⚠️ You're spending more than you earn! Consider cutting non-essential expenses immediately." });
    } else if (savingsRate < 10) {
      insights.push({ type: "danger", message: "Your savings rate is critically low at " + savingsRate.toFixed(1) + "%. Financial experts recommend saving at least 20% of income." });
    } else if (savingsRate < 20) {
      insights.push({ type: "warning", message: "Your savings rate of " + savingsRate.toFixed(1) + "% is below the recommended 20% threshold. Try to reduce discretionary spending." });
    } else {
      insights.push({ type: "success", message: "Great job! You're saving " + savingsRate.toFixed(1) + "% of your income, which is above the recommended 20% target." });
    }

    // Per-category overspending analysis
    if (totalIncome > 0) {
      const categoryTotals: Record<string, number> = {};
      expenses.forEach((e) => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
      });

      Object.entries(categoryTotals).forEach(([cat, amount]) => {
        const pct = (amount / totalIncome) * 100;
        if (pct > 30) {
          insights.push({ type: "warning", message: `Your ${cat} expenses account for ${pct.toFixed(1)}% of income — that's above the 30% recommended limit.` });
        }
      });
    }

    // Monthly trend analysis
    const now = new Date();
    const thisMonth = now.getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;

    const thisMonthExp = expenses.filter((e) => new Date(e.date).getMonth() === thisMonth).reduce((s, e) => s + e.amount, 0);
    const lastMonthExp = expenses.filter((e) => new Date(e.date).getMonth() === lastMonth).reduce((s, e) => s + e.amount, 0);

    if (lastMonthExp > 0 && thisMonthExp > lastMonthExp) {
      const increase = ((thisMonthExp - lastMonthExp) / lastMonthExp * 100).toFixed(1);
      insights.push({ type: "warning", message: `Your expenses increased by ${increase}% compared to last month. Review recent transactions for areas to cut back.` });
    } else if (lastMonthExp > 0 && thisMonthExp < lastMonthExp) {
      insights.push({ type: "success", message: "Your spending decreased compared to last month — keep up the good financial discipline!" });
    }

    // Healthy balance
    if (balance > 0 && savingsRate >= 20) {
      insights.push({ type: "success", message: "Your financial health looks strong. Consider investing your surplus for long-term growth." });
    }

    return insights;
  },
};
