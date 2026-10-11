import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import HomePage from '@/pages/HomePage/HomePage';
import EntryPage from '@/pages/EntryPage/EntryPage';
import RecordsPage from '@/pages/RecordsPage/RecordsPage';
import AccountsPage from '@/pages/AccountsPage/AccountsPage';
import CategoriesPage from '@/pages/CategoriesPage/CategoriesPage';
import BudgetsPage from '@/pages/BudgetsPage/BudgetsPage';
import MonthlyStatsPage from '@/pages/MonthlyStatsPage/MonthlyStatsPage';
import YearlyStatsPage from '@/pages/YearlyStatsPage/YearlyStatsPage';
import BalanceSheetPage from '@/pages/BalanceSheetPage/BalanceSheetPage';
import SubscriptionsPage from '@/pages/SubscriptionsPage/SubscriptionsPage';
import AnalysisPage from '@/pages/AnalysisPage/AnalysisPage';
import RulesPage from '@/pages/RulesPage/RulesPage';
import BackupPage from '@/pages/BackupPage/BackupPage';
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="entry" element={<EntryPage />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="budgets" element={<BudgetsPage />} />
        <Route path="monthly" element={<MonthlyStatsPage />} />
        <Route path="yearly" element={<YearlyStatsPage />} />
        <Route path="balance" element={<BalanceSheetPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="analysis" element={<AnalysisPage />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="backup" element={<BackupPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
