import ReactECharts from 'echarts-for-react';
import { COLOR_INCOME, COLOR_EXPENSE } from '@/lib/theme';

export default function TrendChart({
  labels,
  income,
  expense,
  height = 280,
  smooth = true,
}: {
  labels: string[];
  income: number[];
  expense: number[];
  height?: number;
  smooth?: boolean;
}) {
  const option = {
    color: [COLOR_INCOME, COLOR_EXPENSE],
    tooltip: { trigger: 'axis', formatter: (ps: any) => (ps as Array<{ seriesName: string; value: number }>).map((p) => `${p.seriesName}：¥${p.value}`).join('<br/>') },
    legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#66736C', fontSize: 12 } },
    grid: { top: 24, left: 8, right: 8, bottom: 36, containLabel: true },
    xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#D8DFDA' } }, axisLabel: { color: '#66736C' } },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#EDF1EE' } },
      axisLabel: { color: '#66736C', formatter: (v: number) => (v >= 10000 ? `${Math.round(v / 1000)}k` : `${v}`) },
    },
    series: [
      { name: '收入', type: 'bar', data: income, barMaxWidth: 18, itemStyle: { borderRadius: [4, 4, 0, 0] } },
      {
        name: '支出',
        type: smooth ? 'line' : 'bar',
        data: expense,
        smooth,
        symbolSize: 5,
        lineStyle: { width: 2 },
        itemStyle: { borderRadius: smooth ? undefined : [4, 4, 0, 0] },
        areaStyle: smooth ? { opacity: 0.08 } : undefined,
      },
    ],
  };
  return <ReactECharts option={option} style={{ width: '100%', height }} notMerge lazyUpdate />;
}
