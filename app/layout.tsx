import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gmail Account Creator',
  description: 'Automatically create Gmail accounts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

