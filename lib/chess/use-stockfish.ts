'use client';

import { useState, useEffect, useRef } from 'react';
import { StockfishEngine } from './stockfish-engine';
import { EngineEvaluation } from './types';

export function useStockfish() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<StockfishEngine | null>(null);

  useEffect(() => {
    const engine = new StockfishEngine();
    engineRef.current = engine;

    engine
      .init()
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to initialize engine');
        setIsLoading(false);
      });

    return () => {
      engine.quit();
    };
  }, []);

  const analyze = async (
    fen: string,
    depth: number,
    multiPv: number
  ): Promise<EngineEvaluation[]> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await engineRef.current.analyze(fen, depth, multiPv);
      return result;
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    engine: engineRef.current,
    isLoading,
    isAnalyzing,
    error,
    analyze,
  };
}
