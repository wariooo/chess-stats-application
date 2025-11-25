'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface SearchFormProps {
  onSearch: (username: string) => void;
  isLoading?: boolean;
}

export function SearchForm({ onSearch, isLoading = false }: SearchFormProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (trimmedUsername) {
      onSearch(trimmedUsername);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-base">
          Chess.com Username
        </Label>
        <div className="flex gap-2">
          <Input
            id="username"
            type="text"
            placeholder="e.g., hikaru, magnuscarlsen"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            className="flex-1"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="min-w-[100px]"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter any Chess.com username to view their statistics
        </p>
      </div>
    </form>
  );
}
