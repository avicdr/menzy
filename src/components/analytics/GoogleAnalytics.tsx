'use client';

import React from 'react';
import Script from 'next/script';

export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();

  if (!measurementId && !gtmId) {
    return null;
  }

  return (
    <>
      {gtmId && (
        <Script id="menzy-gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId.replace(/[^A-Za-z0-9_-]/g, '')}');`}
        </Script>
      )}
      {measurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
            strategy="afterInteractive"
          />
          <Script id="menzy-ga4" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId.replace(/[^A-Za-z0-9_-]/g, '')}', { anonymize_ip: true });`}
          </Script>
        </>
      )}
    </>
  );
}

