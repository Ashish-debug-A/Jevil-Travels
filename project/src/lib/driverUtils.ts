export function getDriverInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2);
}
