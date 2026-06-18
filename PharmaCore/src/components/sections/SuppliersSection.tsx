import React, { useEffect, useState } from "react";
import {
  Truck,
  Search,
  Filter,
  Plus,
  Download,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  Eye,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Globe,
  FileText,
} from "lucide-react";
import {
  getSuppliers,
  getSupplierStats,
  getRegionalDistribution,
  getStockAlerts,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getExportUrl,
  Supplier,
  SupplierStats,
  RegionalData,
  StockAlert,
} from "../../services/supplierService";

const SuppliersSection = () => {
  // Lists and stats states
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [regions, setRegions] = useState<RegionalData[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  // Search & filter states
  const [searchVal, setSearchVal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState("companyName");
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(5); // Show 5 suppliers per page

  // Loader, Error and Notifications states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  // Modal Dialogs states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [activeActionsMenu, setActiveActionsMenu] = useState<number | null>(null);

  // Selected supplier item state
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Form inputs state
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    taxNumber: "",
    website: "",
    notes: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // 1. Debounce Search Input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchVal);
      setPage(1);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchVal]);

  // 2. Fetch all dynamic metrics
  const fetchAllData = async () => {
    setLoading(true);
    setError("");
    try {
      const [suppliersData, statsData, regionsData, alertsData] = await Promise.all([
        getSuppliers({
          page,
          limit,
          search: searchQuery,
          status: statusFilter,
          sort: sortField,
          order: sortOrder,
        }),
        getSupplierStats(),
        getRegionalDistribution(),
        getStockAlerts(),
      ]);

      setSuppliers(suppliersData.suppliers);
      setTotalPages(suppliersData.totalPages);
      setTotalRecords(suppliersData.total);
      setStats(statsData);
      setRegions(regionsData);
      setStockAlerts(alertsData);
    } catch (err: any) {
      console.error(err);
      setError("Failed to sync supplier data with database.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger refetching upon changes
  useEffect(() => {
    fetchAllData();
  }, [page, searchQuery, statusFilter, sortField, sortOrder]);

  // Handle Form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Show Toast Helper
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification("");
    }, 3500);
  };

  // Clear Form State
  const clearForm = () => {
    setForm({
      companyName: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      taxNumber: "",
      website: "",
      notes: "",
      status: "ACTIVE",
    });
    setFormError("");
  };

  // Open Add Modal
  const openAddModal = () => {
    clearForm();
    setModalMode("add");
    setFormError("");
    setShowAddEditModal(true);
  };

  // Open Edit Modal
  const openEditModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setForm({
      companyName: supplier.companyName,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      country: supplier.country,
      postalCode: supplier.postalCode,
      taxNumber: supplier.taxNumber,
      website: supplier.website,
      notes: supplier.notes,
      status: supplier.status,
    });
    setModalMode("edit");
    setFormError("");
    setShowAddEditModal(true);
  };

  // Save / Update Form Submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.phone.trim()) {
      setFormError("Company Name and Phone Number are required fields.");
      return;
    }

    if (form.email && form.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        setFormError("Please enter a valid email format.");
        return;
      }
    }

    setFormError("");
    setFormSubmitting(true);

    try {
      if (modalMode === "add") {
        await createSupplier(form);
        triggerNotification("✅ Supplier created successfully.");
      } else {
        if (selectedSupplier) {
          await updateSupplier(selectedSupplier.id, form);
          triggerNotification("✅ Supplier details updated.");
        }
      }
      setShowAddEditModal(false);
      clearForm();
      fetchAllData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || "Error saving details. Please verify values.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Soft Delete / Deactivate Supplier
  const handleDeactivateConfirm = async () => {
    if (!selectedSupplier) return;
    try {
      await deleteSupplier(selectedSupplier.id);
      triggerNotification("🗑 Supplier status set to INACTIVE.");
      setShowDeleteConfirm(false);
      fetchAllData();
    } catch (err: any) {
      console.error(err);
      alert("Error deactivating supplier.");
    }
  };

  // Activate / Invert status directly
  const handleToggleStatus = async (supplier: Supplier) => {
    try {
      const updatedStatus = supplier.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await updateSupplier(supplier.id, {
        companyName: supplier.companyName,
        phone: supplier.phone,
        status: updatedStatus,
      });
      triggerNotification(`✅ Supplier set to ${updatedStatus}.`);
      fetchAllData();
    } catch (err) {
      console.error(err);
      alert("Error toggling status.");
    }
  };

  // Export handlers
  const handleExport = (format: "csv" | "xlsx" | "pdf") => {
    const url = getExportUrl(format, searchQuery, statusFilter);
    window.open(url, "_blank");
    setShowExportDropdown(false);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 sm:space-y-8 relative">
      {/* Toast Notification Notification Banner */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500 animate-bounce">
          <CheckCircle size={16} />
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-headline text-on-surface tracking-tight">
              Supplier Network
            </h1>
            <p className="text-on-surface-variant mt-1 text-xs sm:text-sm font-medium">
              Manage your pharmaceutical supply chain and procurement.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-emerald-700 text-on-primary rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Supplier</span>
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" size={18} />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search suppliers by name, contact, phone, email, code..."
              className="w-full bg-white border border-surface-container rounded-xl py-2.5 pl-11 pr-4 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-surface-container rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-700 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, ord] = e.target.value.split("-");
                setSortField(field);
                setSortOrder(ord);
              }}
              className="bg-white border border-surface-container rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-700 focus:outline-none"
            >
              <option value="companyName-asc">Sort Name (A-Z)</option>
              <option value="companyName-desc">Sort Name (Z-A)</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-surface-container shadow-sm flex items-center justify-between gap-3">
          <div>
            <p className="text-[8px] sm:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Total Suppliers
            </p>
            <h2 className="text-lg sm:text-2xl font-extrabold font-headline text-on-surface mt-1 tracking-tight">
              {stats ? stats.totalSuppliers.toString().padStart(2, "0") : "—"}
            </h2>
          </div>
          <div className="p-2.5 sm:p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit">
            <Truck size={18} className="sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-surface-container shadow-sm flex items-center justify-between gap-3">
          <div>
            <p className="text-[8px] sm:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Active Suppliers
            </p>
            <h2 className="text-lg sm:text-2xl font-extrabold font-headline text-on-surface mt-1 tracking-tight">
              {stats ? stats.activeSuppliers.toString().padStart(2, "0") : "—"}
            </h2>
          </div>
          <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit">
            <Truck size={18} className="sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-surface-container shadow-sm flex items-center justify-between gap-3">
          <div>
            <p className="text-[8px] sm:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Pending Orders
            </p>
            <h2 className="text-lg sm:text-2xl font-extrabold font-headline text-on-surface mt-1 tracking-tight">
              {stats ? stats.pendingOrders.toString().padStart(2, "0") : "—"}
            </h2>
          </div>
          <div className="p-2.5 sm:p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit">
            <Truck size={18} className="sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Supplier List */}
      <div className="bg-white rounded-3xl border border-surface-container shadow-sm overflow-hidden">
        <div className="px-3 sm:px-6 py-4 sm:py-5 flex justify-between items-center gap-3 border-b border-surface-container bg-surface-container-low/20">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg text-[8px] sm:text-[10px] font-bold text-on-surface-variant">
              <Filter size={12} />
              Filter Enabled
            </span>
            <p className="text-[8px] sm:text-[10px] text-outline font-bold uppercase tracking-widest">
              Showing {suppliers.length} of {totalRecords} suppliers
            </p>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="p-1.5 sm:p-2 hover:bg-surface-container rounded-lg text-outline transition-colors flex items-center gap-1.5 text-xs font-bold border border-surface-container cursor-pointer"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-surface-container rounded-xl shadow-lg z-30 py-1 text-xs">
                <button
                  onClick={() => handleExport("pdf")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 font-semibold cursor-pointer"
                >
                  PDF Report
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 font-semibold cursor-pointer"
                >
                  CSV Format
                </button>
                <button
                  onClick={() => handleExport("xlsx")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 font-semibold cursor-pointer"
                >
                  Excel Sheet
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table loader, empty or content states */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm animate-pulse">
            Loading supplier database...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-rose-500 text-sm font-semibold">
            {error}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No matching suppliers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-surface-container-low/30 border-b border-surface-container">
                  <th className="px-3 sm:px-6 py-3.5 text-[8px] sm:text-[9px] font-bold text-outline uppercase tracking-widest">
                    Supplier Name
                  </th>
                  <th className="px-2 sm:px-4 py-3.5 text-[8px] sm:text-[9px] font-bold text-outline uppercase tracking-widest">
                    Contact Info
                  </th>
                  <th className="px-2 sm:px-4 py-3.5 text-[8px] sm:text-[9px] font-bold text-outline uppercase tracking-widest">
                    Address / City
                  </th>
                  <th className="px-2 sm:px-4 py-3.5 text-[8px] sm:text-[9px] font-bold text-outline uppercase tracking-widest text-center whitespace-nowrap">
                    Orders Count
                  </th>
                  <th className="px-2 sm:px-4 py-3.5 text-[8px] sm:text-[9px] font-bold text-outline uppercase tracking-widest text-center whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3.5 text-[8px] sm:text-[9px] font-bold text-outline uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {suppliers.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-[8px] sm:text-xs bg-emerald-50 text-emerald-700 border border-emerald-100`}>
                          {getInitials(row.companyName)}
                        </div>
                        <div>
                          <h5 className="text-[8px] sm:text-xs font-bold text-on-surface">
                            {row.companyName}
                          </h5>
                          <span className="text-[8px] font-mono text-gray-400">
                            {row.supplierCode}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-4">
                      <div className="space-y-0.5">
                        <div className="text-[8px] sm:text-xs font-semibold text-gray-700">
                          {row.contactPerson || "—"}
                        </div>
                        <div className="flex items-center gap-1 text-[7px] sm:text-[10px] font-bold text-on-surface-variant truncate">
                          <Phone size={10} className="text-outline flex-shrink-0" />
                          <span className="truncate">{row.phone}</span>
                        </div>
                        {row.email && (
                          <div className="flex items-center gap-1 text-[7px] sm:text-[10px] font-bold text-outline truncate">
                            <Mail size={10} className="text-outline flex-shrink-0" />
                            <span className="truncate">{row.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-4">
                      <div className="flex items-center gap-1 text-[7px] sm:text-[10px] font-bold text-on-surface-variant">
                        <MapPin size={10} className="text-outline flex-shrink-0" />
                        <span className="truncate">
                          {row.address ? `${row.address}, ` : ""}
                          {row.city || row.state || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-4 text-center text-[8px] sm:text-xs font-bold text-on-surface">
                      {row.ordersCount}
                    </td>
                    <td className="px-2 sm:px-4 py-4 text-center">
                      <span className={`text-[7px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${row.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-right relative">
                      <button
                        onClick={() => setActiveActionsMenu(activeActionsMenu === row.id ? null : row.id)}
                        className="p-1 sm:p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors cursor-pointer"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {/* Floating Actions dropdown */}
                      {activeActionsMenu === row.id && (
                        <div className="absolute right-6 mt-1 w-32 bg-white border border-surface-container rounded-xl shadow-lg z-30 py-1 text-left text-[11px] font-semibold text-gray-700">
                          <button
                            onClick={() => {
                              setSelectedSupplier(row);
                              setShowDetailModal(true);
                              setActiveActionsMenu(null);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye size={12} /> View details
                          </button>
                          <button
                            onClick={() => {
                              openEditModal(row);
                              setActiveActionsMenu(null);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 size={12} /> Edit fields
                          </button>
                          <button
                            onClick={() => {
                              handleToggleStatus(row);
                              setActiveActionsMenu(null);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Truck size={12} /> {row.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSupplier(row);
                              setShowDeleteConfirm(true);
                              setActiveActionsMenu(null);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-1.5 border-t border-gray-100 cursor-pointer"
                          >
                            <Trash2 size={12} /> Deactivate (Del)
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Pagination */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-surface-container-low/30 flex items-center justify-between border-t border-surface-container">
          <p className="text-[8px] sm:text-[10px] text-outline font-bold uppercase tracking-wider">
            Page {page} of {totalPages || 1}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Regional Supply Distribution + Alerts widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white p-4 sm:p-8 rounded-3xl border border-surface-container shadow-sm space-y-6 sm:space-y-8">
          <h3 className="text-base sm:text-lg font-bold font-headline text-on-surface">
            Regional Supply Distribution
          </h3>
          <div className="space-y-4 sm:space-y-6">
            {regions.map((bar, i) => (
              <div key={i} className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-on-surface-variant">{bar.label}</span>
                  <span className="text-primary">{bar.value}</span>
                </div>
                <div className="w-full bg-surface-container-low h-2 sm:h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${bar.color}`}
                    style={{ width: bar.value }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock alerts widget container */}
        <div className="bg-emerald-50 p-4 sm:p-6 rounded-3xl border border-emerald-100 flex flex-col justify-center items-center text-center space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-4 bg-white rounded-full shadow-sm text-emerald-600">
            <Truck size={24} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-emerald-900">Stock Alerts</h4>
            {stockAlerts.length === 0 ? (
              <p className="text-[8px] sm:text-xs font-medium text-emerald-700 mt-1">
                No suppliers have pending stock alerts.
              </p>
            ) : (
              <p className="text-[8px] sm:text-xs font-medium text-emerald-700 mt-1">
                {stockAlerts[0].affectedMedicines} items are running low on stock from {stockAlerts[0].supplierName}.
              </p>
            )}
          </div>
          <button
            onClick={() => {
              if (stockAlerts.length > 0) {
                alert(`Preparing purchase review workspace for ${stockAlerts[0].supplierName}.`);
              } else {
                alert("Inventory levels currently optimal.");
              }
            }}
            className="px-4 sm:px-6 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[8px] sm:text-xs font-bold hover:scale-105 active:scale-95 transition-all w-fit cursor-pointer"
          >
            Review Order
          </button>
        </div>
      </div>

      {/* ─── ADD / EDIT DIALOG MODAL OVERLAY ────────────────────────────────────── */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddEditModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-success-pulse border border-surface-container">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                  {modalMode === "add" ? "Register New Supplier" : "Edit Supplier Credentials"}
                </h2>
                <p className="text-[10px] sm:text-xs text-gray-400">
                  Complete required (*) fields to sync supplier info
                </p>
              </div>
              <button
                onClick={() => setShowAddEditModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={form.companyName}
                    onChange={handleInputChange}
                    placeholder="e.g. Acme Pharmaceuticals"
                    required
                    className="border border-surface-container rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={form.contactPerson}
                    onChange={handleInputChange}
                    placeholder="e.g. John Doe"
                    className="border border-surface-container rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +1 (555) 012-3456"
                    required
                    className="border border-surface-container rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="e.g. info@acme.com"
                    className="border border-surface-container rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  Address Line
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleInputChange}
                  placeholder="e.g. 100 Industrial Parkway"
                  className="border border-surface-container rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">City</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Boston"
                    className="border border-surface-container rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">State</label>
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleInputChange}
                    placeholder="e.g. MA"
                    className="border border-surface-container rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={form.country}
                    onChange={handleInputChange}
                    placeholder="e.g. USA"
                    className="border border-surface-container rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleInputChange}
                    placeholder="02111"
                    className="border border-surface-container rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Tax Number / VAT</label>
                  <input
                    type="text"
                    name="taxNumber"
                    value={form.taxNumber}
                    onChange={handleInputChange}
                    placeholder="TX-112233"
                    className="border border-surface-container rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Website URL</label>
                  <input
                    type="text"
                    name="website"
                    value={form.website}
                    onChange={handleInputChange}
                    placeholder="www.acme.com"
                    className="border border-surface-container rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {modalMode === "edit" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                    className="border border-surface-container rounded-xl px-3 py-2 text-xs outline-none bg-white focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">General Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Optional log details or notes about this supplier..."
                  className="border border-surface-container rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 px-4 py-2 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2 bg-primary hover:bg-emerald-700 text-on-primary font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? "Saving..." : "Save details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SUPPLIER DETAILS VIEWER DIALOG OVERLAY ────────────────────────────── */}
      {showDetailModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden border border-surface-container animate-success-pulse">
            <div className="flex items-center justify-between px-6 py-5 border-b border-surface-container bg-surface-container-low/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                  {getInitials(selectedSupplier.companyName)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">{selectedSupplier.companyName}</h3>
                  <span className="text-[9px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                    {selectedSupplier.supplierCode}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Status</span>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 font-bold rounded-full ${selectedSupplier.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {selectedSupplier.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Contact Name</span>
                  <div className="mt-1 text-gray-800 font-semibold">{selectedSupplier.contactPerson || "—"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Phone</span>
                  <div className="mt-1 text-gray-800 font-semibold flex items-center gap-1">
                    <Phone size={12} className="text-gray-400" /> {selectedSupplier.phone}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Email</span>
                  <div className="mt-1 text-gray-800 font-semibold flex items-center gap-1">
                    <Mail size={12} className="text-gray-400" /> {selectedSupplier.email || "—"}
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-100 pb-3">
                <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Address Location</span>
                <div className="mt-1 text-gray-800 font-semibold flex items-start gap-1">
                  <MapPin size={12} className="text-gray-400 mt-0.5" />
                  <div>
                    {selectedSupplier.address ? `${selectedSupplier.address}, ` : ""}
                    {selectedSupplier.city ? `${selectedSupplier.city}, ` : ""}
                    {selectedSupplier.state ? `${selectedSupplier.state} ` : ""}
                    {selectedSupplier.postalCode ? `(${selectedSupplier.postalCode})` : ""}
                    {selectedSupplier.country ? `, ${selectedSupplier.country}` : ""}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Website</span>
                  <div className="mt-1 text-gray-800 font-semibold flex items-center gap-1">
                    <Globe size={12} className="text-gray-400" /> {selectedSupplier.website || "—"}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider">VAT / Tax Number</span>
                  <div className="mt-1 text-gray-800 font-semibold flex items-center gap-1">
                    <FileText size={12} className="text-gray-400" /> {selectedSupplier.taxNumber || "—"}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Log / Notes</span>
                <p className="mt-1 bg-gray-50 border border-gray-100 rounded-xl p-3 text-gray-600 leading-relaxed font-medium">
                  {selectedSupplier.notes || "No general notes logged for this supplier."}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-surface-container flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Close dialog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIRM DEACTIVATE/DELETE DIALOG MODAL ────────────────────────────── */}
      {showDeleteConfirm && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-surface-container p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Deactivate Supplier?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to remove this supplier? This will set their status to INACTIVE.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
              >
                Confirm deactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersSection;
