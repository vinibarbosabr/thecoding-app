export function truncateAccountId(
  accountId: string,
  head = 6,
  tail = 4,
): string {
  if (accountId.length <= head + tail + 1) return accountId;
  return `${accountId.slice(0, head)}…${accountId.slice(-tail)}`;
}
