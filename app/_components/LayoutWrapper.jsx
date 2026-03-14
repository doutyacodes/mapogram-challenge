"use client"
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import React from 'react'

const LayoutWrapper = ({children}) => {
    const pathname = usePathname()

  return (
    <div className={cn("flex-grow relative z-10 md:p-3")}>
        {children}
    </div>
  )
}

export default LayoutWrapper