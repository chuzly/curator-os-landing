import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Card Mania 2026 Survey — Closed | Chou's TCG Ledger",
  description:
    "The Card Mania 2026 collector survey closed on May 24, 2026. Thank you to everyone who participated. Visit Chou's TCG Ledger for ongoing PTCG market analysis.",
};

export default function CardmaniaSurveyClosedPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "80px auto",
        padding: 24,
        textAlign: "center",
        fontFamily:
          '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Survey Closed · 问卷已结束</h1>
      <p style={{ color: "#555", lineHeight: 1.7 }}>
        The Card Mania 2026 collector survey closed on May 24, 2026.
        <br />
        Thank you to everyone who participated. 感谢每一位参与的藏家。
      </p>
      <p style={{ color: "#555", marginTop: 24 }}>
        For ongoing PTCG market analysis · curator commentary · newsletter:
      </p>
      <a
        href="https://chous-tcg-ledger.vercel.app"
        style={{
          display: "inline-block",
          marginTop: 12,
          padding: "12px 24px",
          background: "#B73224",
          color: "#fff",
          textDecoration: "none",
          borderRadius: 6,
          fontWeight: 600,
        }}
      >
        Visit 邹氏卡藏 / Chou&apos;s TCG Ledger →
      </a>
    </main>
  );
}
