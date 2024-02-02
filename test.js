const myPostalCode = 75200;
const postalCodes = [75850, 75800, 75890, 75100, 75120, 75160];

// Calculate the differences between each postal code and your postal code
const differences = postalCodes.map((code) => Math.abs(myPostalCode - code));

// Find the index of the minimum difference
const minDifferenceIndex = differences.indexOf(Math.min(...differences));

// The nearest postal code
const nearestPostalCode = postalCodes[minDifferenceIndex];

console.log(
  `The nearest postal code to ${myPostalCode} is ${nearestPostalCode}`
);

console.log(new Date().getTime());
