export type Sale = {
  id: string;
  item: string;
  qty: number;
  unit: string;
  amount: number; // naira, total
  ts: number;
};

export type Expense = {
  id: string;
  category: string;
  amount: number;
  note?: string;
  ts: number;
};

export type Debt = {
  id: string;
  customer: string;
  amount: number; // outstanding
  note?: string;
  ts: number;
};

export type Task = {
  id: string;
  who: string;
  task: string;
  done: boolean;
  ts: number;
};

export type InventoryItem = {
  id: string;
  item: string;
  qty: number;
  unit: string;
  lowAt: number; // low-stock threshold
};

export type PriceReport = {
  id: string;
  commodity: string;
  market: string;
  price: number;
  by?: string;
  ts: number;
};

export type DB = {
  business: string;
  sales: Sale[];
  expenses: Expense[];
  debts: Debt[];
  tasks: Task[];
  inventory: InventoryItem[];
  priceReports: PriceReport[];
};

export type BusinessState = {
  business: string;
  today: {
    revenue: number;
    expenses: number;
    profit: number;
    salesCount: number;
  };
  totals: {
    outstandingDebt: number;
    openTasks: number;
  };
  recentSales: Sale[];
  debts: Debt[];
  tasks: Task[];
  inventory: InventoryItem[];
  lowStock: string[];
  coach: string;
};
