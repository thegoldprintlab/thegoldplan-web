/**
 * Vercel Web Analytics — kiraan pelawat laman sendiri (first-party).
 *
 * KENAPA ADA, PADAHAL DAH ADA GA4
 * -------------------------------
 * GA4 (lib/analytics.ts) guna cookie → kena tunggu orang tekan "Accept".
 * Kebanyakan pelawat tak pernah tekan apa-apa, jadi GA4 cuma nampak sebahagian
 * kecil trafik. Vercel Web Analytics TAK guna cookie dan tak simpan apa-apa
 * dalam peranti pelawat — ia cuma hantar path, negara, jenis peranti, rujukan.
 * Jadi kita dapat angka "berapa ramai orang datang" yang lebih hampir betul,
 * tanpa perlu consent. Kedua-duanya berjalan serentak; GA4 kekal jadi sumber
 * untuk funnel/event, Vercel untuk jumlah pelawat.
 *
 * PENTING: kalau nak tukar jadi "hantar hanya selepas orang Accept", cuma
 * tambah satu baris dalam beforeSend di bawah (rujuk komen di situ).
 *
 * SKRIP: /_vercel/insights/script.js — disajikan oleh Vercel sendiri
 * (same-origin). Ia HANYA ada kalau Web Analytics dihidupkan untuk projek ini
 * di dashboard Vercel → tab Analytics → Enable.
 */

import { inject, pageview } from '@vercel/analytics'

/** Skrip Vercel hanya wujud di production, dan hanya pada hos sebenar. */
const HOST_DIBENARKAN = ['thegoldplan.my', 'www.thegoldplan.my']

let sudahInject = false

function hosBetul(): boolean {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  // Preview deployment (*.vercel.app) dan localhost dikecualikan — kalau tidak
  // angka production dicemar oleh lawatan kita sendiri semasa ujian.
  return HOST_DIBENARKAN.includes(h)
}

/**
 * Suntik skrip Vercel Web Analytics. No-op (senyap) bila bukan production atau
 * hos bukan laman sebenar — pemanggil tak perlu jaga apa-apa.
 */
export function initWebAnalytics(): boolean {
  if (!import.meta.env.PROD) return false
  if (!hosBetul()) return false
  if (sudahInject) return true
  inject({ mode: 'production' })
  sudahInject = true
  return true
}

/**
 * page_view manual untuk navigasi SPA.
 *
 * Tanpa ini, Vercel hanya nampak muatan pertama; react-router tak muat semula
 * halaman, jadi /pricing, /help dsb. hilang dari laporan.
 */
export function trackWebPageView(path: string) {
  if (!sudahInject) return
  try {
    pageview({ path })
  } catch {
    // Analytics tak boleh sesekali memecahkan app. Telan dan teruskan.
  }
}
