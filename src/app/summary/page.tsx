import type { Metadata } from "next";
import { Suspense } from "react";
import { SummaryEntry } from "@/features/summary/components/summary-entry";
import "./summary.css";

export const metadata: Metadata = {
  title: "Project summary — Home Gym Creator",
  description: "Review your local gym layout, equipment, budget, training goals and layout checks.",
};

export default function SummaryPage() {
  return <Suspense fallback={<p role="status">Loading project summary…</p>}>
    <SummaryEntry />
  </Suspense>;
}
