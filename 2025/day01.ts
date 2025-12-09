import { runWithInput } from '../common/input.js';

runWithInput(
  async (input: string) => {
    const lines = input.trim().split('\n');
    let position = 50;
    let zeroCount = 0;

    for (const line of lines) {
      if (!line) continue;
      const direction = line[0];
      const amount = parseInt(line.substring(1), 10);

      if (direction === 'L') {
        position = ((position - amount) % 100 + 100) % 100;
      } else if (direction === 'R') {
        position = (position + amount) % 100;
      }

      if (position === 0) {
        zeroCount++;
      }
    }

    return zeroCount;
  },
  async (input: string) => {
    const lines = input.trim().split('\n');
    let position = 50;
    let zeroHits = 0;

    for (const line of lines) {
      if (!line) continue;
      const direction = line[0];
      const amount = parseInt(line.substring(1), 10);

      if (direction === 'R') {
        // Moving right (increasing)
        // We hit 0 at 100, 200, 300... relative to un-modulo'd position
        // Current effective value is position. We go up to position + amount.
        // We cross a multiple of 100 when floor((pos+amt)/100) > floor(pos/100).
        // Since pos < 100, floor(pos/100) is 0. So we just need floor((pos+amt)/100).
        zeroHits += Math.floor((position + amount) / 100);
        position = (position + amount) % 100;
      } else if (direction === 'L') {
        // Moving left (decreasing)
        if (position === 0) {
          zeroHits += Math.floor(amount / 100);
        } else {
          if (amount >= position) {
            zeroHits += 1 + Math.floor((amount - position) / 100);
          }
        }
        position = ((position - amount) % 100 + 100) % 100;
      }
    }
    
    return zeroHits;
  },
  2025,
  1
);
