import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { DollarSign, TrendingUp, TrendingDown, Users, CreditCard, Loader2, RefreshCw } from 'lucide-react';

interface RevenueWidgetProps {
  compact?: boolean;
}

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  totalPurchases: number;
  revenueByMonth: { month: string; amount: number }[];
  churnedThisMonth: number;
}

const RevenueWidget: React.FC<RevenueWidgetProps> = ({ compact = false }) => {
  const { user } = useAuth();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      // Fetch purchases
      const { data: purchases } = await supabase
        .from('purchases')
        .select('id, amount, currency, status, created_at')
        .in('status', ['completed', 'active']);

      // Fetch active subscriptions
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('id, status, current_period_end, amount, created_at')
        .eq('status', 'active');

      // Fetch coaching relationships (manual grants = revenue from coaching packages)
      const { data: coachingRels } = await supabase
        .from('coaching_relationships')
        .select('id, status, started_at, ended_at')
        .order('started_at', { ascending: false });

      const allPurchases = purchases || [];
      const activeSubs = subs || [];
      const relationships = coachingRels || [];

      // Total revenue from purchases
      const totalRevenue = allPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

      // This month's revenue
      const monthlyRevenue = allPurchases
        .filter(p => p.created_at >= thisMonthStart)
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      // MRR estimate from active subs
      const mrr = activeSubs.reduce((sum, s) => sum + (s.amount || 0), 0);

      // Churned this month (ended coaching relationships)
      const churnedThisMonth = relationships.filter(r =>
        r.status === 'ENDED' && r.ended_at && r.ended_at >= thisMonthStart
      ).length;

      // Revenue by month (last 6 months)
      const revenueByMonth: { month: string; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = d.toISOString();
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
        const monthLabel = d.toLocaleDateString('de-DE', { month: 'short' });
        const monthRevenue = allPurchases
          .filter(p => p.created_at >= monthStart && p.created_at <= monthEnd)
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        revenueByMonth.push({ month: monthLabel, amount: monthRevenue });
      }

      setData({
        totalRevenue: totalRevenue / 100,
        monthlyRevenue: (monthlyRevenue || mrr) / 100,
        activeSubscriptions: activeSubs.length,
        totalPurchases: allPurchases.length,
        revenueByMonth: revenueByMonth.map(r => ({ ...r, amount: r.amount / 100 })),
        churnedThisMonth,
      });
    } catch (error) {
      console.error('Error loading revenue data:', error);
      // Set empty data so widget still renders
      setData({
        totalRevenue: 0,
        monthlyRevenue: 0,
        activeSubscriptions: 0,
        totalPurchases: 0,
        revenueByMonth: [],
        churnedThisMonth: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Mini bar chart for revenue by month
  const renderMiniChart = () => {
    if (!data || data.revenueByMonth.length === 0) return null;
    const max = Math.max(...data.revenueByMonth.map(r => r.amount), 1);
    return (
      <div className="flex items-end gap-1 h-16">
        {data.revenueByMonth.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-[#00FF00] transition-all"
              style={{ height: `${(item.amount / max) * 100}%`, minHeight: item.amount > 0 ? 4 : 0 }}
            />
            <span className="text-[9px] text-zinc-600">{item.month}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6 flex items-center justify-center h-40">
        <Loader2 className="animate-spin text-zinc-500" size={20} />
      </div>
    );
  }

  if (!data) return null;

  // Month-over-month change
  const prevMonth = data.revenueByMonth.length >= 2 ? data.revenueByMonth[data.revenueByMonth.length - 2].amount : 0;
  const currMonth = data.revenueByMonth.length >= 1 ? data.revenueByMonth[data.revenueByMonth.length - 1].amount : 0;
  const momChange = prevMonth > 0 ? Math.round(((currMonth - prevMonth) / prevMonth) * 100) : 0;

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <DollarSign size={20} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Umsatz</h3>
            <p className="text-zinc-500 text-xs">Übersicht & Trends</p>
          </div>
        </div>
        <button onClick={loadData} className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-black/20 rounded-xl p-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Gesamt</p>
          <p className="text-xl font-bold text-white">{data.totalRevenue.toFixed(0)}€</p>
        </div>
        <div className="bg-black/20 rounded-xl p-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Dieser Monat</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-[#00FF00]">{data.monthlyRevenue.toFixed(0)}€</p>
            {momChange !== 0 && (
              <span className={`text-xs flex items-center gap-0.5 ${momChange >= 0 ? 'text-[#00FF00]' : 'text-red-400'}`}>
                {momChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(momChange)}%
              </span>
            )}
          </div>
        </div>
        <div className="bg-black/20 rounded-xl p-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Aktive Subs</p>
          <p className="text-xl font-bold text-blue-400 flex items-center gap-1">
            <CreditCard size={14} /> {data.activeSubscriptions}
          </p>
        </div>
        <div className="bg-black/20 rounded-xl p-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Churn</p>
          <p className={`text-xl font-bold ${data.churnedThisMonth > 0 ? 'text-red-400' : 'text-[#00FF00]'}`}>
            {data.churnedThisMonth}
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      {data.revenueByMonth.length > 0 && (
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2">Letzte 6 Monate</p>
          {renderMiniChart()}
        </div>
      )}
    </div>
  );
};

export default RevenueWidget;
