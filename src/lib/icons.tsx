import { CheckSquare, Bug, Bookmark, ArrowUp, ChevronUp, ChevronDown, Check } from 'lucide-react'

export const ISSUE_TYPE_ICONS: Record<string, React.ReactNode> = {
  TASK: <CheckSquare size={16} className="text-primary" />,
  BUG: <Bug size={16} className="text-red-500" />,
  STORY: <Bookmark size={16} className="text-green-500" />,
  EPIC: <CheckSquare size={16} className="text-purple-500" />
}

export const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  URGENT: <ArrowUp size={16} className="text-red-600" />,
  HIGH: <ChevronUp size={16} className="text-red-400" />,
  MEDIUM: <Check size={16} className="text-orange-400" />,
  LOW: <ChevronDown size={16} className="text-blue-400" />
}
