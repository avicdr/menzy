const DEFAULT_CLOUDFLARE_IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell';

const INVALID_PLACEHOLDERS = new Set([
  'your-cloudflare-account-id',
  'your-cloudflare-workers-ai-token',
  'replace-with-cloudflare-account-id',
  'replace-with-cloudflare-workers-ai-token',
]);

function getCloudflareCredentials(): { accountId: string; apiToken: string } | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() || '';
  const apiToken = process.env.CLOUDFLARE_AI_API_TOKEN?.trim() || '';
  if (
    !accountId ||
    !apiToken ||
    INVALID_PLACEHOLDERS.has(accountId) ||
    INVALID_PLACEHOLDERS.has(apiToken)
  ) {
    return null;
  }
  return { accountId, apiToken };
}

export function hasCloudflareWorkersAI(): boolean {
  return getCloudflareCredentials() !== null;
}

export function getCloudflareImageModel(): string {
  return process.env.CLOUDFLARE_AI_IMAGE_MODEL?.trim() || DEFAULT_CLOUDFLARE_IMAGE_MODEL;
}

function detectImageType(buffer: Buffer): { mimeType: string; ext: string } {
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { mimeType: 'image/png', ext: 'png' };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', ext: 'jpg' };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mimeType: 'image/webp', ext: 'webp' };
  }
  throw new Error('Cloudflare Workers AI returned an unsupported image format');
}

export async function generateCloudflareDishImage(params: {
  prompt: string;
  timeoutMs?: number;
}): Promise<{ buffer: Buffer; mimeType: string; ext: string; model: string }> {
  const credentials = getCloudflareCredentials();
  if (!credentials) {
    throw new Error('Cloudflare Workers AI is not configured');
  }

  const model = getCloudflareImageModel();
  const configuredSteps = Number(process.env.CLOUDFLARE_AI_IMAGE_STEPS || 8);
  const steps = Number.isFinite(configuredSteps)
    ? Math.max(1, Math.min(8, Math.round(configuredSteps)))
    : 8;
  const timeoutMs = Math.max(2_000, params.timeoutMs ?? 45_000);
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error('CLOUDFLARE_WORKERS_AI_TIMEOUT')),
    timeoutMs
  );

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(credentials.accountId)}/ai/run/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: params.prompt,
          steps,
          seed: Math.floor(Math.random() * 2_147_483_647),
        }),
        signal: controller.signal,
      }
    );

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(
        `Cloudflare Workers AI error (${response.status}): ${responseText.slice(0, 300)}`
      );
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error('Cloudflare Workers AI returned malformed JSON');
    }

    const encodedImage = data?.result?.image || data?.image;
    if (typeof encodedImage !== 'string' || encodedImage.length === 0) {
      throw new Error('Cloudflare Workers AI returned no image');
    }

    const base64 = encodedImage.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '');
    const buffer = Buffer.from(base64, 'base64');
    const detected = detectImageType(buffer);
    return { buffer, ...detected, model };
  } finally {
    clearTimeout(timer);
  }
}
