const isRemoteUrl = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://");

export const buildProxyUrl = (value: string) =>
  `/api/proxy?url=${encodeURIComponent(value)}`;

export const resolveProxyUrl = (value: string, useProxy: boolean) => {
  if (!useProxy || !isRemoteUrl(value)) return value;
  return buildProxyUrl(value);
};
