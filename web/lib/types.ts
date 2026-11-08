// Data shapes shared by the server and the screens. Amounts are numbers in dollars; dates are 'YYYY-MM-DD'.

export type Category = { id: number; name: string; is_other: boolean; monthly_budget: number | null };

export type Expense = {
  id: number;
  raw_input: string;
  amount: number;
  currency: string;
  category_id: number;
  category: string;
  merchant: string | null;
  date: string;
  remarks: string | null;
  was_edited: boolean;
};

// One category's spending in a month
export type SummaryRow = { category: string; total: number; count: number; budget?: number | null };
