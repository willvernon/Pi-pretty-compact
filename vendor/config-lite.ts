/* pi-pretty-compact: verbatim subset of pi-pretty src/config.ts (MIT, see LICENSE).
 * Only what working-indicator.ts imports. The full config.ts reads files and type-imports Shiki. */

export const FG_DIM = "\x1b[38;2;80;80;80m";
export const FG_BLUE = "\x1b[38;2;100;140;220m";
export const FG_MUTED = "\x1b[38;2;139;148;158m";

export interface WorkingIndicatorConfig {
	enabled?: boolean;
	/** One phrase or a list of phrases rotated across sweeps. */
	text?: string | string[];
	mode?: "shimmer" | "kitt" | "static";
	/** Tier colors: a pi theme color name or a `#rrggbb` hex. */
	low?: string;
	mid?: string;
	high?: string;
	bold?: boolean;
	/** @deprecated Retained for config compatibility; the working row no longer renders this hint. */
	hint?: boolean;
	/** Tint the indicator with a stable per-session accent color. */
	sessionAccent?: boolean;
	/** Frame advance interval in ms (>= 33). Higher = cheaper frames while the agent works. */
	intervalMs?: number;
}

export interface ThinkingIndicatorConfig {
	enabled?: boolean;
	/** Label refresh interval in ms (>= 33). Higher = cheaper frames while thinking. */
	intervalMs?: number;
}
