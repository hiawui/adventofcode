import { runWithInput } from '../common/input.js';

runWithInput(
  async (input: string) => {
    const grid = input
      .trim()
      .split('\n')
      .map(line => line.trim().split(''));

    let startR = -1;
    let startC = -1;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 'S') {
          startR = r;
          startC = c;
          break;
        }
      }
      if (startR !== -1) break;
    }

    if (startR === -1) {
      throw new Error("No start S found");
    }

    let activeCols = new Set<number>();
    activeCols.add(startC);
    
    let splitCount = 0;
    
    // Process row by row starting from startR
    // We iterate through the grid rows. The activeCols are valid for the *current* row 'r'.
    for (let r = startR; r < grid.length; r++) {
      const nextActiveCols = new Set<number>();
      
      for (const c of activeCols) {
        // Check bounds
        if (c < 0 || c >= grid[r].length) continue;
        
        const cell = grid[r][c];
        
        if (cell === 'S' || cell === '.') {
          // Continue straight down to the next row
          nextActiveCols.add(c);
        } else if (cell === '^') {
          splitCount++;
          // Beams split to immediate left and right
          // They continue downward, so they appear in the next row at these new columns
          nextActiveCols.add(c - 1);
          nextActiveCols.add(c + 1);
        }
        // If cell is something else (unexpected), beam stops or we ignore?
        // Problem only mentions S, ., ^.
      }
      
      activeCols = nextActiveCols;
      if (activeCols.size === 0) break;
    }

    return splitCount;
  },
  async (input: string) => {
    // Part 2
    const grid = input
      .replace(/\r\n/g, '\n')
      .trimEnd()
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => line.split(''));

    let startR = -1;
    let startC = -1;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 'S') {
          startR = r;
          startC = c;
          break;
        }
      }
      if (startR !== -1) break;
    }

    if (startR === -1) {
        return 0;
    }

    // Map of column index -> count of particles
    let dp = new Map<number, bigint>();
    dp.set(startC, 1n);

    let completedTimelines = 0n;

    for (let r = startR; r < grid.length; r++) {
        const nextDp = new Map<number, bigint>();
        
        for (const [c, count] of dp) {
            // Safety check
            if (c < 0 || c >= grid[r].length) {
                completedTimelines += count;
                continue;
            }

            const cell = grid[r][c];
            
            let nextCols: number[] = [];
            if (cell === '^') {
                nextCols.push(c - 1, c + 1);
            } else { // '.' or 'S'
                nextCols.push(c);
            }

            for (const nc of nextCols) {
                if (r + 1 >= grid.length) {
                    completedTimelines += count;
                    continue;
                }

                const nextRowWidth = grid[r + 1].length;
                if (nc < 0 || nc >= nextRowWidth) {
                    completedTimelines += count;
                } else {
                    const currentVal = nextDp.get(nc) || 0n;
                    nextDp.set(nc, currentVal + count);
                }
            }
        }
        
        dp = nextDp;
        if (dp.size === 0) break;
    }

    return completedTimelines;
  },
  2025,
  7
);
