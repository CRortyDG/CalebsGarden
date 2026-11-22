import type { MetadataRoute } from 'next';

// Lets phones show the vine icon when the site is added to a home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'calebs.garden',
    short_name: 'calebs.garden',
    start_url: '/',
    display: 'browser',
    background_color: '#0c130d',
    theme_color: '#0b120e',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
