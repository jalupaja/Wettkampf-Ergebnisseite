export function formatPoints(value) {
  const num = Number(value);
  if (isNaN(num)) return value;
  
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(num);
}
