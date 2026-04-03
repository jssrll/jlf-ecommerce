// PRODUCT DATABASE - FIREWORKS SHOP
const products = [
  // Aerial Fireworks
  { id: 1, name: "Maribel Kwitis", category: "Aerial", price: 129, image: "🎇", description: "10 pcs per order" },
  
  // Ground Fireworks
  { id: 2, name: "TS Pastillas Small", category: "Ground", price: 29, image: "🧨", description: "Pack of 10 per order" },
  { id: 3, name: "TS Special Pastillas", category: "Ground", price: 39, image: "🧨", description: "Pack of 10 per order" },
  { id: 4, name: "TS Pastillas Big", category: "Ground", price: 149, image: "🧨", description: "Pack of 10 per order" },
  { id: 5, name: "TS Thunder Sawa 500 Rounds", category: "Ground", price: 749, image: "🧨", description: "1 pcs per order" },
  { id: 6, name: "TS Special DK Sawa 500 Rounds", category: "Ground", price: 789, image: "🧨", description: "1 pcs per order" },
  { id: 7, name: "TS Super Thunder Sawa 500 Rounds", category: "Ground", price: 799, image: "🧨", description: "1 pcs per order" },
  { id: 8, name: "Dreamlight 3 Star", category: "Ground", price: 149, image: "🧨", description: "Ream of 100 per order" },
  { id: 9, name: "Phoenix Thunder", category: "Ground", price: 249, image: "🧨", description: "Ream of 100 per order" },
  { id: 10, name: "Dreamlight Whistle Bomb", category: "Ground", price: 129, image: "🧨", description: "Pack of 10 per order" },
  { id: 11, name: "Nation Whistle Bomb", category: "Ground", price: 129, image: "🧨", description: "Pack of 10 per order" },
  
  // Sparklers
  { id: 12, name: "Maribel Mabuhay Ordinary", category: "Sparklers", price: 29, image: "✨", description: "Pack of 10 per order" },
  { id: 13, name: "Tiger 1 Minutes Luces w/ Effect", category: "Sparklers", price: 49, image: "✨", description: "1 pcs per order" },
  { id: 14, name: "Yanco 1 Minute RC Luces", category: "Sparklers", price: 34, image: "✨", description: "1 pcs per order" },
  { id: 15, name: "Yanco 1 Minute Baby Luces", category: "Sparklers", price: 129, image: "✨", description: "Pack of 10 per order" },
  
  // Fountains
  { id: 16, name: "Yanco Batibot", category: "Fountains", price: 99, image: "💧", description: "3 pcs per order" },
  { id: 17, name: "Yanco Small Silver", category: "Fountains", price: 99, image: "💧", description: "2 pcs per order" },

  // Others
  { id: 18, name: "alp-alp", category: "Others", price: 169, image: "🌊", description: "Pack of 10 per order" },
  { id: 19, name: "kk", category: "Others", price: 269, image: "🌊", description: "Pack of 10 per order" },
  { id: 20, name: "dyn", category: "Others", price: 69, image: "🌊", description: "1 pcs per order" },
  { id: 21, name: "kbs", category: "Others", price: 69, image: "🌊", description: "1 pcs per order" },
  { id: 22, name: "el", category: "Others", price: 79, image: "🌊", description: "1 pcs per order" },
  { id: 23, name: "al", category: "Others", price: 159, image: "🌊", description: "1 pcs per order" }
];

// ========================================
// PROMO CODES DATABASE
// ========================================
const promoCodeRewards = {
  // #1 Peso Codes
  "L5@P6^Z2": { type: "peso", value: 1, message: "You won ₱1 credit!" },
  "V8!H9%T1": { type: "peso", value: 1, message: "You won ₱1 credit!" },
  "kU3#C1$S7": { type: "peso", value: 1, message: "You won ₱1 credit!" },
  "G2&Q4!Y6": { type: "peso", value: 1, message: "You won ₱1 credit!" },
  
  // #2 Peso Codes
  "J1!R6%T8": { type: "peso", value: 2, message: "You won ₱2 credit!" },
  "Z8#D2$N5": { type: "peso", value: 2, message: "You won ₱2 credit!" },
  
  // #5 Peso Codes
  "U8@M7^P6": { type: "peso", value: 5, message: "You won ₱5 credit!" },
  "C7!Z4%N1": { type: "peso", value: 5, message: "You won ₱5 credit!" },
  
  // #10 Peso Codes
  "A4@K2^T3": { type: "peso", value: 10, message: "You won ₱10 credit!" },
  "M3!L6%H7": { type: "peso", value: 10, message: "You won ₱10 credit!" },
  
  // #50 Peso Codes
  "B7!mQ3$pR": { type: "peso", value: 50, message: "You won ₱50 credit!" },
  
  // #100 Peso Codes
  "sR5$D8!oG": { type: "peso", value: 100, message: "You won ₱100 credit!" },
  
  // Fireworks Special Codes
  "FIREWORK2024": { type: "peso", value: 50, message: "🎆 You won ₱50 fireworks credit! 🎇" },
  "NYE2025": { type: "peso", value: 100, message: "🎉 New Year Special! ₱100 credit added! 🎉" },
  "SPARKLE": { type: "peso", value: 20, message: "✨ Sparkle credit added! ₱20 ✨" }
};