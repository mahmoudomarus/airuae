import './global.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'AirUAE - Modern Property Rental Platform',
  description: 'Find and book short-term stays or long-term rentals in the UAE',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
