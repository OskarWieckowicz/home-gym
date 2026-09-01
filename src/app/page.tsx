import { AgentGuide } from "@/components/landing/agent-guide";
import { LandingClosing } from "@/components/landing/landing-closing";
import { LandingHero } from "@/components/landing/landing-hero";
import { PlanningSteps } from "@/components/landing/planning-steps";
import { SharedEditingSection } from "@/components/landing/shared-editing-section";
import { WebMcpExplainer } from "@/components/landing/webmcp-explainer";

export default function Home() {
  return (
    <main className="flex-1 bg-surface">
      <LandingHero />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <PlanningSteps />
        <SharedEditingSection />
        <AgentGuide />
        <WebMcpExplainer />
        <LandingClosing />
      </div>
    </main>
  );
}
