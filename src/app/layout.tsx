import type { Metadata } from 'next'

/**
 * Minimal root layout.
 *
 * The site itself is the static WordPress clone in `public/`, which ships its
 * own complete HTML documents. This layout exists only because the Next App
 * Router requires one; nothing user-facing renders through it.
 */
export const metadata: Metadata = {
  title: 'Slopes to Hope',
  description: 'Reducing Waste and Fostering Hope',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
