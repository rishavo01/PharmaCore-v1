import React, { useState, useEffect } from "react";
import {
  CreditCard,
  ShoppingCart,
  LineChart,
  TrendingUp,
  Filter,
  Download,
  MapPin,
  Globe,
  Building2,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  FileDown,
  RefreshCw,
  X,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  IndianRupee,
  ShoppingBag,
  BarChart3,
} from "lucide-react";
import { motion } from "motion/react";
import {
  getSales,
  getSale,
  updateSale,
  deleteSale,
  cancelSale,
  getStats,
  exportCSV,
  Sale,
  SalesStats,
} from "../../services/salesService";

const StatCard = ({
  icon: Icon,
  label,
  value,
  trend,
  colorClass,
}: {
  icon: any;
  label: string;
  value: string;
  trend: string;
  colorClass: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-surface-container-lowest p-3 sm:p-6 rounded-2xl shadow-sm border border-surface-container/50 flex flex-col"
  >
    <div className="flex justify-between items-center mb-3 sm:mb-4">
      <div
        className={`w-14 h-14 rounded-[16px] flex items-center justify-center transition-all duration-200 ease-in-out shadow-sm hover:shadow-md hover:scale-[1.05] border cursor-pointer ${
          colorClass === "text-primary"
            ? "bg-[#ECFDF5] text-emerald-800 border-[#D1FAE5]/60 shadow-emerald-50/50"
            : colorClass === "text-secondary"
            ? "bg-[#EFF6FF] text-blue-700 border-[#DBEAFE]/60 shadow-blue-50/50"
            : "bg-[#FFF5F5] text-red-800 border-[#FED7D7]/60 shadow-red-50/50"
        }`}
      >
        <Icon size={26} />
      </div>
      <span
        className={`text-[8px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
          trend.includes("-")
            ? "bg-tertiary-container/20 text-tertiary"
            : "bg-primary-container/20 text-primary"
        }`}
      >
        {!trend.includes("Stable") && <TrendingUp size={10} className="sm:w-3 sm:h-3" />}
        {trend}
      </span>
    </div>
    <p className="text-[8px] sm:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{label}</p>
    <h2 className="text-lg sm:text-2xl lg:text-3xl font-extrabold font-headline text-on-surface mt-1 tracking-tight">
      {value}
    </h2>
  </motion.div>
);

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const avatarColors = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
];

const getAvatarColor = (id: number) => avatarColors[id % avatarColors.length];

