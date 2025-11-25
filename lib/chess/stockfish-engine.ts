import { Chess } from 'chess.js';
import { EngineEvaluation } from './types';

export class StockfishEngine {
  private worker: Worker | null = null;
  private isReady = false;
  private resolveReady: (() => void) | null = null;
  private currentAnalysis: {
    resolve: (result: EngineEvaluation[]) => void;
    reject: (error: Error) => void;
    results: EngineEvaluation[];
    depth: number;
    fen: string;
  } | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Load stockfish.js from node_modules
        this.worker = new Worker(
          new URL('stockfish.js/stockfish.js', import.meta.url),
          { type: 'module' }
        );

        this.worker.onmessage = (e) => this.handleMessage(e.data);
        this.worker.onerror = (e) => reject(e);

        this.resolveReady = resolve;
        this.worker.postMessage('uci');
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(line: string): void {
    if (line === 'uciok') {
      this.worker?.postMessage('isready');
    } else if (line === 'readyok') {
      this.isReady = true;
      this.resolveReady?.();
      this.resolveReady = null;
    } else if (line.startsWith('info') && line.includes('score')) {
      this.parseInfoLine(line);
    } else if (line.startsWith('bestmove')) {
      this.finishAnalysis();
    }
  }

  private parseInfoLine(line: string): void {
    if (!this.currentAnalysis) return;

    // Parse: info depth 20 multipv 1 score cp 125 pv e2e4 e7e5 ...
    const depthMatch = line.match(/depth (\d+)/);
    const multipvMatch = line.match(/multipv (\d+)/);
    const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
    const pvMatch = line.match(/pv (.+)/);

    if (!depthMatch || !scoreMatch || !pvMatch) return;

    const depth = parseInt(depthMatch[1]);
    if (depth < this.currentAnalysis.depth) return; // Only use target depth

    const multipv = multipvMatch ? parseInt(multipvMatch[1]) : 1;
    const scoreType = scoreMatch[1];
    const scoreValue = parseInt(scoreMatch[2]);
    const pv = pvMatch[1].split(' ').filter((m) => m.length > 0);

    // Convert UCI to SAN using chess.js
    const chess = new Chess(this.currentAnalysis.fen);
    const moveSan = this.uciToSan(chess, pv[0]);
    const pvSan = this.pvToSan(this.currentAnalysis.fen, pv);

    const evaluation: EngineEvaluation = {
      move: pv[0],
      moveSan: moveSan,
      eval: scoreType === 'cp' ? scoreValue : 0,
      mate: scoreType === 'mate' ? scoreValue : null,
      pv: pvSan,
      depth: depth,
    };

    // Store by multipv index
    this.currentAnalysis.results[multipv - 1] = evaluation;
  }

  private uciToSan(chess: Chess, uciMove: string): string {
    try {
      const from = uciMove.substring(0, 2);
      const to = uciMove.substring(2, 4);
      const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

      const move = chess.move({
        from,
        to,
        promotion,
      });

      if (move) {
        chess.undo();
        return move.san;
      }
    } catch (e) {
      // If conversion fails, return UCI notation
    }
    return uciMove;
  }

  private pvToSan(fen: string, pv: string[]): string[] {
    const chess = new Chess(fen);
    const result: string[] = [];

    for (const uciMove of pv) {
      const from = uciMove.substring(0, 2);
      const to = uciMove.substring(2, 4);
      const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

      try {
        const move = chess.move({
          from,
          to,
          promotion,
        });

        if (move) {
          result.push(move.san);
        } else {
          break;
        }
      } catch (e) {
        break;
      }
    }

    return result;
  }

  private finishAnalysis(): void {
    if (this.currentAnalysis) {
      this.currentAnalysis.resolve(
        this.currentAnalysis.results.filter(Boolean)
      );
      this.currentAnalysis = null;
    }
  }

  async analyze(
    fen: string,
    depth: number,
    multiPv: number
  ): Promise<EngineEvaluation[]> {
    if (!this.isReady) throw new Error('Engine not ready');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Analysis timeout'));
      }, 30000);

      this.currentAnalysis = {
        resolve: (result) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        results: [],
        depth,
        fen,
      };

      this.worker?.postMessage(`position fen ${fen}`);
      this.worker?.postMessage(`setoption name MultiPV value ${multiPv}`);
      this.worker?.postMessage(`go depth ${depth}`);
    });
  }

  stop(): void {
    this.worker?.postMessage('stop');
  }

  quit(): void {
    this.worker?.postMessage('quit');
    this.worker?.terminate();
    this.worker = null;
    this.isReady = false;
  }
}
