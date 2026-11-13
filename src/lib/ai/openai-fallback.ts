import { parseKeyList } from '../gemini/client';

const INVALID_OPENAI_PLACEHOLDERS = new Set([
  'mock-openai-key',
  'sk-placeholder',
  'your-openai-api-key',
]);

export const DEFAULT_OPENAI_TEXT_MODEL = 'gpt-4o-mini';
export const DEFAULT_OPENAI_VISION_MODEL = 'gpt-4o-mini';
export const DEFAULT_OPENAI_IMAGE_MODEL = 'gpt-image-2';

const RETIRED_OPENAI_IMAGE_MODELS = new Set([
  'dall-e-2',
  'dall-e-3',
  'gpt-image-1',
  'gpt-image-1-mini',
]);

export function parseOpenAIApiKeys(): string[] {
  const sources = [process.env.OPENAI_API_KEY, process.env.OPENAI_API_KEYS];
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const src of sources) {
    for (const key of parseKeyList(src)) {
      if (!INVALID_OPENAI_PLACEHOLDERS.has(key) && !seen.has(key)) {
        seen.add(key);
        ordered.push(key);
      }
    }
  }

  return ordered;
}

export function hasOpenAIFallback(): boolean {
  return parseOpenAIApiKeys().length > 0;
}

export function getOpenAIBaseUrl(): string {
  return (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1')
    .trim()
    .replace(/\/+$/, '');
}

export function getOpenAITextModelName(): string {
  return process.env.OPENAI_TEXT_MODEL?.trim() || DEFAULT_OPENAI_TEXT_MODEL;
}

export function getOpenAIVisionModelName(): string {
  return (
    process.env.OPENAI_VISION_MODEL?.trim() ||
    process.env.OPENAI_TEXT_MODEL?.trim() ||
    DEFAULT_OPENAI_VISION_MODEL
  );
}

export function getOpenAIImageModelName(): string {
  const configured = process.env.OPENAI_IMAGE_MODEL?.trim();
  if (!configured || RETIRED_OPENAI_IMAGE_MODELS.has(configured)) {
    return DEFAULT_OPENAI_IMAGE_MODEL;
  }
  return configured;
}

function detectImageTypeFromBuffer(buffer: Buffer): { mimeType: string; ext: string } {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
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
  return { mimeType: 'image/png', ext: 'png' };
}

async function runWithOpenAIKeys<T>(
  operationName: string,
  fn: (apiKey: string) => Promise<T>
): Promise<T> {
  const keys = parseOpenAIApiKeys();
  if (keys.length === 0) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  let lastError: unknown;
  for (let i = 0; i < keys.length; i++) {
    try {
      return await fn(keys[i]);
    } catch (err) {
      lastError = err;
      console.warn(
        `[OpenAI:${operationName}] Key #${i + 1}/${keys.length} failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError || 'OpenAI request failed'));
}

export async function callOpenAIChatJson(params: {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs?: number;
  model?: string;
  temperature?: number;
}): Promise<{
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const model = params.model || getOpenAITextModelName();
  const baseUrl = getOpenAIBaseUrl();
  const timeoutMs = Math.max(500, params.timeoutMs ?? 12000);

  return runWithOpenAIKeys('chat', async (apiKey) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('OPENAI_CHAT_TIMEOUT')), timeoutMs);

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: params.temperature ?? 0.3,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`OpenAI chat API error (${res.status}): ${errBody.slice(0, 300)}`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      if (!text.trim()) {
        throw new Error('OpenAI chat API returned empty content');
      }

      return {
        text,
        model: data?.model || model,
        inputTokens: Number(data?.usage?.prompt_tokens || 600),
        outputTokens: Number(data?.usage?.completion_tokens || 250),
      };
    } finally {
      clearTimeout(timer);
    }
  });
}

export async function callOpenAIVisionMenuExtraction(params: {
  systemPrompt: string;
  userPrompt: string;
  files: Array<{ buffer: Buffer; mimeType: string }>;
  timeoutMs?: number;
  model?: string;
}): Promise<{
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const model = params.model || getOpenAIVisionModelName();
  const baseUrl = getOpenAIBaseUrl();
  const timeoutMs = Math.max(1000, params.timeoutMs ?? 45000);

  const userContent: Array<Record<string, any>> = [
    { type: 'text', text: params.userPrompt },
  ];

  params.files.forEach((file, idx) => {
    const lowerMime = (file.mimeType || '').toLowerCase();
    if (lowerMime === 'image/heic' || lowerMime === 'image/heif') {
      throw new Error(
        'HEIC/HEIF photos require Gemini Vision or JPG/PNG conversion. Please convert the photo to JPG/PNG or PDF and try again.'
      );
    }

    const base64 = file.buffer.toString('base64');
    if (lowerMime === 'application/pdf') {
      userContent.push({
        type: 'file',
        file: {
          filename: `menu-${idx + 1}.pdf`,
          file_data: `data:application/pdf;base64,${base64}`,
        },
      });
    } else {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${lowerMime || 'image/jpeg'};base64,${base64}`,
          detail: 'high',
        },
      });
    }
  });

  return runWithOpenAIKeys('vision-extract', async (apiKey) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('OPENAI_EXTRACTION_TIMEOUT')), timeoutMs);

    try {
      const payload: Record<string, any> = {
        model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      };
      if (!model.startsWith('o1') && !model.startsWith('o3') && !model.startsWith('gpt-5')) {
        payload.max_tokens = 16384;
      }

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`OpenAI vision API error (${res.status}): ${errBody.slice(0, 300)}`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      if (!text.trim()) {
        throw new Error('OpenAI vision API returned empty content');
      }

      return {
        text,
        model: data?.model || model,
        inputTokens: Number(data?.usage?.prompt_tokens || 1200),
        outputTokens: Number(data?.usage?.completion_tokens || 800),
      };
    } finally {
      clearTimeout(timer);
    }
  });
}

