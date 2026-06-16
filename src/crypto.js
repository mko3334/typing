import CryptoJS from 'crypto-js';

// 暗号化のための固定シークレットキー（コンソール画面でのぞき見を防止するための簡易的なもの）
const SECRET_KEY = "kids-typing-game-secret-key-2026-v2";

export const encryptData = (data) => {
  try {
    const jsonStr = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonStr, SECRET_KEY).toString();
  } catch (e) {
    console.error("Encryption failed", e);
    return null;
  }
};

export const decryptData = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedStr);
  } catch (e) {
    console.error("Decryption failed", e);
    return null;
  }
};
