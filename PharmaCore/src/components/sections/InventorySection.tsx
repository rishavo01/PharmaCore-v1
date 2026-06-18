// import React from 'react';
import React, { useEffect, useState } from "react";
import { 
  Package2, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Tags, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  TrendingUp,
  History,
  MoreVertical,
  Edit2,
  Trash2
} from 'lucide-react';

const InventorySection = () => {
  interface Medicine {
  id: number;
  name: string;
  category: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  expiryDate: string;
  createdAt: string;
}

const [medicines, setMedicines] = useState<Medicine[]>([]);
const [isAddModalOpen, setIsAddModalOpen] = useState(false);
const [editingId, setEditingId] = useState<number | null>(null);
const [suggestions, setSuggestions] = useState([]);
const [search, setSearch] = useState("");
const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
const [showFilter, setShowFilter] = useState(false);
const [selectedCategory, setSelectedCategory] = useState("All");
const [activeActionsMenu, setActiveActionsMenu] = useState<number | null>(null);




const [formData, setFormData] = useState({
  name: "",
  category: "",
  quantity:0,
  buyPrice: 0,
  sellPrice: 0,
  expiryDate: "",
});

// Fetch all medicines
const fetchMedicines = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/medicines");
    const data = await res.json();
    setMedicines(data);
  } catch (error) {
    console.error(error);
  }
};

// Save new medicine
const handleSaveMedicine = async () => {
  try {
    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      quantity: Number(formData.quantity),
      buyPrice: Number(formData.buyPrice),
      sellPrice: Number(formData.sellPrice),
      expiryDate: formData.expiryDate,
    };

    console.log("editingId:", editingId);
    console.log("payload:", payload);

    if (!payload.name) {
      alert("Medicine name is required");
      return;
    }

    if (!payload.expiryDate) {
      alert("Expiry date is required");
      return;
    }

    const url = editingId
      ? `http://localhost:5000/api/medicines/${editingId}`
      : "http://localhost:5000/api/medicines";

    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to save medicine");
    }

    await fetchMedicines();

    setIsAddModalOpen(false);
    setEditingId(null);

    setFormData({
      name: "",
      category: "",
      quantity: 0,
      buyPrice: 0,
      sellPrice: 0,
      expiryDate: "",
    });
  } catch (err) {
    console.error(err);
    alert("Failed to save medicine");
  }
};


// Edit medicine (placeholder)
const handleEditMedicine = (medicine: Medicine) => {
  setEditingId(medicine.id);

  setFormData({
    name: medicine.name,
    category: medicine.category,
    quantity: medicine.quantity,
    buyPrice: medicine.buyPrice,
    sellPrice: medicine.sellPrice,
    expiryDate: medicine.expiryDate.split("T")[0],
  });

  setIsAddModalOpen(true);
};

// Delete medicine
const handleDeleteMedicine = async (id: number) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this medicine?"
  );

  if (!confirmed) return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/medicines/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!res.ok) {
      throw new Error("Failed to delete medicine");
    }

    await fetchMedicines();
  } catch (error) {
    console.error(error);
  }
};

const fetchSuggestions = async (value: string) => {
  if (value.trim().length < 2) {
    setSuggestions([]);
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:5000/api/medicines/search?q=${value}`
    );

    const data = await res.json();
    setSuggestions(data);
  } catch (error) {
    console.error(error);
  }
};
const handleSearch = async (value: string) => {
  setSearch(value);

  if (value.trim().length < 2) {
    setSearchSuggestions([]);
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:5000/api/medicines/search?q=${value}`
    );

    const data = await res.json();
    setSearchSuggestions(data);
  } catch (err) {
    console.error(err);
  }
};




