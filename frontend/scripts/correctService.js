import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');
const SERVICES_DIR = path.join(PROJECT_ROOT, 'api', 'services');
const BASE_HTTP_REQUEST_FILE = path.join(PROJECT_ROOT, 'api', 'core', 'BaseHttpRequest.ts');

function detectEol(text) {
	return text.includes('\r\n') ? '\r\n' : '\n';
}

/**
 * Transform:
 *   constructor(public readonly httpRequest: BaseHttpRequest) {}
 * into:
 *   public readonly httpRequest: BaseHttpRequest;
 *   constructor(httpRequest: BaseHttpRequest) {
 *       this.httpRequest = httpRequest;
 *   }
 */
function patchServiceConstructor(sourceText, fileNameForLogs) {
	const originalEol = detectEol(sourceText);
	const textNormalized = sourceText.replace(/\r\n/g, '\n');

	// Idempotent: already in desired form.
	if (
		textNormalized.includes('public readonly httpRequest: BaseHttpRequest;') &&
		/constructor\s*\(\s*httpRequest\s*:\s*BaseHttpRequest\s*\)/.test(textNormalized) &&
		/this\.httpRequest\s*=\s*httpRequest\s*;/.test(textNormalized)
	) {
		return { changed: false, text: sourceText, reason: 'already patched' };
	}

	// Only patch the exact generated pattern with an empty body.
	const ctorRe = /^(\s*)constructor\s*\(\s*public\s+readonly\s+httpRequest\s*:\s*BaseHttpRequest\s*\)\s*\{\s*\}\s*$/m;
	const match = textNormalized.match(ctorRe);
	if (!match) {
		return { changed: false, text: sourceText, reason: 'no matching constructor' };
	}

	const indent = match[1] ?? '';
	const innerIndent = indent + '    ';

	// If there is already a field declaration but constructor still uses parameter-property, skip to avoid duplication.
	if (textNormalized.includes('public readonly httpRequest: BaseHttpRequest;')) {
		return { changed: false, text: sourceText, reason: 'field exists but constructor not patchable' };
	}

	const replacement =
		`${indent}public readonly httpRequest: BaseHttpRequest;\n` +
		`${indent}constructor(httpRequest: BaseHttpRequest) {\n` +
		`${innerIndent}this.httpRequest = httpRequest;\n` +
		`${indent}}`;

	let patched = textNormalized.replace(ctorRe, replacement);

	// Trim trailing whitespace and collapse excessive blank lines introduced by formatting differences.
	patched = patched
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n');

	const finalText = originalEol === '\r\n' ? patched.replace(/\n/g, '\r\n') : patched;

	if (finalText === sourceText) {
		return { changed: false, text: sourceText, reason: 'no effective changes' };
	}

	return { changed: true, text: finalText, reason: `patched constructor in ${fileNameForLogs}` };
}

/**
 * Transform in api/core/BaseHttpRequest.ts:
 *   constructor(public readonly config: OpenAPIConfig) {}
 * into:
 *   public readonly config: OpenAPIConfig;
 *   constructor(config: OpenAPIConfig) {
 *       this.config = config;
 *   }
 */
function patchBaseHttpRequest(sourceText) {
	const originalEol = detectEol(sourceText);
	const textNormalized = sourceText.replace(/\r\n/g, '\n');

	const alreadyPatched =
		textNormalized.includes('public readonly config: OpenAPIConfig;') &&
		/constructor\s*\(\s*config\s*:\s*OpenAPIConfig\s*\)/.test(textNormalized) &&
		/this\.config\s*=\s*config\s*;/.test(textNormalized);

	const ctorRe = /^(\s*)constructor\s*\(\s*public\s+readonly\s+config\s*:\s*OpenAPIConfig\s*\)\s*\{\s*\}\s*$/m;
	const match = textNormalized.match(ctorRe);
	if (!match && !alreadyPatched) {
		return { changed: false, text: sourceText, reason: 'no matching constructor' };
	}

	let patched = textNormalized;

	if (match) {
		const indent = match[1] ?? '';
		const innerIndent = indent + '    ';

		if (textNormalized.includes('public readonly config: OpenAPIConfig;')) {
			return { changed: false, text: sourceText, reason: 'field exists but constructor not patchable' };
		}

		const replacement =
			`${indent}public readonly config: OpenAPIConfig;\n` +
			`${indent}constructor(config: OpenAPIConfig) {\n` +
			`${innerIndent}this.config = config;\n` +
			`${indent}}`;

		patched = patched.replace(ctorRe, replacement);
	}

	// Normalize whitespace to match services style (no blank lines inside constructor).
	patched = patched
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.replace(/\n\n(\s*public readonly config: OpenAPIConfig;)/g, '\n$1')
		.replace(/(public readonly config: OpenAPIConfig;)\n\n(\s*constructor)/g, '$1\n$2')
		.replace(/(constructor\(config: OpenAPIConfig\) \{)\n\n(\s*this\.config)/g, '$1\n$2')
		.replace(/(this\.config\s*=\s*config;)\n\n(\s*\})/g, '$1\n$2')
		.replace(/\n\n(\s*public abstract request)/g, '\n$1');

	const finalText = originalEol === '\r\n' ? patched.replace(/\n/g, '\r\n') : patched;
	if (finalText === sourceText) {
		return { changed: false, text: sourceText, reason: 'no effective changes' };
	}

	return {
		changed: true,
		text: finalText,
		reason: match ? 'patched BaseHttpRequest constructor' : 'normalized BaseHttpRequest formatting',
	};
}

async function main() {
	// 1) Patch api/core/BaseHttpRequest.ts (only this core file).
	try {
		const before = await fs.readFile(BASE_HTTP_REQUEST_FILE, 'utf8');
		const result = patchBaseHttpRequest(before);
		if (result.changed) {
			await fs.writeFile(BASE_HTTP_REQUEST_FILE, result.text, 'utf8');
			console.log(`[correctService] patched: api/core/BaseHttpRequest.ts (${result.reason})`);
		} else {
			console.log(`[correctService] skipped: api/core/BaseHttpRequest.ts (${result.reason})`);
		}
	} catch {
		console.error(`[correctService] BaseHttpRequest not found: ${BASE_HTTP_REQUEST_FILE}`);
		process.exitCode = 1;
		return;
	}

	// 2) Patch api/services/*.ts
	let entries;
	try {
		entries = await fs.readdir(SERVICES_DIR, { withFileTypes: true });
	} catch {
		console.error(`[correctService] services dir not found: ${SERVICES_DIR}`);
		process.exitCode = 1;
		return;
	}

	const serviceFiles = entries
		.filter((e) => e.isFile() && e.name.endsWith('.ts'))
		.map((e) => e.name);

	let changedCount = 0;
	for (const fileName of serviceFiles) {
		const filePath = path.join(SERVICES_DIR, fileName);
		const before = await fs.readFile(filePath, 'utf8');
		const result = patchServiceConstructor(before, fileName);
		if (result.changed) {
			await fs.writeFile(filePath, result.text, 'utf8');
			changedCount += 1;
			console.log(`[correctService] patched: api/services/${fileName} (${result.reason})`);
		} else {
			console.log(`[correctService] skipped: api/services/${fileName} (${result.reason})`);
		}
	}

	console.log(`[correctService] done, changed ${changedCount} file(s).`);
}

main();
