import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#2a2a2a]">
      {/* Minimal Header */}
      <header className="absolute top-0 right-0 p-4 z-10">
        <div className="flex items-center gap-4">
          <Link href="/pricing">
            <span className="text-gray-400 hover:text-white text-sm">Pricing</span>
          </Link>
          <Link href="/sign-in">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
            >
              Sign in
            </Button>
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