// Load medicines on component mount
useEffect(() => {
  fetchMedicines();
}, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const totalSKU = medicines.length;

  const stockValue = medicines.reduce(
    (sum, item) => sum + item.quantity * item.sellPrice,
    0
  );

  const lowStockCount = medicines.filter(
    (item) => item.quantity <= 20
  ).length;

  const expiredCount = medicines.filter(
    (item) => new Date(item.expiryDate) < new Date()
  ).length;
      
  return (
    
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-headline text-on-surface tracking-tight">Inventory Management</h1>
          <p className="text-on-surface-variant mt-1 text-xs sm:text-sm font-medium">Real-time tracking of clinical pharmaceutical stock.</p>
        </div>
<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
  {/* Search Box */}
  <div className="relative group flex-1 sm:flex-none">
    <Search
      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
      size={18}
    />

    <input
      type="text"
      value={search}
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="Search medicines..."
      className="w-full bg-white border border-surface-container rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
    />

    {/* Suggestions Dropdown */}
    {searchSuggestions.length > 0 && (
  <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
    {searchSuggestions.map((item: any) => (
      <div
        key={item.id}
        onClick={() => {
          setSearch(item.name);
          setSearchSuggestions([]);
        }}
        className="cursor-pointer px-4 py-3 hover:bg-emerald-50 border-b last:border-b-0"
      >
        <div className="font-semibold">{item.name}</div>
        <div className="text-xs text-gray-500">
          {item.category} • Stock: {item.quantity}
        </div>
      </div>
    ))}
  </div>
)}
    
  </div>

{/* Filter Button */}
<div className="relative">
  <button
    onClick={() => setShowFilter(!showFilter)}
    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-surface-container rounded-xl text-xs font-bold text-on-surface shadow-sm hover:bg-gray-50"
  >
    <Filter size={16} className="text-outline flex-shrink-0" />
    <span className="hidden sm:inline">Filter</span>
  </button>

  {showFilter && (
    <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
      {[
        "All",
        "Antibiotics",
        "Analgesic",
        "Antiviral",
        "Vitamin",
        "Capsule",
      ].map((category) => (
        <button
          key={category}
          onClick={() => {
            setSelectedCategory(category);
            setShowFilter(false);
          }}
          className={`w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 ${
            selectedCategory === category
              ? "bg-emerald-100 font-semibold text-emerald-700"
              : ""
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  )}
</div>



  {/* Add Medicine Button */}
  <button
    onClick={() => setIsAddModalOpen(true)}
    className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:opacity-90"
  >
    <Plus size={16} className="flex-shrink-0" />
    <span>Add Medicine</span>
  </button>
</div>



      </div>

      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-surface-container shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Package2 size={18} className="sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700">+12%</span>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[9px] sm:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Total SKU</p>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold font-headline text-on-surface mt-1 tracking-tight">{totalSKU}</h2>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-surface-container shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp size={18} className="sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700">Healthy</span>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[9px] sm:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Stock Value</p>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold font-headline text-on-surface mt-1 tracking-tight"> {stockValue.toLocaleString()}</h2>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-3xl border-2 border-orange-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 sm:p-2.5 rounded-xl bg-orange-50 text-orange-600">
              <AlertCircle size={18} className="sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg bg-orange-100 text-orange-700">Critical</span>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[9px] sm:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Low Stock</p>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold font-headline text-on-surface mt-1 tracking-tight">{lowStockCount} Items</h2>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-3xl border-2 border-rose-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <History size={18} className="sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-100 text-rose-700">Urgent</span>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[9px] sm:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Expired</p>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold font-headline text-on-surface mt-1 tracking-tight">{expiredCount} Batches</h2>
          </div>
        </div>
      </div>

      {/* Product Registry */}

<div className="bg-white rounded-3xl border border-surface-container shadow-sm overflow-hidden">
  <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-surface-container bg-surface-container-low/20">
    <h3 className="text-base sm:text-lg font-bold font-headline text-on-surface uppercase tracking-tight">
      Product Registry
    </h3>

    <div className="flex items-center gap-2 sm:gap-3">
      <button className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-surface-container-low rounded-lg text-[9px] sm:text-[10px] font-bold text-on-surface-variant">
        <Download size={13} className="sm:w-3.5 sm:h-3.5" />
        <span className="hidden sm:inline">Export</span>
      </button>

      <button className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-surface-container-low rounded-lg text-[9px] sm:text-[10px] font-bold text-on-surface-variant">
        <Tags size={13} className="sm:w-3.5 sm:h-3.5" />
        <span className="hidden sm:inline">Labels</span>
      </button>
    </div>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full text-left min-w-[700px]">
      <thead>
        <tr className="bg-surface-container-low/30 border-b border-surface-container">
          <th className="px-3 sm:px-6 py-3.5 text-[8px] sm:text-[9px] font-bold text-outline uppercase tracking-widest text-left">
            Medicine Details
          </th>

          <th className="px-2 sm:px-4 py-3.5 text-[8px] sm:text-[9px] font-bold text-outline uppercase tracking-widest text-center whitespace-nowrap">
            Category
          </th>

          <th className="px-2 sm:px-4 py-3.5 text-[8px] sm:text-[9px] font-bold text-outline uppercase tracking-widest text-left">
            Stock Level
          </th>

          <th className="px-2 sm:px-4 py-3.5 text-[8px] sm:text-[9px] font-bold text-outline uppercase tracking-widest text-right whitespace-nowrap">
            Unit Price
          </th>

          <th className="px-2 sm:px-4 py-3.5 text-[8px] sm:text-[9px] font-bold text-outline uppercase tracking-widest text-center whitespace-nowrap">
            Expiry Date
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
        {medicines
          .filter((row) => {
            const matchesSearch =
              search === "" ||
              row.name.toLowerCase().includes(search.toLowerCase());

            const matchesCategory =
              selectedCategory === "All" ||
              row.category === selectedCategory;

            return matchesSearch && matchesCategory;
          })
          .map((row) => {
            const expired = new Date(row.expiryDate) < new Date();
            const lowStock = row.quantity <= 20;

            const color = expired
              ? "bg-rose-100 text-rose-700"
              : lowStock
              ? "bg-orange-100 text-orange-700"
              : "bg-emerald-100 text-emerald-700";

            return (
              <tr
                key={row.id}
                className="hover:bg-surface-container-low/20 transition-colors"
              >
                {/* Medicine Details */}
                <td className="px-3 sm:px-6 py-4">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-[8px] sm:text-xs border ${
                        expired
                          ? "bg-rose-50 text-rose-700 border-rose-100"
                          : lowStock
                          ? "bg-orange-50 text-orange-700 border-orange-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      }`}
                    >
                      {getInitials(row.name)}
                    </div>

                    <div>
                      <h5 className="text-[8px] sm:text-xs font-bold text-on-surface">
                        {row.name}
                      </h5>
                      <span className="text-[8px] font-mono text-gray-400 block mt-0.5">
                        MED-{row.id}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="px-2 sm:px-4 py-4 text-center text-[8px] sm:text-xs font-semibold text-gray-700">
                  {row.category}
                </td>

                {/* Stock Level */}
                <td className="px-2 sm:px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-surface-container-low h-2 rounded-full overflow-hidden border border-surface-container/50">
                      <div
                        className={`h-full rounded-full ${
                          lowStock ? "bg-orange-500" : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${Math.min(row.quantity, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[8px] sm:text-xs font-bold text-on-surface w-6 text-right">
                      {row.quantity}
                    </span>
                  </div>
                </td>

                {/* Unit Price */}
                <td className="px-2 sm:px-4 py-4 text-right text-[8px] sm:text-xs font-bold text-on-surface">
                  Rs. {row.sellPrice}
                </td>

                {/* Expiry Date */}
                <td className="px-2 sm:px-4 py-4 text-center text-[8px] sm:text-xs font-semibold text-gray-700">
                  {new Date(row.expiryDate).toLocaleDateString()}
                </td>

                {/* Status */}
                <td className="px-2 sm:px-4 py-4 text-center">
                  <span
                    className={`text-[7px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${color}`}
                  >
                    {expired
                      ? "Expired"
                      : lowStock
                      ? "Low Stock"
                      : "Active"}
                  </span>
                </td>

                {/* Actions */}
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
                          handleEditMedicine(row);
                          setActiveActionsMenu(null);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteMedicine(row.id);
                          setActiveActionsMenu(null);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-1.5 border-t border-gray-100 cursor-pointer"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  </div>
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-surface-container-low/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-surface-container">
          <p className="text-[8px] sm:text-[10px] text-outline font-bold uppercase tracking-wider">Showing 1-10 of 1,429</p>
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto">
            <button className="p-1 sm:p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-all flex-shrink-0">
              <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
            </button>
            <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary text-on-primary text-[9px] sm:text-[10px] font-bold shadow-md shadow-primary/20 flex-shrink-0">1</button>
            <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-on-surface hover:bg-surface-container text-[9px] sm:text-[10px] font-bold flex-shrink-0">2</button>
            <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-on-surface hover:bg-surface-container text-[9px] sm:text-[10px] font-bold flex-shrink-0">
            3
          </button>

          <span className="px-1 text-outline text-[8px] sm:text-xs flex-shrink-0">
            ...
          </span>

          <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-on-surface hover:bg-surface-container text-[9px] sm:text-[10px] font-bold flex-shrink-0">
            143
          </button>

          <button className="p-1 sm:p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-all flex-shrink-0">
            <ChevronRight size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>

{isAddModalOpen && (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-lg p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Add New Medicine</h2>
          <p className="text-xs text-gray-500 mt-0.5">Register a new pharmaceutical product to the inventory.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(false)}
          className="text-gray-400 hover:text-gray-700 text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5">

        {/* General Information */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-3">
            General Information
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Medicine Name</label>
              <div className="relative">
  <input
    type="text"
    value={formData.name}
    onChange={async (e) => {
      const value = e.target.value;

      setFormData({
        ...formData,
        name: value,
      });

      if (value.length >= 2) {
        try {
          const res = await fetch(
            `http://localhost:5000/api/medicines/search?q=${value}`
          );

          const data = await res.json();
          setSuggestions(data);
        } catch (error) {
          console.error(error);
        }
      } else {
        setSuggestions([]);
      }
    }}
    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
  />

  {suggestions.length > 0 && (
    <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-gray-200 bg-white shadow-lg">
      {suggestions.map((item: any) => (
        <div
          key={item.id}
          className="cursor-pointer px-3 py-2 hover:bg-emerald-50 border-b last:border-b-0"
          onClick={() => {
            setFormData({
              ...formData,
              name: item.name,
              category: item.category,
            });

            setSuggestions([]);
          }}
        >
          <div className="font-medium">{item.name}</div>
          <div className="text-xs text-gray-500">
            {item.category} • Stock: {item.quantity}
          </div>
        </div>
      ))}
    </div>
  )}
</div>



            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Category</label>
             <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value,
                  })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
              >
                <option value="">Select Category</option>
                <option value="Antibiotics">Antibiotics</option>
                <option value="Analgesic">Analgesic</option>
                <option value="Antiviral">Antiviral</option>
                <option value="Vitamin">Vitamin</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-3">
            <label className="text-xs font-medium text-gray-700">SKU / Batch Number</label>
            <input
              type="text"
              placeholder="SKU-XXX-000"
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Inventory Details */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-3">
            Inventory Details
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Initial Stock Level</label>
              <div className="relative">
                <input
                    type="number"
                    value={formData.quantity === 0 ? "" : formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="Enter stock"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-14 text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                  UNITS
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Expiry Date</label>
              <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expiryDate: e.target.value,
                    })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-3">
            Pricing
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Unit Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400"> </span>
                <input
                    type="number"
                    value={formData.sellPrice === 0 ? "" : formData.sellPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellPrice: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="Enter Price"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Tax Rate (%)</label>
              <input
                type="number"
                placeholder="0"
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t px-6 py-4">
        <button
          onClick={() => setIsAddModalOpen(false)}
          className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
            <button
              onClick={handleSaveMedicine}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save Medicine
            </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
};

export default InventorySection;