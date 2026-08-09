// Zero-dependency prebuild generator for social card (Open Graph / Twitter) images.
//
// Composites each release's cover art onto a 1200x630 brand-background canvas using the
// already-installed `sharp` package — no new dependency. Runs automatically before every
// `npm run build` via the `prebuild` lifecycle script (see package.json), so a clean
// checkout with no manual step yields the PNGs under `public/og/`.
//
// The canvas background colour (#0A0908) is transcribed from `--color-bg` in
// `src/styles/global.css` — if that token ever changes, update CANVAS_BACKGROUND here too.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(REPO_ROOT, 'public/og');
const PUBLIC_DIR = path.resolve(REPO_ROOT, 'public');

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 630;
const ART_SIZE = 630;
const CANVAS_BACKGROUND = '#0A0908';

// Favicon rasterization density — verified during planning to produce a crisp `D`
// glyph at both 32x32 and 256x256 from the hand-authored 64x64 source SVG.
const FAVICON_DENSITY = 384;

/**
 * Composites a single source cover image onto a 1200x630 brand-background canvas and
 * writes the result as a PNG. Throws a descriptive error if the source art is smaller
 * than the target composite size in either dimension, so a future low-resolution cover
 * fails the build loudly instead of shipping an upscaled blur.
 *
 * @param {string} sourcePath Absolute path to the source JPEG.
 * @param {string} outputPath Absolute path the PNG should be written to.
 */
async function generateCard(sourcePath, outputPath) {
	const sourceImage = sharp(sourcePath);
	const sourceMetadata = await sourceImage.metadata();
	if (
		!sourceMetadata.width ||
		!sourceMetadata.height ||
		sourceMetadata.width < ART_SIZE ||
		sourceMetadata.height < ART_SIZE
	) {
		throw new Error(
			`generate-assets: source image "${sourcePath}" is ${sourceMetadata.width ?? '?'}x${sourceMetadata.height ?? '?'}, ` +
				`below the required ${ART_SIZE}x${ART_SIZE} minimum for a 1200x630 OG card. Provide higher-resolution artwork.`
		);
	}

	const artBuffer = await sharp(sourcePath)
		.resize(ART_SIZE, ART_SIZE, { fit: 'cover' })
		.toBuffer();

	await sharp({
		create: {
			width: CANVAS_WIDTH,
			height: CANVAS_HEIGHT,
			channels: 4,
			background: CANVAS_BACKGROUND,
		},
	})
		.composite([{ input: artBuffer, gravity: 'center' }])
		.flatten({ background: CANVAS_BACKGROUND })
		.png()
		.toFile(outputPath);

	const writtenMetadata = await sharp(outputPath).metadata();
	console.log(
		`generate-assets: wrote ${path.relative(REPO_ROOT, outputPath)} (${writtenMetadata.width}x${writtenMetadata.height})`
	);
}

/**
 * Wraps a 32x32 PNG buffer in a minimal single-image .ico container. An icon container
 * has accepted a raw PNG stream as a valid entry since Windows Vista, so no bitmap
 * re-encode is needed here. Layout (confirmed with `file(1)` during planning — that
 * command is this routine's acceptance gate, not the byte offsets on paper):
 *   ICONDIR (6 bytes):  reserved=0 (u16le), type=1 (u16le), count=1 (u16le)
 *   ICONDIRENTRY (16 bytes): width=32 (u8), height=32 (u8), colorCount=0 (u8),
 *     reserved=0 (u8), planes=1 (u16le), bitCount=32 (u16le), bytesInRes (u32le),
 *     imageOffset=22 (u32le)
 *   then the PNG bytes themselves, concatenated.
 *
 * @param {Buffer} pngBuffer A 32x32 PNG-encoded image buffer.
 * @returns {Buffer} A complete .ico file buffer.
 */
function wrapPngAsIco(pngBuffer) {
	const iconDir = Buffer.alloc(6);
	iconDir.writeUInt16LE(0, 0); // reserved
	iconDir.writeUInt16LE(1, 2); // type: 1 = icon
	iconDir.writeUInt16LE(1, 4); // image count

	const iconDirEntry = Buffer.alloc(16);
	iconDirEntry.writeUInt8(32, 0); // width
	iconDirEntry.writeUInt8(32, 1); // height
	iconDirEntry.writeUInt8(0, 2); // color palette count
	iconDirEntry.writeUInt8(0, 3); // reserved
	iconDirEntry.writeUInt16LE(1, 4); // color planes
	iconDirEntry.writeUInt16LE(32, 6); // bits per pixel
	iconDirEntry.writeUInt32LE(pngBuffer.length, 8); // image data size
	iconDirEntry.writeUInt32LE(22, 12); // offset of image data (6 + 16)

	return Buffer.concat([iconDir, iconDirEntry, pngBuffer]);
}

