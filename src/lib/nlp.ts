// EXPORTS: ParsedEntry, ParseResult, parseEntries, PARSE_EXAMPLES
import { TODAY, YESTERDAY, DAY_BEFORE_YESTERDAY } from './time';
import type { TRecordType, IAccount, ICategory, IRule } from './types';

export interface ParsedEntry {
  type: TRecordType;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
  categoryId: string;
  accountId: string;
  merchant: string;
  note: string;
  sourceText: string;
}

export interface ParseResult {
  entries: ParsedEntry[];
  errors: string[];
}

export interface ParseContext {
  accounts: IAccount[];
  categories: ICategory[];
  rules: IRule[];
}

const MERCHANT_WORDS = [
  '海底捞', '麦当劳', '肯德基', '必胜客', '星巴克', '瑞幸', '山姆', '盒马', '永辉',
  '淘宝', '京东', '拼多多', '天猫', '美团', '饿了么', '滴滴', '高德',
  '超市', '便利店', '药店', '电影院', '优衣库', '火锅店',
];

const PAYMENT_WORDS: Array<[RegExp, (a: IAccount[]) => string]> = [
  [/微信/, (a) => a.find((x) => x.type === 'wechat')?.id ?? ''],
  [/支付宝/, (a) => a.find((x) => x.type === 'alipay')?.id ?? ''],
  [/银行卡|储蓄卡/, (a) => a.find((x) => x.type === 'bank')?.id ?? ''],
  [/信用卡/, (a) => a.find((x) => x.type === 'credit')?.id ?? ''],
  [/现金/, (a) => a.find((x) => x.type === 'cash')?.id ?? ''],
  [/花呗/, (a) => a.find((x) => x.type === 'credit')?.id ?? ''],
  [/云闪付|其他账户|余额宝/, (a) => a.find((x) => x.type === 'other')?.id ?? ''],
];

const INCOME_RULES: Array<[RegExp, string]> = [
  [/工资|发工资|薪水|收入/, 'inc_salary_salary'],
  [/奖金|年终奖/, 'inc_bonus_bonus'],
  [/理财|利息|收益/, 'inc_invest_invest'],
  [/朋友还|还我|还款|报销|退款|收款|转账到/, 'inc_transfer_transfer'],
  [/中奖|闲鱼|二手|卖掉/, 'inc_other_other'],
];

const EXPENSE_RULES: Array<[RegExp, string]> = [
  [/早餐|早饭/, 'exp_food_breakfast'],
  [/午餐|午饭|中饭|中午饭|中午/, 'exp_food_lunch'],
  [/晚餐|晚饭|晚上/, 'exp_food_dinner'],
  [/夜宵|宵夜/, 'exp_food_latenight'],
  [/火锅|聚餐|聚会|请客/, 'exp_food_gathering'],
  [/外卖/, 'exp_food_takeout'],
  [/奶茶|咖啡|星巴克|瑞幸/, 'exp_food_drink'],
  [/零食|水果/, 'exp_food_snack'],
  [/房租/, 'exp_housing_rent'],
  [/房贷/, 'exp_housing_mortgage'],
  [/水电|燃气|电费|水费/, 'exp_housing_utility'],
  [/物业/, 'exp_housing_property'],
  [/家具|宜家|床垫/, 'exp_housing_furniture'],
  [/地铁|公交|共享单车|乘车码/, 'exp_transport_public'],
  [/打车|滴滴|出租车|高德/, 'exp_transport_taxi'],
  [/加油/, 'exp_transport_fuel'],
  [/停车/, 'exp_transport_parking'],
  [/机票|高铁|火车|动车/, 'exp_transport_long'],
  [/电影|演出|演唱会|话剧/, 'exp_ent_film'],
  [/游戏|点券|steam|Steam|充值/, 'exp_ent_game'],
  [/旅游|酒店|景点|门票/, 'exp_ent_travel'],
  [/健身|瑜伽/, 'exp_ent_fitness'],
  [/医院|挂号|门诊/, 'exp_med_clinic'],
  [/药店|感冒|药/, 'exp_med_drug'],
  [/体检/, 'exp_med_checkup'],
  [/课程|培训|学费|网课/, 'exp_edu_course'],
  [/书|书店/, 'exp_edu_book'],
  [/话费/, 'exp_comm_phone'],
  [/流量/, 'exp_comm_data'],
  [/宽带/, 'exp_comm_broadband'],
  [/红包|送礼|礼金/, 'exp_soc_redpacket'],
  [/份子钱/, 'exp_soc_gift'],
  [/耳机|键盘|手机|电脑|充电器|显示器|平板/, 'exp_shopping_digital'],
  [/衣服|鞋|裤子|裙子|包/, 'exp_shopping_clothes'],
  [/化妆品|护肤|面膜/, 'exp_shopping_beauty'],
  [/日用品|超市|便利店/, 'exp_shopping_daily'],
  [/淘宝|京东|拼多多|天猫|唯品会|买/, 'exp_shopping_other'],
  [/吃饭|餐厅|食堂|饭|面|粉/, 'exp_food_other'],
];

