import 'dotenv/config';
import prisma from '../lib/db/prisma';
import { extractMenuFromImages } from '../lib/gemini/vision-extractor';
import { generateOrReuseDishIllustration } from '../lib/gemini/illustration-generator';
import fs from 'fs';
import path from 'path';

async function runWorkerLoop() {
  console.log('🚀 Dishora Background Worker running...');

  while (true) {
    try {
      // 1. Process queued ExtractionJobs
      const queuedExtraction = await prisma.extractionJob.findFirst({
        where: { status: 'QUEUED' },
        include: { upload: true, restaurant: true },
      });

      if (queuedExtraction && queuedExtraction.upload) {
        console.log(`[Worker] Processing ExtractionJob ${queuedExtraction.id}...`);
        await prisma.extractionJob.update({
          where: { id: queuedExtraction.id },
          data: { status: 'PROCESSING', attempts: { increment: 1 } },
        });

        const fileKeys = queuedExtraction.upload.fileKeys as string[];
        const images: Array<{ buffer: Buffer; mimeType: string }> = [];

        for (const fileUrl of fileKeys) {
          try {
            const localPath = path.join(process.cwd(), 'public', fileUrl.replace(/^\//, ''));
            if (fs.existsSync(localPath)) {
              const buffer = fs.readFileSync(localPath);
              const ext = path.extname(localPath).toLowerCase();
              let mimeType = 'image/jpeg';
              if (ext === '.webp') mimeType = 'image/webp';
              else if (ext === '.png') mimeType = 'image/png';
              else if (ext === '.pdf') mimeType = 'application/pdf';
              else if (ext === '.gif') mimeType = 'image/gif';
              images.push({ buffer, mimeType });
            }
          } catch {}
        }

        try {
          const extracted = await extractMenuFromImages({
            images,
            restaurantId: queuedExtraction.restaurantId,
            currencyDefault: queuedExtraction.restaurant.currency === 'USD' ? 'USD' : 'INR',
          });

          await prisma.extractionJob.update({
            where: { id: queuedExtraction.id },
            data: {
              status: 'COMPLETED',
              extractedJson: extracted as any,
              extractionConfidence: 0.95,
            },
          });
          console.log(`[Worker] ExtractionJob ${queuedExtraction.id} completed.`);
        } catch (workerErr: any) {
          console.error(`[Worker] ExtractionJob ${queuedExtraction.id} failed:`, workerErr);
          await prisma.extractionJob.update({
            where: { id: queuedExtraction.id },
            data: {
              status: 'FAILED',
              error: workerErr?.message || 'Extraction failed',
            },
          });
          if (queuedExtraction.upload) {
            await prisma.menuUpload.update({
              where: { id: queuedExtraction.upload.id },
              data: { status: 'FAILED' },
            });
          }
        }
      }

      // 2. Process queued GenerationJobs
      const queuedGen = await prisma.generationJob.findFirst({
        where: { status: 'QUEUED' },
        include: { restaurant: true, menuItem: true },
      });

      if (queuedGen && queuedGen.restaurant?.organizationId) {
        console.log(`[Worker] Processing GenerationJob ${queuedGen.id}...`);
        await prisma.generationJob.update({
          where: { id: queuedGen.id },
          data: { status: 'PROCESSING', attempts: { increment: 1 } },
        });

        const result = await generateOrReuseDishIllustration({
          restaurantId: queuedGen.restaurantId,
          organizationId: queuedGen.restaurant.organizationId,
          menuItemId: queuedGen.menuItemId ?? undefined,
          dishName: queuedGen.menuItem?.customName || 'Artisanal Dish',
          visualDescription: queuedGen.prompt,
          canonicalId: queuedGen.canonicalId ?? undefined,
        });

        await prisma.generationJob.update({
          where: { id: queuedGen.id },
          data: {
            status: 'COMPLETED',
            outputAssetId: result.asset.id,
          },
        });
        console.log(`[Worker] GenerationJob ${queuedGen.id} completed.`);
      }
    } catch (err) {
      console.error('[Worker Error]:', err);
    }

    // Sleep 4 seconds between poll cycles
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
}

runWorkerLoop().catch((e) => {
  console.error('Fatal worker crash:', e);
  process.exit(1);
});

