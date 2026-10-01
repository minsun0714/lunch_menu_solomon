export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return `${date.getFullYear()}. ${(date.getMonth() + 1).toString().padStart(2, '0')}. ${date.getDate().toString().padStart(2, '0')}`;
}
