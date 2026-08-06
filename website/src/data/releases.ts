import eserianiCover from '../assets/releases/eseriani.jpg';
import randevuCover from '../assets/releases/randevu.jpg';
import braveCover from '../assets/releases/brave.jpg';
import openWideCover from '../assets/releases/open-wide.jpg';

export type Platform =
  | 'spotify'
  | 'appleMusic'
  | 'youtube'
  | 'iheartradio'
  | 'deezer'
  | 'amazonMusic'
  | 'tidal'
  | 'pandora'
  | 'napster'
  | 'anghami'
  | 'boomplay';

export interface PlatformLink {
  platform: Platform;
  url: string;
  label: string;
}

export interface YouTubeEmbed {
  videoId: string;
  titleForA11y: string;
}

export interface Release {
  slug: string;
  title: string;
  year: number;
  artistLine: string;
  cover: ImageMetadata;
  isLatest: boolean;
  platforms: PlatformLink[];
  youtubeEmbed?: YouTubeEmbed;
}

export type SocialPlatform = 'spotify' | 'instagram' | 'facebook' | 'youtube' | 'tiktok';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  label: string;
}

export const releases: Release[] = [
  {
    slug: 'eseriani',
    title: 'Eseriani',
    year: 2026,
    artistLine: 'Darlng x Tobiko',
    cover: eserianiCover,
    isLatest: true,
    platforms: [
      { platform: 'spotify', url: 'https://open.spotify.com/album/3rPZRfnYweEdoQXt78DkJQ', label: 'Spotify' },
      { platform: 'appleMusic', url: 'https://music.apple.com/us/album/eseriani-single/6780308217', label: 'Apple Music' },
      { platform: 'youtube', url: 'https://youtube.com/watch?v=qltP16ukVr4', label: 'YouTube' },
      { platform: 'iheartradio', url: 'https://www.iheart.com/artist/id-51034697/albums/id-408729127', label: 'iHeartRadio' },
    ],
    youtubeEmbed: {
      videoId: 'qltP16ukVr4',
      titleForA11y: 'DARLNG x Tobiko — Eseriani (Official Video)',
    },
  },
  {
    slug: 'randevu',
    title: 'Randevu',
    year: 2024,
    artistLine: 'Darlng ft. Shubi Di Badman',
    cover: randevuCover,
    isLatest: false,
    platforms: [
      { platform: 'spotify', url: 'https://open.spotify.com/track/0IZDYN5TWzvcAzLtmX0Tbf', label: 'Spotify' },
      { platform: 'deezer', url: 'https://www.deezer.com/track/2872988692', label: 'Deezer' },
      { platform: 'amazonMusic', url: 'https://music.amazon.com/albums/B0D8LHNXQ6?trackAsin=B0D8LJSBW4', label: 'Amazon Music' },
      { platform: 'tidal', url: 'https://listen.tidal.com/track/372717222', label: 'Tidal' },
      { platform: 'pandora', url: 'https://www.pandora.com/TR:128946631', label: 'Pandora' },
      { platform: 'napster', url: 'https://play.napster.com/track/tra.809485382', label: 'Napster' },
      { platform: 'anghami', url: 'https://play.anghami.com/song/1166313324', label: 'Anghami' },
    ],
  },
  {
    slug: 'brave',
    title: 'Brave',
    year: 2020,
    artistLine: 'Darlng ft. Ray Pineapple',
    cover: braveCover,
    isLatest: false,
    platforms: [
      { platform: 'spotify', url: 'https://open.spotify.com/track/6tExFPMrQNZx233cYQmqNq', label: 'Spotify' },
      { platform: 'appleMusic', url: 'https://music.apple.com/fr/album/brave-feat-ray-pineapple-single/1535673587', label: 'Apple Music' },
      { platform: 'tidal', url: 'https://listen.tidal.com/track/158456117', label: 'Tidal' },
      { platform: 'pandora', url: 'https://www.pandora.com/TR:107403386', label: 'Pandora' },
      { platform: 'boomplay', url: 'https://www.boomplay.com/songs/144156765', label: 'Boomplay' },
    ],
  },
  {
    slug: 'open-wide',
    title: 'Open Wide',
    year: 2019,
    artistLine: 'Darlng ft. Don Classic',
    cover: openWideCover,
    isLatest: false,
    platforms: [
      { platform: 'spotify', url: 'https://open.spotify.com/album/0tH6wTY01FjjYnFuTBMA3e', label: 'Spotify' },
      { platform: 'appleMusic', url: 'https://music.apple.com/us/album/open-wide-feat-don-classic-single/1491599938', label: 'Apple Music' },
      { platform: 'amazonMusic', url: 'https://www.amazon.com/gp/product/B082RBHFWH', label: 'Amazon Music' },
      { platform: 'deezer', url: 'https://www.deezer.com/album/123035192', label: 'Deezer' },
      { platform: 'iheartradio', url: 'https://www.iheart.com/artist/id-33736629/albums/id-85989670', label: 'iHeartRadio' },
      { platform: 'napster', url: 'https://us.napster.com/artist/darlng/album/open-wide', label: 'Napster' },
    ],
  },
];

/**
 * The single release with `isLatest: true`. Throws a descriptive build-time
 * error if the invariant ("exactly one release must be marked latest") is
 * ever violated, instead of silently returning a stale release or crashing
 * with an unhelpful "Cannot read properties of undefined" error.
 */
export const latestRelease: Release = (() => {
  const matches = releases.filter((release) => release.isLatest);
  if (matches.length !== 1) {
    throw new Error(
      `releases.ts: expected exactly one release with isLatest: true, found ${matches.length}.`
    );
  }
  return matches[0];
})();

export const socials: SocialLink[] = [
  { platform: 'spotify', url: 'https://open.spotify.com/artist/0uXxSPfLr36OuyGDKiBzV3', label: 'Spotify' },
  { platform: 'instagram', url: 'https://www.instagram.com/darlngmusic', label: 'Instagram' },
  { platform: 'facebook', url: 'https://www.facebook.com/darlng.music', label: 'Facebook' },
  { platform: 'youtube', url: 'https://www.youtube.com/channel/UC_noHUKnp2wJ3fi29smmZKw', label: 'YouTube' },
  { platform: 'tiktok', url: 'https://www.tiktok.com/@darlng_music', label: 'TikTok' },
];
