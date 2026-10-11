import ReactECharts from 'echarts-for-react';
import { CHART_COLORS } from '@/lib/theme';

export interface IDonutDatum {
  name: string;
  value: number;
}

export default function DonutChart({
  data,
  colors = CHART_COLORS,
  height = 260,
  centerText,
  centerSub,
}: {
  data: IDonutDatum[];
  colors?: string[];
  height?: number;
  centerText?: string;
  centerSub?: string;
}) {
  const graphic = [];
  if (centerText) {
    graphic.push({
      type: 'text',
      left: 'center',
      top: '38%',
      style: { text: centerText, textAlign: 'center', fontSize: 22, fontWeight: 700, fill: '#1B2B26' },
    });
  }
  if (centerSub) {
    graphic.push({
      type: 'text',
      left: 'center',
      top: '52%',
      style: { text: centerSub, textAlign: 'center', fontSize: 12, fill: '#8A938E' },
    });
  }
  const option = {
    color: colors,
    tooltip: {
      trigger: 'item',
      formatter: (p: { name: string; value: number; percent: number }) => `${p.name}：¥${p.value}（${p.percent}%）`,
    },
    legend: {
      bottom: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: '#66736C', fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '75%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: '#FFFFFF', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, formatter: '{b}\n¥{c}', fontSize: 12, fontWeight: 600 } },
        data,
      },
    ],
    graphic,
  };
  return <ReactECharts option={option} style={{ width: '100%', height }} notMerge lazyUpdate />;
}
