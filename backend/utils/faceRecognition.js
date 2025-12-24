/**
 * Face Recognition Utilities
 */
const { FACE_MATCH_THRESHOLD } = require('../config/constants');

/**
 * Calculate Euclidean distance between two face descriptors
 * @param {Array<Number>} arr1 - First face descriptor (128-dimensional array)
 * @param {Array<Number>} arr2 - Second face descriptor (128-dimensional array)
 * @returns {Number} - Euclidean distance between the two descriptors
 */
const euclideanDistance = (arr1, arr2) => {
  if (!arr1 || !arr2) return Infinity;
  if (arr1.length !== arr2.length) return Infinity;
  if (arr1.length !== 128) return Infinity; // Must be 128-dimensional
  
  return Math.sqrt(
    arr1.reduce((sum, val, i) => sum + Math.pow(val - arr2[i], 2), 0)
  );
};

/**
 * Find the best matching user from a list of users
 * @param {Array<Number>} faceDescriptor - Face descriptor to match
 * @param {Array} users - Array of user objects with faceDescriptor field
 * @returns {Object|null} - { user, distance } or null if no match found
 */
const findBestMatch = (faceDescriptor, users) => {
  let bestMatch = null;
  let bestDistance = Infinity;
  
  for (const user of users) {
    if (!user.faceDescriptor || user.faceDescriptor.length !== 128) continue;
    
    const distance = euclideanDistance(faceDescriptor, user.faceDescriptor);
    
    if (distance < bestDistance && distance < FACE_MATCH_THRESHOLD) {
      bestMatch = user;
      bestDistance = distance;
    }
  }
  
  return bestMatch ? { user: bestMatch, distance: bestDistance } : null;
};

/**
 * Validate a face descriptor array
 * @param {Array} descriptor - Face descriptor to validate
 * @returns {boolean} - True if valid
 */
const isValidDescriptor = (descriptor) => {
  if (!Array.isArray(descriptor)) return false;
  if (descriptor.length !== 128) return false;
  return descriptor.every(val => typeof val === 'number' && !isNaN(val));
};

module.exports = {
  euclideanDistance,
  findBestMatch,
  isValidDescriptor,
  FACE_MATCH_THRESHOLD,
};