const DATE_RE = /(昨天|前天|今天|今日|(\d{1,2})月(\d{1,2})[日号]|(\d{1,2})\/(\d{1,2}))/;

function resolveDate(text: string): { date: string; cleaned: string } {
  let cleaned = text;
  let date = TODAY;
  if (/今天|今日/.test(text)) {
    date = TODAY;
  } else if (/昨天/.test(text)) {
    date = YESTERDAY;
  } else if (/前天/.test(text)) {
    date = DAY_BEFORE_YESTERDAY;
  }
  const m = text.match(/(\d{1,2})月(\d{1,2})[日号]/);
  if (m) {
    const mo = Number(m[1]);
    const d = Number(m[2]);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      const y = new Date().getFullYear();
      date = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  } else {
    const m2 = text.match(/(\d{1,2})\/(\d{1,2})/);
    if (m2) {
      const mo = Number(m2[1]);
      const d = Number(m2[2]);
      if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
        const y = new Date().getFullYear();
        date = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  }
  cleaned = text.replace(DATE_RE, ' ');
  return { date, cleaned };
}

function stripStopwords(s: string): string {
  return s
    .replace(/早餐|早饭|午餐|午饭|中饭|晚餐|晚饭|夜宵|宵夜|中午|晚上|早上|下午/g, ' ')
    .replace(/吃饭|吃了|花了|支付|付款|买了|买|了|个|用|走|通过|都|是/g, ' ')
    .replace(/[，,。、；;：:\s]+/g, ' ')
    .trim();
}

/** 自然语言记账：拆句 → 日期/金额/支付方式/分类/商户 */
export function parseEntries(raw: string, ctx: ParseContext): ParseResult {
  const text = raw
    .replace(/[，,。、；;]+/g, '，')
    .replace(/\n+/g, '，');
  const segments = text.split(/，+/).map((s) => s.trim()).filter(Boolean);

  let globalAccountId = '';
  const rest: string[] = [];
  for (const seg of segments) {
    const gm = seg.match(/^都(用|是|走|通过)?(微信|支付宝|银行卡|信用卡|现金|花呗|余额宝|云闪付)(支付|付款|转账)?$/);
    if (gm) {
      for (const [re, pick] of PAYMENT_WORDS) {
        if (re.test(seg)) {
          globalAccountId = pick(ctx.accounts);
          break;
        }
      }
      continue;
    }
    rest.push(seg);
  }

  const entries: ParsedEntry[] = [];
  const errors: string[] = [];

  for (const seg of rest) {
    if (!seg) continue;
    const { date, cleaned } = resolveDate(seg);

    let accountId = '';
    for (const [re, pick] of PAYMENT_WORDS) {
      if (re.test(cleaned)) {
        accountId = pick(ctx.accounts);
        break;
      }
    }
    if (!accountId) accountId = globalAccountId;
    if (!accountId) accountId = ctx.accounts[0]?.id ?? '';

    const noPay = cleaned.replace(/(用|走|通过)?(微信|支付宝|银行卡|储蓄卡|信用卡|现金|花呗|余额宝|云闪付)/g, ' ');
    const amtMatch = noPay.match(/(\d+(?:\.\d{1,2})?)/);
    if (!amtMatch) {
      errors.push(`“${seg}”没有识别到金额`);
      continue;
    }
    const amount = Math.round(Number(amtMatch[1]) * 100) / 100;
    if (amount <= 0) {
      errors.push(`“${seg}”金额无效`);
      continue;
    }

    // 分类：用户规则优先，其次内置词典
    let categoryId = '';
    let type: TRecordType = 'expense';
    const hitRule = ctx.rules.find((r) => r.enabled && seg.includes(r.keyword));
    if (hitRule) {
      categoryId = hitRule.categoryId;
      type = hitRule.type;
    } else {
      for (const [re, id] of INCOME_RULES) {
        if (re.test(seg)) {
          categoryId = id;
          type = 'income';
          break;
        }
      }
      if (!categoryId) {
        for (const [re, id] of EXPENSE_RULES) {
          if (re.test(seg)) {
            categoryId = id;
            break;
          }
        }
        if (!categoryId) categoryId = 'exp_other';
      }
    }
    // 分类有效性兜底
    if (!ctx.categories.some((c) => c.id === categoryId)) categoryId = type === 'income' ? 'inc_other_other' : 'exp_other';

    let merchant = '';
    for (const w of MERCHANT_WORDS) {
      if (seg.includes(w)) {
        merchant = w;
        break;
      }
    }

    const leftover = stripStopwords(noPay.replace(amtMatch[0], ' '));
    const note = merchant !== '' && merchant !== leftover ? merchant : leftover.length >= 2 ? leftover : merchant;

    entries.push({
      type,
      amount,
      date,
      categoryId,
      accountId,
      merchant,
      note,
      sourceText: seg,
    });
  }

  return { entries, errors };
}

export const PARSE_EXAMPLES = [
  '今天中午吃饭35，微信支付',
  '昨天淘宝买了个键盘399，支付宝',
  '今天早餐18，地铁6，中午35，晚上和朋友吃饭128，都是微信',
  '工资 15000',
  '房租 3500',
  '打车 28',
  '朋友还我 200',
];
