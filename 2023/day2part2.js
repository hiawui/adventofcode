let input = `Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green
Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue
Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red
Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red
Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green
`;

let games = {};

input.split("\n").forEach((r) => {
  if (!r) {
    return;
  }
  let [left, right] = r.split(": ");
  const gid = left.split(" ")[1];
  const trials = right.split("; ").map((t) => {
    const r = {};
    t.split(", ").forEach((grab) => {
      const [n, color] = grab.split(" ");
      r[color] = Number(n);
    });
    return r;
  });
  games[gid] = {
    gid,
    trials,
  };
});

Object.values(games)
  .map((g) => {
    let min = {
      red: 0,
      green: 0,
      blue: 0,
    };
    g.trials.forEach((t) => {
      for (const k in min) {
        if (t[k] > min[k]) {
          min[k] = t[k];
        }
      }
    });
    return min["red"] * min["green"] * min["blue"];
  })
  .reduce((a, b) => a + b, 0);
