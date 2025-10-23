export function generateSecureId(role: 'admin' | 'supervisor' | 'fabricator'): string {
  const prefixes = {
    admin: 'ADMID',
    supervisor: 'SUPID', 
    fabricator: 'FABID'
  };
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${prefixes[role]}-${result}`;
}

export function generateEmployeeNumber(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `EMP${year}${randomNum}`;
}