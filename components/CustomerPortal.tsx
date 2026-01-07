import React, { useState, useEffect } from 'react';
import { Country, Applicant, PricingOption, Notification, DocStatus } from '../types';
import { calculatePricingOptions } from '../utils/pricing';
import { 
  Bell, UploadCloud, CheckCircle2, Clock, FileText, Loader2, Sparkles, 
  AlertCircle, LogOut, ChevronDown, Shield, User, LayoutDashboard, 
  CreditCard, HelpCircle, FileCheck, ArrowUpRight, Search
} from 'lucide-react';

interface CustomerPortalProps {
  countries: Country[];
  applicant: Applicant;
  notifications: Notification[];
  updateApplicant: (updated: Applicant) => void;
  markNotificationsRead: () => void;
  onLogout: () => void;
}

type Tab = 'DASHBOARD' | 'DOCUMENTS' | 'PAYMENTS' | 'HELP';

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  countries,
  applicant,
  notifications,
  updateApplicant,
  markNotificationsRead,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [selectedCountryId, setSelectedCountryId] = useState<string>(applicant.countryId);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    setSelectedCountryId(applicant.countryId);
  }, [applicant.countryId]);

  const currentCountry = countries.find(c => c.id === selectedCountryId) || countries[0];
  const pricingOptions = calculatePricingOptions(currentCountry, applicant.selectedDiscountType);
  
  // Combine docs for Customer View to maintain compatibility
  const allRequiredDocs = [...(currentCountry.docsAppStage || []), ...(currentCountry.docsEmbassyStage || [])];
  
  const unreadCount = notifications.filter(n => !n.read).length;

  // Stats Logic
  const totalDocs = allRequiredDocs.length;
  const completedDocs = allRequiredDocs.filter(d => 
    applicant.documents[d]?.status === 'APPROVED' || applicant.documents[d]?.status === 'AI_VERIFIED'
  ).length;
  const progressPercent = totalDocs === 0 ? 0 : Math.round((completedDocs / totalDocs) * 100);

  // Timeline Steps
  const timelineSteps = currentCountry.timeline && currentCountry.timeline.length > 0 
    ? currentCountry.timeline 
    : ['Registration', 'Documents', 'Review', 'Approval']; // Fallback

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryId = e.target.value;
    setSelectedCountryId(newCountryId);
    
    const newCountry = countries.find(c => c.id === newCountryId);
    if (!newCountry) return;

    // Build new doc state based on new country requirements
    const newDocsState = { ...applicant.documents };
    const newDocsList = [...(newCountry.docsAppStage || []), ...(newCountry.docsEmbassyStage || [])];
    
    newDocsList.forEach(doc => {
      if (!newDocsState[doc]) {
        newDocsState[doc] = { status: 'MISSING' };
      }
    });

    updateApplicant({
      ...applicant,
      countryId: newCountryId,
      documents: newDocsState
    });
  };

  const handleFileUpload = (docName: string, file: File) => {
    const updatedDocs = {
      ...applicant.documents,
      [docName]: { 
        status: 'SCANNING' as DocStatus, 
        fileName: file.name,
        uploadedAt: new Date()
      }
    };
    
    updateApplicant({ ...applicant, documents: updatedDocs });

    setTimeout(() => {
      const aiVerifiedDocs = {
        ...applicant.documents,
        [docName]: { 
          status: 'AI_VERIFIED' as DocStatus, 
          fileName: file.name,
          uploadedAt: new Date()
        }
      };
      updateApplicant({ ...applicant, documents: aiVerifiedDocs });
    }, 2000);
  };

  const getStatusColor = (status: DocStatus) => {
    switch(status) {
        case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        case 'AI_VERIFIED': return 'bg-purple-50 text-purple-700 border-purple-100';
        case 'SCANNING': return 'bg-blue-50 text-blue-700 border-blue-100';
        case 'MISSING': return 'bg-slate-50 text-slate-500 border-slate-100';
        default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const NavItem = ({ tab, icon: Icon, label }: { tab: Tab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        activeTab === tab 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className={`w-5 h-5 ${activeTab === tab ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
      <span className="font-medium text-sm">{label}</span>
      {activeTab === tab && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
    </button>
  );

  const ArrowUpRightSmall = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M7 7h10v10"/></svg>;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col fixed h-full z-20">
         <div className="h-24 flex items-center px-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                   <Shield className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-heading font-bold text-xl text-slate-900 tracking-tight block leading-none">EuroVisa</span>
                  <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Portal</span>
                </div>
            </div>
         </div>
         
         <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2">Menu</div>
            <NavItem tab="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
            <NavItem tab="DOCUMENTS" icon={FileCheck} label="My Documents" />
            <NavItem tab="PAYMENTS" icon={CreditCard} label="Payments" />
            <NavItem tab="HELP" icon={HelpCircle} label="Help & Support" />
            
            <div className="mt-8">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700">AI Assistant Active</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                        Gemini AI is monitoring your uploads for compliance with {currentCountry.name} laws.
                    </p>
                </div>
            </div>
         </div>

         <div className="p-4 border-t border-slate-100">
            <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Log Out</span>
            </button>
         </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col lg:ml-72 transition-all duration-300">
        
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-8 flex justify-between items-center">
            <h2 className="text-xl font-heading font-bold text-slate-800">
                {activeTab === 'DASHBOARD' && 'Dashboard Overview'}
                {activeTab === 'DOCUMENTS' && 'Document Center'}
                {activeTab === 'PAYMENTS' && 'Billing & Plans'}
                {activeTab === 'HELP' && 'Support Center'}
            </h2>
            
            <div className="flex items-center gap-6">
                <div className="relative group">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
                    <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 rounded-full bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm w-64 transition-all outline-none" />
                </div>
                
                <div className="h-8 w-px bg-slate-200"></div>

                <div className="relative">
                    <button 
                    onClick={() => { setNotificationsOpen(!isNotificationsOpen); markNotificationsRead(); }}
                    className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative"
                    >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                    )}
                    </button>
                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                             <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-baseline">
                                <h4 className="font-bold text-slate-800 text-sm">Notifications</h4>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-6 text-center text-slate-400 text-xs">No new notifications</div>
                            ) : (
                                notifications.map(n => (
                                <div key={n.id} className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}>
                                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{n.timestamp.toLocaleTimeString()}</p>
                                </div>
                                ))
                            )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 pl-2">
                    <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {applicant.name.charAt(0)}
                    </div>
                </div>
            </div>
        </header>

        {/* Tab Content */}
        <main className="p-8 max-w-6xl mx-auto w-full">
            
            {/* DASHBOARD TAB */}
            {activeTab === 'DASHBOARD' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Welcome & Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                             <div className="relative z-10">
                                <h1 className="text-3xl font-heading font-bold mb-2">Welcome back, {applicant.name.split(' ')[0]}!</h1>
                                <p className="text-blue-100 mb-6 max-w-md">Your application for {currentCountry.name} is in progress. You have completed {completedDocs} out of {totalDocs} required steps.</p>
                                <button onClick={() => setActiveTab('DOCUMENTS')} className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg shadow-black/10 inline-flex items-center gap-2">
                                    Continue Uploading <ArrowUpRight className="w-4 h-4" />
                                </button>
                             </div>
                        </div>
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 className="text-slate-500 font-medium text-sm mb-1">Current Destination</h3>
                                <div className="relative">
                                    <select 
                                        value={selectedCountryId} 
                                        onChange={handleCountryChange}
                                        className="appearance-none w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer hover:bg-slate-100 transition-colors"
                                    >
                                        {countries.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                                    <span>Completion</span>
                                    <span>{progressPercent}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stepper */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-heading font-bold text-lg text-slate-900">Application Timeline</h3>
                            <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">Step {applicant.progressStep} of {timelineSteps.length}</span>
                        </div>
                        <div className="relative px-4">
                            <div className="absolute left-0 top-5 w-full h-0.5 bg-slate-100 -z-0"></div>
                            <div className="flex justify-between relative z-10 w-full overflow-x-auto pb-4 scrollbar-hide">
                                {timelineSteps.map((step, idx) => {
                                    const stepNum = idx + 1;
                                    const isCompleted = stepNum < applicant.progressStep;
                                    const isCurrent = stepNum === applicant.progressStep;
                                    
                                    return (
                                        <div key={step} className="flex flex-col items-center gap-3 min-w-[100px] flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border-4 transition-all duration-500 ${
                                                isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 
                                                isCurrent ? 'bg-white border-blue-600 text-blue-600 shadow-lg shadow-blue-500/20 scale-110' : 
                                                'bg-white border-slate-100 text-slate-300'
                                            }`}>
                                                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : stepNum}
                                            </div>
                                            <span className={`text-xs font-semibold uppercase tracking-wide text-center transition-colors ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>
                                                {step}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === 'DOCUMENTS' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-heading font-bold text-lg text-slate-900">Required Documents</h3>
                                <p className="text-sm text-slate-500 mt-1">Upload required files for {currentCountry.name} visa processing.</p>
                            </div>
                            <div className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
                                {currentCountry.visaType}
                            </div>
                        </div>
                        
                        <div className="divide-y divide-slate-50">
                            {allRequiredDocs.map((doc) => {
                                const docState = applicant.documents[doc] || { status: 'MISSING' };
                                const colorClass = getStatusColor(docState.status);
                                
                                return (
                                <div key={doc} className="px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors group">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-colors ${
                                            docState.status === 'MISSING' ? 'bg-slate-50 border-slate-200 text-slate-300' : 
                                            'bg-white border-transparent shadow-md'
                                        } ${docState.status === 'APPROVED' ? 'text-emerald-500' : docState.status === 'AI_VERIFIED' ? 'text-purple-500' : docState.status === 'SCANNING' ? 'text-blue-500' : ''}`}>
                                            {docState.status === 'SCANNING' ? <Loader2 className="w-7 h-7 animate-spin" /> : 
                                            docState.status === 'APPROVED' ? <CheckCircle2 className="w-7 h-7" /> :
                                            docState.status === 'AI_VERIFIED' ? <Sparkles className="w-7 h-7" /> :
                                            <FileText className="w-7 h-7" />}
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-slate-900">{doc}</p>
                                            <p className="text-sm text-slate-500 mt-0.5 font-medium">
                                            {docState.status === 'MISSING' ? 'Document required (PDF/JPG)' : docState.fileName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 self-end sm:self-auto">
                                        {docState.status !== 'MISSING' && (
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${colorClass} flex items-center gap-2`}>
                                                {docState.status === 'SCANNING' && 'Analyzing...'}
                                                {docState.status === 'AI_VERIFIED' && <><Sparkles className="w-3 h-3" /> AI Verified</>}
                                                {docState.status === 'APPROVED' && <><CheckCircle2 className="w-3 h-3" /> Approved</>}
                                            </span>
                                        )}

                                        {(docState.status === 'MISSING' || docState.status === 'REJECTED') && (
                                            <label className="cursor-pointer group/btn relative overflow-hidden inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-slate-900 hover:bg-blue-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/30">
                                            <span className="relative z-10 flex items-center gap-2">
                                                <UploadCloud className="w-4 h-4" />
                                                Upload File
                                            </span>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept=".pdf,.jpg,.png"
                                                onChange={(e) => {
                                                if (e.target.files?.[0]) handleFileUpload(doc, e.target.files[0]);
                                                }} 
                                            />
                                            </label>
                                        )}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === 'PAYMENTS' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
                        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-20"></div>

                        <div className="relative z-10 mb-8 flex justify-between items-end">
                            <div>
                                <h3 className="font-heading font-bold text-2xl mb-2">My Payment Schedule</h3>
                                <p className="text-slate-400 text-sm">Your selected plan: <span className="text-white font-bold">{applicant.paymentMode}</span></p>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Total Contract Value</span>
                                <span className="font-mono font-bold text-2xl">€{Math.round(applicant.financeData.totalAmount).toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                            <table className="w-full">
                                <thead className="bg-black/20 text-xs font-bold text-slate-400 uppercase">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Description</th>
                                        <th className="px-6 py-4 text-left">Due Date</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10 text-sm">
                                    {(applicant.installments || []).map((inst) => (
                                        <tr key={inst.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{inst.name}</td>
                                            <td className="px-6 py-4 text-slate-300 font-mono">{inst.dueDate}</td>
                                            <td className="px-6 py-4 text-right font-mono text-white font-bold">€{Math.round(inst.amount).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                    inst.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 
                                                    inst.status === 'OVERDUE' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                                    'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                                }`}>
                                                    {inst.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(applicant.installments || []).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No payment schedule found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="mt-6 flex justify-between items-center text-xs text-slate-400 relative z-10">
                            <p>Payments are securely processed via Deutsche Bank.</p>
                            <button className="text-white hover:text-blue-400 underline transition-colors">Download Full Invoice</button>
                        </div>
                    </div>
                </div>
            )}

            {/* HELP TAB */}
            {activeTab === 'HELP' && (
                <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 text-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6">
                            <HelpCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-heading font-bold text-slate-900 mb-2">How can we help?</h2>
                        <p className="text-slate-500 mb-8 max-w-lg mx-auto">Browse common questions or contact our support team for assistance with your visa application.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <div className="p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                                <h4 className="font-bold text-slate-800 mb-2">Document Verification</h4>
                                <p className="text-sm text-slate-500">Why was my document rejected? How long does AI check take?</p>
                            </div>
                            <div className="p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                                <h4 className="font-bold text-slate-800 mb-2">Payment Issues</h4>
                                <p className="text-sm text-slate-500">Refund policies, splitting payments, and invoice downloads.</p>
                            </div>
                            <div className="p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                                <h4 className="font-bold text-slate-800 mb-2">Embassy Process</h4>
                                <p className="text-sm text-slate-500">Scheduling interviews and preparing physical files.</p>
                            </div>
                            <div className="p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                                <h4 className="font-bold text-slate-800 mb-2">Contact Support</h4>
                                <p className="text-sm text-slate-500">Reach out to our 24/7 expert legal team directly.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </main>
      </div>
    </div>
  );
};