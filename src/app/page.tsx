import { LandingNav, LandingFooter } from "@/components/landing/Chrome";
import { TickerTape } from "@/components/landing/TickerTape";
import { Hero } from "@/components/landing/Hero";
import { Method } from "@/components/landing/Method";
import { DailyEdition } from "@/components/landing/DailyEdition";
import { ScoreReader } from "@/components/landing/ScoreReader";
import { Pricing } from "@/components/landing/Pricing";
import { EditorialCTA } from "@/components/landing/EditorialCTA";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "#0A0F0C" }}>
      <LandingNav />
      <TickerTape />
      <div style={{ paddingTop: 90 }}>
        <Hero />
        <Method />
        <DailyEdition />
        <ScoreReader />
        <Pricing />
        <EditorialCTA />
        <LandingFooter />
      </div>
    </div>
  );
}
