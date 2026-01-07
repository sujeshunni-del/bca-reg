import React, { useState, useEffect } from 'react';
import { Country, Applicant, DocumentState, Transaction, TransactionStatus, PricingOption, Installment, Staff } from '../types';
import { MOCK_TRANSACTIONS, STANDARD_TIMELINE_STEPS } from '../constants';
import { calculatePricingOptions } from '../utils/pricing';
import { syncProfileToClickUp, syncCountryToClickUp, syncUserToClickUp } from '../utils/clickup';
import { 
    LayoutDashboard, Users, Settings, Plus, Save, FileCheck, X, Check, 
    ExternalLink, RefreshCw, Sparkles, Receipt, FileText, CreditCard, 
    Download, BadgeCheck, AlertCircle, ChevronRight, UserPlus, Calendar, Phone, Mail, Globe, Wallet, Printer, Share2, Send,
    ArrowUp, ArrowDown, Trash2, LogOut, Search, Clock, User, Percent, List, Shield, Lock, Key, Eye, EyeOff, MoreHorizontal, UserCog, Copy, Loader2
} from 'lucide-react';

const ArrowUpRightSmall = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7M7 7h10v10"/>
  </svg>
);

interface AdminPanelProps {
  countries: Country[];
  setCountries: React.Dispatch<React.SetStateAction<Country[]>>;
  applicants: Applicant[];
  updateApplicant: (updated: Applicant) => void;
  addApplicant: (newApplicant: Applicant) => void;
  onLogout: () => void;
  triggerSyncSimulation: () => void;
}

type AdminTab = 'VERIFICATION' | 'COUNTRIES' | 'FINANCE' | 'PROFILE_CREATION' | 'USERS';

