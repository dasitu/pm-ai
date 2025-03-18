export function parseMonthFromFileName(fileName: string): string {
  const match = fileName.match(/(\d{4})(\d{2})/)
  if (match) {
    const [_, year, month] = match
    return `${year}年${month}月`
  }
  return '未知月份'
} 