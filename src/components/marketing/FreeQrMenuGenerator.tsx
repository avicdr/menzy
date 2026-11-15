'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const DEFAULT_VALUE = 'https://menzy.arenova.in/qr-code-menu';

export function FreeQrMenuGenerator() {
  const [value, setValue] = useState(DEFAULT_VALUE);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setQrDataUrl('');
      setError('Enter a menu URL or text to generate a QR code.');
      return;
    }

    void QRCode.toDataURL(trimmed, { width: 720, margin: 2, errorCorrectionLevel: 'M' })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
        setError('');
      })
      .catch(() => {
        setQrDataUrl('');
        setError('That value could not be encoded. Try a shorter URL or text.');
      });
  }, [value]);

  return (
    <section className="free-tool-card" aria-label="Free QR code generator">
      <div className="free-tool-form">
        <label htmlFor="qr-value">Restaurant menu URL or text</label>
        <input id="qr-value" type="text" value={value} onChange={(event) => setValue(event.target.value)} placeholder="https://yourrestaurant.com/menu" spellCheck={false} />
        <p className="free-tool-help">The QR code is generated in your browser. Do not enter private customer or payment data.</p>
        {error && <p className="free-tool-error" role="status">{error}</p>}
      </div>
      <div className="free-tool-result">
        {qrDataUrl ? <img src={qrDataUrl} alt="Generated QR code" width={280} height={280} /> : <div className="free-tool-empty">Your QR code will appear here.</div>}
        {qrDataUrl && <a className="button button-primary" href={qrDataUrl} download="restaurant-menu-qr.png">Download PNG</a>}
      </div>
    </section>
  );
}
