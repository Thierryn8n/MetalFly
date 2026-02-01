"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AdvertisementDisplayProps {
  position: string
  adType?: 'image' | 'video' | 'both'
  className?: string
}

export function AdvertisementDisplay({ 
  position, 
  adType = 'both',
  className 
}: AdvertisementDisplayProps) {
  return (
    <Card className={cn("overflow-hidden bg-muted/50 border-dashed", className)}>
      <CardContent className="p-4 flex items-center justify-center min-h-[100px]">
        <div className="text-center text-muted-foreground text-sm">
          <p className="font-medium">Espaço Publicitário</p>
          <p className="text-xs mt-1">Position: {position}</p>
        </div>
      </CardContent>
    </Card>
  )
}
