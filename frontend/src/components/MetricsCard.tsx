import { LucideIcon } from 'lucide-react'

interface MetricsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray'
  subtitle?: string
}

const colorClasses = {
  green: 'text-success bg-success/10',
  yellow: 'text-warning bg-warning/10',
  orange: 'text-caution bg-caution/10',
  red: 'text-danger bg-danger/10',
  blue: 'text-primary bg-primary/10',
  gray: 'text-unknown bg-unknown/10',
}

export default function MetricsCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  subtitle 
}: MetricsCardProps) {
  return (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}