const MOCK_STAFF: Staff[] = [
    { id: 'EMP-001', name: 'Admin User', email: 'admin@eurovisa.com', role: 'ADMIN', designation: 'System Administrator', password: 'admin', status: 'ACTIVE', joinedDate: '2023-01-01' },
    { id: 'EMP-002', name: 'Sarah Agent', email: 'sarah@eurovisa.com', role: 'AGENT', designation: 'Senior Visa Consultant', password: 'user123', status: 'ACTIVE', joinedDate: '2023-05-15' },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  countries,
  setCountries,
  applicants,
  updateApplicant,
  addApplicant,
  onLogout,
  triggerSyncSimulation
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('VERIFICATION');
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [reviewApplicant, setReviewApplicant] = useState<Applicant | null>(null);
  const [customStepInput, setCustomStepInput] = useState('');
  
  // Finance State
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [isCreateInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{ type: 'INVOICE' | 'RECEIPT', tx: Transaction } | null>(null);

  // User Management State
  const [staffMembers, setStaffMembers] = useState<Staff[]>(MOCK_STAFF);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<Staff>>({ role: 'AGENT', status: 'ACTIVE' });
  const [editingUser, setEditingUser] = useState<{ type: 'STAFF' | 'CUSTOMER', data: any } | null>(null);

  // Profile Creation State
  const [newProfile, setNewProfile] = useState({
      generatedId: '',
      password: '',
      name: '',
      surname: '',
      email: '',
      mobile: '',
      alternativeMobile: '',
      whatsapp: '',
      dob: '',
      applicationDate: new Date().toISOString().split('T')[0],
      passportNumber: '',
      passportExpiry: '',
      nationality: '',
      profession: '',
      countryId: '',
      visaName: '',
      discountType: 'Standard' as const,
      paymentMode: 'Full Payment'
  });

  // Detailed Installment Editing State
  const [editableInstallments, setEditableInstallments] = useState<Installment[]>([]);

  // ClickUp Sync Feedback State
  const [isSyncing, setIsSyncing] = useState(false);

  // Derived Profile State
  const [calculatedAge, setCalculatedAge] = useState<number>(0);
  const selectedCountryForProfile = countries.find(c => c.id === newProfile.countryId);
  
  const availablePaymentOptions = selectedCountryForProfile 
    ? calculatePricingOptions(selectedCountryForProfile, newProfile.discountType as any)
    : [];
  
  const selectedPaymentDetails = availablePaymentOptions.find(opt => opt.name === newProfile.paymentMode);

  // --- Auto-Generators ---

  const generateNextId = () => {
    // Logic: Find max BCA-XXX and increment
    const existingIds = applicants
      .map(a => a.id)
      .filter(id => id.startsWith('BCA-'))
      .map(id => parseInt(id.replace('BCA-', ''), 10))
      .filter(n => !isNaN(n));
    
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 99; // Start at 100
    return `BCA-${maxId + 1}`;
  };

  const generateRandomPassword = () => {
     return Math.random().toString(36).slice(-8) + 'Aa1!'; 
  };

  const addMonths = (dateStr: string, months: number) => {
     if (!dateStr) return '';
     const d = new Date(dateStr);
     d.setMonth(d.getMonth() + months);
     return d.toISOString().split('T')[0];
  };

  // --- Effects ---

  // Init ID and Password on Mount
  useEffect(() => {
     setNewProfile(prev => ({
         ...prev,
         generatedId: generateNextId(),
         password: generateRandomPassword()
     }));
  }, [applicants]); 

  // Calculate Age
  useEffect(() => {
      if (newProfile.dob) {
          const birthDate = new Date(newProfile.dob);
          const difference = Date.now() - birthDate.getTime();
          const ageDate = new Date(difference);
          setCalculatedAge(Math.abs(ageDate.getUTCFullYear() - 1970));
      }
  }, [newProfile.dob]);

  // Recalculate Installments when Plan/Country/Discount changes
  useEffect(() => {
    if (!selectedCountryForProfile || !selectedPaymentDetails) {
        setEditableInstallments([]);
        return;
    }

    const newInstallments: Installment[] = [];
    const appDate = newProfile.applicationDate || new Date().toISOString().split('T')[0];

    // 1. Entry Payment
    newInstallments.push({
        id: 'entry',
        name: 'Entry Payment',
        amount: selectedPaymentDetails.entry,
        dueDate: appDate,
        status: 'PENDING'
    });

    // 2. Additional Installments
    if (selectedPaymentDetails.structure && selectedPaymentDetails.structure.length > 0) {
        let multiplier = 1.0;
        if (selectedPaymentDetails.id === 1) multiplier = 0.9; // Full
        if (selectedPaymentDetails.id === 2) multiplier = 1.1; // 2 Part
        if (selectedPaymentDetails.id === 3) multiplier = 1.15; // 3 Part
        if (selectedPaymentDetails.id === 4) multiplier = 1.20; // 4 Part

        const netBase = selectedCountryForProfile.basePrice * (1 - (selectedCountryForProfile[`discount${newProfile.discountType}` as keyof Country] as number || 0) / 100);
        const planBase = netBase * multiplier;
        const taxedTotal = planBase * (1 + (selectedCountryForProfile.vat / 100));

        selectedPaymentDetails.structure.forEach((inst, idx) => {
            newInstallments.push({
                id: `inst-${idx + 1}`,
                name: inst.name,
                amount: taxedTotal * inst.percentage,
                dueDate: addMonths(appDate, idx + 1),
                status: 'PENDING'
            });
        });
    }

    setEditableInstallments(newInstallments);

  }, [newProfile.paymentMode, newProfile.countryId, newProfile.discountType, newProfile.applicationDate]);


  // --- Handlers ---
  
  const handleSaveCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCountry) return;
    
    // Sync to ClickUp
    setIsSyncing(true);
    await syncCountryToClickUp(editingCountry);
    setIsSyncing(false);

    setCountries(prev => prev.map(c => c.id === editingCountry.id ? editingCountry : c));
    setEditingCountry(null);
  };

  const handleAddCountry = () => {
    const newCountry: Country = {
        id: `c_${Date.now()}`,
        name: 'New Destination',
        visaType: 'Standard Visa',
        basePrice: 4000,
        regFee: 200,
        vat: 20,
        allowInstallments: true,
        discountFull: 10,
        discountCouple: 5,
        discountReference: 5,
        discountGroup: 10,
        discountSkilled: 5,
        discountCustomName: 'Seasonal',
        discountCustom: 0,
        timeline: ['Registration', 'Document Verification', 'Visa Approval'],
        docsAppStage: ['Passport Scan'],
        docsEmbassyStage: ['Bank Statement']
    };
    setCountries(prev => [...prev, newCountry]);
    setEditingCountry(newCountry);
  };

  const moveTimelineStep = (index: number, direction: 'up' | 'down') => {
      if (!editingCountry) return;
      const newTimeline = [...(editingCountry.timeline || [])];
      if (direction === 'up' && index > 0) {
          [newTimeline[index], newTimeline[index - 1]] = [newTimeline[index - 1], newTimeline[index]];
      } else if (direction === 'down' && index < newTimeline.length - 1) {
          [newTimeline[index], newTimeline[index + 1]] = [newTimeline[index + 1], newTimeline[index]];
      }
      setEditingCountry({...editingCountry, timeline: newTimeline});
  };

  const removeTimelineStep = (step: string) => {
      if (!editingCountry) return;
      setEditingCountry({
          ...editingCountry,
          timeline: (editingCountry.timeline || []).filter(s => s !== step)
      });
  };

  const addTimelineStep = (step: string) => {
      if (!editingCountry || !step) return;
      if ((editingCountry.timeline || []).includes(step)) return;
      setEditingCountry({
          ...editingCountry,
          timeline: [...(editingCountry.timeline || []), step]
      });
  };

  const handleAddCustomStep = () => {
      if (customStepInput.trim()) {
          addTimelineStep(customStepInput.trim());
          setCustomStepInput('');
      }
  };

  const handleStatusChange = (newStepIndex: number) => {
      if (!reviewApplicant) return;
      const countryTimeline = countries.find(c => c.id === reviewApplicant.countryId)?.timeline || [];
      const updated: Applicant = {
          ...reviewApplicant,
          progressStep: newStepIndex + 1,
          status: (newStepIndex + 1) >= countryTimeline.length ? 'APPROVED' : 'PENDING_REVIEW'
      };
      updateApplicant(updated);
      setReviewApplicant(updated);
  };

  const handleApproveApplicant = () => {
    if (!reviewApplicant) return;
    const updatedDocs = { ...reviewApplicant.documents };
    Object.keys(updatedDocs).forEach(key => {
        updatedDocs[key] = { ...updatedDocs[key], status: 'APPROVED' };
    });
    const updated: Applicant = {
        ...reviewApplicant,
        status: 'APPROVED',
        documents: updatedDocs,
    };
    updateApplicant(updated);
    setReviewApplicant(null);
    triggerSyncSimulation();
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedCountryForProfile || !selectedPaymentDetails) return;

      const finalInstallments: Installment[] = editableInstallments.map((inst, idx) => ({
          ...inst,
          id: `inst-${Date.now()}-${idx}`,
          status: 'PENDING'
      }));

      const finalTotal = finalInstallments.reduce((sum, inst) => sum + inst.amount, 0);

      const newApplicant: Applicant = {
          id: newProfile.generatedId,
          password: newProfile.password,
          name: newProfile.name,
          surname: newProfile.surname,
          email: newProfile.email,
          mobile: newProfile.mobile,
          alternativeMobile: newProfile.alternativeMobile,
          whatsapp: newProfile.whatsapp,
          dob: newProfile.dob,
          age: calculatedAge,
          applicationDate: newProfile.applicationDate,
          passportNumber: newProfile.passportNumber,
          passportExpiry: newProfile.passportExpiry,
          nationality: newProfile.nationality,
          profession: newProfile.profession,
          countryId: newProfile.countryId,
          visaName: newProfile.visaName || selectedCountryForProfile.visaType,
          paymentMode: newProfile.paymentMode as any,
          selectedDiscountType: newProfile.discountType as any,
          financeData: {
              basePrice: selectedCountryForProfile.basePrice,
              discountAmount: 0, 
              regFee: selectedCountryForProfile.regFee,
              entryPayment: finalInstallments[0]?.amount || 0,
              installmentAmount: finalInstallments[1]?.amount || 0,
              installmentCount: finalInstallments.length - 1,
              totalAmount: finalTotal
          },
          installments: finalInstallments,
          status: 'PENDING_REVIEW',
          progressStep: 1,
          documents: {}
      };

      const allDocs = [...(selectedCountryForProfile.docsAppStage || []), ...(selectedCountryForProfile.docsEmbassyStage || [])];
      allDocs.forEach(doc => {
          newApplicant.documents[doc] = { status: 'MISSING' };
      });

      addApplicant(newApplicant);
      
      // Sync to ClickUp (Profile List + User List)
      setIsSyncing(true);
      await syncProfileToClickUp(newApplicant, countries);
      // Also save as a user in the User List (since they are now a Customer)
      // We map basic applicant fields to Staff interface for the syncUser function
      const customerAsUser: Staff = {
          id: newApplicant.id,
          name: `${newApplicant.name} ${newApplicant.surname}`,
          email: newApplicant.email,
          role: 'CUSTOMER' as any,
          designation: 'Applicant',
          password: newApplicant.password,
          status: 'ACTIVE',
          joinedDate: new Date().toISOString()
      }
      await syncUserToClickUp(customerAsUser);
      setIsSyncing(false);

      setActiveTab('VERIFICATION');
      setNewProfile({ 
          generatedId: generateNextId(),
          password: generateRandomPassword(),
          name: '', surname: '', email: '', mobile: '', alternativeMobile: '', whatsapp: '', 
          dob: '', applicationDate: new Date().toISOString().split('T')[0],
          passportNumber: '', passportExpiry: '', nationality: '', 
          profession: '', countryId: '', visaName: '', discountType: 'Standard', paymentMode: 'Full Payment' 
      });
      setEditableInstallments([]);
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const applicantId = formData.get('applicantId') as string;
      const amount = parseFloat(formData.get('amount') as string);
      const description = formData.get('description') as string;
      const dueDate = formData.get('dueDate') as string;

      const applicant = applicants.find(a => a.id === applicantId);
      if (!applicant) return;

      const newInv: Transaction = {
          id: `inv_${Math.floor(Math.random() * 10000)}`,
          applicantId: applicant.id,
          applicantName: `${applicant.name} ${applicant.surname}`,
          amount: amount,
          description: description,
          type: 'INVOICE',
          status: 'PENDING',
          date: new Date(),
          reference: `REF-${Math.floor(Math.random() * 10000)}`
      };
      
      setTransactions([newInv, ...transactions]);
      setCreateInvoiceOpen(false);
      setViewingDocument({ type: 'INVOICE', tx: newInv }); 
  };

  const handleVerifyPayment = (id: string) => {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'VERIFIED' } : t));
  };

  const handleShareDocument = () => {
      alert("Document link has been sent to the customer's portal and email.");
  };

  const handleDownloadPDF = () => {
      alert("Downloading PDF... (Simulation)");
  };

  // User Management Handlers
  const handleTogglePassword = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddStaff = async () => {
    if(!newUser.name || !newUser.email || !newUser.designation) return;
    
    const staff: Staff = {
        id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as any || 'AGENT',
        designation: newUser.designation,
        password: newUser.password || generateRandomPassword(),
        status: 'ACTIVE',
        joinedDate: new Date().toISOString().split('T')[0]
    };
    
    // Sync to ClickUp
    setIsSyncing(true);
    await syncUserToClickUp(staff);
    setIsSyncing(false);

    setStaffMembers([...staffMembers, staff]);
    setIsAddUserOpen(false);
    setNewUser({ role: 'AGENT', status: 'ACTIVE' });
  };

  const handleEditUserSave = () => {
      if (!editingUser) return;
      
      if (editingUser.type === 'STAFF') {
          setStaffMembers(prev => prev.map(s => s.id === editingUser.data.id ? editingUser.data : s));
      } else {
          // Update customer
          updateApplicant(editingUser.data);
      }
      setEditingUser(null);
  };

  // --- Views ---

  const SyncLoadingToast = () => (
      isSyncing ? (
        <div className="fixed top-6 right-6 bg-slate-900/90 backdrop-blur text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 z-[100] animate-in slide-in-from-top-4">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <div>
            <p className="font-bold text-sm">Syncing to ClickUp</p>
            <p className="text-xs text-slate-400">Updating external database...</p>
          </div>
        </div>
      ) : null
  );

  const CreateInvoiceModal = () => {
    if (!isCreateInvoiceOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-heading font-bold text-xl text-slate-900">Create New Invoice</h3>
                    <button onClick={() => setCreateInvoiceOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Select Applicant</label>
                        <select name="applicantId" required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                            <option value="">Select...</option>
                            {applicants.map(a => (
                                <option key={a.id} value={a.id}>{a.name} {a.surname} ({a.id})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                        <input name="description" required type="text" placeholder="e.g. Visa Processing Fee" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Amount (€)</label>
                            <input name="amount" required type="number" min="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                            <input name="dueDate" required type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4 hover:bg-blue-700 transition-colors">
                        Generate Invoice
                    </button>
                </form>
            </div>
        </div>
    );
  };

  const DocumentViewerModal = () => {
    if (!viewingDocument) return null;
    const { tx, type } = viewingDocument;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${type === 'INVOICE' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {type === 'INVOICE' ? <FileText className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{type === 'INVOICE' ? 'Tax Invoice' : 'Payment Receipt'}</h3>
                            <p className="text-xs text-slate-500 font-mono">{tx.reference}</p>
                        </div>
                    </div>
                    <button onClick={() => setViewingDocument(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex-1 p-8 overflow-y-auto bg-slate-100 flex justify-center">
                    <div className="bg-white w-full max-w-md shadow-sm border border-slate-200 p-8 text-sm">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h1 className="font-heading font-bold text-2xl text-slate-900">EuroVisa</h1>
                                <p className="text-slate-500 text-xs mt-1">Immigration Services</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-900 uppercase tracking-wider text-xs">{type}</p>
                                <p className="text-slate-500 text-xs mt-1">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        <div className="border-t border-b border-slate-100 py-4 mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-slate-500">Billed To:</span>
                                <span className="font-bold text-slate-900">{tx.applicantName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Applicant ID:</span>
                                <span className="font-mono text-slate-900">{tx.applicantId}</span>
                            </div>
                        </div>

                        <div className="mb-8">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                        <th className="py-2">Description</th>
                                        <th className="py-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-4 font-medium text-slate-900">{tx.description || 'Consultation Services'}</td>
                                        <td className="py-4 text-right font-mono">€{tx.amount.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td className="py-4 font-bold text-slate-900 text-right">Total</td>
                                        <td className="py-4 text-right font-bold text-slate-900 text-lg">€{tx.amount.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="text-center text-xs text-slate-400 mt-12">
                            <p>Thank you for choosing EuroVisa.</p>
                            <p>This is a computer-generated document.</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                    <button onClick={handleShareDocument} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50 flex items-center gap-2">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button onClick={handleDownloadPDF} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
  };

  const VerificationQueue = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-2xl font-heading font-bold text-slate-900">Applicant Queue</h3>
                <p className="text-slate-500 text-sm">Review and process visa applications.</p>
            </div>
            <div className="flex items-center gap-3">
                 <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search applicant..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Needs Attention
                 </button>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Applicant</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Destination</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Progress</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {(applicants || []).map(app => (
                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-bold text-slate-900">{app.name} {app.surname}</div>
                                <div className="text-xs text-slate-500">{app.id}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">
                                    {countries.find(c => c.id === app.countryId)?.name}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="w-32 bg-slate-100 rounded-full h-1.5 mb-1 overflow-hidden">
                                    <div className="bg-emerald-500 h-full" style={{ width: `${(app.progressStep / (countries.find(c => c.id === app.countryId)?.timeline.length || 10)) * 100}%` }}></div>
                                </div>
                                <span className="text-xs text-slate-400 font-mono">Step {app.progressStep}</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                    app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                    'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${app.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                    {app.status === 'APPROVED' ? 'Approved' : 'Pending Review'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={() => setReviewApplicant(app)}
                                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                                >
                                    Review
                                </button>
                            </td>
                        </tr>
                    ))}
                    {(applicants || []).length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No applicants found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );

  const FinanceView = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h3 className="text-2xl font-heading font-bold text-slate-900">Finance & Billing</h3>
                <p className="text-slate-500 text-sm">Manage invoices and track payments.</p>
            </div>
            <button 
                onClick={() => setCreateInvoiceOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
                <Plus className="w-4 h-4" /> Create Invoice
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-500">Total Revenue</span>
                </div>
                <div className="text-2xl font-mono font-bold text-slate-900">
                    €{transactions.filter(t => t.status === 'VERIFIED' || t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Receipt className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-500">Pending Invoices</span>
                </div>
                <div className="text-2xl font-mono font-bold text-slate-900">
                    €{transactions.filter(t => t.status === 'PENDING').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <Users className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-500">Active Payers</span>
                </div>
                <div className="text-2xl font-mono font-bold text-slate-900">
                    {new Set(transactions.map(t => t.applicantId)).size}
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Reference</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Applicant</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{tx.reference}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">{tx.applicantName}</td>
                            <td className="px-6 py-4 font-mono text-slate-900">€{tx.amount.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{tx.date.toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                    tx.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    tx.status === 'PAID' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                    {tx.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                <button 
                                    onClick={() => setViewingDocument({ type: 'INVOICE', tx })}
                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                                    title="View Invoice"
                                >
                                    <FileText className="w-4 h-4" />
                                </button>
                                {tx.status === 'PENDING' && (
                                    <button 
                                        onClick={() => handleVerifyPayment(tx.id)}
                                        className="p-2 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"
                                        title="Mark Verified"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  const UserManagement = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-2xl font-heading font-bold text-slate-900">User Management</h3>
                <p className="text-slate-500 text-sm">Manage staff access and customer credentials.</p>
            </div>
            <button 
                onClick={() => setIsAddUserOpen(true)}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2"
            >
                <Plus className="w-4 h-4" /> Add Staff Member
            </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ID</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Designation</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Password</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {/* Staff Members */}
                        {staffMembers.map(staff => (
                            <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {staff.name.charAt(0)}
                                        </div>
                                        {staff.name}
                                    </div>
                                    <div className="text-xs text-slate-500 pl-10">{staff.email}</div>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-500 font-bold">{staff.id}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                        staff.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                    }`}>
                                        {staff.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-700">{staff.designation}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type={showPasswordMap[staff.id] ? 'text' : 'password'} 
                                            value={staff.password} 
                                            readOnly 
                                            className="bg-transparent border-none text-sm w-24 text-slate-600 focus:ring-0" 
                                        />
                                        <button onClick={() => handleTogglePassword(staff.id)} className="text-slate-400 hover:text-blue-600">
                                            {showPasswordMap[staff.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => setEditingUser({ type: 'STAFF', data: staff })} className="text-slate-400 hover:text-blue-600">
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        
                        {/* Customers (Applicants) */}
                        {applicants.map(app => (
                            <tr key={app.id} className="hover:bg-slate-50 transition-colors bg-slate-50/30">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                                            {app.name.charAt(0)}
                                        </div>
                                        {app.name} {app.surname}
                                    </div>
                                    <div className="text-xs text-slate-500 pl-10">{app.email}</div>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-500 font-bold">{app.id}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-100">
                                        CUSTOMER
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-700">{app.profession || 'Applicant'}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type={showPasswordMap[app.id] ? 'text' : 'password'} 
                                            value={app.password || '******'} 
                                            readOnly 
                                            className="bg-transparent border-none text-sm w-24 text-slate-600 focus:ring-0" 
                                        />
                                        <button onClick={() => handleTogglePassword(app.id)} className="text-slate-400 hover:text-blue-600">
                                            {showPasswordMap[app.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                     <button onClick={() => setEditingUser({ type: 'CUSTOMER', data: app })} className="text-slate-400 hover:text-blue-600">
                                        <UserCog className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Add Staff Modal */}
        {isAddUserOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-heading font-bold text-xl text-slate-900">Add Staff Member</h3>
                        <button onClick={() => setIsAddUserOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                                value={newUser.name || ''}
                                onChange={e => setNewUser({...newUser, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                            <input 
                                type="email" 
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                                value={newUser.email || ''}
                                onChange={e => setNewUser({...newUser, email: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                                <select 
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                                    value={newUser.role}
                                    onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                                >
                                    <option value="AGENT">Agent</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="MANAGER">Manager</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Sales"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                                    value={newUser.designation || ''}
                                    onChange={e => setNewUser({...newUser, designation: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                                    value={newUser.password || ''}
                                    placeholder="Leave blank to auto-generate"
                                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                                />
                                <button 
                                    onClick={() => setNewUser({...newUser, password: generateRandomPassword()})}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600"
                                    title="Generate"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <button onClick={handleAddStaff} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold mt-4">Create Account</button>
                    </div>
                </div>
            </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-heading font-bold text-xl text-slate-900">Edit User: {editingUser.data.name}</h3>
                        <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Designation / Profession</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                                value={editingUser.type === 'STAFF' ? editingUser.data.designation : editingUser.data.profession}
                                onChange={e => {
                                    if(editingUser.type === 'STAFF') {
                                        setEditingUser({ ...editingUser, data: { ...editingUser.data, designation: e.target.value } });
                                    } else {
                                        setEditingUser({ ...editingUser, data: { ...editingUser.data, profession: e.target.value } });
                                    }
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                                value={editingUser.data.password}
                                onChange={e => setEditingUser({ ...editingUser, data: { ...editingUser.data, password: e.target.value } })}
                            />
                        </div>
                         <button onClick={handleEditUserSave} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4">Save Changes</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  const CountryManager = () => (
    <div className="space-y-8">
       {/* Header */}
       <div className="flex justify-between items-center">
            <div>
                <h3 className="text-2xl font-heading font-bold text-slate-900">Country Configuration</h3>
                <p className="text-slate-500 text-sm">Manage visa pricing, timelines, and document requirements.</p>
            </div>
            <button 
                onClick={handleAddCountry}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
            >
                <Plus className="w-4 h-4" /> Add Destination
            </button>
        </div>

       {/* Country Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {countries.map(country => (
              <div key={country.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  
                  <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl">
                             {country.name === 'Sweden' ? '🇸🇪' : country.name === 'Finland' ? '🇫🇮' : '🇷🇸'}
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-900 text-lg">{country.name}</h4>
                              <p className="text-xs text-slate-500 font-medium">{country.visaType}</p>
                          </div>
                      </div>

                      <div className="space-y-3 mb-6">
                          <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Base Price</span>
                              <span className="font-bold text-slate-900">€{country.basePrice}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-slate-500">VAT</span>
                              <span className="font-bold text-slate-900">{country.vat}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Timeline Steps</span>
                              <span className="font-bold text-slate-900">{country.timeline.length} Steps</span>
                          </div>
                      </div>

                      <button 
                        onClick={() => setEditingCountry(country)}
                        className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                          <Settings className="w-4 h-4" /> Configure
                      </button>
                  </div>
              </div>
          ))}
       </div>

       {/* Edit Modal/Drawer */}
       {editingCountry && (
           <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
                <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur z-20">
                        <h3 className="font-bold text-xl text-slate-900">Edit {editingCountry.name}</h3>
                        <button onClick={() => setEditingCountry(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                    </div>

                    <form onSubmit={handleSaveCountry} className="p-8 space-y-8">
                         {/* General Section */}
                         <section>
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Globe className="w-4 h-4" /> General Info
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Country Name</label>
                                    <input 
                                        type="text" 
                                        value={editingCountry.name}
                                        onChange={e => setEditingCountry({...editingCountry, name: e.target.value})}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-sm text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Visa Type Name</label>
                                    <input 
                                        type="text" 
                                        value={editingCountry.visaType}
                                        onChange={e => setEditingCountry({...editingCountry, visaType: e.target.value})}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-sm text-slate-900"
                                    />
                                </div>
                            </div>
                         </section>

                         <hr className="border-slate-100" />

                         {/* Financials Section */}
                         <section>
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Financials
                            </h4>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Base Price (€)</label>
                                    <input 
                                        type="number" 
                                        value={editingCountry.basePrice}
                                        onChange={e => setEditingCountry({...editingCountry, basePrice: Number(e.target.value)})}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Reg Fee (€)</label>
                                    <input 
                                        type="number" 
                                        value={editingCountry.regFee}
                                        onChange={e => setEditingCountry({...editingCountry, regFee: Number(e.target.value)})}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">VAT (%)</label>
                                    <input 
                                        type="number" 
                                        value={editingCountry.vat}
                                        onChange={e => setEditingCountry({...editingCountry, vat: Number(e.target.value)})}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-900"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-lg border border-purple-100">
                                <input 
                                    type="checkbox" 
                                    id="allowInstallments"
                                    checked={editingCountry.allowInstallments}
                                    onChange={e => setEditingCountry({...editingCountry, allowInstallments: e.target.checked})}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                                />
                                <label htmlFor="allowInstallments" className="text-sm font-bold text-purple-900">Allow Split Installment Payments</label>
                            </div>
                         </section>

                         <hr className="border-slate-100" />

                         {/* Discounts Section */}
                         <section>
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Percent className="w-4 h-4" /> Discounts Configuration
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Payment (%)</label>
                                    <input type="number" value={editingCountry.discountFull} onChange={e => setEditingCountry({...editingCountry, discountFull: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Couple Application (%)</label>
                                    <input type="number" value={editingCountry.discountCouple} onChange={e => setEditingCountry({...editingCountry, discountCouple: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Reference (%)</label>
                                    <input type="number" value={editingCountry.discountReference} onChange={e => setEditingCountry({...editingCountry, discountReference: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Group (3+) (%)</label>
                                    <input type="number" value={editingCountry.discountGroup} onChange={e => setEditingCountry({...editingCountry, discountGroup: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Skilled Special (%)</label>
                                    <input type="number" value={editingCountry.discountSkilled} onChange={e => setEditingCountry({...editingCountry, discountSkilled: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Custom Promo (%)</label>
                                    <input type="number" value={editingCountry.discountCustom} onChange={e => setEditingCountry({...editingCountry, discountCustom: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900" />
                                </div>
                            </div>
                         </section>

                         <hr className="border-slate-100" />

                         {/* Documents Section */}
                         <section>
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Required Documents
                            </h4>
                            <div className="space-y-4">
                                <div>
                                     <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        Registration Stage (CSV)
                                     </label>
                                     <textarea 
                                        value={(editingCountry.docsAppStage || []).join(', ')}
                                        onChange={e => setEditingCountry({...editingCountry, docsAppStage: e.target.value.split(',').map(s => s.trim())})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-20 resize-none"
                                        placeholder="Passport, CV, ..."
                                     />
                                </div>
                                <div>
                                     <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
                                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                        Embassy Stage (CSV)
                                     </label>
                                     <textarea 
                                        value={(editingCountry.docsEmbassyStage || []).join(', ')}
                                        onChange={e => setEditingCountry({...editingCountry, docsEmbassyStage: e.target.value.split(',').map(s => s.trim())})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-20 resize-none"
                                        placeholder="Bank Statement, Insurance, ..."
                                     />
                                </div>
                            </div>
                         </section>

                         <hr className="border-slate-100" />

                         {/* Timeline Section */}
                         <section>
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Timeline Configuration
                            </h4>
                            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                                {editingCountry.timeline.map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm group">
                                        <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-full text-xs font-bold text-slate-500">{idx + 1}</span>
                                        <span className="flex-1 text-sm font-medium text-slate-700">{step}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={() => moveTimelineStep(idx, 'up')} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600"><ArrowUp className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => moveTimelineStep(idx, 'down')} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600"><ArrowDown className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => removeTimelineStep(step)} className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex gap-2 mt-4 pt-2 border-t border-slate-200">
                                    <input 
                                        type="text" 
                                        value={customStepInput}
                                        onChange={e => setCustomStepInput(e.target.value)}
                                        placeholder="Add new timeline step..."
                                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900"
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomStep())}
                                    />
                                    <button type="button" onClick={handleAddCustomStep} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold">Add</button>
                                </div>
                            </div>
                         </section>

                         <div className="sticky bottom-0 bg-white pt-4 pb-8 border-t border-slate-100 mt-8 flex gap-4">
                             <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all">
                                 Save Changes
                             </button>
                             <button type="button" onClick={() => setEditingCountry(null)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                                 Cancel
                             </button>
                         </div>
                    </form>
                </div>
           </div>
       )}
    </div>
  );

  const ProfileCreation = () => (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
            <div>
                <h3 className="text-2xl font-heading font-bold text-slate-900">New Application</h3>
                <p className="text-slate-500 text-sm">Register a new applicant and configure their payment plan.</p>
            </div>
             <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm">
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Generated ID</p>
                    <p className="font-mono font-bold text-slate-900">{newProfile.generatedId}</p>
                </div>
                <div className="h-8 w-px bg-slate-100"></div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Password</p>
                    <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-slate-900 tracking-wider">••••••</p>
                        <button onClick={() => navigator.clipboard.writeText(newProfile.password)} className="text-blue-600 hover:text-blue-700"><Copy className="w-3 h-3" /></button>
                    </div>
                </div>
            </div>
        </div>

        <form onSubmit={handleCreateProfile} className="grid grid-cols-12 gap-8">
            {/* Left Column: Personal & Application Data */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
                {/* Personal Details Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <User className="w-4 h-4" /> Personal Information
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                            <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={newProfile.name} onChange={e => setNewProfile({...newProfile, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Surname</label>
                            <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={newProfile.surname} onChange={e => setNewProfile({...newProfile, surname: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                            <input required type="email" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={newProfile.email} onChange={e => setNewProfile({...newProfile, email: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                            <input required type="tel" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={newProfile.mobile} onChange={e => setNewProfile({...newProfile, mobile: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                            <input required type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={newProfile.dob} onChange={e => setNewProfile({...newProfile, dob: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Calculated Age</label>
                            <input type="text" disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-bold" 
                                value={calculatedAge > 0 ? `${calculatedAge} Years` : '-'} />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Nationality</label>
                            <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={newProfile.nationality} onChange={e => setNewProfile({...newProfile, nationality: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Profession</label>
                            <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={newProfile.profession} onChange={e => setNewProfile({...newProfile, profession: e.target.value})} />
                        </div>
                    </div>
                </div>
                
                 {/* Destination Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Application Details
                    </h4>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                             <label className="block text-xs font-bold text-slate-700 mb-1">Destination Country</label>
                             <div className="grid grid-cols-3 gap-4">
                                {countries.map(country => (
                                    <div 
                                        key={country.id}
                                        onClick={() => setNewProfile({...newProfile, countryId: country.id})}
                                        className={`cursor-pointer rounded-xl border p-4 transition-all flex items-center gap-3 ${
                                            newProfile.countryId === country.id 
                                            ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-lg">
                                             {country.name === 'Sweden' ? '🇸🇪' : country.name === 'Finland' ? '🇫🇮' : '🇷🇸'}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-bold text-sm ${newProfile.countryId === country.id ? 'text-blue-700' : 'text-slate-700'}`}>{country.name}</p>
                                            <p className="text-[10px] text-slate-500">{country.visaType}</p>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>

                        {selectedCountryForProfile && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Discount Profile</label>
                                    <select 
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                        value={newProfile.discountType}
                                        onChange={e => setNewProfile({...newProfile, discountType: e.target.value as any})}
                                    >
                                        <option value="Standard">Standard (No Profile Discount)</option>
                                        <option value="Couple">Couple Application (-{selectedCountryForProfile.discountCouple}%)</option>
                                        <option value="Reference">Reference (-{selectedCountryForProfile.discountReference}%)</option>
                                        <option value="Group">Group 3+ (-{selectedCountryForProfile.discountGroup}%)</option>
                                        <option value="Skilled">Skilled Worker (-{selectedCountryForProfile.discountSkilled}%)</option>
                                        <option value="Custom">Custom Promo (-{selectedCountryForProfile.discountCustom}%)</option>
                                    </select>
                                </div>
                                <div>
                                     <label className="block text-xs font-bold text-slate-700 mb-1">Payment Plan</label>
                                     <select 
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                        value={newProfile.paymentMode}
                                        onChange={e => setNewProfile({...newProfile, paymentMode: e.target.value})}
                                    >
                                        {availablePaymentOptions.map(opt => (
                                            <option key={opt.id} value={opt.name}>{opt.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                     </div>
                </div>
            </div>

            {/* Right Column: Financial Summary */}
             <div className="col-span-12 lg:col-span-4 space-y-8">
                 <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-2xl sticky top-24">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Wallet className="w-4 h-4" /> Payment Breakdown
                    </h4>
                    
                    {selectedCountryForProfile && selectedPaymentDetails ? (
                        <div className="space-y-6">
                            <div className="space-y-2 pb-4 border-b border-white/10">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Base Visa Fee</span>
                                    <span className="font-mono">€{selectedCountryForProfile.basePrice}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-emerald-400">Profile Discount</span>
                                    <span className="font-mono text-emerald-400">
                                        -{newProfile.discountType !== 'Standard' 
                                            ? `${selectedCountryForProfile[`discount${newProfile.discountType}` as keyof Country]}%` 
                                            : '0%'}
                                    </span>
                                </div>
                                 <div className="flex justify-between text-sm">
                                    <span className="text-blue-400">Plan Adjustment</span>
                                    <span className="font-mono text-blue-400">
                                        {selectedPaymentDetails.id === 1 ? '-10% (Full Pay)' : 
                                         selectedPaymentDetails.id === 2 ? '+10% (2-Part)' : 
                                         selectedPaymentDetails.id === 3 ? '+15% (3-Part)' : '+20% (4-Part)'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">VAT ({selectedCountryForProfile.vat}%)</span>
                                    <span className="font-mono">Included</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Registration Fee</span>
                                    <span className="font-mono">€{selectedCountryForProfile.regFee}</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-lg font-bold">Total Contract</span>
                                    <span className="text-2xl font-bold font-mono">€{Math.round(selectedPaymentDetails.total).toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-slate-500">{selectedPaymentDetails.breakdown}</p>
                            </div>

                            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Installment Schedule</p>
                                {editableInstallments.map((inst, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div>
                                            <span className="text-white block">{inst.name}</span>
                                            <span className="text-slate-500 text-xs">{inst.dueDate}</span>
                                        </div>
                                        <span className="font-mono font-bold">€{Math.round(inst.amount).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2">
                                <Check className="w-5 h-5" /> Confirm & Create Profile
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <p>Select a country to view pricing.</p>
                        </div>
                    )}
                 </div>
             </div>
        </form>
    </div>
  );

  // --- Main Render Layout ---

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
       {/* Sidebar */}
       <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-30">
          <div className="h-20 flex items-center px-6 border-b border-white/10">
              <span className="font-heading font-bold text-xl tracking-tight">EuroVisa Admin</span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <button 
                onClick={() => setActiveTab('VERIFICATION')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'VERIFICATION' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="font-medium text-sm">Dashboard</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('COUNTRIES')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'COUNTRIES' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                  <Globe className="w-5 h-5" />
                  <span className="font-medium text-sm">Countries</span>
              </button>

              <button 
                onClick={() => setActiveTab('PROFILE_CREATION')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'PROFILE_CREATION' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                  <UserPlus className="w-5 h-5" />
                  <span className="font-medium text-sm">New Profile</span>
              </button>

              <button 
                onClick={() => setActiveTab('FINANCE')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'FINANCE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                  <Wallet className="w-5 h-5" />
                  <span className="font-medium text-sm">Finance</span>
              </button>

              <button 
                onClick={() => setActiveTab('USERS')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'USERS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                  <Users className="w-5 h-5" />
                  <span className="font-medium text-sm">Users & Staff</span>
              </button>
          </nav>

          <div className="p-4 border-t border-white/10">
              <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium text-sm">Log Out</span>
              </button>
          </div>
       </aside>

       {/* Main Content Area */}
       <div className="flex-1 flex flex-col ml-64 h-screen overflow-hidden">
          <header className="h-20 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
              <h2 className="text-xl font-heading font-bold text-slate-800">
                  {activeTab === 'VERIFICATION' && 'Verification Dashboard'}
                  {activeTab === 'COUNTRIES' && 'Country Manager'}
                  {activeTab === 'PROFILE_CREATION' && 'Applicant Registration'}
                  {activeTab === 'FINANCE' && 'Financial Overview'}
                  {activeTab === 'USERS' && 'User Management'}
              </h2>
              <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">A</div>
              </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
              {activeTab === 'VERIFICATION' && <VerificationQueue />}
              {activeTab === 'COUNTRIES' && <CountryManager />}
              {activeTab === 'PROFILE_CREATION' && <ProfileCreation />}
              {activeTab === 'FINANCE' && <FinanceView />}
              {activeTab === 'USERS' && <UserManagement />}
          </main>
       </div>

      {/* Review Modal */}
      {reviewApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-6xl h-[85vh] flex overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                  {/* Left: Document Preview (Mock) */}
                  <div className="w-2/3 bg-slate-100 flex flex-col items-center justify-center border-r border-gray-200 relative">
                      <div className="text-center">
                          <FileCheck className="w-20 h-20 text-slate-300 mx-auto mb-6" />
                          <p className="text-slate-600 font-bold text-lg">Document Previewer</p>
                          <p className="text-sm text-slate-400 mt-1">Securely loading PDF from server...</p>
                      </div>
                      <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-xs font-mono text-slate-600 shadow-sm border border-white/20">
                          ID: {reviewApplicant.id}
                      </div>
                  </div>

                  {/* Right: Checklist & Actions */}
                  <div className="w-1/3 flex flex-col bg-white">
                      <div className="p-8 border-b border-gray-100">
                          <h3 className="font-heading font-bold text-2xl text-gray-900">{reviewApplicant.name} {reviewApplicant.surname}</h3>
                          <div className="flex flex-col gap-1 mt-2">
                             <span className="text-sm font-medium text-gray-500">Applying for: {reviewApplicant.profession}</span>
                             <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">{countries.find(c => c.id === reviewApplicant.countryId)?.name}</span>
                          </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-8 space-y-6">
                          <div>
                              <div className="mb-6">
                                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Manual Status Update</label>
                                  <select 
                                    value={reviewApplicant.progressStep - 1} 
                                    onChange={(e) => handleStatusChange(parseInt(e.target.value))}
                                    className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                      {(countries.find(c => c.id === reviewApplicant.countryId)?.timeline || []).map((step, idx) => (
                                          <option key={idx} value={idx}>{idx + 1}. {step}</option>
                                      ))}
                                  </select>
                              </div>

                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Verification Checklist</h4>
                              <div className="space-y-3">
                                  {Object.entries(reviewApplicant.documents).map(([docName, val]) => {
                                      const docState = val as DocumentState;
                                      return (
                                      <div key={docName} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 group hover:border-blue-200 transition-colors">
                                          <div className="flex items-center gap-4">
                                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${docState.status === 'AI_VERIFIED' ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-400'}`}>
                                                  {docState.status === 'AI_VERIFIED' ? <Sparkles className="w-4 h-4"/> : <div className="w-2 h-2 bg-gray-400 rounded-full"></div>}
                                              </div>
                                              <div>
                                                  <span className="text-sm font-bold text-gray-700 block">{docName}</span>
                                                  <span className="text-[10px] text-gray-400 font-mono">{docState.fileName || 'No file'}</span>
                                              </div>
                                          </div>
                                          {docState.status === 'AI_VERIFIED' && <BadgeCheck className="w-5 h-5 text-purple-500" />}
                                      </div>
                                  )})}
                              </div>
                          </div>
                      </div>

                      <div className="p-8 bg-gray-50 border-t border-gray-100 space-y-3">
                          <button 
                            onClick={handleApproveApplicant}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all flex justify-center items-center gap-2"
                          >
                             <Check className="w-5 h-5" /> Approve & Sync ClickUp
                          </button>
                          <button 
                            onClick={() => setReviewApplicant(null)}
                            className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                          >
                             Close
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Sync Loader */}
      <SyncLoadingToast />

      {/* Invoice Creator Modal */}
      <CreateInvoiceModal />

      {/* Document Viewer Modal */}
      <DocumentViewerModal />

    </div>
  );
};