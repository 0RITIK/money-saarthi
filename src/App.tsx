import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddIncome from "./pages/AddIncome";
import AddExpense from "./pages/AddExpense";
import RoutineTransactions from "./pages/RoutineTransactions";
import PayBill from "./pages/PayBill";
import Upgrade from "./pages/Upgrade";
import LoanManager from "./pages/LoanManager";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/add-income"
              element={<ProtectedRoute><AddIncome /></ProtectedRoute>}
            />
            <Route
              path="/add-expense"
              element={<ProtectedRoute><AddExpense /></ProtectedRoute>}
            />
            <Route
              path="/routine-transactions"
              element={<ProtectedRoute><RoutineTransactions /></ProtectedRoute>}
            />
            <Route
              path="/pay-bill"
              element={<ProtectedRoute><PayBill /></ProtectedRoute>}
            />
            <Route
              path="/upgrade"
              element={<ProtectedRoute><Upgrade /></ProtectedRoute>}
            />
            <Route
              path="/loan-manager"
              element={<ProtectedRoute><LoanManager /></ProtectedRoute>}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
       </BrowserRouter>
     </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
