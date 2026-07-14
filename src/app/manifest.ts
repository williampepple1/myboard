import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Myboard',
    short_name: 'Myboard',
    description: 'A modern Kanban board and productivity app.',
    start_url: '/',
    display: 'standalone',
    background_color: '#172B4D',
    theme_color: '#3730A3',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
