import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Search,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Printer,
  User,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

interface Medicine {
  id: number;
  name: string;
  category: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  expiryDate: string;
}

interface CartItem {
  id: number;
  name: string;
  exp: string;
  qty: number;
  price: number;
}

const BillingSection = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [taxRate, setTaxRate] = useState(5); // Default 5%
  const [discountInput, setDiscountInput] = useState("0"); // e.g. 10 or 5%
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  // Customer workflow states
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [editCustomerEnabled, setEditCustomerEnabled] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Dropdown Autocomplete suggestions states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFromSuggestions, setSelectedFromSuggestions] = useState(false);
  const [highlightSuccess, setHighlightSuccess] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Debounced search logic for phone lookups
  useEffect(() => {
    if (selectedFromSuggestions) {
      setSelectedFromSuggestions(false);
      return;
    }

    const cleanPhone = customerPhone.trim();
    if (!cleanPhone) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsExistingCustomer(false);
      setLookupMessage("");
      return;
    }

    setIsLookingUp(true);
    setLookupMessage("");

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/customers/search?phone=${cleanPhone}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);

          if (data.length === 0) {
            setIsExistingCustomer(false);
            setLookupMessage("⚠ No existing customer found. Please enter customer details to create a new customer.");
            setCustomerName("");
            setCustomerEmail("");
            setCustomerAddress("");
            setEditCustomerEnabled(true);
          } else {
            setLookupMessage("");
          }
        }
      } catch (err) {
        console.error("Lookup error:", err);
      } finally {
        setIsLookingUp(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [customerPhone]);

  // Execute direct lookup if 10 digits completed
  const handleImmediateSearch = async (phoneVal: string) => {
    try {
      setIsLookingUp(true);
      const res = await fetch(`http://localhost:5000/api/customers/search?phone=${phoneVal}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
        if (data.length === 0) {
          setIsExistingCustomer(false);
          setLookupMessage("⚠ No existing customer found. Please enter customer details to create a new customer.");
          setCustomerName("");
          setCustomerEmail("");
          setCustomerAddress("");
          setEditCustomerEnabled(true);
        } else {
          setLookupMessage("");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLookingUp(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/medicines");
      const data = await res.json();
      setMedicines(data);
    } catch (err) {
      console.error(err);
    }
  };

  const onPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cleanVal = val.replace(/\D/g, "");
    setCustomerPhone(cleanVal);
    if (cleanVal.length === 10) {
      setSelectedFromSuggestions(false);
      handleImmediateSearch(cleanVal);
    }
  };

  const handleSelectCustomer = (cust: any) => {
    setSelectedFromSuggestions(true);
    setCustomerPhone(cust.phone);
    setCustomerName(cust.name);
    setCustomerEmail(cust.email || "");
    setCustomerAddress(cust.address || "");
    setIsExistingCustomer(true);
    setEditCustomerEnabled(false);
    setLookupMessage("");
    setShowSuggestions(false);
    
    // Highlight pulse effect on card selection
    setHighlightSuccess(true);
    setTimeout(() => {
      setHighlightSuccess(false);
    }, 1500);
  };

  const handleSwitchCustomer = () => {
    setCustomerPhone("");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerAddress("");
    setIsExistingCustomer(false);
    setEditCustomerEnabled(false);
    setLookupMessage("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const addToCart = (medicine: Medicine) => {
    const existing = cart.find((item) => item.id === medicine.id);
    const existingQty = existing ? existing.qty : 0;
    if (medicine.quantity <= existingQty) {
      alert(`Cannot add more. Only ${medicine.quantity} units available in stock.`);
      return;
    }

    setCart((prev) => {
      if (existing) {
        return prev.map((item) =>
          item.id === medicine.id ? { ...item, qty: item.qty + 1 } : item
        );
      }

      return [
        ...prev,
        {
          id: medicine.id,
          name: medicine.name,
          exp: new Date(medicine.expiryDate).toLocaleDateString(),
          qty: 1,
          price: medicine.sellPrice,
        },
      ];
    });
  };

  const increaseQty = (id: number) => {
    const medicine = medicines.find((m) => m.id === id);
    const existing = cart.find((item) => item.id === id);
    if (medicine && existing && medicine.quantity <= existing.qty) {
      alert(`Cannot exceed stock level. Available: ${medicine.quantity}`);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const decreaseQty = (id: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0)
    );
  };

  // Pricing calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * (taxRate / 100);

  let discountAmount = 0;
  if (discountInput.endsWith("%")) {
    const pct = parseFloat(discountInput.slice(0, -1)) || 0;
    discountAmount = subtotal * (pct / 100);
  } else {
    discountAmount = parseFloat(discountInput) || 0;
  }

  const total = Math.max(0, subtotal + tax - discountAmount);

  // Print Redesigned Invoice PDF Layout with notes field
  const generateInvoice = (sale: any) => {
    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
    });

    const margin = 20;
    let y = 25;

    doc.setFont("courier", "bold");
    doc.setFontSize(18);
    doc.text("PharmaCore Pharmacy", 105, y, { align: "center" });
    y += 6;
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    doc.text("Pharmacy Management System", 105, y, { align: "center" });
    y += 8;

    doc.text("-------------------------------------------------------------------------", 105, y, { align: "center" });
    y += 8;

    doc.text(`Invoice #: ${sale.invoiceNumber}`, margin, y);
    y += 6;
    doc.text(`Date & Time: ${new Date(sale.createdAt).toLocaleString()}`, margin, y);
    y += 6;
    doc.text(`Customer Name: ${sale.customerName}`, margin, y);
    y += 6;
    doc.text(`Phone Number: ${customerPhone}`, margin, y);
    y += 6;
    doc.text(`Payment Method: ${sale.paymentMethod}`, margin, y);
    y += 8;

    doc.text("-------------------------------------------------------------------------", 105, y, { align: "center" });
    y += 6;

    doc.setFont("courier", "bold");
    doc.text("Medicine", margin, y);
    doc.text("Qty", 120, y, { align: "center" });
    doc.text("Price", 150, y, { align: "right" });
    doc.text("Total", 190, y, { align: "right" });
    y += 5;

    doc.setFont("courier", "normal");
    doc.text("-------------------------------------------------------------------------", 105, y, { align: "center" });
    y += 6;

    cart.forEach((item) => {
      const nameStr = item.name.length > 25 ? item.name.slice(0, 22) + "..." : item.name;
      doc.text(nameStr, margin, y);
      doc.text(item.qty.toString(), 120, y, { align: "center" });
      doc.text(`Rs.${item.price.toFixed(2)}`, 150, y, { align: "right" });
      doc.text(`Rs.${(item.qty * item.price).toFixed(2)}`, 190, y, { align: "right" });
      y += 6;
    });

    doc.text("-------------------------------------------------------------------------", 105, y, { align: "center" });
    y += 8;

    doc.text("Subtotal:", 120, y);
    doc.text(`Rs.${sale.subtotal.toFixed(2)}`, 190, y, { align: "right" });
    y += 6;

    doc.text(`VAT (${taxRate}%):`, 120, y);
    doc.text(`Rs.${sale.tax.toFixed(2)}`, 190, y, { align: "right" });
    y += 6;

    doc.text("Discount:", 120, y);
    doc.text(`-Rs.${sale.discount.toFixed(2)}`, 190, y, { align: "right" });
    y += 6;

    doc.text("-------------------------------------", 190, y, { align: "right" });
    y += 6;

    doc.setFont("courier", "bold");
    doc.text("Grand Total:", 120, y);
    doc.text(`Rs.${sale.totalAmount.toFixed(2)}`, 190, y, { align: "right" });
    y += 10;

    // Append Clinical Notes to Receipt PDF
    if (notes.trim()) {
      doc.setFont("courier", "bold");
      doc.text("Clinical Notes:", margin, y);
      y += 5;
      doc.setFont("courier", "normal");
      const splitNotes = doc.splitTextToSize(notes.trim(), 170);
      splitNotes.forEach((line: string) => {
        doc.text(line, margin, y);
        y += 5;
      });
      y += 5;
    }

    doc.setFont("courier", "normal");
    doc.text("-------------------------------------------------------------------------", 105, y, { align: "center" });
    y += 8;

    doc.text("Thank you for your purchase!", 105, y, { align: "center" });
    y += 6;
    doc.text("Visit Again.", 105, y, { align: "center" });
    y += 8;
    doc.text("-------------------------------------------------------------------------", 105, y, { align: "center" });

    doc.save(`Invoice-${sale.invoiceNumber}.pdf`);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 10) {
      alert("A valid 10-digit Phone Number is required before checkout.");
      return;
    }
    if (!customerName.trim()) {
      alert("Patient/Customer Name is required.");
      return;
    }

    setLoading(true);
    const wasNew = !isExistingCustomer;
    try {
      const saleData = {
        customerPhone: customerPhone.trim(),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerAddress: customerAddress.trim(),
        paymentMethod: paymentMethod === "cash" ? "Cash" : "Online",
        status: "Completed",
        discount: discountAmount,
        taxRate: taxRate,
        items: cart.map((item) => ({
          medicineId: item.id,
          quantity: item.qty,
        })),
        clinicalNotes: notes.trim(),
      };

      const res = await fetch("http://localhost:5000/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to complete transaction.");
      }

      generateInvoice(data);
      setCart([]);
      fetchMedicines();
      setNotes("");
      handleSwitchCustomer();

      // Dispatch event to sync panels in real time
      window.dispatchEvent(new Event("salesUpdated"));

      if (wasNew) {
        alert(`✅ Customer created successfully.\nTransaction completed successfully! Invoice: ${data.invoiceNumber}`);
      } else {
        alert(`Transaction completed successfully! Invoice: ${data.invoiceNumber}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error processing checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-12rem)] gap-4 sm:gap-6 overflow-hidden">
      {/* Left: Medicine Selection */}
      <div className="flex-1 bg-white rounded-3xl border border-surface-container shadow-sm flex flex-col overflow-hidden lg:h-full">
        <div className="p-3 sm:p-6 border-b border-surface-container">
          <h3 className="text-xs sm:text-sm font-bold text-outline uppercase tracking-widest mb-3">Medicines</h3>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find medicine..."
              className="w-full bg-surface-container-low border border-surface-container rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
          {medicines
            .filter((med) => med.name.toLowerCase().includes(search.toLowerCase()))
            .map((med) => (
              <button
                key={med.id}
                onClick={() => addToCart(med)}
                className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h4 className="truncate text-xs sm:text-sm font-bold">{med.name}</h4>
                    <p className="text-[10px] sm:text-xs text-gray-500">{med.category}</p>
                    <p className="text-xs sm:text-sm font-bold">Rs. {med.sellPrice}</p>
                    <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-semibold text-green-700">
                      Stock: {med.quantity}
                    </span>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Middle: Cart */}
      <div className="flex-[1.2] bg-white rounded-3xl border border-surface-container shadow-sm flex flex-col overflow-hidden lg:h-full">
        <div className="p-3 sm:p-6 border-b border-surface-container flex justify-between items-center">
          <h3 className="text-xs sm:text-sm font-bold text-on-surface-variant uppercase tracking-widest">Cart</h3>
          <button
            onClick={() => setCart([])}
            className="group flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[8px] sm:text-[10px] font-bold text-rose-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Trash2
              size={12}
              className="sm:w-3.5 sm:h-3.5 transition-all duration-300 group-hover:rotate-12 group-hover:-translate-y-0.5 group-hover:text-rose-600"
            />
            <span className="transition-all duration-200 group-hover:tracking-wider">CLEAR</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 custom-scrollbar">
          <div className="grid grid-cols-12 gap-2 sm:gap-4 text-[7px] sm:text-[9px] font-bold text-outline uppercase tracking-widest border-b border-surface-container pb-2">
            <div className="col-span-6">Medicine</div>
            <div className="col-span-3 text-center">Qty</div>
            <div className="col-span-3 text-right">Total</div>
          </div>
          {cart.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 sm:gap-4 items-center">
              <div className="col-span-6 min-w-0">
                <h5 className="text-[7px] sm:text-xs font-bold text-on-surface truncate">{item.name}</h5>
                <p className="text-[7px] sm:text-[9px] text-emerald-600 font-bold mt-0.5 uppercase tracking-tighter">
                  EXP: {item.exp}
                </p>
              </div>
              <div className="col-span-3 flex items-center justify-center gap-1">
                <button
                  onClick={() => decreaseQty(item.id)}
                  className="p-0.5 sm:p-1 hover:bg-surface-container rounded-md text-outline"
                >
                  <Minus size={10} className="sm:w-3 sm:h-3" />
                </button>
                <span className="text-[7px] sm:text-xs font-bold text-on-surface">{item.qty}</span>
                <button
                  onClick={() => increaseQty(item.id)}
                  className="p-0.5 sm:p-1 hover:bg-surface-container rounded-md text-outline"
                >
                  <Plus size={10} className="sm:w-3 sm:h-3" />
                </button>
              </div>
              <div className="col-span-3 text-right">
                <div className="text-[7px] sm:text-xs font-bold text-on-surface">Rs.{(item.price * item.qty).toFixed(2)}</div>
                <div className="text-[6px] sm:text-[9px] text-outline font-bold">Rs.{item.price.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Summary Panel */}
      <div className="w-full lg:w-80 flex flex-col gap-4 sm:gap-6 lg:h-full">
        <div className="bg-white rounded-3xl border border-surface-container shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6 flex flex-col overflow-y-auto custom-scrollbar">
          <h3 className="text-xs sm:text-sm font-bold text-on-surface-variant uppercase tracking-widest">Order Summary</h3>

          {/* Customer Information Panel Card */}
          <div className={`p-4 rounded-3xl border border-surface-container shadow-sm space-y-4 transition-all duration-300 relative bg-surface-container-lowest ${highlightSuccess ? 'ring-4 ring-emerald-500 bg-emerald-50/10 scale-[1.02] shadow-emerald-100' : ''}`}>
            <div className="flex justify-between items-center border-b border-surface-container pb-2">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Customer Info</span>
              {customerPhone && (
                <button
                  type="button"
                  onClick={handleSwitchCustomer}
                  className="text-[9px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider"
                >
                  Switch Patient
                </button>
              )}
            </div>

            {/* Existing Customer Green Badge */}
            {isExistingCustomer && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/60 border border-emerald-200 rounded-xl px-2.5 py-1.5 animate-success-pulse">
                <span>✅</span> Existing Customer
              </div>
            )}

            {/* Phone Lookup Input */}
            <div className="flex flex-col gap-1 relative">
              <label className="text-[9px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
                <Phone size={10} className="text-gray-400" /> Phone Number *
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={onPhoneChange}
                placeholder="10-digit number"
                className="w-full bg-surface-container-low border border-surface-container rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-800 focus:border-primary/50"
              />
              {isLookingUp && <p className="text-[8px] text-primary animate-pulse mt-0.5">Searching directory...</p>}
              
              {/* AutocompleteDropdown suggestions panel overlay */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-50 bg-white border border-surface-container rounded-2xl shadow-xl mt-1 overflow-hidden max-h-60 overflow-y-auto">
                  <div className="bg-surface-container-low px-3 py-1.5 text-[9px] font-bold text-outline uppercase border-b border-surface-container">
                    {suggestions.length === 1 ? "Existing Customer Found" : "Existing Customers Found"}
                  </div>
                  {suggestions.map((cust) => (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => handleSelectCustomer(cust)}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-gray-50 last:border-b-0 transition-colors flex flex-col gap-0.5 cursor-pointer"
                    >
                      <div className="flex justify-between items-center text-xs font-bold text-gray-900">
                        <span className="flex items-center gap-1">
                          👤 {cust.name}
                        </span>
                        <span className="text-gray-500 font-mono text-[10px]">📞 {cust.phone}</span>
                      </div>
                      {cust.email && (
                        <span className="text-[10px] text-gray-400 pl-4 block">✉ {cust.email}</span>
                      )}
                      {cust.address && (
                        <span className="text-[10px] text-gray-400 pl-4 block">📍 {cust.address}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Warning if Customer doesn't exist */}
            {lookupMessage && (
              <p className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-1 flex items-start gap-1">
                <span>⚠</span>
                <span>{lookupMessage}</span>
              </p>
            )}

            {/* Name Input */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
                  <User size={10} className="text-gray-400" /> Customer Name *
                </label>
                {isExistingCustomer && (
                  <button
                    type="button"
                    onClick={() => setEditCustomerEnabled(!editCustomerEnabled)}
                    className="text-[8px] text-primary hover:text-emerald-700 font-bold uppercase hover:underline"
                  >
                    {editCustomerEnabled ? "Lock Details" : "Edit Customer"}
                  </button>
                )}
              </div>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={isExistingCustomer && !editCustomerEnabled}
                placeholder="Enter customer name"
                className="w-full bg-surface-container-low border border-surface-container rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all text-gray-800"
              />
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
                <Mail size={10} className="text-gray-400" /> Email (Optional)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                disabled={isExistingCustomer && !editCustomerEnabled}
                placeholder="john@example.com"
                className="w-full bg-surface-container-low border border-surface-container rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all text-gray-800"
              />
            </div>

            {/* Address Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
                <MapPin size={10} className="text-gray-400" /> Address (Optional)
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                disabled={isExistingCustomer && !editCustomerEnabled}
                placeholder="Customer address"
                className="w-full bg-surface-container-low border border-surface-container rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all text-gray-800"
              />
            </div>
          </div>

          {/* Pricing Panel */}
          <div className="space-y-3">
            <div className="flex justify-between text-[8px] sm:text-xs font-bold">
              <span className="text-outline">Subtotal</span>
              <span className="text-on-surface">Rs.{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-[8px] sm:text-xs font-bold">
              <span className="text-outline">VAT</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-lg px-2 py-0.5 bg-white w-16">
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full bg-transparent text-center outline-none text-xs"
                  />
                  <span className="text-gray-500 text-xs">%</span>
                </div>
                <span className="font-bold text-gray-900">Rs.{tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[8px] sm:text-xs font-bold">
              <span className="text-outline">Discount</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-lg px-2 py-0.5 bg-white w-20">
                  <input
                    type="text"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    className="w-full bg-transparent text-center outline-none text-xs"
                    placeholder="0 or 5%"
                  />
                </div>
                <span className="text-rose-600 font-bold">-Rs.{discountAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-container flex justify-between items-end">
              <div>
                <p className="text-[8px] sm:text-[10px] font-bold text-outline uppercase tracking-widest">Grand Total</p>
                <h2 className="text-lg sm:text-2xl font-extrabold font-headline text-on-surface mt-1">
                  Rs.{total.toFixed(2)}
                </h2>
              </div>
              <span className="bg-emerald-100 text-emerald-700 text-[9px] sm:text-[11px] font-bold px-3 py-1 rounded-md">
                NPR PAID
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <p className="text-[8px] sm:text-[10px] font-bold text-outline uppercase tracking-widest">Payment Method</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 ${
                  paymentMethod === "cash"
                    ? "border-primary bg-emerald-50 text-primary"
                    : "border-surface-container text-outline hover:border-primary/30"
                }`}
              >
                <Banknote size={20} />
                <span className="text-xs font-bold">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("online")}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 ${
                  paymentMethod === "online"
                    ? "border-primary bg-emerald-50 text-primary"
                    : "border-surface-container text-outline hover:border-primary/30"
                }`}
              >
                <CreditCard size={20} />
                <span className="text-xs font-bold">Online</span>
              </button>
            </div>
          </div>

          {/* Clinical Notes TextArea */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-outline uppercase tracking-wider">
              Clinical Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add prescription notes, dosage instructions, allergies, or other clinical information..."
              className="w-full h-32 bg-surface-container-low border border-surface-container rounded-2xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-y min-h-[120px] max-h-[250px] text-gray-800 font-medium"
            />
          </div>

          {/* Generate Invoice Action */}
          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className={`w-full py-3 sm:py-4 bg-primary text-on-primary rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Printer size={16} className="sm:w-5 sm:h-5" />
              {loading ? "Processing..." : "Generate Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSection;
