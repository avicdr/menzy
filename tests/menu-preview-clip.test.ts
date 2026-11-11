import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { MenuPreviewClip } from '@/components/marketing/MenuPreviewClip';

describe('Landing Page Menu Preview Clip', () => {
  it('ships valid MP4, WebM, and WebP poster assets under public/media with 540x960 portrait sizing', () => {
    const mediaDir = path.join(process.cwd(), 'public', 'media');
    const mp4Path = path.join(mediaDir, 'menu-preview.mp4');
    const webmPath = path.join(mediaDir, 'menu-preview.webm');
    const posterPath = path.join(mediaDir, 'menu-preview-poster.webp');

    expect(fs.existsSync(mp4Path)).toBe(true);
    expect(fs.existsSync(webmPath)).toBe(true);
    expect(fs.existsSync(posterPath)).toBe(true);

    const mp4 = fs.readFileSync(mp4Path);
    const webm = fs.readFileSync(webmPath);
    const poster = fs.readFileSync(posterPath);

    expect(mp4.byteLength).toBeGreaterThan(100_000);
    expect(webm.byteLength).toBeGreaterThan(100_000);
    expect(poster.byteLength).toBeGreaterThan(5_000);

    // WebP RIFF header check
    expect(poster.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(poster.subarray(8, 12).toString('ascii')).toBe('WEBP');

    // EBML Matroska/WebM magic header check
    expect(webm.subarray(0, 4).toString('hex')).toBe('1a45dfa3');

    // MP4 ftyp + dimensions (540x960)
    expect(mp4.includes('ftyp')).toBe(true);
    const tkhdIdx = mp4.indexOf('tkhd');
    expect(tkhdIdx).toBeGreaterThan(-1);
    const tkhdVersion = mp4[tkhdIdx + 4];
    const widthOffset = tkhdIdx + 4 + (tkhdVersion === 1 ? 88 : 76);
    expect(mp4.readUInt32BE(widthOffset) >> 16).toBe(540);
    expect(mp4.readUInt32BE(widthOffset + 4) >> 16).toBe(960);
  });

  it('renders accessible, lazy-deferred video markup with pause/replay controls and synced chapters', () => {
    const html = renderToStaticMarkup(React.createElement(MenuPreviewClip));

    expect(html).toContain('loading="lazy"');
    expect(html).toContain('preload="none"');
    expect(html).toContain('width="540"');
    expect(html).toContain('height="960"');
    expect(html).toContain('poster="/media/menu-preview-poster.webp"');
    expect(html).toContain('<source src="/media/menu-preview.webm" type="video/webm"');
    expect(html).toContain('<source src="/media/menu-preview.mp4" type="video/mp4"');
    expect(html).toContain('<figure');
    expect(html).toContain('<figcaption');
    expect(html).toContain('Play menu preview clip');
    expect(html).toContain('Replay menu preview clip from start');
    expect(html).toContain('/m/chai-and-chutney');
    // Ensure Play/Pause toggle does not pair aria-pressed with changing label
    expect(html).not.toContain('aria-pressed');
  });
});

