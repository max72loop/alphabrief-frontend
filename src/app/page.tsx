import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f1a] text-white">

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 bg-[#0a0a14]/90 border-b border-white/[0.06] backdrop-blur-xl">
        <span className="text-base font-bold tracking-tight text-white">
          Alpha<span className="text-indigo-400">Brief</span>
        </span>

        {/* Liens de navigation centraux */}
        <div className="hidden sm:flex items-center gap-6 text-sm text-zinc-400">
          <a href="#comment-ca-marche" className="hover:text-white transition-colors">
            Comment ça marche
          </a>
          <Link href="/pricing" className="hover:text-white transition-colors">
            Tarifs
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-1.5 text-sm text-zinc-300 hover:text-white transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/login"
            className="px-4 py-1.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            Essayer gratuitement
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-36 pb-24 flex-1">
        <span className="inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-3 py-1 rounded-full mb-6">
          ✦ 1 500+ actions scorées en temps réel
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-5 max-w-3xl">
          Investis dans les bonnes boîtes.{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Au bon moment.
          </span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-xl leading-relaxed mb-10">
          AlphaBrief score chaque action de <strong className="text-white">0 à 100</strong> en
          combinant fondamentaux, indicateurs techniques et momentum. Plus besoin de jongler entre
          20 métriques — une seule note pour décider.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="px-7 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-base transition-colors"
          >
            Commencer gratuitement →
          </Link>
          <a
            href="#comment-ca-marche"
            className="px-7 py-3 border border-white/10 hover:border-white/20 rounded-xl font-semibold text-base text-zinc-300 hover:text-white transition-colors"
          >
            Comment ça marche ?
          </a>
        </div>
        <p className="mt-4 text-xs text-zinc-600">
          5 analyses gratuites par jour · Pas de carte bancaire requise
        </p>
      </section>

      {/* ── Product preview ───────────────────────────────────────────── */}
      <section className="flex flex-col items-center px-6 pb-24 gap-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Aperçu en direct · Mis à jour chaque nuit
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          {[
            {
              ticker: "AAPL",
              name: "Apple Inc.",
              score: 74,
              label: "Bon",
              change: "+1.42%",
              changePos: true,
              scoreColor: "text-emerald-400",
              barColor: "bg-emerald-500",
              badgeBg: "bg-emerald-500/10 border-emerald-500/20",
              badgeText: "text-emerald-400",
            },
            {
              ticker: "META",
              name: "Meta Platforms",
              score: 81,
              label: "Excellent",
              change: "+2.07%",
              changePos: true,
              scoreColor: "text-emerald-400",
              barColor: "bg-emerald-500",
              badgeBg: "bg-emerald-500/10 border-emerald-500/20",
              badgeText: "text-emerald-400",
            },
            {
              ticker: "NKE",
              name: "Nike Inc.",
              score: 38,
              label: "Attention",
              change: "-0.83%",
              changePos: false,
              scoreColor: "text-red-400",
              barColor: "bg-red-500",
              badgeBg: "bg-red-500/10 border-red-500/20",
              badgeText: "text-red-400",
            },
          ].map((s) => (
            <div
              key={s.ticker}
              className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3 hover:border-white/[0.14] transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    {s.ticker}
                  </span>
                  <p className="text-[0.7rem] text-zinc-500 mt-0.5">{s.name}</p>
                </div>
                <span
                  className={`text-[0.7rem] font-semibold ${
                    s.changePos ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {s.change}
                </span>
              </div>

              {/* Score */}
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-extrabold leading-none ${s.scoreColor}`}>
                  {s.score}
                </span>
                <span className="text-zinc-600 text-sm mb-0.5">/ 100</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.barColor}`}
                  style={{ width: `${s.score}%` }}
                />
              </div>

              {/* Badge */}
              <span
                className={`self-start text-[0.65rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${s.badgeBg} ${s.badgeText}`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pourquoi AlphaBrief ───────────────────────────────────────── */}
      <section className="px-6 pb-24 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-2">Pourquoi AlphaBrief ?</h2>
        <p className="text-center text-zinc-500 text-sm mb-10">
          Fini les tableurs interminables. Un outil pensé pour l&apos;investisseur individuel.
        </p>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              icon: "⏱",
              title: "Gagnez du temps",
              before: "Avant : 2h de recherche par action",
              after: "Après : un score en 3 secondes",
            },
            {
              icon: "🎯",
              title: "Décidez avec confiance",
              before: "Avant : 20 métriques contradictoires",
              after: "Après : une note claire de 0 à 100",
            },
            {
              icon: "📡",
              title: "Restez à jour",
              before: "Avant : données périmées ou payantes",
              after: "Après : mise à jour chaque nuit",
            },
          ].map((b) => (
            <div
              key={b.title}
              className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 flex flex-col gap-3"
            >
              <span className="text-2xl">{b.icon}</span>
              <span className="font-bold text-white text-sm">{b.title}</span>
              <div className="flex flex-col gap-1.5">
                <p className="text-[0.75rem] text-zinc-500 flex items-start gap-2">
                  <span className="mt-0.5 text-red-500 font-bold">✕</span>
                  {b.before}
                </p>
                <p className="text-[0.75rem] text-emerald-400 flex items-start gap-2">
                  <span className="mt-0.5 font-bold">✓</span>
                  {b.after}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section id="comment-ca-marche" className="px-6 pb-24 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-10">Un score. Trois piliers.</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              icon: "📊",
              title: "Fondamentaux",
              pct: "50%",
              desc: "Marges, croissance du chiffre d'affaires, dette, retour sur capitaux propres — inspiré de la méthode Brian Feroldi.",
            },
            {
              icon: "📈",
              title: "Techniques",
              pct: "25%",
              desc: "RSI 14 jours, volatilité annuelle, drawdown maximum — pour savoir si le titre est en zone d'achat.",
            },
            {
              icon: "🚀",
              title: "Momentum",
              pct: "25%",
              desc: "Performance relative sur 1, 3, 6 et 12 mois par rapport au marché et au secteur.",
            },
          ].map((p) => (
            <div
              key={p.title}
              className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5"
            >
              <div className="text-2xl mb-3">{p.icon}</div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-bold text-white">{p.title}</span>
                <span className="text-xs text-indigo-400 font-semibold">{p.pct}</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Score legend ──────────────────────────────────────────────── */}
      <section className="px-6 pb-24 max-w-2xl mx-auto w-full">
        <h2 className="text-xl font-bold text-center mb-6">Lire un score AlphaBrief</h2>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
          {[
            { range: "75 – 100", label: "Excellent", color: "bg-emerald-500", desc: "Fondamentaux solides, momentum positif, signal fort." },
            { range: "60 – 74", label: "Bon", color: "bg-emerald-400", desc: "Bonne qualité globale, à surveiller de près." },
            { range: "45 – 59", label: "Neutre", color: "bg-amber-400", desc: "Profil mixte — métriques contrastées, pas de signal clair." },
            { range: "30 – 44", label: "Attention", color: "bg-orange-500", desc: "Faiblesses identifiées sur plusieurs piliers." },
            { range: "0 – 29", label: "Risqué", color: "bg-red-500", desc: "Score faible — à éviter ou à revoir en profondeur." },
          ].map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center gap-4 px-5 py-3 ${i < 4 ? "border-b border-white/[0.05]" : ""}`}
            >
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${row.color}`} />
              <span className="text-sm font-mono text-zinc-500 w-16 flex-shrink-0">{row.range}</span>
              <span className="text-sm font-semibold text-white w-20 flex-shrink-0">{row.label}</span>
              <span className="text-sm text-zinc-400">{row.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────── */}
      <section className="px-6 pb-28">
        <div className="max-w-2xl mx-auto rounded-2xl bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-transparent border border-indigo-500/20 px-8 py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Prêt à scorer vos premières actions ?</h2>
          <p className="text-zinc-400 mb-8 text-sm">
            Commencez gratuitement — aucune carte bancaire requise.
          </p>

          {/* Checklist */}
          <ul className="inline-flex flex-col items-start gap-2 mb-8 text-sm">
            {[
              "5 analyses complètes par jour offertes",
              "Score sur 3 piliers : fondamentaux, technique, momentum",
              "Watchlist personnalisée et alertes",
              "Données mises à jour chaque nuit",
            ].map((feat) => (
              <li key={feat} className="flex items-center gap-2 text-zinc-300">
                <span className="text-emerald-400 font-bold">✓</span>
                {feat}
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-base transition-colors"
            >
              Créer un compte gratuit →
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-white/10 hover:border-white/20 rounded-xl font-semibold text-base text-zinc-300 hover:text-white transition-colors"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] px-6 py-6 text-center text-xs text-zinc-600">
        <p>
          © {new Date().getFullYear()} AlphaBrief — Outil d&apos;aide à la décision, pas un conseil en investissement au sens MIF II.
        </p>
        <p className="mt-1">
          <Link href="/login" className="hover:text-zinc-400 transition-colors">Connexion</Link>
          {" · "}
          <Link href="/pricing" className="hover:text-zinc-400 transition-colors">Tarifs</Link>
          {" · "}
          <a href="mailto:contact@maxloop.ovh" className="hover:text-zinc-400 transition-colors">Contact</a>
        </p>
      </footer>

    </div>
  );
}
