export function generateKey(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let randomStr = ''
  for (let i = 0; i < 32; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}${randomStr}`
}
