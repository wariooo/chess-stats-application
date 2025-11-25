'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      router.push(`/player/${username.trim()}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#3d3d3d]">
      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Title */}
          <h1 className="text-6xl md:text-7xl font-bold text-orange-500 mb-6">
            Claude Chess
          </h1>

          {/* Tagline */}
          <p className="text-2xl md:text-3xl text-white mb-12">
            Learn from <span className="text-orange-500">your mistakes</span> and climb the rating ladder
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex">
              <Input
                type="text"
                placeholder="Search for chess.com username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 h-14 text-lg rounded-r-none border-r-0 bg-white text-gray-900 placeholder:text-gray-500"
              />
              <Button
                type="submit"
                className="h-14 px-8 text-lg font-semibold rounded-l-none bg-orange-500 hover:bg-orange-600 text-white"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg p-8 relative">
              <h3 className="text-xl font-semibold text-orange-500 mb-3">
                Understand your style
              </h3>
              <p className="text-gray-600">
                Detailed statistics about your games and type of play
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg p-8 relative">
              <div className="absolute top-4 right-4">
                <span className="bg-orange-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
                  Pro
                </span>
              </div>
              <h3 className="text-xl font-semibold text-orange-500 mb-3">
                Win in the opening
              </h3>
              <p className="text-gray-600">
                Deep analysis of your opening repertoire and where to focus on
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg p-8 relative">
              <div className="absolute top-4 right-4">
                <span className="bg-orange-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
                  Pro
                </span>
              </div>
              <h3 className="text-xl font-semibold text-orange-500 mb-3">
                Improve your middle game
              </h3>
              <p className="text-gray-600">
                Custom puzzles based on your own games and common mistakes
              </p>
              <Link href="/puzzles" className="block mt-3">
                <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                  Try Puzzle Generator →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
