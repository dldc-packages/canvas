export const Random = (() => {
  return {
    sequenceOfUniqueColor,
    sequenceOfUnique,
  };

  function sequenceOfUnique(intermediateOffset: number, seedBase = 1) {
    // from https://preshing.com/20121224/how-to-generate-a-sequence-of-unique-random-integers/
    let index = permuteQPR(permuteQPR(seedBase) + 0x682f01);

    function permuteQPR(x: number) {
      const prime = 16777199;
      const halfPrime = 8388599;
      if (x >= prime) return x; // The 17 integers out of range are mapped to themselves.

      // squaring can cause exceeding 2^53
      const residue = (x * x) % prime;
      return x <= halfPrime ? residue : prime - residue;
    }

    function getNth(n: number) {
      // >>> ensures conversion to unsigned int
      return permuteQPR(((permuteQPR(n) + intermediateOffset) ^ 0x5bf036) >>> 0);
    }

    return () => {
      const res = getNth(index);
      index++;
      return res;
    };
  }

  function sequenceOfUniqueColor() {
    const gen = sequenceOfUnique(Math.floor(Math.random() * 10000));
    return () => {
      let num = gen().toString(16);
      while (num.length < 6) {
        num = '0' + num;
      }
      return '#' + num;
    };
  }
})();
