export const formatDateInput = (date: Date) =>
  date.toISOString().split('T')[0];

export const parseDateInput = (value: string) =>
  new Date(`${value}T00:00:00.000Z`);
