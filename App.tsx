import React, { useState } from 'react';
import { INITIAL_COUNTRIES, INITIAL_APPLICANTS, MOCK_APPLICANT_ID } from './constants';
import { Role, Country, Applicant, Notification } from './types';
import { CustomerPortal } from './components/CustomerPortal';
import { AdminPanel } from './components/AdminPanel';
import { Loader2, ArrowRight, ShieldCheck, User, Globe2, CheckCircle2, ChevronDown, LogIn } from 'lucide-react';

export default function App() {
  // --- Global State ---
  const [activeRole, setActiveRole] = useState<Role>('GUEST');
  const [countries, setCountries] = useState<Country[]>(INITIAL_COUNTRIES);
  const [applicants, setApplicants] = useState<Applicant[]>(INITIAL_APPLICANTS);
  const [currentApplicantId, setCurrentApplicantId] = useState<string>(MOCK_APPLICANT_ID);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedLoginUser, setSelectedLoginUser] = useState<string>('');

  // --- Actions ---

  const handleUpdateApplicant = (updated: Applicant) => {
    const oldApp = applicants.find(a => a.id === updated.id);
    if (oldApp) {
        Object.keys(updated.documents).forEach(docKey => {
            if (oldApp.documents[docKey]?.status !== 'AI_VERIFIED' && updated.documents[docKey]?.status === 'AI_VERIFIED') {
                addNotification(`AI Verified: ${docKey}`, `Gemini has successfully scanned and verified your ${docKey}.`);
            }
        });
    }

    setApplicants(prev => prev.map(app => app.id === updated.id ? updated : app));
  };

  const handleAddApplicant = (newApplicant: Applicant) => {
      setApplicants(prev => [newApplicant, ...prev]);
      addNotification("New Profile Created", `Applicant ${newApplicant.name} has been registered.`);
  };

  const addNotification = (title: string, message: string) => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      title,
      message,
      type: 'INFO',
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const triggerClickUpSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
        setIsSyncing(false);
        addNotification("Application Approved", "Your documents have been approved by an admin. We are preparing for the Embassy.");
    }, 2500);
  };

  const handleCustomerLogin = () => {
      if (selectedLoginUser) {
          setCurrentApplicantId(selectedLoginUser);
          setActiveRole('CUSTOMER');
      }
  };

  // --- Views ---

  const LoginView = () => (
    <div className="min-h-screen flex bg-white">
        {/* Left Side - Brand / Visual */}
        <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden flex-col justify-between p-12 text-white">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <Globe2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">EuroVisa Flow</span>
                </div>
            </div>

            <div className="relative z-10 max-w-lg">
                <h1 className="text-4xl font-heading font-bold mb-6 leading-tight">
                    Start your European journey with confidence.
                </h1>
                <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                    Our AI-powered platform streamlines your work visa application, handling document verification and embassy compliance in real-time.
                </p>
                <div className="flex gap-4 text-sm font-medium text-blue-200">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-400" /> AI Verification
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-400" /> Dynamic Pricing
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-400" /> 24/7 Tracking
                    </div>
                </div>
            </div>
            
            <div className="relative z-10 text-xs text-blue-300/60">
                © 2024 EuroVisa Inc. All rights reserved.
            </div>
        </div>

        {/* Right Side - Login Options */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center lg:text-left">
                    <h2 className="text-3xl font-heading font-bold text-slate-900">Welcome back</h2>
                    <p className="mt-2 text-slate-500">Please select your portal to continue.</p>
                </div>

                <div className="space-y-4">
                    {/* Customer Login Card */}
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm transition-all duration-300">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Customer Portal</h3>
                                <p className="text-sm text-slate-500">Log in with your created profile</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="relative">
                                <select 
                                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                    value={selectedLoginUser}
                                    onChange={(e) => setSelectedLoginUser(e.target.value)}
                                >
                                    <option value="">Select User Profile...</option>
                                    {applicants.map(app => (
                                        <option key={app.id} value={app.id}>
                                            {app.name} {app.surname} ({app.id})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            {selectedLoginUser && (
                                <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 font-mono border border-blue-100 flex flex-col gap-1">
                                    <div className="flex justify-between">
                                        <span className="font-bold opacity-60">Username:</span>
                                        <span>{applicants.find(a => a.id === selectedLoginUser)?.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold opacity-60">Password:</span>
                                        <span>••••••••••••</span>
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={handleCustomerLogin}
                                disabled={!selectedLoginUser}
                                className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                    selectedLoginUser 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30' 
                                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                }`}
                            >
                                <LogIn className="w-4 h-4" /> Secure Login
                            </button>
                        </div>
                    </div>

                    {/* Admin Login Card */}
                    <button 
                        onClick={() => setActiveRole('ADMIN')}
                        className="group w-full bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300 flex items-center justify-between text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Admin Console</h3>
                                <p className="text-sm text-slate-500">Manage countries & verify visas</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                    </button>
                </div>
                
                <div className="pt-8 border-t border-slate-200 text-center">
                    <p className="text-xs text-slate-400 font-medium">System Version 1.0.4 • Powered by Gemini AI</p>
                </div>
            </div>
        </div>
    </div>
  );

  // --- Sync Toast (Global) ---
  const SyncToast = () => (
      <div className={`fixed top-6 right-6 bg-slate-900/90 backdrop-blur text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 transform transition-all duration-500 z-[100] ${isSyncing ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
          <div className="relative">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <div className="absolute inset-0 bg-blue-400/20 blur-lg rounded-full animate-pulse"></div>
          </div>
          <div>
              <p className="font-bold text-sm">Syncing to ClickUp</p>
              <p className="text-xs text-slate-400">Processing approval...</p>
          </div>
      </div>
  );

  // --- Render ---

  if (activeRole === 'GUEST') return <LoginView />;

  return (
    <>
        {activeRole === 'ADMIN' && (
            <AdminPanel 
                countries={countries}
                setCountries={setCountries}
                applicants={applicants}
                updateApplicant={handleUpdateApplicant}
                addApplicant={handleAddApplicant}
                onLogout={() => setActiveRole('GUEST')}
                triggerSyncSimulation={triggerClickUpSync}
            />
        )}

        {activeRole === 'CUSTOMER' && (
            <CustomerPortal 
                countries={countries}
                applicant={applicants.find(a => a.id === currentApplicantId) || applicants[0]}
                notifications={notifications}
                updateApplicant={handleUpdateApplicant}
                markNotificationsRead={() => setNotifications(prev => prev.map(n => ({...n, read: true})))}
                onLogout={() => setActiveRole('GUEST')}
            />
        )}
        <SyncToast />
    </>
  );
}