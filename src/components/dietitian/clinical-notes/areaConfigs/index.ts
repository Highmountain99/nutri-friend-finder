import { heartHealthConfig } from "./heartHealth";
import { ibsConfig } from "./ibs";
import { diabetesConfig } from "./diabetes";
import { womensHealthConfig } from "./womensHealth";
import { eatingDisorderConfig } from "./eatingDisorder";
import { pregnancyConfig } from "./pregnancy";
import { weightLossConfig } from "./weightLoss";
import { ptAreaConfigs } from "./ptAreas";
import type { AreaConfig, LegacyAreaConfig } from "../types";

/** Selectable goal areas in the wizard (PT-focused). */
export const areaConfigs: AreaConfig[] = ptAreaConfigs;

/** Kept only so previously saved notes still resolve a readable title. */
const legacyAreaConfigs: LegacyAreaConfig[] = [
  heartHealthConfig,
  ibsConfig,
  diabetesConfig,
  womensHealthConfig,
  eatingDisorderConfig,
  pregnancyConfig,
  weightLossConfig,
];

export const getAreaConfig = (id: string): AreaConfig | LegacyAreaConfig | undefined =>
  areaConfigs.find(c => c.id === id) || legacyAreaConfigs.find(c => c.id === id);
