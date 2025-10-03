export interface StoreInfo {
  storeName: string;
  address: string;
  cashierName: string;
  transactionDate: string;
  transactionTime: string;
}

export interface PaymentSummary {
  paymentMethod: string;
  totalAmount: number;
  changeGiven: number;
  itemsSold: number;
  referenceNumber: string;
}

export interface Item {
  itemName: string;
  itemPrice: number;
  itemType: string;
  weight: number;
  unitPrice: number;
}

export interface SavingsSummary {
  totalSavings: number;
  totalCoupons: number;
  annualCardSavings: number;
  fuelPointsEarned: number;
  totalFuelPoints: number;
}

export interface AccountInfo {
  customerId: string;
  cardType: string;
  cardLastDigits: string;
  aid: string;
  tc: string;
}

export interface Extraction {
  storeInfo: StoreInfo;
  paymentSummary: PaymentSummary;
  itemList: Item[];
  savingsSummary: SavingsSummary;
  accountInfo: AccountInfo;
}

export interface Receipt {
  id: number;
  store_name: string;
  address: string;
  transaction_date: string;
  total_amount: number;
  items: Item[];
  user_id: string;
  created_at: string;
}