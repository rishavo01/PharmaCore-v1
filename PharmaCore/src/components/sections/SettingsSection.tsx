import React from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Globe, 
  Database, 
  CreditCard, 
  ChevronRight,
  Camera,
  LogOut
} from 'lucide-react';

const SettingsSection = () => {
  return (
    <div className="space-y-6 sm:space-y-8 px-0">
      {/* Header */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-headline text-on-surface tracking-tight">Settings</h1>
        <p className="text-on-surface-variant text-xs sm:text-sm font-medium">Configure your workspace and personal preferences.</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-surface-container shadow-sm flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant text-2xl sm:text-3xl font-bold border-4 border-white shadow-lg overflow-hidden">
            <img src="https://picsum.photos/seed/pharmacist/200/200" alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <button className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-primary text-on-primary rounded-full shadow-lg hover:scale-110 transition-transform">
            <Camera size={12} className="sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
        <div className="flex-1 text-center sm:text-left space-y-0.5 sm:space-y-1">
          <h2 className="text-lg sm:text-xl font-extrabold font-headline text-on-surface">Dr. Rishav Kumar</h2>
          <p className="text-[8px] sm:text-xs font-medium text-on-surface-variant uppercase tracking-widest">Chief Pharmacist • ID: PH-94210</p>
          <p className="text-[8px] sm:text-xs text-outline font-bold">rishav690999@gmail.com</p>
        </div>
        <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-surface-container-low text-on-surface-variant rounded-xl text-[8px] sm:text-xs font-bold hover:bg-surface-container transition-all flex items-center gap-2 flex-shrink-0 w-full sm:w-fit justify-center sm:justify-start">
          Edit Profile
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {[
          { icon: Shield, title: 'Security & Privacy', desc: 'Password, 2FA, and session management', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Bell, title: 'Notifications', desc: 'Manage stock alerts and order updates', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { icon: Globe, title: 'Regional Settings', desc: 'Currency, timezone, and language', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { icon: Database, title: 'Data Management', desc: 'Export logs, backups, and storage', color: 'text-amber-600', bg: 'bg-amber-50' },
          { icon: CreditCard, title: 'Billing & Plans', desc: 'Subscription details and payment methods', color: 'text-rose-600', bg: 'bg-rose-50' },
          { icon: User, title: 'Team Management', desc: 'Manage staff roles and permissions', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((item, i) => (
          <button key={i} className="bg-white p-4 sm:p-6 rounded-3xl border border-surface-container shadow-sm flex items-center gap-2 sm:gap-4 hover:border-primary/20 hover:shadow-md transition-all group text-left">
            <div className={`p-2.5 sm:p-3 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform flex-shrink-0`}>
              <item.icon size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[8px] sm:text-sm font-bold text-on-surface truncate">{item.title}</h4>
              <p className="text-[7px] sm:text-[10px] font-bold text-outline mt-0.5 line-clamp-1">{item.desc}</p>
            </div>
            <ChevronRight className="text-outline group-hover:translate-x-1 transition-transform flex-shrink-0 sm:w-5 sm:h-5" size={16} />
          </button>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50 p-4 sm:p-6 lg:p-8 rounded-3xl border border-rose-100 space-y-3 sm:space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold font-headline text-rose-900">Danger Zone</h3>
          <p className="text-[8px] sm:text-xs font-medium text-rose-700 mt-0.5 sm:mt-1">These actions are irreversible. Please proceed with caution.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-2">
          <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-rose-600 text-white rounded-xl text-[8px] sm:text-xs font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-fit">
            <LogOut size={14} className="sm:w-4 sm:h-4" />
            <span>Logout from all devices</span>
          </button>
          <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-[8px] sm:text-xs font-bold hover:bg-rose-50 transition-all w-full sm:w-fit">
            Deactivate Account
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center py-6 sm:py-8 space-y-1.5 sm:space-y-2">
        <p className="text-[8px] sm:text-[10px] font-bold text-outline uppercase tracking-[0.2em]">PharmaCore Enterprise v2.4.0</p>
        <p className="text-[8px] sm:text-[10px] font-bold text-outline uppercase tracking-[0.2em]">© 2026 PharmaCore Systems Inc.</p>
      </div>
    </div>
  );
};

export default SettingsSection;
