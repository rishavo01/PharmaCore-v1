import React, { useEffect, useState } from "react";
import { 
  TrendingUp, 
  ShoppingCart, 
  LineChart, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar as CalendarIcon,
  Search,
  AlertCircle
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import {
  getReportSummary,
  getReportChart,
  getReportCategories,
  getReportTopMedicines,
  getReportExportUrl,
  ReportSummary,
  ChartPayload,
  CategoryData,
  TopMedicineData
} from "../../services/reportService";

const getTooltipLabel = (label: string, period: string) => {
  if (period === "daily") {
    return `Time: ${label}`;
  }
  if (period === "weekly") {
    const dayNamesMap: Record<string, string> = {
      Mon: "Monday",
      Tue: "Tuesday",
      Wed: "Wednesday",
      Thu: "Thursday",
      Fri: "Friday",
      Sat: "Saturday",
      Sun: "Sunday",
    };
    return dayNamesMap[label] || label;
  }
  if (period === "monthly") {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const currentMonth = monthNames[new Date().getMonth()];
    return `${currentMonth} ${label}`;
  }
  if (period === "yearly") {
    const monthNamesMap: Record<string, string> = {
      Jan: "January",
      Feb: "February",
      Mar: "March",
      Apr: "April",
      May: "May",
      Jun: "June",
      Jul: "July",
      Aug: "August",
      Sep: "September",
      Oct: "October",
      Nov: "November",
      Dec: "December",
    };
    return monthNamesMap[label] || label;
  }
  return label;
};

const CustomTooltip = ({ active, payload, label, period }: any) => {
  if (active && payload && payload.length) {
    const displayLabel = getTooltipLabel(label, period);
    return (
      <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-md text-xs text-left">
        <p className="font-bold text-gray-700 uppercase mb-1">{displayLabel}</p>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          <span className="text-gray-500">Revenue:</span>
          <span className="text-emerald-600 font-bold">
            Rs. {Number(payload[0].value).toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const ReportsSection = () => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [chartData, setChartData] = useState<{ day: string; value: number }[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [topMedicines, setTopMedicines] = useState<TopMedicineData[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [error, setError] = useState("");
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const data = await getReportSummary(period);
      setSummary(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load summary stats.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchChart = async () => {
    setLoadingChart(true);
    try {
      const payload = await getReportChart(period);
      const formatted = payload.labels.map((lbl, idx) => ({
        day: lbl,
        value: payload.revenue[idx] || 0
      }));
      setChartData(formatted);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingChart(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await getReportCategories(period);
      setCategories(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchTopMedicines = async () => {
    setLoadingMeds(true);
    try {
      const data = await getReportTopMedicines(period, debouncedSearch);
      setTopMedicines(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingMeds(false);
    }
  };

  const fetchAllReports = () => {
    setError("");
    fetchSummary();
    fetchChart();
    fetchCategories();
    fetchTopMedicines();
  };

  // Sync with period changes and salesUpdated events
  useEffect(() => {
    fetchAllReports();

    window.addEventListener("salesUpdated", fetchAllReports);
    return () => {
      window.removeEventListener("salesUpdated", fetchAllReports);
    };
  }, [period]);

  // Sync with search queries
  useEffect(() => {
    fetchTopMedicines();
  }, [debouncedSearch]);

  const handleExport = (format: "pdf" | "csv" | "xlsx") => {
    const url = getReportExportUrl(format, period);
    window.open(url, "_blank");
    setShowExportDropdown(false);
  };

  const isChartEmpty = chartData.length === 0 || chartData.every((d) => d.value === 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-headline text-on-surface tracking-tight">
              Reports & Analytics
            </h1>
            <p className="text-on-surface-variant mt-1 text-xs sm:text-sm font-medium">
              Operational insights and fiscal performance metrics.
            </p>
          </div>
          <div className="flex bg-surface-container-low p-1 rounded-xl border border-surface-container w-fit">
            {(["daily", "weekly", "monthly", "yearly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 sm:px-5 py-1.5 rounded-lg text-[8px] sm:text-xs font-semibold transition-colors cursor-pointer capitalize ${
                  period === p ? "bg-white shadow-sm text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {p === "daily" ? "Daily" : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 border border-red-100 text-xs font-semibold">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {loadingSummary && !summary ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="animate-pulse bg-white p-4 sm:p-6 rounded-3xl border border-surface-container shadow-sm space-y-4 h-36">
              <div className="w-8 h-8 bg-gray-100 rounded-xl"></div>
              <div className="h-4 bg-gray-100 rounded w-1/3"></div>
              <div className="h-6 bg-gray-100 rounded w-2/3"></div>
            </div>
          ))
        ) : (
          [
            { 
              icon: TrendingUp, 
              label: "Total Revenue", 
              value: `Rs.${(summary?.revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
              trend: `${(summary?.revenueDelta ?? 0) >= 0 ? "+" : ""}${summary?.revenueDelta}%`, 
              color: (summary?.revenueDelta ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600", 
              bg: (summary?.revenueDelta ?? 0) >= 0 ? "bg-emerald-50" : "bg-rose-50" 
            },
            { 
              icon: ShoppingCart, 
              label: "Total Sales", 
              value: `${(summary?.sales ?? 0).toLocaleString()} orders`, 
              trend: `${(summary?.salesDelta ?? 0) >= 0 ? "+" : ""}${summary?.salesDelta}%`, 
              color: (summary?.salesDelta ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600", 
              bg: (summary?.salesDelta ?? 0) >= 0 ? "bg-emerald-50" : "bg-rose-50" 
            },
            { 
              icon: LineChart, 
              label: "Net Profit", 
              value: `Rs.${(summary?.profit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
              trend: `${(summary?.profitDelta ?? 0) >= 0 ? "+" : ""}${summary?.profitDelta}%`, 
              color: (summary?.profitDelta ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600", 
              bg: (summary?.profitDelta ?? 0) >= 0 ? "bg-emerald-50" : "bg-rose-50" 
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 sm:p-6 rounded-3xl border border-surface-container shadow-sm space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <div className={`p-2 sm:p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={18} className="sm:w-5 sm:h-5" />
                </div>
                <span className={`text-[8px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg ${stat.bg} ${stat.color}`}>
                  {stat.trend}
                </span>
              </div>
              <div>
                <p className="text-[8px] sm:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{stat.label}</p>
                <h2 className="text-base sm:text-lg lg:text-2xl font-extrabold font-headline text-on-surface mt-1 tracking-tight">{stat.value}</h2>
              </div>
              <div className="w-full bg-surface-container-low h-1 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${stat.color.replace("text-", "bg-")}`} style={{ width: "65%" }}></div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Sales Performance Chart */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-8 rounded-3xl border border-surface-container shadow-sm relative">
          <div className="flex justify-between items-center gap-3 mb-6 sm:mb-10">
            <h3 className="text-base sm:text-lg font-bold font-headline text-on-surface capitalize">
              {period === "daily" ? "Daily" : period} Sales Performance
            </h3>
            <div className="relative">
              <button 
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="p-1.5 sm:p-2 hover:bg-surface-container rounded-lg text-outline transition-colors flex items-center gap-1.5 text-xs font-bold border border-surface-container cursor-pointer"
              >
                <Download size={16} className="sm:w-4.5 sm:h-4.5" />
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
          <div className="h-64 sm:h-80 lg:h-[350px] w-full relative">
            {isChartEmpty && !loadingChart && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span className="px-4 py-2 bg-white/95 backdrop-blur-xs rounded-xl border border-surface-container shadow-md text-xs font-semibold text-gray-500">
                  No sales data available for this period.
                </span>
              </div>
            )}
            {loadingChart ? (
              <div className="w-full h-full bg-gray-50 rounded-2xl animate-pulse flex items-center justify-center text-xs text-gray-400 font-semibold">
                Syncing performance timelines...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0A8F5A" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0A8F5A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 700, fill: "#64748b" }} 
                    dy={8}
                    tickFormatter={(v) => {
                      if (period === "daily") {
                        const hourNum = parseInt(v.split(":")[0]);
                        return hourNum % 2 === 0 ? v : "";
                      }
                      return v;
                    }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 700, fill: "#64748b" }} 
                    tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                  />
                  <Tooltip 
                    content={<CustomTooltip period={period} />}
                    cursor={{ stroke: "#0A8F5A", strokeWidth: 1, strokeDasharray: "3 3" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#0A8F5A" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Selling Categories */}
        <div className="bg-white p-4 sm:p-8 rounded-3xl border border-surface-container shadow-sm space-y-6 sm:space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-bold font-headline text-on-surface">Top Selling Categories</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <span className="text-[8px] sm:text-[9px] font-bold text-outline">Units</span>
            </div>
          </div>
          <div className="space-y-4 sm:space-y-6">
            {loadingCategories ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="space-y-2 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/12"></div>
                  </div>
                  <div className="w-full bg-gray-100 h-2 sm:h-2.5 rounded-full"></div>
                </div>
              ))
            ) : categories.length === 0 ? (
              <div className="text-center text-xs text-gray-400 py-12 font-semibold">
                No inventory logs available.
              </div>
            ) : (
              categories.map((cat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-on-surface-variant">{cat.label}</span>
                    <span className="text-on-surface">{cat.value}</span>
                  </div>
                  <div className="w-full bg-surface-container-low h-2 sm:h-2.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cat.color}`} style={{ width: cat.value }}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Selling Medicines Table */}
      <div className="bg-white rounded-3xl border border-surface-container shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-surface-container flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-base sm:text-lg font-bold font-headline text-on-surface">Top Selling Medicines</h3>
          <div className="relative group max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search top medicines..."
              className="w-full bg-white border border-surface-container rounded-xl py-1.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="bg-surface-container-low/30 border-b border-surface-container">
                <th className="px-3 sm:px-6 py-3.5 text-[8px] sm:text-[9px] font-bold text-outline uppercase tracking-widest">Medicine Name</th>
                <th className="px-2 sm:px-4 py-3.5 text-[8px] sm:text-[9px] font-bold text-outline uppercase tracking-widest text-center whitespace-nowrap">Total Units</th>
                <th className="px-2 sm:px-4 py-3.5 text-[8px] sm:text-[9px] font-bold text-outline uppercase tracking-widest text-center whitespace-nowrap">Growth</th>
                <th className="px-3 sm:px-6 py-3.5 text-[8px] sm:text-[9px] font-bold text-outline uppercase tracking-widest text-right whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {loadingMeds ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-3 sm:px-6 py-4"><div className="h-4 bg-gray-100 rounded w-2/3"></div></td>
                    <td className="px-2 sm:px-4 py-4"><div className="h-4 bg-gray-100 rounded w-1/3 mx-auto"></div></td>
                    <td className="px-2 sm:px-4 py-4"><div className="h-4 bg-gray-100 rounded w-1/3 mx-auto"></div></td>
                    <td className="px-3 sm:px-6 py-4 text-right"><div className="h-4 bg-gray-100 rounded w-1/2 ml-auto"></div></td>
                  </tr>
                ))
              ) : topMedicines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-xs text-gray-400 font-semibold">
                    No top-selling medicines recorded.
                  </td>
                </tr>
              ) : (
                topMedicines.map((row, i) => (
                  <tr key={i} className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-3 sm:px-6 py-4 text-[8px] sm:text-xs font-bold text-on-surface">{row.name}</td>
                    <td className="px-2 sm:px-4 py-4 text-center text-[8px] sm:text-xs font-bold text-on-surface">{row.units}</td>
                    <td className="px-2 sm:px-4 py-4 text-center">
                      <div className={`flex items-center justify-center gap-1 text-[8px] sm:text-[10px] font-bold ${row.growth.startsWith("+") ? "text-emerald-600" : "text-rose-600"}`}>
                        {row.growth.startsWith("+") ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {row.growth}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-right">
                      <span className={`text-[7px] sm:text-[9px] font-bold px-2 py-0.5 rounded-md ${row.bg} ${row.color} whitespace-nowrap inline-block`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsSection;
