import { runWithInput } from '../common/input.js';

runWithInput(
  async (input: string) => {
    const lines = input.trim().split('\n');
    const rows = lines.length;
    const cols = lines[0].length;
    let accessibleCount = 0;

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (lines[r][c] === '@') {
          let neighborCount = 0;
          for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && lines[nr][nc] === '@') {
              neighborCount++;
            }
          }
          if (neighborCount < 4) {
            accessibleCount++;
          }
        }
      }
    }
    
    return accessibleCount;
  },
  async (input: string) => {
    let grid = input.trim().split('\n').map(line => line.split(''));
    const rows = grid.length;
    const cols = grid[0].length;
    let totalRemoved = 0;

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    let changed = true;
    while (changed) {
      changed = false;
      const toRemove: [number, number][] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] === '@') {
            let neighborCount = 0;
            for (const [dr, dc] of directions) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === '@') {
                neighborCount++;
              }
            }
            if (neighborCount < 4) {
              toRemove.push([r, c]);
            }
          }
        }
      }

      if (toRemove.length > 0) {
        changed = true;
        totalRemoved += toRemove.length;
        for (const [r, c] of toRemove) {
          grid[r][c] = '.';
        }
      }
    }

    return totalRemoved;
  },
  2025,
  4
);
