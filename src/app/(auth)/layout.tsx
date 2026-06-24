export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid place-items-center bg-canvas p-6">
      <div className="splash-card fade-up">
        <div className="splash-art">
          <div className="flex items-center gap-3">
            <span className="brand-mark">v</span>
            <div>
              <div className="brand-name" style={{ color: "#fff" }}>
                Visory
              </div>
              <div className="brand-sub">Performance</div>
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ color: "var(--magenta-3)" }}>
              Quarterly reviews · 9-box
            </div>
            <h2
              className="serif"
              style={{ fontSize: 38, lineHeight: 1.05, letterSpacing: "-0.02em", marginTop: 8 }}
            >
              Performance, <em style={{ fontStyle: "italic" }}>clearly.</em>
            </h2>
          </div>
        </div>
        <div className="splash-body">{children}</div>
      </div>
    </div>
  );
}