export async function generateOpenAIDishImage(params: {
  prompt: string;
  timeoutMs?: number;
  model?: string;
  quality?: 'low' | 'medium' | 'high' | 'auto';
  outputFormat?: 'webp' | 'jpeg' | 'png';
  outputCompression?: number;
}): Promise<{
  buffer: Buffer;
  mimeType: string;
  ext: string;
  model: string;
}> {
  const configuredModel = params.model || getOpenAIImageModelName();
  const baseUrl = getOpenAIBaseUrl();
  const timeoutMs = Math.max(2000, params.timeoutMs ?? 45000);

  return runWithOpenAIKeys('image-gen', async (apiKey) => {
    const attemptRequest = async (targetModel: string) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(new Error('OPENAI_IMAGE_TIMEOUT')), timeoutMs);

      try {
        const body: Record<string, any> = {
          model: targetModel,
          prompt: params.prompt,
          n: 1,
          size: '1024x1024',
        };

        // dall-e-2 / dall-e-3 accept response_format; gpt-image-* models reject it and return b64_json by default.
        if (targetModel.startsWith('dall-e')) {
          body.response_format = 'b64_json';
        } else if (targetModel.startsWith('gpt-image')) {
          body.quality = params.quality || 'medium';
          const fmt = params.outputFormat || 'jpeg';
          body.output_format = fmt;
          if (fmt === 'jpeg' || fmt === 'webp') {
            body.output_compression = params.outputCompression ?? 85;
          }
        }

        const res = await fetch(`${baseUrl}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          throw new Error(`OpenAI image API error (${res.status}): ${errBody.slice(0, 300)}`);
        }

        const data = await res.json();
        const first = data?.data?.[0];

        if (first?.b64_json) {
          const buffer = Buffer.from(first.b64_json, 'base64');
          const detected = detectImageTypeFromBuffer(buffer);
          return {
            buffer,
            mimeType: detected.mimeType,
            ext: detected.ext,
            model: targetModel,
          };
        }

        if (first?.url) {
          const imgRes = await fetch(first.url, { signal: controller.signal });
          if (!imgRes.ok) {
            throw new Error(`Failed to fetch generated OpenAI image (${imgRes.status})`);
          }
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const detected = detectImageTypeFromBuffer(buffer);
          return {
            buffer,
            mimeType: imgRes.headers.get('content-type')?.split(';')[0]?.trim() || detected.mimeType,
            ext: detected.ext,
            model: targetModel,
          };
        }

        throw new Error('OpenAI image API returned neither b64_json nor url');
      } finally {
        clearTimeout(timer);
      }
    };

    try {
      return await attemptRequest(configuredModel);
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (
        configuredModel === 'gpt-image-1' &&
        (msg.includes('does not exist') || msg.includes('invalid_value'))
      ) {
        return await attemptRequest(DEFAULT_OPENAI_IMAGE_MODEL);
      }
      throw err;
    }
  });
}
