import { heartHealthConfig } from "./heartHealth";
import { ibsConfig } from "./ibs";
import { diabetesConfig } from "./diabetes";
import { womensHealthConfig } from "./womensHealth";
import { eatingDisorderConfig } from "./eatingDisorder";
import { pregnancyConfig } from "./pregnancy";
import { weightLossConfig } from "./weightLoss";
import type { AreaConfig } from "../types";

export const areaConfigs: AreaConfig[] = [
  heartHealthConfig,
  ibsConfig,
  diabetesConfig,
  womensHealthConfig,
  eatingDisorderConfig,
  pregnancyConfig,
  weightLossConfig,
];

export const getAreaConfig = (id: string): AreaConfig | undefined =>
  areaConfigs.find(c => c.id === id);
