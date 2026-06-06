import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Payzati — Pay Anyone. Anywhere. Instantly.',
    short_name: 'Payzati',
    description: 'Global B2B B2C Payroll & Settlement Platform powered by Interledger Protocol.',
    start_url: '/',
    display: 'standalone',
    background_color: '#121212',
    theme_color: '#1dbb9c',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
