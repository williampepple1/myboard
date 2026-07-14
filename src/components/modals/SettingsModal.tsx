'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

const PRESET_COLORS = [
  { name: 'Purple', primary: '#4338CA', hover: '#3730A3' },
  { name: 'Blue', primary: '#0C66E4', hover: '#0052cc' },
  { name: 'Green', primary: '#16a34a', hover: '#15803d' },
  { name: 'Red', primary: '#dc2626', hover: '#b91c1c' },
  { name: 'Orange', primary: '#ea580c', hover: '#c2410c' },
  { name: 'Slate', primary: '#475569', hover: '#334155' },
]

function darkenHex(hex: string, amount = 20) {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  const num = parseInt(hex, 16)
  let r = (num >> 16) - amount
  let g = ((num >> 8) & 0x00FF) - amount
  let b = (num & 0x0000FF) - amount
  r = Math.max(Math.min(255, r), 0)
  g = Math.max(Math.min(255, g), 0)
  b = Math.max(Math.min(255, b), 0)
  return '#' + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')
}

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { primary, setTheme } = useThemeStore()
  const [customColor, setCustomColor] = useState(primary)

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    setTheme(color, darkenHex(color, 20))
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-border rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#172B4D]">Theme Settings</h2>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground transition-colors p-1 rounded hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-foreground/70 mb-3">Preset Colors</h3>
            <div className="flex flex-wrap gap-3">
              {PRESET_COLORS.map(color => (
                <button
                  key={color.name}
                  onClick={() => setTheme(color.primary, color.hover)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm"
                  style={{ backgroundColor: color.primary }}
                  title={color.name}
                >
                  {primary.toLowerCase() === color.primary.toLowerCase() && (
                    <Check size={20} className="text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-medium text-foreground/70 mb-3">Custom Color</h3>
            <div className="flex items-center gap-4">
              <input 
                type="color" 
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-12 h-12 rounded cursor-pointer border-0 p-0"
              />
              <div className="flex-1">
                <input 
                  type="text" 
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all text-sm uppercase"
                />
              </div>
            </div>
            <p className="text-xs text-foreground/50 mt-2">
              The hover state color is automatically calculated.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-5 border-t border-border mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
