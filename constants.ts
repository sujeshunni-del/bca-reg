import { Country, Applicant, Transaction } from './types';

export const STANDARD_TIMELINE_STEPS = [
  'Registration',
  'Document Verification',
  'Interview',
  'Work Permit Application',
  'PCC Verification',
  'Work Permit Approval',
  'Apply VFS/Embassy Appointment',
  'Visa Documents Submission',
  'Visa Approval',
  'Travel Arrangement',
  'Post Arrival',
  'TRC/Card'
];

export const INITIAL_COUNTRIES: Country[] = [
  {
    id: 'c1',
    name: 'Sweden',
    visaType: 'Work Permit (Type D)',
    basePrice: 5250,
    regFee: 250,
    vat: 25, // Sweden VAT
    allowInstallments: true,
    discountFull: 10,
    discountCouple: 5,
    discountReference: 5,
    discountGroup: 10,
    discountSkilled: 5,
    discountCustomName: 'Seasonal Promo',
    discountCustom: 15,
    timeline: [
        'Registration', 
        'Document Verification', 
        'Work Permit Application', 
        'Work Permit Approval', 
        'Visa Documents Submission', 
        'Visa Approval', 
        'Travel Arrangement'
    ],
    docsAppStage: ['Passport Scan', 'CV (Europass)'],
    docsEmbassyStage: ['Employment Contract', 'Union Statement', 'Biometrics']
  },
  {
    id: 'c2',
    name: 'Finland',
    visaType: 'Specialist Residence Permit',
    basePrice: 4800,
    regFee: 200,
    vat: 24, // Finland VAT
    allowInstallments: true,
    discountFull: 10,
    discountCouple: 5,
    discountReference: 5,
    discountGroup: 10,
    discountSkilled: 5,
    discountCustomName: '',
    discountCustom: 0,
    timeline: [
        'Registration',
        'Document Verification',
        'Interview',
        'Work Permit Application',
        'Visa Approval',
        'Post Arrival',
        'TRC/Card'
    ],
    docsAppStage: ['Passport Scan', 'Degree Certificate'],
    docsEmbassyStage: ['Income Statement', 'Tax Card']
  },
  {
    id: 'c3',
    name: 'Serbia',
    visaType: 'Temporary Residence',
    basePrice: 3500,
    regFee: 150,
    vat: 20, // Serbia VAT
    allowInstallments: false,
    discountFull: 10,
    discountCouple: 5,
    discountReference: 5,
    discountGroup: 10,
    discountSkilled: 5,
    discountCustomName: '',
    discountCustom: 0,
    timeline: [
        'Registration',
        'Document Verification',
        'PCC Verification',
        'Visa Documents Submission',
        'Visa Approval',
        'TRC/Card'
    ],
    docsAppStage: ['Passport Scan', 'White Card (Police)'],
    docsEmbassyStage: ['Health Insurance', 'Lease Agreement', 'Bank Statement']
  }
];

export const MOCK_APPLICANT_ID = 'BCA-100';

export const INITIAL_APPLICANTS: Applicant[] = [
  {
    id: 'BCA-100',
    password: 'password123',
    name: 'Alex',
    surname: 'Mercer',
    email: 'alex.mercer@eurovisa.com',
    mobile: '+1 555 0123',
    alternativeMobile: '+1 555 9876',
    whatsapp: '+1 555 0123',
    dob: '1995-04-12',
    age: 29,
    applicationDate: '2024-01-15',
    passportNumber: 'A12345678',
    passportExpiry: '2030-01-01',
    nationality: 'American',
    profession: 'Software Engineer',
    countryId: 'c1',
    visaName: 'Work Permit (Type D)',
    paymentMode: 'Full Payment',
    selectedDiscountType: 'Standard',
    financeData: {
        basePrice: 5250,
        discountAmount: 0,
        regFee: 250,
        entryPayment: 4975, // (5250 * 0.9) + 250
        installmentAmount: 0,
        installmentCount: 0,
        totalAmount: 4975
    },
    installments: [
        { id: 'inst-1', name: 'Full Payment', amount: 4975, dueDate: '2024-01-15', status: 'PAID' }
    ],
    status: 'PENDING_REVIEW',
    progressStep: 2,
    documents: {
      'Passport Scan': { status: 'AI_VERIFIED', fileName: 'passport_scan.pdf', uploadedAt: new Date() },
      'CV (Europass)': { status: 'MISSING' },
      'Employment Contract': { status: 'MISSING' }
    }
  },
  {
    id: 'BCA-101',
    password: 'password123',
    name: 'Sarah',
    surname: 'Jenko',
    email: 's.jenko@eurovisa.com',
    mobile: '+44 20 7123 4567',
    alternativeMobile: '',
    whatsapp: '+44 20 7123 4567',
    dob: '1990-08-23',
    age: 34,
    applicationDate: '2024-02-01',
    passportNumber: 'UK98765432',
    passportExpiry: '2028-05-15',
    nationality: 'British',
    profession: 'Nurse',
    countryId: 'c3',
    visaName: 'Temporary Residence',
    paymentMode: 'Full Payment',
    selectedDiscountType: 'Standard',
    financeData: {
        basePrice: 3500,
        discountAmount: 0,
        regFee: 150,
        entryPayment: 3300, 
        installmentAmount: 0,
        installmentCount: 0,
        totalAmount: 3300
    },
    installments: [
        { id: 'inst-2', name: 'Entry Payment', amount: 1650, dueDate: '2024-02-01', status: 'PAID' },
        { id: 'inst-3', name: '2nd Installment', amount: 1650, dueDate: '2024-03-01', status: 'PENDING' }
    ],
    status: 'PENDING_REVIEW',
    progressStep: 3,
    documents: {
      'Passport Scan': { status: 'AI_VERIFIED', fileName: 'passport.jpg', uploadedAt: new Date() },
      'White Card (Police)': { status: 'AI_VERIFIED', fileName: 'police_record.pdf', uploadedAt: new Date() },
      'Health Insurance': { status: 'AI_VERIFIED', fileName: 'insurance.pdf', uploadedAt: new Date() },
      'Lease Agreement': { status: 'AI_VERIFIED', fileName: 'apt_lease.pdf', uploadedAt: new Date() }
    }
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 'inv_001', applicantId: 'BCA-100', applicantName: 'Alex Mercer', amount: 250, type: 'INVOICE', status: 'PAID', date: new Date('2024-02-10'), reference: 'REG-FEE-001', description: 'Initial Registration Fee' },
    { id: 'inv_002', applicantId: 'BCA-101', applicantName: 'Sarah Jenko', amount: 3650, type: 'INVOICE', status: 'VERIFIED', date: new Date('2024-02-12'), reference: 'FULL-PAY-002', description: 'Full Program Payment - Serbia' },
    { id: 'inv_003', applicantId: 'BCA-100', applicantName: 'Alex Mercer', amount: 5250, type: 'INVOICE', status: 'PENDING', date: new Date(), reference: 'BASE-PAY-003', description: 'Work Permit Base Fee' },
];