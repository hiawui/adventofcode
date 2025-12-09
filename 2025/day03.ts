import { runWithInput } from '../common/input.js';

runWithInput(
  async (input: string) => {
    const lines = input.trim().split('\n');
    let totalJoltage = 0;

    for (const line of lines) {
      if (line.length < 2) continue;
      
      let maxD1 = -1;
      let maxD2 = 0;

      for (let i = 0; i < line.length; i++) {
        const digit = line.charCodeAt(i) - 48;
        
        // Logic: Always prefer a larger first digit if possible.
        // If we find a larger d1 (that is not the last digit), we take it 
        // and reset d2, because (newD1 * 10 + 0) > (oldD1 * 10 + 9) for newD1 > oldD1.
        if (digit > maxD1 && i < line.length - 1) {
          maxD1 = digit;
          maxD2 = 0;
        } else {
          // Otherwise, this digit is a candidate for the second digit
          if (digit > maxD2) {
            maxD2 = digit;
          }
        }
      }
      totalJoltage += maxD1 * 10 + maxD2;
    }
    
    return totalJoltage;
  },
  async (input: string) => {
    const lines = input.trim().split('\n');
    let totalJoltage = 0;
    const KEEP_COUNT = 12;

    for (const line of lines) {
      if (line.length < KEEP_COUNT) continue;
      
      let removeCount = line.length - KEEP_COUNT;
      const stack: number[] = [];
      
      for (let i = 0; i < line.length; i++) {
        const digit = line.charCodeAt(i) - 48;
        
        // Greedy approach: Maintain a decreasing stack (for the prefix)
        // If current digit is larger than stack top and we can still remove digits,
        // pop the smaller digit to make room for the larger one.
        while (removeCount > 0 && stack.length > 0 && stack[stack.length - 1] < digit) {
          stack.pop();
          removeCount--;
        }
        stack.push(digit);
      }
      
      // If we still have removals left (e.g. for a decreasing sequence), remove from the end
      while (removeCount > 0) {
        stack.pop();
        removeCount--;
      }
      
      // stack now contains exactly KEEP_COUNT digits
      totalJoltage += parseInt(stack.join(''), 10);
    }
    
    return totalJoltage;
  },
  2025,
  3
);
