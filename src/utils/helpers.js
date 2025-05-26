const forbiddenColors = new Set([
  '#ffffff', '#fff', '#fffFFF', '#FFFFFF',
  '#1c1c23', '#47ED73', '#10A62B', '#F02037', '#D30B21',
  '#4A4E51', '#17171C', '#EB5757', '#27AE60',
  '#E0E0E0', '#A1A1A1'
].map(c => c.toLowerCase()));

function generateSafeHexColor() {
  let color;
  do {
    color = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`.toLowerCase();
  } while (
    forbiddenColors.has(color) || isNearWhite(color)
  );
  return color;
}

function isNearWhite(hex) {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;
  const brightness = (r + g + b) / 3;
  return brightness > 240;
}


module.exports = {generateSafeHexColor}
