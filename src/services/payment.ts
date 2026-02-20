/**
 * Mock Razorpay Payment Service
 *
 * Simulates Razorpay order creation, verification, subscription upgrade,
 * and EMI/Loan management using localStorage.
 *
 * In production, replace with real Razorpay SDK calls using:
 *   process.env.RAZORPAY_KEY_ID
 *   process.env.RAZORPAY_KEY_SECRET
 */

import { expenseApi, type Expense, type ExpenseCategory } from "./api";

// ─── Types ────────────────────────────────────────────────────

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed";
  createdAt: string;
}

export interface PaymentVerification {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  verified: boolean;
}

export interface Loan {
  id: string;
  userId: string;
  loanName: string;
  totalAmount: number;
  emiAmount: number;
  remainingAmount: number;
  startDate: string;
  nextDueDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface SubscriptionInfo {
  subscriptionId: string;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────

const generateId = () => "rzp_" + Math.random().toString(36).substring(2, 14);
const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));

const getStore = <T>(key: string): T[] => {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
};
const setStore = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ─── Payment API ──────────────────────────────────────────────

export const paymentApi = {
  /**
   * POST /api/payment/create-order (simulated)
   * Creates a Razorpay order for bill / EMI / subscription payments.
   */
  async createOrder(amount: number, description: string): Promise<RazorpayOrder> {
    await delay(800);
    const order: RazorpayOrder = {
      id: generateId(),
      amount,
      currency: "INR",
      status: "created",
      createdAt: new Date().toISOString(),
    };
    return order;
  },

  /**
   * POST /api/payment/verify (simulated)
   * Verifies the payment signature. In production, this uses
   * crypto.createHmac with RAZORPAY_KEY_SECRET.
   */
  async verifyPayment(orderId: string): Promise<PaymentVerification> {
    await delay(600);
    // Simulate 95% success rate
    const verified = Math.random() > 0.05;
    return {
      razorpayOrderId: orderId,
      razorpayPaymentId: generateId(),
      razorpaySignature: generateId() + generateId(),
      verified,
    };
  },

  /**
   * Complete bill payment: verify → create expense entry
   */
  async payBill(
    userId: string,
    amount: number,
    category: ExpenseCategory,
    description: string
  ): Promise<Expense> {
    const order = await this.createOrder(amount, description);
    const verification = await this.verifyPayment(order.id);

    if (!verification.verified) {
      throw new Error("Payment verification failed. Please try again.");
    }

    // Prevent duplicate: check if this orderId already has an expense
    const existing = getStore<Expense>("cfo_expenses");
    if (existing.find((e) => e.razorpayOrderId === order.id)) {
      throw new Error("Payment already processed.");
    }

    const expense = await expenseApi.add(userId, {
      amount,
      category,
      description: `${description} [Online]`,
      date: new Date().toISOString().split("T")[0],
      razorpayOrderId: verification.razorpayOrderId,
      razorpayPaymentId: verification.razorpayPaymentId,
      razorpaySignature: verification.razorpaySignature,
      paymentType: "Bill",
      paymentMethod: "Razorpay",
      status: "Completed",
      isOnlinePayment: true,
    });

    return expense;
  },
};

// ─── Subscription API ─────────────────────────────────────────

