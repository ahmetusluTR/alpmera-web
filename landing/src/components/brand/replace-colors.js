const fs = require('fs');

const filePath = './src/app/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Color replacements
content = content.replace(/#0F2043/g, '#1B4D3E');
content = content.replace(/#F0EDE5/g, '#E8DED1');
content = content.replace(/#B87333/g, '#C9A962');
content = content.replace(/#4A5D4E/g, '#3A6B5A');

// Update RGB values in rgba
content = content.replace(/rgba\(15, 32, 67/g, 'rgba(27, 77, 62');
content = content.replace(/rgba\(240, 237, 229/g, 'rgba(232, 222, 209');
content = content.replace(/rgba\(184, 115, 51/g, 'rgba(201, 169, 98');
content = content.replace(/rgba\(74, 93, 78/g, 'rgba(58, 107, 90');

// Name replacements
content = content.replace(/Deep Sapphire/g, 'Deep Forest');
content = content.replace(/Cloud Dancer/g, 'Warm Stone');
content = content.replace(/Matte Copper/g, 'Muted Gold');
content = content.replace(/Eucalyptus/g, 'Forest Light');

// Font replacement
content = content.replace(/DM Serif Display/g, 'Libre Baskerville');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replacements complete!');
