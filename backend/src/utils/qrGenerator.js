import QRCode from 'qrcode';

export const generateQRCode = async (textData) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(textData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    });
    return qrDataUrl;
  } catch (err) {
    console.error('QR Code Generation Error:', err);
    throw err;
  }
};
