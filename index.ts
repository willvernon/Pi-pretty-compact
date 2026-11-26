/**
 * pi-pretty-compact
 *
 * The prompt box, user message prefix, user rail and working row from pi-pretty,
 * built to sit beside pi-compact-tools. compact-tools owns tool rows and thinking.
 *
 * This extension registers no tools, never touches the thinking label, and loads
 * no Shiki, FFF index or file watcher. Vendored code: see VENDORED.md.
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionContext, SessionInfoChangedEvent } from "@earendil-works/pi-coding-agent";
import * as hostSdk from "@earendil-works/pi-coding-agent";
import type { WorkingIndicatorConfig } from "./vendor/config-lite.js";
import { createPromptEditorClass, type CustomEditorConstructor } from "./vendor/prompt-editor.js";
import { installUserRail, setUserRail } from "./vendor/user-rail.js";
import {
	installWorkingIndicator,
	resolveWorkingIndicatorSettings,
	type WorkingIndicatorController,
} from "./vendor/working-indicator.js";

interface PrettyCompactConfig {
	prompt?: {
		/** true: rounded box with a 3-column icon slot. false: plain rules, flush-left icon. */
		boxed?: boolean;
		/** Prefix sent user messages with the prompt icon (display only). */
		userIcon?: boolean;
	};
	/** `#rrggbb` one-cell bar left of user messages. Unset means no rail. */
	userRail?: string;
	workingIndicator?: WorkingIndicatorConfig;
}

const USER_MESSAGE_ICON = "❯";
const NAME = "pi-pretty-compact";

// Copied from pi-pretty src/index.ts
type EditorFactory = Parameters<ExtensionContext["ui"]["setEditorComponent"]>[0];
type EditorUiCompatibility = {
	setEditorComponent?: (factory: EditorFactory) => void;
	getEditorComponent?: () => EditorFactory;
};

function configPath(): string {
	const dir = process.env.PI_PRETTY_COMPACT_CONFIG_DIR ?? join(homedir(), ".pi", "agent");
	return join(dir, `${NAME}.json`);
}

function loadConfig(): PrettyCompactConfig {
	try {
		const parsed = JSON.parse(readFileSync(configPath(), "utf8")) as unknown;
		return parsed && typeof parsed === "object" ? (parsed as PrettyCompactConfig) : {};
	} catch {
		return {};
	}
}

// Copied from pi-pretty src/index.ts
const safeSessionName = (ctx: ExtensionContext): string | undefined => {
	try {
		return ctx.sessionManager?.getSessionName?.() ?? undefined;
	} catch {
		return undefined;
	}
};

export default function piPrettyCompact(pi: ExtensionAPI): void {
	const config = loadConfig();
	const boxed = config.prompt?.boxed ?? true;
	const workingSettings = resolveWorkingIndicatorSettings(config.workingIndicator);
	const hostCustomEditor = (hostSdk as unknown as { CustomEditor?: CustomEditorConstructor }).CustomEditor;

	let controller: WorkingIndicatorController | undefined;
	let streaming = false;
	let sessionName: string | undefined;
	let editorInstalled = false;
	let previousEditorFactory: EditorFactory;

	if (config.prompt?.userIcon ?? true) {
		pi.registerMarkdownTransformer?.((markdown, context) => {
			if (context.messageType !== "user" || markdown.trim() === "") return markdown;
			return ` ${USER_MESSAGE_ICON} ${markdown}`;
		});
	}

	// Adapted from pi-pretty installPromptEditor; `boxed` replaces `!claudeStyle`.
	const installEditor = (ctx: ExtensionContext): void => {
		if (ctx.mode !== "tui" || editorInstalled || typeof hostCustomEditor !== "function") return;
		const editorUi = ctx.ui as unknown as EditorUiCompatibility;
		if (typeof editorUi.setEditorComponent !== "function") return;
		previousEditorFactory = editorUi.getEditorComponent?.();
		const PromptEditor = createPromptEditorClass(
			hostCustomEditor,
			(icon) => {
				const theme = ctx.ui.theme;
				return typeof theme.getThinkingBorderColor === "function"
					? theme.getThinkingBorderColor(ctx.thinkingLevel ?? "off")(icon)
					: theme.fg("thinkingText", icon);
			},
			boxed,
		);
		editorUi.setEditorComponent((tui, theme, keybindings) => new PromptEditor(tui, theme, keybindings));
		editorInstalled = true;
	};

	// Copied from pi-pretty installIndicator (warning text renamed).
	const installIndicator = async (ctx: ExtensionContext): Promise<void> => {
		controller?.dispose();
		controller = undefined;
		try {
			const next = await installWorkingIndicator(ctx.ui, workingSettings, undefined, sessionName);
			controller = next;
			if (streaming) next.start();
			// Noop install (disabled/blank) after a previous install: restore pi's loader.
			if (next.frames.length === 0) ctx.ui.setWorkingVisible?.(true);
		} catch (error: unknown) {
			try {
				ctx.ui.setWorkingVisible?.(true);
			} catch {
				// Host without the API: nothing to restore.
			}
			ctx.ui?.notify?.(
				`${NAME} working indicator failed: ${error instanceof Error ? error.message : String(error)}`,
				"warning",
			);
		}
	};

	pi.on("session_start", async (_event: unknown, ctx: ExtensionContext) => {
		if (ctx.mode !== "tui") return;
		try {
			installEditor(ctx);
		} catch (error: unknown) {
			ctx.ui?.notify?.(`${NAME} prompt editor failed: ${error instanceof Error ? error.message : String(error)}`, "warning");
		}
		setUserRail(loadConfig().userRail);
		installUserRail((hostSdk as unknown as { UserMessageComponent?: unknown }).UserMessageComponent);
		sessionName = safeSessionName(ctx);
		await installIndicator(ctx);
	});

	// Re-tint the working row when the session is renamed.
	pi.on("session_info_changed", async (event: SessionInfoChangedEvent, ctx: ExtensionContext) => {
		if (ctx.mode !== "tui") return;
		if (event.name === sessionName) return;
		sessionName = event.name;
		if (workingSettings.enabled) await installIndicator(ctx);
	});

	pi.on("agent_start", async (_event: unknown, ctx: ExtensionContext) => {
		if (ctx.mode !== "tui") return;
		streaming = true;
		controller?.start();
	});

	const stopStreaming = async (_event: unknown, ctx: ExtensionContext): Promise<void> => {
		if (ctx.mode !== "tui") return;
		streaming = false;
		controller?.stop();
	};
	pi.on("agent_end", stopStreaming);
	pi.on("agent_settled", stopStreaming);

	pi.on("session_shutdown", async (_event: unknown, ctx?: ExtensionContext) => {
		if (editorInstalled) {
			if (ctx) {
				const editorUi = ctx.ui as unknown as EditorUiCompatibility;
				if (typeof editorUi.setEditorComponent === "function") editorUi.setEditorComponent(previousEditorFactory);
			}
			editorInstalled = false;
			previousEditorFactory = undefined;
		}
		controller?.dispose();
		controller = undefined;
		streaming = false;
	});
}
