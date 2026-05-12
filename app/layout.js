import './globals.css'
import Providers from '../components/Providers'

export const metadata = {
  title: 'MyBadBiz — Bad Business Experience Registry',
  description: 'Search real bad business experiences reported by real people. Look up names and businesses to protect yourself before doing business.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
