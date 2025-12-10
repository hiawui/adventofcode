import { runWithInput } from '../common/input.js';

runWithInput(
  async (input: string) => {
    // Part 1
    const [rangesSection, idsSection] = input.trim().split('\n\n');
    
    const ranges = rangesSection.split('\n').map(line => {
        const [start, end] = line.split('-').map(Number);
        return { start, end };
    });

    const ids = idsSection.split('\n').map(Number);

    let freshCount = 0;
    for (const id of ids) {
        let isFresh = false;
        for (const range of ranges) {
            if (id >= range.start && id <= range.end) {
                isFresh = true;
                break;
            }
        }
        if (isFresh) {
            freshCount++;
        }
    }

    return freshCount;
  },
  async (input: string) => {
    // Part 2
    const [rangesSection] = input.trim().split('\n\n');
    const ranges = rangesSection.split('\n').map(line => {
        const [start, end] = line.split('-').map(Number);
        return { start, end };
    });

    // Sort ranges by start
    ranges.sort((a, b) => a.start - b.start);

    const mergedRanges: {start: number, end: number}[] = [];
    if (ranges.length > 0) {
        mergedRanges.push(ranges[0]);
        for (let i = 1; i < ranges.length; i++) {
            const current = ranges[i];
            const last = mergedRanges[mergedRanges.length - 1];

            // Check for overlap or adjacency
            if (current.start <= last.end + 1) {
                last.end = Math.max(last.end, current.end);
            } else {
                mergedRanges.push(current);
            }
        }
    }

    let totalFresh = 0;
    for (const range of mergedRanges) {
        totalFresh += (range.end - range.start + 1);
    }
    
    return totalFresh;
  },
  2025,
  5
);
