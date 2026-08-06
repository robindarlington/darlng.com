// Shared source of truth for social-platform brand icons — imported by
// Header.astro and Footer.astro so the two nav components can never drift
// out of sync when a platform is added/removed.
import { siSpotify, siInstagram, siFacebook, siYoutube, siTiktok } from 'simple-icons';
import type { SimpleIcon } from 'simple-icons';
import type { SocialPlatform } from './releases';

export const socialIcons: Record<SocialPlatform, SimpleIcon> = {
	spotify: siSpotify,
	instagram: siInstagram,
	facebook: siFacebook,
	youtube: siYoutube,
	tiktok: siTiktok,
};
