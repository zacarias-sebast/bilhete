export default function randomNumberSets(count: number, min: number, max: number) {
  const sets = [];
  for (let i = 0; i < count; i++) {
    const set = [];
    for (let j = 0; j < 4; j++) {
      set.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    sets.push(set);
  }
  return sets;
}
