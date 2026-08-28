import { accessorySeeds } from "./accessories";
import { barbellSeeds } from "./barbells";
import { benchSeeds } from "./benches";
import { cardioSeeds } from "./cardio";
import { parseCatalogSeeds } from "./catalog-validation";
import { dumbbellSeeds } from "./dumbbells";
import { plateSeeds } from "./plates";
import { rackSeeds } from "./racks";

const productSeeds = [
  ...rackSeeds,
  ...benchSeeds,
  ...barbellSeeds,
  ...plateSeeds,
  ...dumbbellSeeds,
  ...cardioSeeds,
  ...accessorySeeds,
];

export const catalogProducts = parseCatalogSeeds(productSeeds);
