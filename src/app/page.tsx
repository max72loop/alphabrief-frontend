import Link from "next/link";
import ScoreCards from "@/components/ScoreCards";
import StickyBanner from "@/components/StickyBanner";
import StatsBar from "@/components/StatsBar";

function Logo({ size = "base" }: { size?: "base" | "lg" }) {
  const cls = size === "lg"
    ? { alpha: "text-5xl", word: "text-4xl" }
    : { alpha: "text-xl", word: "text-lg" };
  return (
    <span className="tracking-tight select-none">
      <span
        className={`${cls.alpha} text-[#7EE5A3]`}
        style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", fontWeight: 500 }}
      >
        α
      </span>
      <span className={`${cls.word} font-bold text-[#F0EBDB]`}>lpha</span>
      <span className={`${cls.word} font-medium text-[#F0EBDB]`}>Brief</span>
    </span>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0F0C] text-[#F0EBDB]">

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 bg-[#0A0F0C]/90 border-b border-[#1A2520] backdrop-blur-xl">
        <Logo />

        <div className="hidden sm:flex items-center gap-6 text-sm text-[#4A6355]">
          <a href="#comment-ca-marche" className="hover:text-[#F0EBDB] transition-colors">
            Comment ça marche
          </a>
          <Link href="/pricing" className="hover:text-[#F0EBDB] transition-colors">
            Tarifs
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-1.5 text-sm text-[#4A6355] hover:text-[#F0EBDB] transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/login"
            className="px-4 py-1.5 text-sm font-semibold bg-[#7EE5A3] hover:bg-[#9AEDB5] text-[#0A0F0C] rounded-lg transition-colors"
          >
            Essayer gratuitement
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-36 pb-24 flex-1 overflow-hidden">
        {/* Ambient glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[400px] rounded-full bg-[#7EE5A3]/10 blur-[140px]" />
          <div className="absolute w-[280px] h-[280px] rounded-full bg-[#E5A04E]/8 blur-[100px] translate-x-32 -translate-y-8" />
        </div>

        <span className="inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-widest text-[#7EE5A3] bg-[#7EE5A3]/10 border border-[#7EE5A3]/25 px-3 py-1 rounded-full mb-6">
          ✦ 1 500+ actions scorées en temps réel
        </span>

        <h1 className="text-4xl sm:text-6xl font-bold leading-tight tracking-tight mb-5 max-w-3xl text-[#F0EBDB]">
          Investis dans les bonnes boîtes.{" "}
          <span className="text-[#7EE5A3]">Au bon moment.</span>
        </h1>

        <p className="text-lg text-[#4A6355] max-w-xl leading-relaxed mb-10">
          AlphaBrief score chaque action de <strong className="text-[#F0EBDB]">0 à 100</strong> en
          combinant fondamentaux, indicateurs techniques et momentum. Plus besoin de jongler entre
          20 métriques — une seule note pour décider.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="px-7 py-3 bg-[#7EE5A3] hover:bg-[#9AEDB5] text-[#0A0F0C] rounded-xl font-semibold text-base transition-colors"
          >
            Commencer gratuitement →
          </Link>
          <a
            href="#comment-ca-marche"
            className="px-7 py-3 border border-[#1A2520] hover:border-[#7EE5A3]/40 rounded-xl font-semibold text-base text-[#4A6355] hover:text-[#F0EBDB] transition-colors"
          >
            Comment ça marche ?
          </a>
        </div>

        <p className="mt-4 text-xs text-[#2A3D30]">
          5 analyses gratuites par jour · Pas de carte bancaire requise
        </p>
      </section>

      {/* ── Product preview ───────────────────────────────────────────── */}
      <section className="flex flex-col items-center px-6 pb-16 gap-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#2A3D30]">
          Aperçu en direct · Mis à jour chaque nuit
        </p>
        <ScoreCards />
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <StatsBar />

      {/* ── Pourquoi AlphaBrief ───────────────────────────────────────── */}
      <section className="px-6 pb-24 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-2 text-[#F0EBDB]">Pourquoi AlphaBrief ?</h2>
        <p className="text-center text-[#4A6355] text-sm mb-10">
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
              className="bg-[#0F1A13] border border-[#1A2520] rounded-xl p-5 flex flex-col gap-3 hover:border-[#7EE5A3]/30 transition-colors"
            >
              <span className="text-2xl">{b.icon}</span>
              <span className="font-bold text-[#F0EBDB] text-sm">{b.title}</span>
              <div className="flex flex-col gap-1.5">
                <p className="text-[0.75rem] text-[#4A6355] flex items-start gap-2">
                  <span className="mt-0.5 text-red-400 font-bold">✕</span>
                  {b.before}
                </p>
                <p className="text-[0.75rem] text-[#7EE5A3] flex items-start gap-2">
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
        <h2 className="text-2xl font-bold text-center mb-10 text-[#F0EBDB]">Un score. Trois piliers.</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              label: "50%",
              title: "Fondamentaux",
              desc: "Marges, croissance du chiffre d'affaires, dette, retour sur capitaux propres — inspiré de la méthode Brian Feroldi.",
            },
            {
              label: "25%",
              title: "Techniques",
              desc: "RSI 14 jours, volatilité annuelle, drawdown maximum — pour savoir si le titre est en zone d'achat.",
            },
            {
              label: "25%",
              title: "Momentum",
              desc: "Performance relative sur 1, 3, 6 et 12 mois par rapport au marché et au secteur.",
            },
          ].map((p) => (
            <div
              key={p.title}
              className="bg-[#0F1A13] border border-[#1A2520] rounded-xl p-5 hover:border-[#7EE5A3]/30 transition-colors"
            >
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-bold text-[#F0EBDB]">{p.title}</span>
                <span
                  className="text-xs font-semibold text-[#7EE5A3]"
                  style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                >
                  {p.label}
                </span>
              </div>
              <p className="text-sm text-[#4A6355] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Score legend ──────────────────────────────────────────────── */}
      <section className="px-6 pb-24 max-w-2xl mx-auto w-full">
        <h2 className="text-xl font-bold text-center mb-6 text-[#F0EBDB]">Lire un score AlphaBrief</h2>
        <div className="bg-[#0F1A13] border border-[#1A2520] rounded-xl overflow-hidden">
          {[
            { range: "75 – 100", label: "Excellent", dot: "bg-[#7EE5A3]", desc: "Fondamentaux solides, momentum positif, signal fort." },
            { range: "60 – 74",  label: "Bon",       dot: "bg-[#7EE5A3]/60", desc: "Bonne qualité globale, à surveiller de près." },
            { range: "45 – 59",  label: "Neutre",    dot: "bg-[#E5A04E]",   desc: "Profil mixte — métriques contrastées, pas de signal clair." },
            { range: "30 – 44",  label: "Attention", dot: "bg-orange-500",  desc: "Faiblesses identifiées sur plusieurs piliers." },
            { range: "0 – 29",   label: "Risqué",    dot: "bg-red-500",     desc: "Score faible — à éviter ou à revoir en profondeur." },
          ].map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center gap-4 px-5 py-3 ${i < 4 ? "border-b border-[#1A2520]" : ""}`}
            >
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${row.dot}`} />
              <span
                className="text-sm text-[#4A6355] w-16 flex-shrink-0"
                style={{ fontFamily: "var(--font-jetbrains-mono)" }}
              >
                {row.range}
              </span>
              <span className="text-sm font-semibold text-[#F0EBDB] w-20 flex-shrink-0">{row.label}</span>
              <span className="text-sm text-[#4A6355]">{row.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Gratuit vs Pro ────────────────────────────────────────────── */}
      <section className="px-6 pb-24 max-w-3xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-2 text-[#F0EBDB]">Gratuit ou Pro ?</h2>
        <p className="text-center text-[#4A6355] text-sm mb-10">
          Commencez gratuitement, passez Pro quand vous en avez besoin.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Gratuit */}
          <div className="bg-[#0F1A13] border border-[#1A2520] rounded-2xl p-6 flex flex-col gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#4A6355]">Gratuit</span>
              <p className="text-3xl font-bold mt-1 text-[#F0EBDB]">
                0 €<span className="text-base font-normal text-[#4A6355]"> / mois</span>
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              {[
                [true,  "5 analyses complètes par jour"],
                [true,  "Score sur 3 piliers"],
                [true,  "Watchlist (5 actions)"],
                [false, "Analyses illimitées"],
                [false, "Alertes de score par email"],
                [false, "Données historiques"],
                [false, "Export CSV"],
              ].map(([ok, feat]) => (
                <li key={feat as string} className="flex items-center gap-2">
                  <span className={`font-bold flex-shrink-0 ${ok ? "text-[#7EE5A3]" : "text-[#1A2520]"}`}>
                    {ok ? "✓" : "✕"}
                  </span>
                  <span className={ok ? "text-[#F0EBDB]" : "text-[#2A3D30]"}>{feat as string}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="mt-auto text-center px-5 py-2.5 border border-[#1A2520] hover:border-[#7EE5A3]/40 rounded-xl text-sm font-semibold text-[#4A6355] hover:text-[#F0EBDB] transition-colors"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* Pro */}
          <div className="relative bg-[#7EE5A3]/5 border border-[#7EE5A3]/30 rounded-2xl p-6 flex flex-col gap-4">
            <span className="absolute top-4 right-4 text-[0.65rem] font-bold uppercase tracking-widest bg-[#7EE5A3]/15 text-[#7EE5A3] border border-[#7EE5A3]/30 px-2 py-0.5 rounded-full">
              Populaire
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#7EE5A3]">Pro</span>
              <p className="text-3xl font-bold mt-1 text-[#F0EBDB]">
                4,99 €<span className="text-base font-normal text-[#4A6355]"> / mois</span>
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              {[
                "Analyses illimitées",
                "Score sur 3 piliers",
                "Watchlist illimitée",
                "Alertes de score par email",
                "Données historiques",
                "Export CSV",
                "Support prioritaire",
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-2">
                  <span className="text-[#7EE5A3] font-bold flex-shrink-0">✓</span>
                  <span className="text-[#F0EBDB]">{feat}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/pricing"
              className="mt-auto text-center px-5 py-2.5 bg-[#7EE5A3] hover:bg-[#9AEDB5] text-[#0A0F0C] rounded-xl text-sm font-semibold transition-colors"
            >
              Passer Pro →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────── */}
      <section className="px-6 pb-28">
        <div className="max-w-2xl mx-auto rounded-2xl bg-[#0F1A13] border border-[#7EE5A3]/20 px-8 py-12 text-center relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-[400px] h-[200px] rounded-full bg-[#7EE5A3]/8 blur-[80px]" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-[#F0EBDB] relative">Prêt à scorer vos premières actions ?</h2>
          <p className="text-[#4A6355] mb-8 text-sm relative">
            Commencez gratuitement — aucune carte bancaire requise.
          </p>
          <ul className="inline-flex flex-col items-start gap-2 mb-8 text-sm relative">
            {[
              "5 analyses complètes par jour offertes",
              "Score sur 3 piliers : fondamentaux, technique, momentum",
              "Watchlist personnalisée et alertes",
              "Données mises à jour chaque nuit",
            ].map((feat) => (
              <li key={feat} className="flex items-center gap-2 text-[#F0EBDB]">
                <span className="text-[#7EE5A3] font-bold">✓</span>
                {feat}
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#7EE5A3] hover:bg-[#9AEDB5] text-[#0A0F0C] rounded-xl font-semibold text-base transition-colors"
            >
              Créer un compte gratuit →
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-[#1A2520] hover:border-[#7EE5A3]/40 rounded-xl font-semibold text-base text-[#4A6355] hover:text-[#F0EBDB] transition-colors"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="px-6 pb-24 max-w-2xl mx-auto w-full">
        <h2 className="text-xl font-bold text-center mb-8 text-[#F0EBDB]">Questions fréquentes</h2>
        <div className="flex flex-col divide-y divide-[#1A2520]">
          {[
            {
              q: "D'où viennent les données ?",
              a: "Les données financières proviennent de sources publiques (rapports SEC, Yahoo Finance) et sont recalculées chaque nuit. Les cours temps réel sont fournis via une API dédiée.",
            },
            {
              q: "Le score est-il fiable pour prendre des décisions ?",
              a: "AlphaBrief est un outil d'aide à la décision, pas un conseil financier. Le score synthétise des données objectives mais ne remplace pas votre propre analyse ni un conseiller agréé MIF II.",
            },
            {
              q: "Quelle est la différence entre l'offre gratuite et Pro ?",
              a: "L'offre gratuite donne accès à 5 analyses complètes par jour. L'offre Pro débloque les analyses illimitées, les alertes de score, la watchlist avancée et les données historiques.",
            },
            {
              q: "Quelles actions sont couvertes ?",
              a: "Plus de 1 500 actions américaines (NYSE, NASDAQ) sont disponibles. La couverture des marchés européens est en cours de développement.",
            },
            {
              q: "Puis-je annuler mon abonnement à tout moment ?",
              a: "Oui. L'abonnement Pro est sans engagement, annulable en un clic depuis les paramètres. Aucuns frais cachés.",
            },
          ].map((item) => (
            <details key={item.q} className="group py-4 cursor-pointer list-none">
              <summary className="flex items-center justify-between gap-4 text-sm font-semibold text-[#F0EBDB] select-none marker:hidden">
                {item.q}
                <span className="text-[#4A6355] group-open:rotate-45 transition-transform duration-200 text-lg leading-none flex-shrink-0">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-[#4A6355] leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1A2520] px-6 py-6 text-center text-xs text-[#2A3D30]">
        <p>
          © {new Date().getFullYear()} AlphaBrief — Outil d&apos;aide à la décision, pas un conseil en investissement au sens MIF II.
        </p>
        <p className="mt-1">
          <Link href="/login" className="hover:text-[#4A6355] transition-colors">Connexion</Link>
          {" · "}
          <Link href="/pricing" className="hover:text-[#4A6355] transition-colors">Tarifs</Link>
          {" · "}
          <a href="mailto:contact@maxloop.ovh" className="hover:text-[#4A6355] transition-colors">Contact</a>
        </p>
      </footer>

      <StickyBanner />
    </div>
  );
}
