import React, { useEffect, useState, useMemo } from 'react';
import { getExerciseProgressData } from '../services/supabase';
import { useLanguage } from '../context/LanguageContext';
import { TrendingUp, Loader2, BarChart3 } from 'lucide-react';

interface ExerciseProgressChartProps {
  athleteId: string;
  exerciseId: string;
  exerciseName: string;
  days?: number;
  height?: number;
  compact?: boolean;
}

interface DataPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
  bestSet: string;
}

const ExerciseProgressChart: React.FC<ExerciseProgressChartProps> = ({
  athleteId,
  exerciseId,
  exerciseName,
  days = 90,
  height = 200,
  compact = false,
}) => {
  const { t } = useLanguage();
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<'weight' | 'volume'>('weight');

  useEffect(() => {
    loadData();
  }, [athleteId, exerciseId, days]);

  const loadData = async () => {
    setLoading(true);
    try {
      const raw = await getExerciseProgressData(athleteId, exerciseId, days);
      const points: DataPoint[] = raw.map((entry: any) => {
        const sets = entry.sets || [];
        let maxWeight = 0;
        let bestReps = 0;
        let totalVolume = entry.total_volume || 0;

        sets.forEach((s: any) => {
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps) || 0;
          if (w > maxWeight) {
            maxWeight = w;
            bestReps = r;
          }
          if (!totalVolume) totalVolume += w * r;
        });

        return {
          date: entry.workout_date || entry.created_at?.split('T')[0],
          maxWeight,
          totalVolume,
          bestSet: maxWeight > 0 ? `${maxWeight}kg × ${bestReps}` : '',
        };
      });

      // Deduplicate by date (keep max per day)
      const byDate = new Map<string, DataPoint>();
      points.forEach(p => {
        if (!p.date) return;
        const existing = byDate.get(p.date);
        if (!existing || p.maxWeight > existing.maxWeight) {
          byDate.set(p.date, p);
        }
      });

      setData(Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)));
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const values = data.map(d => metric === 'weight' ? d.maxWeight : d.totalVolume);
    if (values.length === 0) return { values: [], min: 0, max: 0, labels: [] };
    const min = Math.min(...values);
    const max = Math.max(...values);
    return {
      values,
      min: Math.max(0, min - (max - min) * 0.1),
      max: max + (max - min) * 0.1 || max + 10,
      labels: data.map(d => d.date),
    };
  }, [data, metric]);

  const trend = useMemo(() => {
    if (data.length < 2) return 0;
    const vals = data.map(d => metric === 'weight' ? d.maxWeight : d.totalVolume);
    const first = vals.slice(0, Math.ceil(vals.length / 3));
    const last = vals.slice(-Math.ceil(vals.length / 3));
    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgLast = last.reduce((a, b) => a + b, 0) / last.length;
    return avgFirst > 0 ? ((avgLast - avgFirst) / avgFirst) * 100 : 0;
  }, [data, metric]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-zinc-500" size={20} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-6 text-zinc-500 text-sm">
        <BarChart3 size={24} className="mx-auto mb-2 opacity-50" />
        <p>Keine Daten für diese Übung vorhanden.</p>
      </div>
    );
  }

  const { values, min, max } = chartData;
  const range = max - min || 1;
  const svgWidth = compact ? 280 : 500;
  const svgHeight = height;
  const padding = { top: 20, right: 16, bottom: 30, left: 45 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const getX = (i: number) => padding.left + (i / Math.max(values.length - 1, 1)) * chartWidth;
  const getY = (v: number) => padding.top + chartHeight - ((v - min) / range) * chartHeight;

  // Build SVG path
  const linePath = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`)
    .join(' ');

  // Area path (fill under curve)
  const areaPath = linePath + ` L ${getX(values.length - 1).toFixed(1)} ${(padding.top + chartHeight).toFixed(1)} L ${getX(0).toFixed(1)} ${(padding.top + chartHeight).toFixed(1)} Z`;

  // Y-axis labels
  const ySteps = 4;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => min + (range / ySteps) * i);

  // X-axis labels (show ~5 dates)
  const xLabelCount = Math.min(5, values.length);
  const xLabelIndices = Array.from({ length: xLabelCount }, (_, i) =>
    Math.round((i / Math.max(xLabelCount - 1, 1)) * (values.length - 1))
  );

  return (
    <div className={compact ? '' : 'bg-zinc-900/50 rounded-xl border border-zinc-800 p-4'}>
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-white font-bold text-sm">{exerciseName}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <TrendingUp size={14} className={trend >= 0 ? 'text-[#00FF00]' : 'text-red-400'} />
              <span className={`text-xs font-medium ${trend >= 0 ? 'text-[#00FF00]' : 'text-red-400'}`}>
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
              </span>
              <span className="text-zinc-500 text-xs">({days} Tage)</span>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setMetric('weight')}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                metric === 'weight' ? 'bg-[#00FF00] text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Max kg
            </button>
            <button
              onClick={() => setMetric('volume')}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                metric === 'volume' ? 'bg-[#00FF00] text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Volumen
            </button>
          </div>
        </div>
      )}

      <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible">
        {/* Grid lines */}
        {yLabels.map((v, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              x2={svgWidth - padding.right}
              y1={getY(v)}
              y2={getY(v)}
              stroke="#27272a"
              strokeWidth="1"
            />
            <text
              x={padding.left - 6}
              y={getY(v) + 4}
              textAnchor="end"
              fill="#71717a"
              fontSize="10"
            >
              {metric === 'weight' ? `${Math.round(v)}` : v >= 1000 ? `${(v/1000).toFixed(1)}k` : Math.round(v)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabelIndices.map(idx => (
          <text
            key={idx}
            x={getX(idx)}
            y={svgHeight - 4}
            textAnchor="middle"
            fill="#71717a"
            fontSize="9"
          >
            {data[idx]?.date ? new Date(data[idx].date + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : ''}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#greenGrad)" opacity="0.15" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#00FF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {values.map((v, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(v)}
            r={compact ? 2 : 3}
            fill="#00FF00"
            stroke="#000"
            strokeWidth="1"
          />
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FF00" />
            <stop offset="100%" stopColor="#00FF00" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Latest value + best */}
      {!compact && data.length > 0 && (
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800">
          <div>
            <span className="text-zinc-500 text-xs">Aktuell</span>
            <p className="text-white font-bold text-sm">
              {metric === 'weight'
                ? `${data[data.length - 1].maxWeight} kg`
                : `${Math.round(data[data.length - 1].totalVolume)} kg`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-zinc-500 text-xs">Bester Satz</span>
            <p className="text-[#00FF00] font-bold text-sm">
              {data.reduce((best, d) => d.maxWeight > (best?.maxWeight || 0) ? d : best, data[0]).bestSet || '-'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseProgressChart;
