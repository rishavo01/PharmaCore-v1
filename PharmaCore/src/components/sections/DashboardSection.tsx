import React, { useEffect, useState } from "react";
import api from "../../services/api.js";
import {
  Pill,
  AlertTriangle,
  Clock,
  TrendingUp,
  Download,
  Calendar as CalendarIcon,
  Edit3,
  X,
  Plus,
  Loader2,
  CheckCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  getDashboardSummary,
  getDashboardRevenue,
  getRecentActivity,
  getDashboardAlerts,
  exportDashboard,
  RecentActivity,
  PriorityAlert,
} from "../../services/dashboardService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalMeds: number;
  totalMedsDelta: number;
  lowStock: number;
  expiredSoon: number;
  todaySales: number;
  todaySalesDelta: number;
}
interface RevenueDay {
  day: string;
  value: number;
  isToday?: boolean;
}
interface StockMetrics {
  stockOptimization: number;
  fulfillmentRate: number;
  fulfillmentCleared: number;
  fulfillmentTotal: number;
}

const CATEGORIES = [
  "Analgesics",
  "Antibiotics",
  "Antifungals",
  "Antivirals",
  "Cardiovascular",
  "Dermatology",
  "Diabetes",
  "Gastroenterology",
  "Neurology",
  "Oncology",
  "Respiratory",
  "Vitamins & Supplements",
  "Other",
];
const UNITS = ["Tablet", "Capsule", "Syrup (ml)", "Injection (ml)", "Cream (g)", "Drops (ml)", "Patch", "Inhaler"];

// ─── Add Medicine Modal ───────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  genericName: "",
  category: "",
  manufacturer: "",
  batchNumber: "",
  unit: "Tablet",
  quantityInStock: "",
  reorderLevel: "",
  unitPrice: "",
  sellingPrice: "",
  expiryDate: "",
  description: "",
  requiresPrescription: false,
};

type FormState = typeof EMPTY_FORM;

const AddMedicineModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({
        ...f,
        [field]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value,
      }));

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.quantityInStock || !form.sellingPrice) {
      setError("Please fill in Name, Category, Stock Quantity, and Selling Price.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.post("/medicines", {
        name: form.name,
        category: form.category,
        quantity: Number(form.quantityInStock),
        buyPrice: Number(form.unitPrice) || 0,
        sellPrice: Number(form.sellingPrice),
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : new Date().toISOString(),
      });
      setDone(true);
      // Dispatch updates event
      window.dispatchEvent(new Event("salesUpdated"));
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to add medicine. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({
    label,
    field,
    type = "text",
    placeholder = "",
    required = false,
  }: {
    label: string;
    field: keyof FormState;
    type?: string;
    placeholder?: string;
    required?: boolean;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[field] as string}
        onChange={set(field)}
        placeholder={placeholder}
        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Add New Medicine</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fill in the details to add to your inventory</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Basic Info */}
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-3">Basic Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Medicine Name" field="name" required placeholder="e.g. Amoxicillin 500mg" />
              <Field label="Generic Name" field="genericName" placeholder="e.g. Amoxicillin" />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Category<span className="text-red-400 ml-0.5">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={set("category")}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition bg-white"
                >
                  <option value="">Select category…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Manufacturer" field="manufacturer" placeholder="e.g. Cipla Ltd." />
            </div>
          </div>

          {/* Stock & Pricing */}
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-3">Stock & Pricing</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</label>
                <select
                  value={form.unit}
                  onChange={set("unit")}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition bg-white"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Quantity in Stock" field="quantityInStock" type="number" required placeholder="e.g. 200" />
              <Field label="Reorder Level" field="reorderLevel" type="number" placeholder="e.g. 20" />
              <Field label="Batch Number" field="batchNumber" placeholder="e.g. BT-20240901" />
              <Field label="Unit Cost (Rs.)" field="unitPrice" type="number" placeholder="e.g. 5.00" />
              <Field label="Selling Price (Rs.)" field="sellingPrice" type="number" required placeholder="e.g. 8.50" />
            </div>
          </div>

          {/* Dates & Other */}
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-3">Dates & Other</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Expiry Date" field="expiryDate" type="date" />
              <div className="flex items-center gap-3 pt-5">
                <input
                  id="rx"
                  type="checkbox"
                  checked={form.requiresPrescription}
                  onChange={set("requiresPrescription")}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <label htmlFor="rx" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Requires Prescription
                </label>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes / Description</label>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={2}
                placeholder="Optional notes about this medicine…"
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/60">
          <button
            onClick={onClose}
            className="text-sm font-semibold text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || done}
            className={`flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl text-white transition-all shadow-sm
              ${
                done
                  ? "bg-emerald-500 cursor-default"
                  : submitting
                  ? "bg-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
              }`}
          >
            {done ? (
              <>
                <CheckCircle size={15} /> Added!
              </>
            ) : submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Plus size={15} /> Add Medicine
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const Badge = ({ text, variant }: { text: string; variant: "alert" | "critical" | "new" }) => {
  const s: Record<string, string> = {
    alert: "bg-amber-100 text-amber-700",
    critical: "bg-red-100 text-red-600",
    new: "bg-emerald-600 text-white",
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${s[variant]}`}>{text}</span>;
};

const StatCard = ({ icon: Icon, iconBg, iconColor, label, value, subValue, badge }: any) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between min-h-[120px]">
    <div className="flex justify-between items-start">
      <div className={`p-2.5 rounded-xl ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
      {badge && <Badge text={badge.text} variant={badge.variant} />}
    </div>
    <div className="mt-4">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-extrabold text-gray-900">{value}</span>
        {subValue && (
          <span className={`text-[11px] font-bold ${subValue.includes("-") ? "text-red-500" : "text-emerald-600"}`}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  </div>
);

const ProgressBar = ({ value, color }: { value: number; color: string }) => (
  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-700 ${color}`}
      style={{ width: `${Math.min(100, value)}%` }}
    />
  </div>
);

const statusStyle: Record<string, string> = {
  Completed: "text-emerald-600 font-semibold",
  Pending: "text-amber-500 font-semibold",
  Cancelled: "text-red-500 font-semibold",
};
const alertTypeStyle: Record<string, string> = {
  Order: "bg-emerald-100 text-emerald-800",
  Disposal: "bg-rose-100 text-rose-800",
  Warning: "bg-amber-100 text-amber-800",
};

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-md text-xs">
        <p className="font-bold text-gray-700 uppercase mb-1">{label}</p>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          <span className="text-gray-500">Revenue:</span>
          <span className="text-primary font-bold">
            Rs. {Number(payload[0].value).toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const DashboardSection = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDay[]>([]);
  const [stockMetrics, setStockMetrics] = useState<StockMetrics | null>(null);
  const [transactions, setTransactions] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<PriorityAlert[]>([]);
  const [revenueView, setRevenueView] = useState<"Weekly" | "Monthly">("Weekly");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [summary, revenue, activities, alertData] = await Promise.all([
        getDashboardSummary(),
        getDashboardRevenue(revenueView === "Weekly" ? "weekly" : "monthly"),
        getRecentActivity(10),
        getDashboardAlerts(),
      ]);

      if (summary) {
        setStats({
          totalMeds: summary.totalMedicines,
          totalMedsDelta: 0,
          lowStock: summary.lowStockCount,
          expiredSoon: summary.expiringCount,
          todaySales: summary.todayRevenue,
          todaySalesDelta: summary.todaySalesDelta,
        });

        // Compute Fulfillment & Stock Optimization widgets
        const optimization =
          summary.totalMedicines > 0
            ? Math.round(((summary.totalMedicines - summary.lowStockCount) / summary.totalMedicines) * 100)
            : 100;
        setStockMetrics({
          stockOptimization: optimization,
          fulfillmentRate: summary.todayOrders > 0 ? 100 : 0,
          fulfillmentCleared: summary.todayOrders,
          fulfillmentTotal: summary.todayOrders,
        });
      }

      if (revenue) {
        const mapped = revenue.map((r) => ({
          day: r.label,
          value: r.revenue,
        }));
        setRevenueData(mapped);
      }

      if (activities) {
        setTransactions(activities);
      }

      if (alertData) {
        setAlerts(alertData);
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();

    // Hook up real-time listener for POS checkouts
    window.addEventListener("salesUpdated", fetchAll);
    return () => {
      window.removeEventListener("salesUpdated", fetchAll);
    };
  }, [revenueView]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading dashboard…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6 font-sans">
      {/* Modal */}
      {showModal && <AddMedicineModal onClose={() => setShowModal(false)} onSuccess={fetchAll} />}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Clinical Overview</h1>
          <p className="text-sm text-gray-400 mt-0.5">Real-time status of your pharmacy operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 shadow-sm">
            <CalendarIcon size={14} className="text-gray-400" />
            {today}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
            >
              <Download size={14} />
              Export
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-xl shadow-lg z-30 text-left py-1 text-xs">
                <button
                  onClick={() => {
                    exportDashboard("pdf");
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 font-semibold"
                >
                  PDF Report
                </button>
                <button
                  onClick={() => {
                    exportDashboard("csv");
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 font-semibold"
                >
                  CSV Data
                </button>
                <button
                  onClick={() => {
                    exportDashboard("xlsx");
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 font-semibold"
                >
                  Excel Sheet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Pill}
          iconBg="bg-gray-100"
          iconColor="text-gray-500"
          label="Total Meds"
          value={stats?.totalMeds?.toLocaleString() ?? "—"}
        />
        <StatCard
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          label="Low Stock"
          value={stats?.lowStock ?? "—"}
          badge={{ text: "Alert", variant: "alert" }}
        />
        <StatCard
          icon={Clock}
          iconBg="bg-red-50"
          iconColor="text-red-400"
          label="Expired Soon"
          value={stats?.expiredSoon ?? "—"}
          badge={{ text: "Critical", variant: "critical" }}
        />
        <StatCard
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Today's Sales"
          value={stats?.todaySales != null ? `Rs.${stats.todaySales.toLocaleString()}` : "—"}
          subValue={
            stats?.todaySalesDelta != null
              ? `${stats.todaySalesDelta >= 0 ? "+" : ""}${stats.todaySalesDelta}%`
              : undefined
          }
        />
      </div>

      {/* Revenue + Stock Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-base font-bold text-gray-900">Revenue Analytics</h2>
              <p className="text-xs text-gray-400">{revenueView} performance tracking</p>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {(["Weekly", "Monthly"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setRevenueView(v)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    revenueView === v ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} barSize={28} margin={{ top: 16, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(5, 150, 105, 0.15)" }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} activeBar={{ fill: '#047857' }}>
                {revenueData.map((e, i) => (
                  <Cell key={i} fill={e.value > 0 ? "#059669" : "#E5E7EB"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-emerald-700">Stock Optimization</span>
              <span className="text-lg font-extrabold text-gray-900">
                {stockMetrics?.stockOptimization != null ? stockMetrics.stockOptimization : "—"}%
              </span>
            </div>
            <ProgressBar value={stockMetrics?.stockOptimization ?? 0} color="bg-emerald-500" />
            <p className="text-xs text-emerald-600 mt-2">Near capacity across most medical categories.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-blue-600">Fulfillment Rate</span>
              <span className="text-lg font-extrabold text-gray-900">
                {stockMetrics?.fulfillmentRate ?? "—"}%
              </span>
            </div>
            <ProgressBar value={stockMetrics?.fulfillmentRate ?? 0} color="bg-blue-500" />
            <p className="text-xs text-gray-400 mt-2">
              {stockMetrics
                ? `${stockMetrics.fulfillmentCleared} of ${stockMetrics.fulfillmentTotal} prescriptions cleared today.`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity + Priority Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-base font-bold text-gray-900">Recent Activity</h2>
              <p className="text-xs text-gray-400">Last 24 hours transactions</p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="text-left pb-2 pr-4">ID</th>
                  <th className="text-left pb-2 pr-4">Patient</th>
                  <th className="text-left pb-2 pr-4">Status</th>
                  <th className="text-left pb-2 pr-4 text-center">Items</th>
                  <th className="text-right pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-6 text-xs">
                      No recent transactions.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4 text-gray-500 text-xs font-mono">{tx.invoiceNumber}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {getInitials(tx.customerName)}
                          </span>
                          <span className="font-medium text-gray-700 text-xs">{tx.customerName}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs ${statusStyle[tx.status] ?? "text-gray-500"}`}>{tx.status}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs text-center">{tx.itemCount}</td>
                      <td className="py-3 text-right font-semibold text-gray-800 text-xs">
                        Rs.{tx.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Priority Alerts</h2>
            {alerts.length > 0 && <Badge text={`${alerts.length} NEW`} variant="new" />}
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No priority alerts.</p>
            ) : (
              alerts.map((alertItem) => (
                <div
                  key={alertItem.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-white border border-gray-200 mt-0.5 flex-shrink-0">
                    <Edit3 size={13} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-800 truncate">{alertItem.name}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ${
                          alertTypeStyle[alertItem.type] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {alertItem.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-[11px] text-gray-400 truncate">{alertItem.detail}</p>
                      <button
                        onClick={() => alert(`Initiated action: ${alertItem.type} for ${alertItem.name}`)}
                        className={`text-[9px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                          alertItem.type === "Order"
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-rose-600 text-white hover:bg-rose-700"
                        }`}
                      >
                        {alertItem.type}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Add Medicine Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
        title="Add new medicine"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default DashboardSection;