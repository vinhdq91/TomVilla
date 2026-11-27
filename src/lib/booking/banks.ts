// Banks supported by VietQR. The value is the bank's official BIN code.
export const banks = [
  { label: 'Vietcombank', value: '970436' },
  { label: 'VietinBank', value: '970415' },
  { label: 'BIDV', value: '970418' },
  { label: 'Agribank', value: '970405' },
  { label: 'Techcombank', value: '970407' },
  { label: 'MB Bank', value: '970422' },
  { label: 'ACB', value: '970416' },
  { label: 'VPBank', value: '970432' },
  { label: 'TPBank', value: '970423' },
  { label: 'Sacombank', value: '970403' },
  { label: 'VIB', value: '970441' },
  { label: 'HDBank', value: '970437' },
  { label: 'SHB', value: '970443' },
  { label: 'MSB', value: '970426' },
  { label: 'Eximbank', value: '970431' },
  { label: 'SeABank', value: '970440' },
  { label: 'OCB', value: '970448' },
  { label: 'LPBank', value: '970449' },
] as const;

export const bankName = (bin: string) => banks.find((b) => b.value === bin)?.label ?? bin;
