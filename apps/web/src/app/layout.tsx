import './global.css';
import { AuthProvider } from '../context/AuthContext';
import Header from '../components/Header';

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
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="bg-gray-50 border-t py-6">
              <div className="container mx-auto px-4">
                <p className="text-center text-gray-500 text-sm">
                  &copy; {new Date().getFullYear()} AirUAE. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
