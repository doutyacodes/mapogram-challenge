import CryptoJS from 'crypto-js';

const secretKey = 'C7d8h2uu@1'; // Consider moving this to an environment variable for better security

export const encryptText = (text) => {
  return CryptoJS.AES.encrypt(text, secretKey).toString();
};

export const decryptText = (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};


export const encryptURLText = (text) => {
  const cipherText = CryptoJS.AES.encrypt(text, secretKey).toString();
  return encodeURIComponent(cipherText); // URL encode
};

export const decryptURLText = (cipherText) => {
  const decodedCipherText = decodeURIComponent(cipherText); // URL decode
  const bytes = CryptoJS.AES.decrypt(decodedCipherText, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};
