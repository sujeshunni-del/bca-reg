export type Role = 'GUEST' | 'ADMIN' | 'CUSTOMER';

export interface PricingOption {
  id: number;
  name: string;
  total: number;
  entry: number;
  installmentAmount: number; // For simple display
  installmentCount: number;
  breakdown: string;
  isPopular?: boolean;
  // Structure for generating admin inputs
  structure: { name: string; percentage: number }[];
}

export interface Country {
  id: string;
  name: string;
  visaType: string;
  basePrice: number;
  regFee: number;
  vat: number; // Value Added Tax %
  allowInstallments: boolean;
  // Discount Configuration (%)
  discountFull: number;
  discountCouple: number;
  discountReference: number;
  discountGroup: number;
  discountSkilled: number;
  discountCustomName: string;
  discountCustom: number;
  
  // Dynamic Timeline
  timeline: string[];

  // Documents needed immediately for application
  docsAppStage: string[]; 
  // Documents needed later for embassy submission
  docsEmbassyStage: string[];
}

export type DocStatus = 'MISSING' | 'SCANNING' | 'AI_VERIFIED' | 'APPROVED' | 'REJECTED';

export interface DocumentState {
  fileName?: string;
  status: DocStatus;
  uploadedAt?: Date;
}

export interface Installment {
  id: string;
  name: string; // e.g., "Entry Payment", "2nd Installment"
  amount: number;
  dueDate: string; // YYYY-MM-DD
  status: 'PENDING' | 'PAID' | 'OVERDUE';
}

export interface Applicant {
  id: string;
  password?: string; // New field for customer login
  // Personal Details
  name: string;
  surname: string;
  email: string;
  mobile: string;
  alternativeMobile?: string;
  whatsapp: string;
  dob: string;
  age: number;
  applicationDate: string; // YYYY-MM-DD
  
  // ID Details
  passportNumber: string;
  passportExpiry: string; // YYYY-MM-DD
  nationality: string;

  // Application Details
  profession: string;
  countryId: string;
  visaName: string;
  
  // Financials & Payment Breakdown (Saved for ClickUp)
  paymentMode: 'Full Payment' | '2-Part Split' | '3-Part Split' | '4-Part Split';
  selectedDiscountType: 'Standard' | 'Couple' | 'Reference' | 'Group' | 'Skilled' | 'Custom';
  
  financeData: {
    basePrice: number;
    discountAmount: number;
    regFee: number;
    entryPayment: number;
    installmentAmount: number;
    installmentCount: number;
    totalAmount: number;
  };
  
  installments: Installment[];

  status: 'PENDING_REVIEW' | 'APPROVED' | 'ACTION_REQUIRED';
  documents: Record<string, DocumentState>; 
  progressStep: number;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT' | 'MANAGER';
  designation: string;
  password?: string;
  status: 'ACTIVE' | 'INACTIVE';
  joinedDate: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING';
  timestamp: Date;
  read: boolean;
}

export type TransactionStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'VERIFIED';
export type TransactionType = 'INVOICE' | 'RECEIPT';

export interface Transaction {
  id: string;
  applicantId?: string;
  applicantName: string;
  amount: number;
  description?: string;
  type: TransactionType;
  status: TransactionStatus;
  date: Date;
  reference: string;
}