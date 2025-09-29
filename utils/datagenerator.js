const { generateRandomString, formatDate } = require('./helpers.js'); // Assuming helpers.js is in the same directory

const firstNames = [
  'Aarav',
  'Vivaan',
  'Aditya',
  'Vihaan',
  'Arjun',
  'Sai',
  'Reyansh',
  'Ayaan',
  'Krishna',
  'Ishaan',
  'Saanvi',
  'Aanya',
  'Aadhya',
  'Ananya',
  'Pari',
  'Diya',
  'Anika',
  'Navya',
  'Riya',
  'Myra',
];
const lastNames = [
  'Sharma',
  'Verma',
  'Gupta',
  'Singh',
  'Kumar',
  'Patel',
  'Reddy',
  'Das',
  'Chopra',
  'Mehta',
  'Joshi',
  'Nair',
  'Iyer',
  'Menon',
  'Rao',
];
const genders = ['Male', 'Female', 'Other'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * Generates a random first name from a predefined list.
 * @returns {string} A random first name.
 */
function getRandomFirstName() {
  return firstNames[Math.floor(Math.random() * firstNames.length)];
}

/**
 * Generates a random last name from a predefined list.
 * @returns {string} A random last name.
 */
function getRandomLastName() {
  return lastNames[Math.floor(Math.random() * lastNames.length)];
}

/**
 * Generates a random gender from a predefined list.
 * @returns {string} A random gender ('Male', 'Female', 'Other').
 */
function getRandomGender() {
  return genders[Math.floor(Math.random() * genders.length)];
}

/**
 * Generates a random blood group from a predefined list.
 * @returns {string} A random blood group (e.g., 'A+').
 */
function getRandomBloodGroup() {
  return bloodGroups[Math.floor(Math.random() * bloodGroups.length)];
}

/**
 * Generates a random date of birth for an adult (e.g., between 18 and 80 years ago).
 * @returns {Date} A Date object representing a random date of birth.
 */
function getRandomDateOfBirth() {
  const today = new Date();
  const minAge = 18;
  const maxAge = 80;
  const birthYear =
    today.getFullYear() -
    (Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge);
  const birthMonth = Math.floor(Math.random() * 12); // 0-11
  const birthDay = Math.floor(Math.random() * 28) + 1; // 1-28 to keep it simple
  return new Date(birthYear, birthMonth, birthDay);
}

/**
 * Generates a random Bahmni-like patient identifier (e.g., GAN1000001, BAH2000034).
 * You might need to adjust the prefix or length based on your Bahmni configuration.
 * @param {string} [prefix='BAM'] - Optional prefix for the identifier.
 * @returns {string} A random patient identifier.
 */
function generatePatientId(prefix = 'BAM') {
  const randomNumber = Math.floor(1000000 + Math.random() * 9000000); // 7-digit number
  return `${prefix.toUpperCase()}${randomNumber}`;
}

/**
 * Generates a complete random patient data object.
 * @returns {object} An object containing random patient details.
 */
function generateRandomPatientData() {
  const dob = getRandomDateOfBirth();
  return {
    firstName: getRandomFirstName(),
    lastName: getRandomLastName(),
    fullName: `${getRandomFirstName()} ${getRandomLastName()}`, // Or combine the above
    gender: getRandomGender(),
    dateOfBirth: dob,
    formattedDateOfBirth: formatDate(dob), // Using helper function
    patientId: generatePatientId(),
    bloodGroup: getRandomBloodGroup(),
    phoneNumber: `9${generateRandomString(9)}`, // Example 10-digit phone number
    email: `${generateRandomString(8).toLowerCase()}@example.com`,
    address: `${generateRandomString(5)} Street, ${generateRandomString(7)} City`,
  };
}

module.exports = {
  getRandomFirstName,
  getRandomLastName,
  getRandomGender,
  getRandomBloodGroup,
  getRandomDateOfBirth,
  generatePatientId,
  generateRandomPatientData,
};
