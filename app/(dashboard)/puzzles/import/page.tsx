'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function ImportGamesPage() {
  const [username, setUsername] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/games/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          year: parseInt(year),
          month: parseInt(month),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import games');
      }

      setSuccess(`Successfully imported ${data.count} games!`);
      setUsername('');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Import Chess.com Games</h1>

        <Card className="p-6">
          <p className="text-gray-600 mb-6">
            Import your games from chess.com to generate personalized puzzles
            from positions in your own games.
          </p>

          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Chess.com Username
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your chess.com username"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Year</label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="2000"
                  max={new Date().getFullYear()}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Month</label>
                <Input
                  type="number"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  min="1"
                  max="12"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md">
                {success}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {loading ? 'Importing...' : 'Import Games'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-2">Quick Select</h3>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  setYear(now.getFullYear().toString());
                  setMonth((now.getMonth() + 1).toString());
                }}
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const lastMonth = new Date();
                  lastMonth.setMonth(lastMonth.getMonth() - 1);
                  setYear(lastMonth.getFullYear().toString());
                  setMonth((lastMonth.getMonth() + 1).toString());
                }}
              >
                Last Month
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
