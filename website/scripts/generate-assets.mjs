// Zero-dependency prebuild generator for social card (Open Graph / Twitter) images.
//
// Composites each release's cover art onto a 1200x630 brand-background canvas using the
// already-installed `sharp` package — no new dependency. Runs automatically before every
// `npm run build` via the `prebuild` lifecycle script (see package.json), so a clean
// checkout with no manual step yields the PNGs under `public/og/`.
//
// The canvas background colour (#0A0908) is transcribed from `--color-bg` in
// `src/styles/global.css` — if that token ever changes, update CANVAS_BACKGROUND here too.

import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(REPO_ROOT, 'public/og');

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 630;
const ART_SIZE = 630;
const CANVAS_BACKGROUND = '#0A0908';

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

async function main() {
	await mkdir(OUTPUT_DIR, { recursive: true });

	// Task 1 scope: the homepage card only, sourced from the Eseriani cover (D-03: the
	// home card is Eseriani-based). Task 2 extends this with one entry per release.
	await generateCard(
		path.resolve(REPO_ROOT, 'src/assets/releases/eseriani.jpg'),
		path.resolve(OUTPUT_DIR, 'home.png')
	);
}

main().catch((err) => {
	console.error(err.message);
	process.exit(1);
});
