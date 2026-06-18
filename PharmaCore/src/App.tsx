import { 
  LayoutDashboard, 
  Package2, 
  ReceiptText, 
  CreditCard, 
  Truck, 
  BarChart3, 
  Settings, 
  Plus, 
  Search, 
  Bell, 
  CircleHelp,
  Menu,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

// --- Sections ---
import DashboardSection from './components/sections/DashboardSection';
import InventorySection from './components/sections/InventorySection';
import BillingSection from './components/sections/BillingSection';
import SalesSection from './components/sections/SalesSection';
import SuppliersSection from './components/sections/SuppliersSection';
import ReportsSection from './components/sections/ReportsSection';
import SettingsSection from './components/sections/SettingsSection';

// --- Components ---

interface SidebarItemProps {
  key?: string | number;
  icon: any;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function SidebarItem({ 
  icon: Icon, 
  label, 
  active = false, 
  onClick 
}: SidebarItemProps) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group Rs.{
        active 
          ? 'bg-white shadow-sm text-primary font-semibold' 
          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
      }`}
    >
      <Icon size={20} className={active ? 'text-primary' : 'text-outline group-hover:text-on-surface'} />
      <span className="text-sm">{label}</span>
    </button>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case 'Dashboard': return <DashboardSection />;
      case 'Inventory': return <InventorySection />;
      case 'Billing': return <BillingSection />;
      case 'Sales': return <SalesSection />;
      case 'Suppliers': return <SuppliersSection />;
      case 'Reports': return <ReportsSection />;
      case 'Settings': return <SettingsSection />;
      default: return <DashboardSection />;
    }
  };

  const navItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'Inventory', icon: Package2, label: 'Inventory' },
    { id: 'Billing', icon: ReceiptText, label: 'Billing' },
    { id: 'Sales', icon: CreditCard, label: 'Sales' },
    { id: 'Suppliers', icon: Truck, label: 'Suppliers' },
    { id: 'Reports', icon: BarChart3, label: 'Reports' },
    { id: 'Settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar - Desktop Fixed, Mobile Slide */}
     <aside
            className={`
              ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }
              lg:translate-x-0
              fixed lg:sticky
              lg:top-0
              left-0
              top-0
              h-screen
              w-64
              bg-surface-container-low
              border-r
              border-surface-container
              p-6
              flex
              flex-col
              z-40
              transition-transform
              duration-300
            `}
          >
        <div className="mb-10 px-2">
          <div className="text-2xl font-extrabold text-primary font-headline tracking-tight">PharmaCore</div>
          <div className="text-[10px] text-outline uppercase tracking-widest mt-1 font-bold">Pharmacy Management</div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <SidebarItem 
              key={item.id}
              icon={item.icon} 
              label={item.label} 
              active={activeSection === item.id}
              onClick={() => {
                setActiveSection(item.id);
                setSidebarOpen(false);
              }}
            />
          ))}
        </nav>

        {/* <div className="mt-auto">
          <button className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            <Plus size={20} />
            New Prescription
          </button>
        </div> */}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-surface-container flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Search Bar - Hide on mobile, show on tablet+ */}
          <div className="relative w-full lg:w-96 mx-4 lg:mx-0 group hidden sm:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" size={18} />
            <input 
              type="text" 
              placeholder="Search transactions, medicines, suppliers..." 
              className="w-full bg-surface-container-low border-none rounded-full py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>

          {/* Icon Group - Responsive */}
          <div className="flex items-center gap-3 lg:gap-6 ml-auto">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-surface-container rounded-full relative text-on-surface-variant transition-colors">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-tertiary rounded-full border-2 border-white"></span>
              </button>
              <button className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors hidden sm:block">
                <CircleHelp size={20} />
              </button>
            </div>
            <div className="h-8 w-px bg-surface-container hidden sm:block"></div>
            <div className="flex items-center gap-2 lg:gap-3 group cursor-pointer">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-on-surface font-headline leading-none">Dr. Sarah Miller</p>
                <p className="text-[10px] text-outline font-bold uppercase tracking-tighter mt-1">Chief Pharmacist</p>
              </div>
              <img 
                src="https://picsum.photos/seed/pharmacist/100/100" 
                alt="Sarah Miller" 
                className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-primary/10 group-hover:border-primary transition-all"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full overflow-y-auto">
          <div className="max-w-[1400px] mx-auto w-full">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderSection()}
            </motion.div>
          </div>
        </main>
      </div>

      {/* FAB */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-4 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center z-50 group"
      >
        <Plus size={24} className="sm:w-8 sm:h-8 group-hover:rotate-90 transition-transform duration-300" />
      </motion.button>
    </div>
  );
}
