import { runWithInput } from '../common/input.js';

runWithInput(
  async (input: string) => {
    // Remove any potential whitespace/newlines that might wrap the input
    const cleanInput = input.trim().replace(/\s/g, '');
    const ranges = cleanInput.split(',');
    let invalidSum = 0;

    for (const range of ranges) {
      if (!range) continue;
      const [startStr, endStr] = range.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      for (let i = start; i <= end; i++) {
        const s = i.toString();
        // Check if length is even
        if (s.length % 2 !== 0) continue;
        
        const half = s.length / 2;
        // Check if first half equals second half
        if (s.substring(0, half) === s.substring(half)) {
          invalidSum += i;
        }
      }
    }
    return invalidSum;
  },
  async (input: string) => {
    // Remove any potential whitespace/newlines that might wrap the input
    const cleanInput = input.trim().replace(/\s/g, '');
    const ranges = cleanInput.split(',');
    let invalidSum = 0;

    for (const range of ranges) {
      if (!range) continue;
      const [startStr, endStr] = range.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      for (let i = start; i <= end; i++) {
        const s = i.toString();
        const len = s.length;
        let isInvalid = false;

        for (let d = 1; d <= len / 2; d++) {
          if (len % d === 0) {
            const p = s.substring(0, d);
            if (p.repeat(len / d) === s) {
              isInvalid = true;
              break;
            }
          }
        }

        if (isInvalid) {
          invalidSum += i;
        }
      }
    }
    return invalidSum;
  },
  2025,
  2
);
