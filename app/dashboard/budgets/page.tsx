import { Suspense } from "react"
import { BudgetList } from "@/components/budget/budget-list"
import { BudgetHeader } from "@/components/budget/budget-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function BudgetsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <BudgetHeader />
      
      <Suspense fallback={<BudgetListSkeleton />}>
        <BudgetList />
      </Suspense>
    </div>
  )
}

function BudgetListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </Card>
      ))}
    </div>
  )
}