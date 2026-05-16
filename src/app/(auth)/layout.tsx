export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'var(--bg)' }}
    >
      <div className="absolute inset-0 pointer-events-none bg-atmospheric-glow" />
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  )
}
