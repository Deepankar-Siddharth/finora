import { ArrowDownToLine, ArrowUpFromLine, PiggyBank } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { HealthScoreCard } from '../components/analytics/HealthScoreCard'
import { SavingsRateCard } from '../components/analytics/SavingsRateCard'
import { CategorySpending } from '../components/analytics/CategorySpending'
import { TrendChart } from '../components/analytics/TrendChart'
import { TopCategories } from '../components/analytics/TopCategories'

export function Analytics() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Understand your spending patterns, savings and financial health."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <HealthScoreCard />
        <SavingsRateCard />
        <CategorySpending />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <TrendChart
          title="Monthly Income"
          subtitle="Last 12 months"
          dataKey="income"
          color="#10b981"
          icon={<ArrowDownToLine className="h-4.5 w-4.5" aria-hidden="true" />}
        />
        <TrendChart
          title="Monthly Expenses"
          subtitle="Last 12 months"
          dataKey="expenses"
          color="#ef4444"
          icon={<ArrowUpFromLine className="h-4.5 w-4.5" aria-hidden="true" />}
        />
        <TrendChart
          title="Monthly Savings"
          subtitle="Income minus expenses"
          dataKey="balance"
          color="#6366f1"
          negativeColor="#ef4444"
          icon={<PiggyBank className="h-4.5 w-4.5" aria-hidden="true" />}
        />
      </div>

      <TopCategories />
    </div>
  )
}
