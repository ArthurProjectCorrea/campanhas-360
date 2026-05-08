'use client'

import * as React from 'react'
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export interface SectionCardItem {
  title: string
  value: string
  valueLabel?: string
  trend: 'up' | 'down'
  trendValue: string
  footerTitle: string
  footerDescription: string
  progress?: number
}

interface SectionCardsProps {
  items: SectionCardItem[]
  className?: string
}

function SectionCard({ item }: { item: SectionCardItem }) {
  const [currentProgress, setCurrentProgress] = React.useState(0)

  return (
    <Card
      className="@container/card group relative overflow-hidden transition-all hover:shadow-md"
      onMouseEnter={() => setCurrentProgress(item.progress || 0)}
      onMouseLeave={() => setCurrentProgress(0)}
    >
      <CardHeader>
        <CardDescription>{item.title}</CardDescription>
        <div className="flex items-baseline gap-2">
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {item.value}
          </CardTitle>
          {item.valueLabel && (
            <span className="text-xs text-muted-foreground font-medium">{item.valueLabel}</span>
          )}
        </div>
        <CardAction>
          <Badge variant="outline">
            {item.trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
            {item.trendValue}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {item.footerTitle}{' '}
          {item.trend === 'up' ? (
            <TrendingUpIcon className="size-4" />
          ) : (
            <TrendingDownIcon className="size-4" />
          )}
        </div>
        <div className="text-muted-foreground">{item.footerDescription}</div>
      </CardFooter>

      {item.progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 opacity-0 translate-y-1 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
          <Progress
            value={currentProgress}
            className="h-1 rounded-none bg-transparent *:bg-primary"
          />
        </div>
      )}
    </Card>
  )
}

export function SectionCards({ items, className }: SectionCardsProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 px-4 lg:px-6 w-full',
        'sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]',
        '*:data-[slot=card]:shadow-xs',
        className,
      )}
    >
      {items.map((item, index) => (
        <SectionCard key={index} item={item} />
      ))}
    </div>
  )
}
