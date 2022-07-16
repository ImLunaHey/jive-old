const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export const randomUUID = () => Array.from({ length: 6 }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