const SalesSection = () => {
  const [activeTab, setActiveTab] = useState("Today");

  // State integration
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals & Popups State
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState<number | null>(null);

  // Edit Sale Form State
  const [editForm, setEditForm] = useState<{
    id: number;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerAddress?: string;
    paymentMethod: string;
    status: string;
    items: { medicineId: number; quantity: number; name?: string; price?: number }[];
  } | null>(null);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [selectedMedId, setSelectedMedId] = useState<string>("");
  const [addQty, setAddQty] = useState<number>(1);

  useEffect(() => {
    fetchSalesData();
    window.addEventListener("salesUpdated", fetchSalesData);
    return () => {
      window.removeEventListener("salesUpdated", fetchSalesData);
    };
  }, [activeTab, search, statusFilter, paymentFilter, page]);

  const fetchSalesData = async () => {
    setLoading(true);
    setError("");
    try {
      let startDateStr = "";
      const now = new Date();
      if (activeTab === "Today") {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDateStr = d.toISOString();
      } else if (activeTab === "Weekly") {
        const d = new Date();
        d.setDate(now.getDate() - 6);
        d.setHours(0, 0, 0, 0);
        startDateStr = d.toISOString();
      } else if (activeTab === "Monthly") {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        startDateStr = d.toISOString();
      }

      const salesRes = await getSales({
        page,
        limit,
        search,
        status: statusFilter,
        paymentMethod: paymentFilter,
        startDate: startDateStr,
      });

      setSales(salesRes.sales);
      setTotalPages(salesRes.pagination.totalPages);
      setTotalRecords(salesRes.pagination.total);

      const statsRes = await getStats();
      setStats(statsRes);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch transactions and metrics.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (id: number) => {
    try {
      const saleData = await getSale(id);
      setSelectedSale(saleData);
      setShowDetailModal(true);
      setShowActionsDropdown(null);
    } catch (err) {
      alert("Error loading transaction details.");
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this sale? Medicine quantities will be restored.")) return;
    try {
      await cancelSale(id);
      alert("Sale cancelled successfully.");
      setShowActionsDropdown(null);
      fetchSalesData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel transaction.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this pending sale? Medicine stock will be restored.")) return;
    try {
      await deleteSale(id);
      alert("Sale deleted successfully.");
      setShowActionsDropdown(null);
      fetchSalesData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete transaction.");
    }
  };

  const handleOpenEdit = async (sale: Sale) => {
    try {
      const res = await fetch("http://localhost:5000/api/medicines");
      const meds = await res.json();
      setMedicines(meds);

      // Fetch complete sale to get full items mapping
      const completeSale = await getSale(sale.id);
      setEditForm({
        id: completeSale.id,
        customerName: completeSale.customerName,
        customerPhone: completeSale.customer?.phone || "",
        customerEmail: completeSale.customer?.email || "",
        customerAddress: completeSale.customer?.address || "",
        paymentMethod: completeSale.paymentMethod,
        status: completeSale.status,
        items: completeSale.items?.map((item) => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          name: item.medicine?.name || `Medicine ID: ${item.medicineId}`,
          price: item.unitPrice,
        })) || [],
      });
      setShowEditModal(true);
      setShowActionsDropdown(null);
    } catch (err) {
      alert("Error opening edit panel.");
    }
  };

  const handleUpdatePendingSale = async () => {
    if (!editForm || editForm.items.length === 0) return;
    try {
      await updateSale(editForm.id, {
        customerName: editForm.customerName.trim(),
        customerPhone: editForm.customerPhone.trim(),
        customerEmail: editForm.customerEmail?.trim(),
        customerAddress: editForm.customerAddress?.trim(),
        paymentMethod: editForm.paymentMethod,
        status: editForm.status,
        items: editForm.items.map((it) => ({
          medicineId: it.medicineId,
          quantity: it.quantity,
        })),
      });
      alert("Transaction updated successfully!");
      setShowEditModal(false);
      fetchSalesData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update transaction.");
    }
  };

  const addEditItem = () => {
    if (!selectedMedId || !editForm) return;
    const med = medicines.find((m) => m.id === parseInt(selectedMedId));
    if (!med) return;

    const existingIndex = editForm.items.findIndex((it) => it.medicineId === med.id);
    if (existingIndex > -1) {
      const updatedItems = [...editForm.items];
      updatedItems[existingIndex].quantity += addQty;
      setEditForm({ ...editForm, items: updatedItems });
    } else {
      setEditForm({
        ...editForm,
        items: [
          ...editForm.items,
          {
            medicineId: med.id,
            quantity: addQty,
            name: med.name,
            price: med.sellPrice,
          },
        ],
      });
    }
    setSelectedMedId("");
    setAddQty(1);
  };

  const removeEditItem = (index: number) => {
    if (!editForm) return;
    const updatedItems = editForm.items.filter((_, i) => i !== index);
    setEditForm({ ...editForm, items: updatedItems });
  };

  const updateEditItemQty = (index: number, newQty: number) => {
    if (!editForm || newQty <= 0) return;
    const updatedItems = [...editForm.items];
    updatedItems[index].quantity = newQty;
    setEditForm({ ...editForm, items: updatedItems });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Title & Filters */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-headline text-on-surface tracking-tight">
            Sales & Transactions
          </h1>
          <p className="text-on-surface-variant mt-1 text-xs sm:text-sm">
            Real-time financial activity for PharmaCore Central Office.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-surface-container-low p-1 rounded-xl border border-surface-container w-fit">
            {["Today", "Weekly", "Monthly"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
                className={`px-3 sm:px-5 py-1.5 rounded-lg text-[8px] sm:text-xs font-bold transition-all ${
                  activeTab === tab ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Customer or Invoice..."
              className="w-full bg-surface-container-low border border-surface-container rounded-xl py-2 px-3 pl-4 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={stats ? `Rs.${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "Rs.0.00"}
          trend={stats ? `${stats.revenueGrowthPercentage >= 0 ? "+" : ""}${stats.revenueGrowthPercentage}%` : "0%"}
          colorClass="text-primary"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={stats ? stats.totalOrders.toLocaleString() : "0"}
          trend={stats ? `${stats.revenueGrowthPercentage >= 0 ? "+" : ""}${stats.revenueGrowthPercentage}%` : "0%"}
          colorClass="text-secondary"
        />
        <StatCard
          icon={BarChart3}
          label="Avg. Order Value"
          value={stats ? `Rs.${stats.averageOrderValue.toFixed(2)}` : "Rs.0.00"}
          trend="Stable"
          colorClass="text-tertiary"
        />
      </div>

      {/* Transactions Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container overflow-hidden">
        <div className="px-3 sm:px-6 py-4 sm:py-5 flex flex-col sm:gap-4 gap-3 border-b border-surface-container">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold font-headline text-on-surface">Recent Transactions</h3>
              <p className="text-[9px] sm:text-[11px] text-on-surface-variant mt-0.5 font-medium">
                Showing live logs from all terminal nodes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchSalesData}
                className="p-2 bg-surface-container-low border border-surface-container rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                title="Refresh Table"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-3 pr-8 py-2 bg-surface-container-low border border-surface-container rounded-xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Payments</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Online">Online</option>
                <option value="Bank">Bank</option>
                <option value="UPI">UPI</option>
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" size={12} />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-3 pr-8 py-2 bg-surface-container-low border border-surface-container rounded-xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" size={12} />
            </div>

            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setPaymentFilter("");
                setPage(1);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-surface-container-low border border-surface-container rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors whitespace-nowrap"
            >
              Reset Filters
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-on-primary rounded-xl text-xs font-bold shadow-md shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap ml-auto"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-surface-container">
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-[8px] sm:text-[10px] font-bold text-outline uppercase tracking-widest">
                  ID
                </th>
                <th className="px-2 sm:px-4 py-3 sm:py-4 text-[8px] sm:text-[10px] font-bold text-outline uppercase tracking-widest whitespace-nowrap">
                  Timestamp
                </th>
                <th className="px-2 sm:px-4 py-3 sm:py-4 text-[8px] sm:text-[10px] font-bold text-outline uppercase tracking-widest">
                  Customer
                </th>
                <th className="px-2 sm:px-4 py-3 sm:py-4 text-[8px] sm:text-[10px] font-bold text-outline uppercase tracking-widest text-center whitespace-nowrap">
                  Items Count
                </th>
                <th className="px-2 sm:px-4 py-3 sm:py-4 text-[8px] sm:text-[10px] font-bold text-outline uppercase tracking-widest">
                  Channel / Location
                </th>
                <th className="px-2 sm:px-4 py-3 sm:py-4 text-[8px] sm:text-[10px] font-bold text-outline uppercase tracking-widest text-right whitespace-nowrap">
                  Amount
                </th>
                <th className="px-2 sm:px-4 py-3 sm:py-4 text-[8px] sm:text-[10px] font-bold text-outline uppercase tracking-widest text-center whitespace-nowrap">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-[8px] sm:text-[10px] font-bold text-outline uppercase tracking-widest text-right whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-10 text-xs">
                    Loading transactions...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-10 text-xs">
                    No transactions found matching active criteria.
                  </td>
                </tr>
              ) : (
                sales.map((tx) => {
                  const itemCount = tx.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                  const dateObj = new Date(tx.createdAt);
                  const formattedDate = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
                  const formattedTime = dateObj.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

                  return (
                    <tr key={tx.id} className="hover:bg-surface-container-low/30 transition-colors group relative">
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-[8px] sm:text-xs font-bold text-primary">
                            {tx.invoiceNumber}
                          </span>
                          <span className="text-[7px] sm:text-[9px] text-outline font-bold">Terminal POS</span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-[8px] sm:text-xs font-bold text-on-surface">{formattedDate}</div>
                        <div className="text-[7px] sm:text-[9px] text-on-surface-variant font-medium">
                          {formattedTime}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[8px] sm:text-[10px] ${getAvatarColor(
                              tx.id
                            )}`}
                          >
                            {getInitials(tx.customerName)}
                          </div>
                          <span className="text-[7px] sm:text-xs font-bold text-on-surface truncate">
                            {tx.customerName}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-center">
                        <span className="text-xs font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded-lg">
                          {itemCount} units
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center gap-1 text-[8px] sm:text-[11px] font-bold text-on-surface-variant truncate">
                          <MapPin size={12} className="sm:w-3.5 sm:h-3.5 text-outline flex-shrink-0" />
                          <span className="truncate">Central Branch</span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-right whitespace-nowrap">
                        <div className="text-[8px] sm:text-sm font-extrabold font-headline text-on-surface">
                          Rs.{tx.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-[7px] sm:text-[9px] text-primary font-bold flex items-center justify-end gap-0.5">
                          <CreditCard size={10} className="sm:w-2.5 sm:h-2.5" /> {tx.paymentMethod}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-center">
                        <span
                          className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-[9px] font-bold uppercase tracking-wider border inline-block ${
                            tx.status === "Completed"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : tx.status === "Pending"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-tertiary/10 text-tertiary border-tertiary/20"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                        <div className="flex justify-end gap-1 relative">
                          <button
                            onClick={() => handleOpenDetails(tx.id)}
                            className="p-1 sm:p-1.5 hover:bg-surface-container rounded-lg text-primary transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} className="sm:w-4 sm:h-4" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowActionsDropdown(showActionsDropdown === tx.id ? null : tx.id)
                              }
                              className="p-1 sm:p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors"
                            >
                              <MoreVertical size={14} className="sm:w-4 sm:h-4" />
                            </button>
                            {showActionsDropdown === tx.id && (
                              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-xl shadow-lg z-30 text-left py-1 text-xs">
                                <button
                                  onClick={() => handleOpenDetails(tx.id)}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 font-medium"
                                >
                                  View
                                </button>
                                {tx.status === "Pending" && (
                                  <button
                                    onClick={() => handleOpenEdit(tx)}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-blue-600 font-semibold"
                                  >
                                    Edit
                                  </button>
                                )}
                                {tx.status !== "Cancelled" && (
                                  <button
                                    onClick={() => handleCancel(tx.id)}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-amber-600 font-semibold"
                                  >
                                    Cancel
                                  </button>
                                )}
                                {tx.status === "Pending" && (
                                  <button
                                    onClick={() => handleDelete(tx.id)}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600 font-semibold"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-surface-container-low/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-surface-container">
          <p className="text-[8px] sm:text-[10px] text-outline font-bold uppercase tracking-wider">
            Showing {sales.length} of {totalRecords} Records
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1 sm:p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-all flex-shrink-0 disabled:opacity-40"
              >
                <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx + 1)}
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg text-[8px] sm:text-[10px] font-bold flex-shrink-0 ${
                    page === idx + 1
                      ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                      : "text-on-surface hover:bg-surface-container"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1 sm:p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-all flex-shrink-0 disabled:opacity-40"
              >
                <ChevronRight size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pb-12">
        <div className="relative rounded-3xl overflow-hidden h-40 sm:h-48 group shadow-xl border border-surface-container">
          <img
            src="https://picsum.photos/seed/medical-tech/800/400"
            alt="Medical Tech"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/60 to-transparent flex flex-col justify-center px-4 sm:px-10">
            <span className="bg-white/20 backdrop-blur-md text-white text-[7px] sm:text-[9px] font-bold px-2 py-1 rounded-full w-fit mb-2 sm:mb-3 uppercase tracking-widest border border-white/20">
              Compliance
            </span>
            <h4 className="text-white text-lg sm:text-2xl font-extrabold font-headline">Generate CSV Report</h4>
            <p className="text-white/80 text-[8px] sm:text-xs mt-1 max-w-sm font-medium">
              Automated clinical financial auditing ready for download.
            </p>
            <button
              onClick={exportCSV}
              className="mt-3 sm:mt-5 w-fit bg-white text-primary px-4 sm:px-5 py-2 rounded-xl text-[8px] sm:text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <FileDown size={14} className="sm:w-4 sm:h-4" />
              CSV Export
            </button>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-3xl p-4 sm:p-8 flex flex-col justify-between border border-surface-container shadow-sm h-40 sm:h-48">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-on-surface text-base sm:text-xl font-extrabold font-headline">Inventory Sync</h4>
              <p className="text-on-surface-variant text-[8px] sm:text-xs mt-0.5 sm:mt-1 font-medium">
                Real-time stock sync across all connected pharmacy nodes.
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-white rounded-2xl shadow-sm border border-surface-container flex-shrink-0">
              <RefreshCw
                size={18}
                className="sm:w-6 sm:h-6 text-primary animate-spin"
                style={{ animationDuration: "4s" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="bg-white/60 backdrop-blur-sm p-3 sm:p-4 rounded-2xl border border-white shadow-sm">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse flex-shrink-0"></div>
                <span className="text-[7px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Warehouse Hub
                </span>
              </div>
              <p className="text-[10px] sm:text-sm font-bold text-primary">Balanced</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-3 sm:p-4 rounded-2xl border border-white shadow-sm">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                <span className="text-[7px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Terminal Nodes
                </span>
              </div>
              <p className="text-[10px] sm:text-sm font-bold text-primary">04/04 Connected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetailModal && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Transaction Details</h2>
                <p className="text-xs text-gray-400 mt-0.5">Invoice: {selectedSale.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Customer</p>
                  <p className="font-bold text-gray-800 mt-1">{selectedSale.customerName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Phone Number</p>
                  <p className="font-bold text-gray-800 mt-1">{selectedSale.customer?.phone || "N/A"}</p>
                </div>
                {selectedSale.customer?.email && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Email</p>
                    <p className="font-bold text-gray-800 mt-1">{selectedSale.customer.email}</p>
                  </div>
                )}
                {selectedSale.customer?.address && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Address</p>
                    <p className="font-bold text-gray-800 mt-1">{selectedSale.customer.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Status</p>
                  <span
                    className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border inline-block ${
                      selectedSale.status === "Completed"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : selectedSale.status === "Pending"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-tertiary/10 text-tertiary border-tertiary/20"
                    }`}
                  >
                    {selectedSale.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Payment Method</p>
                  <p className="font-bold text-gray-800 mt-1">{selectedSale.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Date</p>
                  <p className="font-medium text-gray-800 mt-1">
                    {new Date(selectedSale.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Line Items</p>
                <div className="border border-gray-100 rounded-2xl overflow-hidden text-sm">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-2">Medicine</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {selectedSale.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-semibold">{item.medicine?.name || "Unknown"}</td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">Rs.{item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-bold">Rs.{item.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-semibold">Rs.{selectedSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax</span>
                  <span className="font-semibold">Rs.{selectedSale.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Discount</span>
                  <span className="text-rose-600 font-semibold">-Rs.{selectedSale.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 text-gray-900 font-extrabold text-base">
                  <span>Grand Total</span>
                  <span>Rs.{selectedSale.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50/60">
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-sm font-semibold bg-gray-200 text-gray-700 px-5 py-2 rounded-xl hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pending Sale Modal */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Edit Pending Transaction</h2>
                <p className="text-xs text-gray-400 mt-0.5">Adjust settings and line items</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Customer Name *</label>
                  <input
                    type="text"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Phone Number *</label>
                  <input
                    type="text"
                    value={editForm.customerPhone}
                    onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                  <input
                    type="email"
                    value={editForm.customerEmail || ""}
                    onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Address</label>
                  <input
                    type="text"
                    value={editForm.customerAddress || ""}
                    onChange={(e) => setEditForm({ ...editForm, customerAddress: e.target.value })}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Payment Method</label>
                  <select
                    value={editForm.paymentMethod}
                    onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Online">Online</option>
                    <option value="Bank">Bank</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Items Management */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cart Items</p>
                <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
                  {editForm.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">Rs.{(item.price || 0).toFixed(2)} / unit</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateEditItemQty(idx, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-bold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateEditItemQty(idx, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeEditItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Add New Item */}
                  <div className="flex items-center gap-2 border-t border-gray-100 pt-3 flex-wrap">
                    <select
                      value={selectedMedId}
                      onChange={(e) => setSelectedMedId(e.target.value)}
                      className="flex-1 min-w-[150px] border border-gray-200 rounded-xl px-2 py-2 text-xs"
                    >
                      <option value="">Add item to sale...</option>
                      {medicines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} (Rs.{m.sellPrice})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={addQty}
                      onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 border border-gray-200 rounded-xl px-2 py-2 text-xs text-center"
                      min="1"
                    />
                    <button
                      onClick={addEditItem}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/60">
              <button
                onClick={() => setShowEditModal(false)}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePendingSale}
                className="text-sm font-bold bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesSection;
