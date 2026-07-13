"use client";

import { useState, useMemo } from "react";
import { format, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FinanceScope, createExpense, createBudget, deleteExpense, deleteBudget } from "@/actions/finance";
import { BudgetPeriod, Expense, Budget, ExpenseCategory } from "@prisma/client";
import { Plus, Trash2 } from "lucide-react";

interface FinanceDataProps {
  expenses: (Expense & { category: ExpenseCategory | null })[];
  budgets: Budget[];
  categories: ExpenseCategory[];
  scope: FinanceScope;
}



export default function ExpenseTracker({ expenses, budgets, scope }: FinanceDataProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "budgets">("overview");
  const [periodFilter, setPeriodFilter] = useState<"WEEKLY" | "MONTHLY" | "YEARLY">("MONTHLY");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [isCustomCurrency, setIsCustomCurrency] = useState(false);
  const [customCurrencyValue, setCustomCurrencyValue] = useState("");
  
  const allCurrencies = useMemo(() => {
    const set = new Set(["USD", "NGN", "EUR", "GBP"]);
    expenses.forEach(e => set.add(e.currency));
    budgets.forEach(b => set.add(b.currency));
    return Array.from(set);
  }, [expenses, budgets]);
  
  // Modals / Forms state
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  // Form states
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);


  const [budgetName, setBudgetName] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>("MONTHLY");

  // Filtering data by currency
  const filteredExpenses = useMemo(() => expenses.filter(e => e.currency === selectedCurrency), [expenses, selectedCurrency]);
  const filteredBudgets = useMemo(() => budgets.filter(b => b.currency === selectedCurrency), [budgets, selectedCurrency]);

  // Chart Data Aggregation
  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    filteredExpenses.forEach((exp) => {
      const d = new Date(exp.date);
      let key = "";
      if (periodFilter === "WEEKLY") {
        key = format(startOfWeek(d), "MMM d");
      } else if (periodFilter === "MONTHLY") {
        key = format(startOfMonth(d), "MMM yyyy");
      } else {
        key = format(startOfYear(d), "yyyy");
      }
      
      dataMap[key] = (dataMap[key] || 0) + exp.amount;
    });

    return Object.keys(dataMap)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(key => ({
        name: key,
        amount: dataMap[key],
      }));
  }, [filteredExpenses, periodFilter]);

  // Summaries
  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Calculate budget for the current active period
  const activeBudgets = filteredBudgets.filter(b => b.period === periodFilter);
  const totalBudget = activeBudgets.reduce((acc, curr) => acc + curr.amount, 0);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount) return;
    await createExpense({
      amount: parseFloat(expenseAmount),
      currency: selectedCurrency,
      description: expenseDescription,
      date: new Date(expenseDate),
    }, scope);
    setShowExpenseForm(false);
    setExpenseAmount("");
    setExpenseDescription("");
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetAmount || !budgetName) return;
    await createBudget({
      name: budgetName,
      amount: parseFloat(budgetAmount),
      currency: selectedCurrency,
      period: budgetPeriod,
    }, scope);
    setShowBudgetForm(false);
    setBudgetAmount("");
    setBudgetName("");
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Finance & Budgeting</h2>
        
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          {isCustomCurrency ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={5}
                placeholder="e.g. CAD"
                value={customCurrencyValue}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setCustomCurrencyValue(val);
                  setSelectedCurrency(val || "USD");
                }}
                className="w-20 px-3 py-1.5 border rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-700 outline-none"
              />
              <button 
                onClick={() => {
                  setIsCustomCurrency(false);
                  if (!customCurrencyValue) setSelectedCurrency("USD");
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Done
              </button>
            </div>
          ) : (
            <select
              value={allCurrencies.includes(selectedCurrency) ? selectedCurrency : "CUSTOM"}
              onChange={(e) => {
                if (e.target.value === "CUSTOM") {
                  setIsCustomCurrency(true);
                  setCustomCurrencyValue("");
                } else {
                  setSelectedCurrency(e.target.value);
                }
              }}
              className="px-3 py-1.5 border rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
            >
              {allCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="CUSTOM">+ Custom...</option>
            </select>
          )}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as "WEEKLY" | "MONTHLY" | "YEARLY")}
            className="px-3 py-1.5 border rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 px-6 pt-4 border-b border-gray-200 dark:border-gray-800">
        {["overview", "expenses", "budgets"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as "overview" | "expenses" | "budgets")}
            className={`pb-3 text-sm font-medium capitalize ${
              activeTab === tab
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedCurrency} {totalExpenses.toLocaleString()}
                </h3>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">{periodFilter} Budget Total</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedCurrency} {totalBudget.toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="h-72 w-full mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Legend />
                  <Bar dataKey="amount" fill="#3b82f6" name={`Expenses (${selectedCurrency})`} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "expenses" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Expenses</h3>
              <button 
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Add Expense
              </button>
            </div>

            {showExpenseForm && (
              <form onSubmit={handleCreateExpense} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Amount ({selectedCurrency})</label>
                    <input required type="number" step="0.01" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Date</label>
                    <input required type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-700" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Description</label>
                    <input type="text" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-700" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowExpenseForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Save</button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="bg-white border-b dark:bg-gray-900 dark:border-gray-800">
                      <td className="px-6 py-4">{format(new Date(exp.date), "MMM d, yyyy")}</td>
                      <td className="px-6 py-4">{exp.description || "-"}</td>
                      <td className="px-6 py-4">{exp.currency} {exp.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={async () => {
                           await deleteExpense(exp.id);
                        }} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No expenses found for this currency.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "budgets" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Budgets</h3>
              <button 
                onClick={() => setShowBudgetForm(!showBudgetForm)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Add Budget
              </button>
            </div>

            {showBudgetForm && (
              <form onSubmit={handleCreateBudget} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Name</label>
                    <input required type="text" value={budgetName} onChange={e => setBudgetName(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Amount ({selectedCurrency})</label>
                    <input required type="number" step="0.01" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-700" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Period</label>
                    <select value={budgetPeriod} onChange={e => setBudgetPeriod(e.target.value as BudgetPeriod)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-700">
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowBudgetForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Save</button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredBudgets.map(b => (
                <div key={b.id} className="p-4 border rounded-lg dark:border-gray-800 flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{b.name}</h4>
                    <p className="text-2xl font-bold mt-2">{b.currency} {b.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1 capitalize">{b.period.toLowerCase()}</p>
                  </div>
                  <button onClick={async () => {
                     await deleteBudget(b.id);
                  }} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {filteredBudgets.length === 0 && (
                <div className="col-span-full py-8 text-center text-gray-500 border border-dashed rounded-lg">
                  No budgets defined for this currency.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
