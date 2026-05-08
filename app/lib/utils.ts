export const hexToRgba = (colorStr: string, alpha: number) => {
  if (!colorStr) return `rgba(0, 0, 0, ${alpha})`;
  let r = 0, g = 0, b = 0;
  if (colorStr.startsWith('#')) {
    let hex = colorStr.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length >= 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  } else if (colorStr.startsWith('rgb')) {
    const match = colorStr.match(/\d+/g);
    if (match && match.length >= 3) {
      r = parseInt(match[0]); g = parseInt(match[1]); b = parseInt(match[2]);
    }
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const toLocalYYYYMMDD = (date: Date) => {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
};