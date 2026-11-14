import { useEffect, useState } from 'react'

/**
 * Warna carta mesti ikut tema site (Linear / Gold / Mono × light / dark).
 * CSS var tak boleh dibaca terus oleh canvas lightweight-charts, jadi kita
 * baca nilai computed dan langgan perubahan `data-design` / `data-theme`.
 */
export interface ChartColors {
  up: string
  down: string
  entry: string
  text: string
  grid: string
  border: string
  gold: string
  dark: boolean
}

function readVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function snapshot(): ChartColors {
  const root = document.documentElement
  const theme = root.getAttribute('data-theme')
  const dark = theme ? theme === 'dark' : !window.matchMedia('(prefers-color-scheme: light)').matches
  return {
    up: readVar('--green', '#2fbf71'),
    down: readVar('--red', '#e5484d'),
    entry: readVar('--primary', '#5e6ad2'),
    text: readVar('--ink-subtle', '#8a8f98'),
    // grid/border guna warna solid tema dengan opacity rendah — bukan rgba hardcode
    grid: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    border: readVar('--hairline', '#22242a'),
    gold: readVar('--gold-accent', '#c8a24a'),
    dark,
  }
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(snapshot)

  useEffect(() => {
    const apply = () => setColors(snapshot())
    const obs = new MutationObserver(apply)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-design'],
    })
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    mq.addEventListener('change', apply)
    return () => {
      obs.disconnect()
      mq.removeEventListener('change', apply)
    }
  }, [])

  return colors
}
