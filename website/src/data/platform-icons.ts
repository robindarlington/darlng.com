// Sibling to social-icons.ts — maps the streaming Platform type (11 values)
// to a verified simple-icons SimpleIcon, or null. `null` means "no verified
// brand mark exists for this platform" — it is rendered with a neutral
// ExternalLink fallback glyph, it never means "skip this platform".
import { siSpotify, siApplemusic, siYoutube, siIheartradio, siDeezer, siTidal, siPandora, siNapster } from 'simple-icons';
import type { SimpleIcon } from 'simple-icons';
import type { Platform } from './releases';

export const platformIcons: Record<Platform, SimpleIcon | null> = {
	spotify: siSpotify,
	appleMusic: siApplemusic,
	youtube: siYoutube,
	iheartradio: siIheartradio,
	deezer: siDeezer,
	tidal: siTidal,
	pandora: siPandora,
	napster: siNapster,
	amazonMusic: null,
	anghami: null,
	boomplay: null,
};