/**
 * Rasterizes `public/favicon.svg` into every icon format browsers and platforms ask
 * for: a 180x180 opaque apple-touch-icon, and a 32x32 favicon.ico hand-wrapped in a
 * minimal container (no new dependency — see wrapPngAsIco above).
 */
async function generateFavicons() {
	const svgPath = path.resolve(PUBLIC_DIR, 'favicon.svg');
	const svgBuffer = await readFile(svgPath);

	// Apple touch icon: iOS applies its own corner mask to home-screen icons, so the
	// tile's rounded corners must be flattened to the brand background rather than left
	// transparent — otherwise the icon renders visibly double-rounded with a translucent
	// fringe.
	const appleTouchIconPath = path.resolve(PUBLIC_DIR, 'apple-touch-icon.png');
	await sharp(svgBuffer, { density: FAVICON_DENSITY })
		.resize(180, 180)
		.flatten({ background: CANVAS_BACKGROUND })
		.png()
		.toFile(appleTouchIconPath);
	const appleTouchMetadata = await sharp(appleTouchIconPath).metadata();
	console.log(
		`generate-assets: wrote ${path.relative(REPO_ROOT, appleTouchIconPath)} (${appleTouchMetadata.width}x${appleTouchMetadata.height})`
	);

	// 32x32 raster for the .ico container — deliberately NOT flattened, so the
	// transparent rounded corners sit well on both light and dark browser tab bars.
	const favicon32Buffer = await sharp(svgBuffer, { density: FAVICON_DENSITY })
		.resize(32, 32)
		.png()
		.toBuffer();
	const icoBuffer = wrapPngAsIco(favicon32Buffer);
	const faviconIcoPath = path.resolve(PUBLIC_DIR, 'favicon.ico');
	await writeFile(faviconIcoPath, icoBuffer);
	const favicon32Metadata = await sharp(favicon32Buffer).metadata();
	console.log(
		`generate-assets: wrote ${path.relative(REPO_ROOT, faviconIcoPath)} (${favicon32Metadata.width}x${favicon32Metadata.height})`
	);
}

// Slug + source filename for each release's own card. Transcribed as literals (mirrors
// src/data/releases.ts and must be kept in step with it) rather than importing the .ts
// data module from Node — this stays a plain ESM script with zero build tooling of its
// own. Order is a stable literal list: no directory listing, no Date, no other run-order
// or timestamp entropy, so two consecutive builds emit byte-identical PNGs.
const RELEASE_CARDS = [
	{ slug: 'eseriani', source: 'eseriani.jpg' },
	{ slug: 'randevu', source: 'randevu.jpg' },
	{ slug: 'brave', source: 'brave.jpg' },
	{ slug: 'open-wide', source: 'open-wide.jpg' },
];

// The slug is interpolated into a filesystem path under public/og/ — validate it against
// a strict lowercase-alphanumeric-and-hyphen pattern before composing that path so no
// value could ever escape the output directory.
const SLUG_PATTERN = /^[a-z0-9-]+$/;

async function main() {
	await mkdir(OUTPUT_DIR, { recursive: true });

	// The home card stays independently sourced from the Eseriani cover (D-03) so its URL
	// never has to change when a future release becomes the latest one.
	await generateCard(
		path.resolve(REPO_ROOT, 'src/assets/releases/eseriani.jpg'),
		path.resolve(OUTPUT_DIR, 'home.png')
	);

	for (const { slug, source } of RELEASE_CARDS) {
		if (!SLUG_PATTERN.test(slug)) {
			throw new Error(
				`generate-assets: slug "${slug}" does not match ${SLUG_PATTERN} — refusing to compose an output path from it.`
			);
		}
		await generateCard(
			path.resolve(REPO_ROOT, 'src/assets/releases', source),
			path.resolve(OUTPUT_DIR, `${slug}.png`)
		);
	}

	await generateFavicons();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
