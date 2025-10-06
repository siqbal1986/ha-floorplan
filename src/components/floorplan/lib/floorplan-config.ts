import {
  ActionConfig,
  BaseActionConfig,
} from '../../../lib/homeassistant/lovelace/types';
import { LovelaceCardConfig } from '../../../lib/homeassistant/data/lovelace';

import {
  ToggleActionConfig,
  CallServiceActionConfig,
  NavigateActionConfig,
  UrlActionConfig,
  MoreInfoActionConfig,
  NoActionConfig,
  CustomActionConfig,
} from '../../../lib/homeassistant/lovelace/types';

import {
  FloorplanSvgElementInfo,
  FloorplanRuleInfo
} from './floorplan-info';

export class FloorplanConfig {
  // Core features
  image!: FloorplanImageConfig | string;
  stylesheet!: FloorplanStylesheetConfig | string;
  log_level!: string;
  console_log_level!: string;
  rules!: FloorplanRuleConfig[];
  /**
   * @deprecated Use `cards` instead.
   */
  card_hosts?: FloorplanCardHostConfig[];

  // Optional features
  startup_action!:
    | FloorplanActionConfig[]
    | FloorplanActionConfig
    | string
    | false;
  defaults!: FloorplanRuleConfig;
  image_mobile!: FloorplanImageConfig | string;
  functions!: string;
  cards?: FloorplanCardHostConfig[];

  // Experimental features
  pages!: string[];
  variables!: FloorplanVariableConfig[];
  pan_zoom: unknown;
}

declare global {
  interface HASSDomEvents {
    'll-custom': ActionConfig;
  }
}

export interface FloorplanCallServiceActionConfig
  extends CallServiceActionConfig {
  value: unknown;
  _is_internal_action_scope?: boolean;
}

export interface HoverInfoActionConfig extends BaseActionConfig {
  action: 'hover-info';
}

export type FloorplanActionConfig =
  | ToggleActionConfig
  | FloorplanCallServiceActionConfig
  | NavigateActionConfig
  | UrlActionConfig
  | MoreInfoActionConfig
  | NoActionConfig
  | CustomActionConfig
  | HoverInfoActionConfig;

export class FloorplanPageConfig extends FloorplanConfig {
  page_id!: string;
  master_page!: FloorplanMasterPageConfig;
}

export class FloorplanMasterPageConfig extends FloorplanPageConfig {
  content_element!: string;
}

export class FloorplanImageConfig {
  location!: string;
  cache!: boolean;
  sizes!: FloorplanImageSize[];
  use_screen_width?: boolean;
}

export class FloorplanImageSize {
  min_width = 0;
  location!: string;
  cache!: boolean;
}

export class FloorplanStylesheetConfig {
  location!: string;
  cache!: boolean;
}

export class FloorplanRuleConfig {
  entity!: string;
  entities!: (string | FloorplanRuleEntityElementConfig)[];
  groups!: string[];
  element!: string;
  elements!: string[];

  // action_name?: string;
  service?: string;
  service_data?: Record<string, unknown>;
  // url?: string;
  state_action!:
    | FloorplanActionConfig
    | FloorplanActionConfig[]
    | string
    | false;
  tap_action!: FloorplanActionConfig | FloorplanActionConfig[] | string | false;
  hold_action!:
    | FloorplanActionConfig
    | FloorplanActionConfig[]
    | string
    | false;
  double_tap_action!:
    | FloorplanActionConfig
    | FloorplanActionConfig[]
    | string
    | false;
  hover_action!:
    | FloorplanActionConfig
    | FloorplanActionConfig[]
    | string
    | false;
  hover_info_filter!: string[];
}

export interface FloorplanCardSetOptions {
  source?: 'auto' | 'manual';
  visible?: boolean;
}

export interface FloorplanCardHostStateConfig {
  card?: LovelaceCardConfig;
  visible?: boolean;
  options?: FloorplanCardSetOptions;
  mode?: 'replace' | 'overlay';
  pointer_events?: string;
}

export interface FloorplanCardHostConditionConfig {
  entity: string;
  attribute?: string;
  state?: string | string[];
  not_state?: string | string[];
  equals?: unknown;
  not_equals?: unknown;
  in?: unknown[];
  not_in?: unknown[];
}

export interface FloorplanCardHostVariantConfig
  extends FloorplanCardHostStateConfig {
  id?: string;
  conditions?: FloorplanCardHostConditionConfig[];
  entities?: string[];
}

export type FloorplanCardHostVariantsConfig =
  | FloorplanCardHostVariantConfig[]
  | Record<string, FloorplanCardHostVariantConfig>;

export interface FloorplanCardHostConfig
  extends FloorplanCardHostStateConfig {
  id?: string;
  target?: string;
  selector?: string;
  element?: string;
  container_id?: string;
  entities?: string[];
  variants?: FloorplanCardHostVariantsConfig;
  /**
   * How the embedded Lovelace card should fit inside the target rect.
   * - 'fill' (default): force the card and its ha-card to width/height 100%.
   * - 'contain': scale the rendered card uniformly to fit within the rect while preserving aspect ratio.
   * - 'cover': scale the rendered card uniformly to cover the rect entirely (may crop), preserving aspect ratio.
   * - 'none': do not force/stretch; render at the card's natural size.
   */
  fit?: 'fill' | 'contain' | 'cover' | 'none';
  /**
   * Optional natural (baseline) size of the embedded card content, used for uniform scaling.
   * Accepts number (square), string (e.g., "320x320", "320 × 320"), array [w,h], or object {width,height}.
   */
  default_size?: number | string | [number, number] | { width: number; height: number };
  foreign_object?: {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
  };
}

export class FloorplanRuleEntityElementConfig {
  entity!: string;
  element!: string;
}

export class FloorplanVariableConfig {
  name!: string;
  value!: unknown;
}

export interface FloorplanEventActionCallDetail {
  actionConfig: FloorplanCallServiceActionConfig;
  entityId?: string;
  svgElementInfo?: FloorplanSvgElementInfo;
  ruleInfo?: FloorplanRuleInfo;
}
