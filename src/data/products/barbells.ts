import type { Product } from "@/features/catalog/schemas";

export const barbellSeeds = [
  {
    id: "product_quarry_power_bar",
    slug: "quarry-power-bar",
    name: "Quarry Power Bar",
    brand: "Anvil North",
    category: "free-weights",
    placementMode: "floor",
    description: "A rigid 20 kg bar intended for heavy squats, presses, and controlled deadlifts.",
    price: 1499,
    dimensions: { widthCm: 220, depthCm: 5, heightCm: 5 },
    useZone: { frontCm: 50, backCm: 50, leftCm: 25, rightCm: 25 },
    exercises: ["back squat", "bench press", "deadlift"],
    trainingGoals: ["strength", "muscle-gain"],
    muscleGroups: ["legs", "chest", "back"],
    weightKg: 20,
    maximumLoadKg: 320,
    requirements: { flooring: "reinforced-floor" },
  },
] satisfies Product[];
