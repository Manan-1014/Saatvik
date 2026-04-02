import { ShoppingBag, Clock, CheckCircle, IndianRupee, Users, UtensilsCrossed } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { useGetDashboardStats, useGetWeeklyRevenue, useGetOrdersByCategory } from "@workspace/api-client-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { Link } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  preparing: "bg-blue-100 text-blue-700",
  ready: "bg-green-100 text-green-700",
  "on the way": "bg-purple-100 text-purple-700",
  delivered: "bg-gray-100 text-gray-700",
};

const CHART_COLORS = ["#F97316", "#4CAF50", "#EAB308", "#3B82F6", "#EF4444"];

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: weeklyRevenue } = useGetWeeklyRevenue();
  const { data: categoryOrders } = useGetOrdersByCategory();

  const statCards = stats ? [
    { label: "Today's Orders", value: stats.today_orders, icon: ShoppingBag, color: "text-primary", trend: "+12%" },
    { label: "Pending", value: stats.pending_orders, icon: Clock, color: "text-amber-600", trend: "-3" },
    { label: "Delivered", value: stats.delivered_today, icon: CheckCircle, color: "text-green-600", trend: "+5" },
    { label: "Revenue Today", value: `₹${parseFloat(stats.revenue_today).toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-emerald-600", trend: "+8%" },
    { label: "Active Customers", value: stats.active_customers, icon: Users, color: "text-blue-600", trend: "+11" },
    { label: "Menu Items", value: stats.menu_items, icon: UtensilsCrossed, color: "text-purple-600", trend: "—" },
  ] : [];

  return (
    <AdminLayout>
      <div data-testid="admin-dashboard">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>Dashboard</h1>
            <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">Live</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-card border border-card-border rounded-xl p-4 animate-pulse h-24" />)
          ) : (
            statCards.map(card => (
              <div key={card.label} className="bg-card border border-card-border rounded-xl p-4" data-testid={`stat-${card.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center justify-between mb-2">
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                  <span className="text-xs text-muted-foreground">{card.trend}</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
              </div>
            ))
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Weekly Revenue */}
          <div className="md:col-span-2 bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-foreground">Weekly Revenue & Orders</h2>
              <span className="text-xs text-muted-foreground">Last 7 days performance</span>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyRevenue ?? []}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      name === "revenue" ? `₹${value}` : value,
                      name === "revenue" ? "Revenue" : "Orders"
                    ]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="orders" stroke="#4CAF50" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders by Category */}
          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="mb-1">
              <h2 className="font-semibold text-foreground">Orders by Category</h2>
              <p className="text-xs text-muted-foreground">Today's breakdown</p>
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryOrders ?? []} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="count" nameKey="category_name">
                    {(categoryOrders ?? []).map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any, name: string) => [v, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-1">
              {(categoryOrders ?? []).map((cat: any, i: number) => (
                <div key={cat.category_name} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-muted-foreground">{cat.category_name}</span>
                  </div>
                  <span className="font-medium">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Orders + Recent */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-1">Daily Orders</h2>
            <p className="text-xs text-muted-foreground mb-3">Orders per day this week</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyRevenue ?? []}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#4CAF50" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="md:col-span-2 bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Recent Orders</h2>
              <Link to="/admin/orders" className="text-xs text-primary font-medium hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Customer</th>
                    <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Area</th>
                    <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Items</th>
                    <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Total</th>
                    <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recent_orders ?? []).map((order: any) => (
                    <tr key={order.id} className="border-b border-border/50 last:border-0" data-testid={`recent-order-${order.id}`}>
                      <td className="py-2.5">
                        <div className="font-medium text-foreground">{order.customer_name || "Guest"}</div>
                        <div className="text-xs text-muted-foreground">ORD{String(order.id).padStart(8, "0")}</div>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{order.delivery_area_name || "—"}</td>
                      <td className="py-2.5 text-muted-foreground">{order.items.length}</td>
                      <td className="py-2.5 font-medium">&#x20B9;{order.total}</td>
                      <td className="py-2.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!stats?.recent_orders?.length && (
                <p className="text-center text-muted-foreground text-sm py-8">No orders yet today</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
