/**
 * Face Recognition Utilities
 */

/**
 * Calculate Euclidean distance between two face descriptors
 * @param {Array<Number>} arr1 - First face descriptor (128-dimensional array)
 * @param {Array<Number>} arr2 - Second face descriptor (128-dimensional array)
 * @returns {Number} - Euclidean distance between the two descriptors
 */
const euclideanDistance = (arr1, arr2) => {
  if (!arr1 || !arr2) return Infinity;
  if (arr1.length !== arr2.length) return Infinity;
  
  return Math.sqrt(
    arr1.reduce((sum, val, i) => sum + Math.pow(val - arr2[i], 2), 0)
  );
};

/**
 * Face recognition threshold
 * Distances below this value are considered a match
 */
const FACE_MATCH_THRESHOLD = 0.6;

module.exports = {
  euclideanDistance,
  FACE_MATCH_THRESHOLD,
};

