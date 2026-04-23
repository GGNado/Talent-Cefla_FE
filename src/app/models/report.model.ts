export interface Summary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: number;
  totalOrders: number;
  uniqueCustomers: number;
  uniqueItems: number;
}

export interface TrendEntry {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  projectedRevenue: number | null;
  projection: boolean;
}

export interface TrendResponse {
  interval: string;
  history: TrendEntry[];
  projections: TrendEntry[];
  totalRevenueMean: number;
  totalRevenueVariance: number;
  totalRevenueStandardDeviation: number;
}

export interface PerformerEntry {
  identifier: string;
  name: string;
  totalRevenue: number;
  totalProfit: number;
  count: number;
}

export interface TopPerformersResponse {
  reportType: string;
  entries: PerformerEntry[];
}

export interface DetailedOrder {
  orderId: number;
  orderDate: string;
  companyName: string;
  customerName: string;
  itemDescription: string;
  businessLine: string;
  areaManager: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface AdvancedForecastResponse {
  monteCarlo: MonteCarloEntry[];
  churnRisk: ChurnRiskEntry[];
}

export interface MonteCarloEntry {
  date: string;
  revenueMin: number;
  revenueMax: number;
  revenueMedian: number;
}

export interface ChurnRiskEntry {
  customerName: string;
  riskScore: number;
  lastOrderDate: string;
}
