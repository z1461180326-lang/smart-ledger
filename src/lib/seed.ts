import { addMonths, format } from 'date-fns';
import { NOW, CURRENT_MONTH } from './time';
import type { IAppState, IAccount, ICategory, IRecord, IBudget, ISubscription, IRule } from './types';

export const SEED_SETTINGS = {
  bigAmountThreshold: 500,
  riseThresholdPct: 30,
  impulseThreshold: 200,
};

export const SEED_ACCOUNTS: IAccount[] = [
  { id: 'a-wechat', name: '微信', type: 'wechat', balance: 12400 },
  { id: 'a-alipay', name: '支付宝', type: 'alipay', balance: 8900 },
  { id: 'a-bank', name: '招商银行卡', type: 'bank', balance: 64000 },
  { id: 'a-credit', name: '信用卡', type: 'credit', balance: -2360 },
  { id: 'a-cash', name: '现金', type: 'cash', balance: 780 },
  { id: 'a-other', name: '其他账户', type: 'other', balance: 2800 },
];

const c = (
  id: string,
  name: string,
  icon: string,
  type: 'income' | 'expense',
  parentId: string | null,
  necessary: boolean,
  optimizable: boolean,
): ICategory => ({ id, name, icon, type, parentId, necessary, optimizable });

export const SEED_CATEGORIES: ICategory[] = [
  // 支出
  c('exp_food', '餐饮', 'utensils', 'expense', null, true, false),
  c('exp_food_breakfast', '早餐', 'coffee', 'expense', 'exp_food', true, false),
  c('exp_food_lunch', '午餐', 'utensils', 'expense', 'exp_food', true, false),
  c('exp_food_dinner', '晚餐', 'utensils', 'expense', 'exp_food', true, false),
  c('exp_food_latenight', '夜宵', 'moon', 'expense', 'exp_food', false, true),
  c('exp_food_gathering', '聚餐', 'users', 'expense', 'exp_food', false, true),
  c('exp_food_takeout', '外卖', 'package', 'expense', 'exp_food', false, true),
  c('exp_food_drink', '咖啡奶茶', 'coffee', 'expense', 'exp_food', false, true),
  c('exp_food_snack', '零食水果', 'apple', 'expense', 'exp_food', false, true),
  c('exp_food_other', '其他餐饮', 'utensils', 'expense', 'exp_food', true, false),

  c('exp_shopping', '购物', 'shopping-bag', 'expense', null, false, true),
  c('exp_shopping_digital', '数码电器', 'headphones', 'expense', 'exp_shopping', false, true),
  c('exp_shopping_clothes', '服饰鞋包', 'shirt', 'expense', 'exp_shopping', false, true),
  c('exp_shopping_daily', '日用品', 'shopping-basket', 'expense', 'exp_shopping', true, false),
  c('exp_shopping_beauty', '美妆护肤', 'sparkles', 'expense', 'exp_shopping', false, true),
  c('exp_shopping_other', '其他购物', 'shopping-bag', 'expense', 'exp_shopping', false, true),

  c('exp_housing', '住房', 'home', 'expense', null, true, false),
  c('exp_housing_rent', '房租', 'key', 'expense', 'exp_housing', true, false),
  c('exp_housing_mortgage', '房贷', 'landmark', 'expense', 'exp_housing', true, false),
  c('exp_housing_utility', '水电燃气', 'zap', 'expense', 'exp_housing', true, false),
  c('exp_housing_property', '物业', 'building-2', 'expense', 'exp_housing', true, false),
  c('exp_housing_furniture', '家居', 'armchair', 'expense', 'exp_housing', false, true),
  c('exp_housing_other', '其他住房', 'home', 'expense', 'exp_housing', true, false),

  c('exp_transport', '交通', 'car', 'expense', null, true, false),
  c('exp_transport_public', '公共交通', 'bus', 'expense', 'exp_transport', true, false),
  c('exp_transport_taxi', '打车', 'car', 'expense', 'exp_transport', true, false),
  c('exp_transport_fuel', '加油', 'fuel', 'expense', 'exp_transport', true, false),
  c('exp_transport_parking', '停车', 'map-pin', 'expense', 'exp_transport', true, false),
  c('exp_transport_long', '长途出行', 'train-front', 'expense', 'exp_transport', true, false),
  c('exp_transport_other', '其他交通', 'car', 'expense', 'exp_transport', true, false),

  c('exp_entertainment', '娱乐', 'gamepad-2', 'expense', null, false, true),
  c('exp_ent_film', '电影演出', 'clapperboard', 'expense', 'exp_entertainment', false, true),
  c('exp_ent_game', '游戏', 'gamepad-2', 'expense', 'exp_entertainment', false, true),
  c('exp_ent_travel', '旅游', 'plane', 'expense', 'exp_entertainment', false, true),
  c('exp_ent_fitness', '运动健身', 'dumbbell', 'expense', 'exp_entertainment', false, true),
  c('exp_ent_other', '其他娱乐', 'gamepad-2', 'expense', 'exp_entertainment', false, true),

  c('exp_medical', '医疗', 'pill', 'expense', null, true, false),
  c('exp_med_drug', '药品', 'pill', 'expense', 'exp_medical', true, false),
  c('exp_med_clinic', '门诊', 'stethoscope', 'expense', 'exp_medical', true, false),
  c('exp_med_checkup', '体检', 'heart-pulse', 'expense', 'exp_medical', true, false),
  c('exp_med_other', '其他医疗', 'pill', 'expense', 'exp_medical', true, false),

  c('exp_education', '教育', 'book-open', 'expense', null, true, false),
  c('exp_edu_course', '课程培训', 'graduation-cap', 'expense', 'exp_education', true, false),
  c('exp_edu_book', '书籍', 'book-open', 'expense', 'exp_education', true, false),
  c('exp_edu_other', '其他教育', 'book-open', 'expense', 'exp_education', true, false),

  c('exp_comm', '通讯', 'smartphone', 'expense', null, true, false),
  c('exp_comm_phone', '话费', 'smartphone', 'expense', 'exp_comm', true, false),
  c('exp_comm_data', '流量', 'wifi', 'expense', 'exp_comm', true, false),
  c('exp_comm_broadband', '宽带', 'router', 'expense', 'exp_comm', true, false),
  c('exp_comm_other', '其他通讯', 'smartphone', 'expense', 'exp_comm', true, false),

  c('exp_social', '人情', 'gift', 'expense', null, false, true),
  c('exp_soc_redpacket', '红包送礼', 'gift', 'expense', 'exp_social', false, true),
  c('exp_soc_gift', '份子钱', 'gift', 'expense', 'exp_social', false, true),
  c('exp_soc_other', '其他人情', 'gift', 'expense', 'exp_social', false, true),

  c('exp_other', '其他支出', 'package', 'expense', null, true, false),

  // 收入
  c('inc_salary', '工资', 'briefcase', 'income', null, true, false),
  c('inc_salary_salary', '工资', 'briefcase', 'income', 'inc_salary', true, false),
  c('inc_bonus', '奖金', 'trophy', 'income', null, true, false),
  c('inc_bonus_bonus', '奖金', 'trophy', 'income', 'inc_bonus', true, false),
  c('inc_invest', '理财收益', 'trending-up', 'income', null, true, false),
  c('inc_invest_invest', '理财收益', 'trending-up', 'income', 'inc_invest', true, false),
  c('inc_transfer', '转账收入', 'arrow-down-left', 'income', null, true, false),
  c('inc_transfer_transfer', '转账收入', 'arrow-down-left', 'income', 'inc_transfer', true, false),
  c('inc_other', '其他收入', 'wallet', 'income', null, true, false),
  c('inc_other_other', '其他收入', 'wallet', 'income', 'inc_other', true, false),
];