export const subscriptionApi = {
  /**
   * POST /api/subscription/upgrade (simulated)
   */
  async upgradeToPro(userId: string, amount: number): Promise<SubscriptionInfo> {
    const order = await paymentApi.createOrder(amount, "Pro Subscription");
    const verification = await paymentApi.verifyPayment(order.id);

    if (!verification.verified) {
      throw new Error("Subscription payment failed.");
    }

    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + 30);

    const info: SubscriptionInfo = {
      subscriptionId: generateId(),
      startDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
      isActive: true,
    };

    // Update user record
    const users = getStore<any>("cfo_users");
    const idx = users.findIndex((u: any) => u.id === userId);
    if (idx >= 0) {
      users[idx].role = "PRO";
      users[idx].subscriptionId = info.subscriptionId;
      users[idx].subscriptionStartDate = info.startDate;
      users[idx].subscriptionExpiryDate = info.expiryDate;
      users[idx].isProActive = true;
      setStore("cfo_users", users);
    }

    // Create expense entry
    await expenseApi.add(userId, {
      amount,
      category: "Bills",
      description: "Pro Subscription [Online]",
      date: now.toISOString().split("T")[0],
      razorpayOrderId: verification.razorpayOrderId,
      razorpayPaymentId: verification.razorpayPaymentId,
      razorpaySignature: verification.razorpaySignature,
      paymentType: "Subscription",
      paymentMethod: "Razorpay",
      status: "Completed",
      isOnlinePayment: true,
    });

    return info;
  },

  /** Check if user is Pro */
  isPro(userId: string): boolean {
    const users = getStore<any>("cfo_users");
    const user = users.find((u: any) => u.id === userId);
    if (!user || !user.isProActive) return false;
    if (user.subscriptionExpiryDate && new Date(user.subscriptionExpiryDate) < new Date()) {
      return false;
    }
    return true;
  },
};

// ─── Loan / EMI API ───────────────────────────────────────────

export const loanApi = {
  /** POST /api/loan/create */
  async create(
    userId: string,
    data: { loanName: string; totalAmount: number; emiAmount: number; startDate: string }
  ): Promise<Loan> {
    await delay(400);
    const nextDue = new Date(data.startDate);
    nextDue.setMonth(nextDue.getMonth() + 1);

    const loan: Loan = {
      id: generateId(),
      userId,
      loanName: data.loanName,
      totalAmount: data.totalAmount,
      emiAmount: data.emiAmount,
      remainingAmount: data.totalAmount,
      startDate: data.startDate,
      nextDueDate: nextDue.toISOString().split("T")[0],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const loans = getStore<Loan>("cfo_loans");
    loans.push(loan);
    setStore("cfo_loans", loans);
    return loan;
  },

  /** Get all loans for user */
  async getAll(userId: string): Promise<Loan[]> {
    await delay(200);
    return getStore<Loan>("cfo_loans").filter((l) => l.userId === userId);
  },

  /** POST /api/loan/pay-emi */
  async payEmi(userId: string, loanId: string): Promise<Expense> {
    const loans = getStore<Loan>("cfo_loans");
    const loan = loans.find((l) => l.id === loanId && l.userId === userId);
    if (!loan) throw new Error("Loan not found");
    if (!loan.isActive) throw new Error("Loan is already fully paid");

    const order = await paymentApi.createOrder(loan.emiAmount, `EMI – ${loan.loanName}`);
    const verification = await paymentApi.verifyPayment(order.id);

    if (!verification.verified) throw new Error("EMI payment failed.");

    // Update loan
    loan.remainingAmount = Math.max(0, loan.remainingAmount - loan.emiAmount);
    const nextDue = new Date(loan.nextDueDate);
    nextDue.setMonth(nextDue.getMonth() + 1);
    loan.nextDueDate = nextDue.toISOString().split("T")[0];
    if (loan.remainingAmount <= 0) loan.isActive = false;

    setStore("cfo_loans", loans);

    // Create expense
    const expense = await expenseApi.add(userId, {
      amount: loan.emiAmount,
      category: "Bills",
      description: `EMI – ${loan.loanName} [Online]`,
      date: new Date().toISOString().split("T")[0],
      razorpayOrderId: verification.razorpayOrderId,
      razorpayPaymentId: verification.razorpayPaymentId,
      razorpaySignature: verification.razorpaySignature,
      paymentType: "EMI",
      paymentMethod: "Razorpay",
      status: "Completed",
      isOnlinePayment: true,
    });

    return expense;
  },

  /** Delete a loan */
  async delete(loanId: string): Promise<void> {
    await delay(200);
    const loans = getStore<Loan>("cfo_loans").filter((l) => l.id !== loanId);
    setStore("cfo_loans", loans);
  },
};
