import ReactECharts from 'echarts-for-react';
import { CHART_COLORS } from '@/lib/theme';

export default function HBarChart({
  data,
  height = 260,
}: {
  data: Array<{ name: string; value: number }>;
  height?: number;
}) {
  const sorted = [...data].sort((a, b) => a.value - b.value);
  const option = {
    color: [CHART_COLORS[0]],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => `${p?.[0]?.name}：¥${p?.[0]?.value}` },
    grid: { top: 8, left: 8, right: 40, bottom: 8, containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#EDF1EE' } }, axisLabel: { color: '#66736C' } },
    yAxis: { type: 'category', data: sorted.map((d) => d.name), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#33413A', fontSize: 12 } },
    series: [
      {
        type: 'bar',
        data: sorted.map((d) => d.value),
        barMaxWidth: 14,
        itemStyle: { borderRadius: [0, 6, 6, 0] },
        label: { show: true, position: 'right', color: '#33413A', fontSize: 11, formatter: (p: { value: number }) => `¥${p.value}` },
      },
    ],
  };
  return <ReactECharts option={option} style={{ width: '100%', height }} notMerge lazyUpdate />;
}
