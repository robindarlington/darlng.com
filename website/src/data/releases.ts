import eserianiCover from '../assets/releases/eseriani.jpg';

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
];

export const socials: SocialLink[] = [
  { platform: 'spotify', url: 'https://open.spotify.com/artist/0uXxSPfLr36OuyGDKiBzV3', label: 'Spotify' },
  { platform: 'instagram', url: 'https://www.instagram.com/darlngmusic', label: 'Instagram' },
  { platform: 'facebook', url: 'https://www.facebook.com/darlng.music', label: 'Facebook' },
  { platform: 'youtube', url: 'https://www.youtube.com/channel/UC_noHUKnp2wJ3fi29smmZKw', label: 'YouTube' },
  { platform: 'tiktok', url: 'https://www.tiktok.com/@darlng_music', label: 'TikTok' },
];