export const SEED_RULES: IRule[] = [
  { id: 'rule-1', keyword: '火锅', type: 'expense', categoryId: 'exp_food_gathering', enabled: true },
  { id: 'rule-2', keyword: '淘宝', type: 'expense', categoryId: 'exp_shopping_digital', enabled: true },
  { id: 'rule-3', keyword: '京东', type: 'expense', categoryId: 'exp_shopping_digital', enabled: true },
  { id: 'rule-4', keyword: '拼多多', type: 'expense', categoryId: 'exp_shopping_digital', enabled: true },
  { id: 'rule-5', keyword: '地铁', type: 'expense', categoryId: 'exp_transport_public', enabled: true },
  { id: 'rule-6', keyword: '打车', type: 'expense', categoryId: 'exp_transport_taxi', enabled: true },
  { id: 'rule-7', keyword: '房租', type: 'expense', categoryId: 'exp_housing_rent', enabled: true },
  { id: 'rule-8', keyword: '工资', type: 'income', categoryId: 'inc_salary_salary', enabled: true },
  { id: 'rule-9', keyword: '电影', type: 'expense', categoryId: 'exp_ent_film', enabled: true },
  { id: 'rule-10', keyword: '咖啡', type: 'expense', categoryId: 'exp_food_drink', enabled: true },
];

const nextMonthOn = (day: number) => format(addMonths(new Date(NOW.getFullYear(), NOW.getMonth(), day), 1), 'yyyy-MM-dd');
const thisMonthOn = (day: number) => format(new Date(NOW.getFullYear(), NOW.getMonth(), day), 'yyyy-MM-dd');

export const SEED_SUBSCRIPTIONS: ISubscription[] = [
  { id: 'sub-1', name: '腾讯视频会员', amount: 25, frequency: 'monthly', categoryId: 'exp_ent_film', accountId: 'a-wechat', nextDate: nextMonthOn(15), note: '连续包月' },
  { id: 'sub-2', name: '网易云音乐会员', amount: 15, frequency: 'monthly', categoryId: 'exp_ent_other', accountId: 'a-alipay', nextDate: nextMonthOn(20), note: '连续包月' },
  { id: 'sub-3', name: '手机话费套餐', amount: 99, frequency: 'monthly', categoryId: 'exp_comm_phone', accountId: 'a-wechat', nextDate: nextMonthOn(8), note: '5G 套餐' },
  { id: 'sub-4', name: '健身房月卡', amount: 200, frequency: 'monthly', categoryId: 'exp_ent_fitness', accountId: 'a-alipay', nextDate: thisMonthOn(15), note: '按月续费' },
  { id: 'sub-5', name: '车辆保险', amount: 3600, frequency: 'yearly', categoryId: 'exp_transport_other', accountId: 'a-bank', nextDate: '2027-03-15', note: '年度车险' },
];

export const SEED_BUDGETS: IBudget[] = [
  { id: 'budget-1', categoryId: 'exp_food', month: CURRENT_MONTH, amount: 2000 },
  { id: 'budget-2', categoryId: 'exp_shopping', month: CURRENT_MONTH, amount: 3000 },
  { id: 'budget-3', categoryId: 'exp_transport', month: CURRENT_MONTH, amount: 800 },
  { id: 'budget-4', categoryId: 'exp_entertainment', month: CURRENT_MONTH, amount: 1000 },
  { id: 'budget-5', categoryId: 'exp_housing', month: CURRENT_MONTH, amount: 3500 },
];

const DAY = 24 * 60 * 60 * 1000;

/** 生成某个月的规律性收支（offset=0 为本月，只生成到今天为止） */
function buildMonthRecords(offset: number): IRecord[] {
  const year = NOW.getFullYear();
  const month = NOW.getMonth() - offset;
  const base = new Date(year, month, 1);
  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const todayDay = NOW.getDate();
  const out: IRecord[] = [];
  let n = 0;

  const push = (day: number, type: 'income' | 'expense', amount: number, categoryId: string, accountId: string, merchant = '', note = '') => {
    if (offset === 0 && day > todayDay) return;
    const date = format(new Date(base.getFullYear(), base.getMonth(), day), 'yyyy-MM-dd');
    out.push({
      id: `r-${offset}-${n++}`,
      type,
      amount: Math.round(amount * 100) / 100,
      categoryId,
      date,
      accountId,
      merchant,
      note,
      createdAt: `${date}T12:00:00.000Z`,
    });
  };

  for (let d = 1; d <= daysInMonth; d += 1) {
    if (d === 1) push(d, 'expense', 3500, 'exp_housing_rent', 'a-bank', '', '房租');
    if (d === 2) push(d, 'expense', 150 + ((offset * 13) % 40), 'exp_housing_utility', 'a-bank', '', '水电费');
    if (d === 8) push(d, 'expense', 99, 'exp_comm_phone', 'a-wechat', '', '话费');
    if (d === 10) push(d, 'income', 15000, 'inc_salary_salary', 'a-bank', '', '工资');
    if (d === 20 && offset > 0) push(d, 'income', 420 + ((offset * 37) % 260), 'inc_invest_invest', 'a-bank', '', '理财收益');
    if (d % 2 === 1 && d >= 3 && d <= 25) push(d, 'expense', 28 + ((d * 5) % 22), 'exp_food_lunch', 'a-wechat', '', '午餐');
    if (d % 5 === 2) push(d, 'expense', 10 + ((d * 2) % 8), 'exp_food_breakfast', 'a-wechat', '', '早餐');
    if (d % 3 === 0 && d <= 24) push(d, 'expense', 6, 'exp_transport_public', 'a-wechat', '', '地铁');
    if (d % 9 === 4) push(d, 'expense', 24 + ((d * 3) % 14), 'exp_transport_taxi', 'a-alipay', '滴滴', '打车');
    if (d === 6) push(d, 'expense', 110 + ((offset * 31) % 160), 'exp_shopping_daily', 'a-alipay', '超市', '日用品');
    if (d === 14) push(d, 'expense', 150 + ((offset * 47) % 320), 'exp_shopping_digital', 'a-alipay', '淘宝', '网购');
    if (d === 22) push(d, 'expense', 130 + ((offset * 23) % 150), 'exp_food_gathering', 'a-wechat', '', '朋友聚餐');
    if (d === 16) push(d, 'expense', 28 + ((offset * 5) % 14), 'exp_transport_taxi', 'a-wechat', '滴滴', '打车');
    if (d === 25 && offset % 3 === 1) push(d, 'expense', 40 + ((offset * 9) % 50), 'exp_med_drug', 'a-alipay', '药店', '药品');
    if (d === 28 && offset % 4 === 0) push(d, 'expense', 68, 'exp_ent_game', 'a-wechat', '', '游戏充值');
  }
  return out;
}

/** 本月示例账（对应 PRD 中的例句） */
function buildCurrentMonthSpecials(): IRecord[] {
  const out: IRecord[] = [];
  let i = 0;
  const push = (dayOffset: number, type: 'income' | 'expense', amount: number, categoryId: string, accountId: string, merchant: string, note: string) => {
    const d = new Date(NOW.getTime() + dayOffset * DAY);
    const date = format(d, 'yyyy-MM-dd');
    i += 1;
    out.push({ id: `sp-${i}`, type, amount, categoryId, date, accountId, merchant, note, createdAt: `${date}T12:00:00.000Z` });
  };
  // 今天
  push(0, 'expense', 18, 'exp_food_breakfast', 'a-wechat', '', '早餐');
  push(0, 'expense', 6, 'exp_transport_public', 'a-wechat', '', '地铁');
  push(0, 'expense', 35, 'exp_food_lunch', 'a-wechat', '', '午餐');
  // 昨天
  push(-1, 'expense', 268, 'exp_food_gathering', 'a-wechat', '火锅', '晚上和朋友吃火锅');
  push(-1, 'expense', 28, 'exp_transport_taxi', 'a-wechat', '滴滴', '打车');
  // 更早
  push(-2, 'expense', 128, 'exp_ent_game', 'a-wechat', '', '游戏充值');
  push(-3, 'expense', 45, 'exp_ent_film', 'a-wechat', '电影院', '电影');
  push(-4, 'expense', 259, 'exp_shopping_clothes', 'a-alipay', '淘宝', '买衣服');
  push(-6, 'income', 200, 'inc_transfer_transfer', 'a-wechat', '', '朋友还我');
  push(-7, 'expense', 45, 'exp_food_takeout', 'a-wechat', '美团', '晚餐外卖');
  push(-8, 'expense', 28, 'exp_food_drink', 'a-wechat', '瑞幸', '咖啡');
  push(-9, 'expense', 399, 'exp_shopping_digital', 'a-alipay', '淘宝', '买键盘');
  push(-9, 'expense', 299, 'exp_shopping_digital', 'a-alipay', '淘宝', '买耳机');
  push(-11, 'income', 3000, 'inc_bonus_bonus', 'a-bank', '', '季度奖金');
  push(-13, 'expense', 88, 'exp_soc_redpacket', 'a-wechat', '', '红包');
  return out;
}

export function buildSeed(): IAppState {
  const records: IRecord[] = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    records.push(...buildMonthRecords(offset));
  }
  records.push(...buildCurrentMonthSpecials());
  records.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return {
    accounts: SEED_ACCOUNTS,
    categories: SEED_CATEGORIES,
    records,
    budgets: SEED_BUDGETS,
    subscriptions: SEED_SUBSCRIPTIONS,
    rules: SEED_RULES,
    settings: SEED_SETTINGS,
  };
}

export const SEED = buildSeed();
