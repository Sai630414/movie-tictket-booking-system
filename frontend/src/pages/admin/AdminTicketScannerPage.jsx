import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../services/api.js';
import AdminLayout from './AdminLayout.jsx';

const SCANNER_ID = 'cineverse-ticket-qr-reader';

function TicketResult({ result }) {
  if (!result) return null;
  const checkedIn = result.status === 'CHECKED_IN';
  const alreadyUsed = result.status === 'ALREADY_USED';
  const cancelled = result.status === 'CANCELLED';
  const paymentPending = result.status === 'PAYMENT_NOT_CONFIRMED';
  const failed = result.status === 'ERROR';
  const color = checkedIn ? '#22c55e' : alreadyUsed ? '#f59e0b' : '#ef4444';
  const Icon = checkedIn ? CheckCircle : alreadyUsed ? AlertTriangle : XCircle;
  const ticket = result.booking;

  return (
    <section aria-live="polite" style={{ marginTop: 22, padding: 20, borderRadius: 12, border: `1px solid ${color}55`, background: `${color}12` }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '0 0 16px', color, fontSize: '1.15rem' }}>
        <Icon size={22} />
        {checkedIn ? (ticket?.bookingType === 'EVENT' ? 'EVENT TICKET VERIFIED' : 'TICKET VERIFIED') : alreadyUsed ? 'TICKET ALREADY USED' : cancelled ? 'CANCELLED TICKET' : paymentPending ? 'PAYMENT NOT CONFIRMED' : failed ? 'VERIFICATION FAILED' : 'INVALID TICKET'}
      </h2>
      {alreadyUsed && ticket?.checkedInAt && <p style={{ color: 'var(--text-secondary)', margin: '0 0 12px' }}>Checked in at: {new Date(ticket.checkedInAt).toLocaleString()}</p>}
      {ticket && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, color: 'var(--text-secondary)', fontSize: '.9rem' }}>
          <div><strong style={{ color: '#fff' }}>{ticket.bookingType === 'EVENT' ? 'Event' : 'Movie'}:</strong> {ticket.title}</div>
          <div><strong style={{ color: '#fff' }}>Venue:</strong> {ticket.venue || '—'}</div>
          {ticket.bookingType === 'EVENT' ? <>
            <div><strong style={{ color: '#fff' }}>Date:</strong> {ticket.eventDate ? new Date(ticket.eventDate).toLocaleDateString() : '—'} {ticket.eventTime}</div>
            <div><strong style={{ color: '#fff' }}>Tickets:</strong> {ticket.ticketItems?.map((item) => `${item.categoryName} × ${item.quantity}`).join(', ') || '—'}</div>
          </> : <>
            <div><strong style={{ color: '#fff' }}>Show:</strong> {ticket.showTime || '—'} {ticket.showDate ? `· ${new Date(ticket.showDate).toLocaleDateString()}` : ''}</div>
            <div><strong style={{ color: '#fff' }}>Screen:</strong> {ticket.screen || '—'}</div>
            <div><strong style={{ color: '#fff' }}>Seats:</strong> {ticket.seats?.join(', ') || '—'}</div>
          </>}
          <div><strong style={{ color: '#fff' }}>Customer:</strong> {ticket.customer || '—'}</div>
          {checkedIn && <div><strong style={{ color: '#fff' }}>Status:</strong> CHECKED IN</div>}
        </div>
      )}
      {result.message && <p style={{ color: 'var(--text-secondary)', margin: '10px 0 0' }}>{result.message}</p>}
    </section>
  );
}

export default function AdminTicketScannerPage() {
  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [starting, setStarting] = useState(true);

  const startScanner = useCallback(async () => {
    setResult(null);
    setCameraError('');
    processingRef.current = false;
    setStarting(true);
    try {
      const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        async (qrData) => {
          if (processingRef.current) return;
          processingRef.current = true;
          setStarting(false);
          await scanner.stop().catch(() => {});
          try { scanner.clear(); } catch { /* Scanner has already released the camera. */ }
          try {
            const response = await api.post('/tickets/verify', { qrData });
            setResult(response.data?.data || { status: 'INVALID', valid: false });
          } catch (error) {
            setResult({ status: 'ERROR', valid: false, message: error.response?.data?.message || 'Could not verify this ticket. Check the connection and scan again.' });
          }
        },
        () => {},
      );
      setStarting(false);
    } catch (error) {
      const scanner = scannerRef.current;
      if (scanner?.isScanning) await scanner.stop().catch(() => {});
      try { scanner?.clear(); } catch { /* Ignore cleanup errors after camera startup failure. */ }
      scannerRef.current = null;
      setCameraError(error?.message || 'Camera access is unavailable. Allow camera access and use a secure HTTPS connection.');
      setStarting(false);
    }
  }, []);

  useEffect(() => {
    startScanner();
    return () => {
      const scanner = scannerRef.current;
      if (scanner?.isScanning) scanner.stop().then(() => { try { scanner.clear(); } catch { /* Component is unmounting. */ } }).catch(() => {});
      else { try { scanner?.clear(); } catch { /* Component is unmounting. */ } }
    };
  }, [startScanner]);

  return (
    <AdminLayout compact>
      <div style={{ width: 'min(100% - 28px, 760px)', margin: '0 auto', padding: '30px 0 48px' }}>
        <header style={{ marginBottom: 22 }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontSize: '1.7rem', margin: 0 }}><Camera color="var(--accent-red)" /> Ticket Scanner</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Scan a customer’s movie or event ticket QR code.</p>
        </header>
        <div style={{ padding: 12, overflow: 'hidden', borderRadius: 14, border: '1px solid var(--border-color)', background: '#050505' }}>
          <div id={SCANNER_ID} style={{ width: '100%', minHeight: 260 }} />
        </div>
        {starting && !cameraError && <p role="status" style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: 14 }}>Starting camera… allow camera access when prompted.</p>}
        {cameraError && <p role="alert" style={{ color: '#fca5a5', textAlign: 'center', marginTop: 14 }}>{cameraError}</p>}
        {!result && !cameraError && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: 14 }}>Point the camera at the ticket QR code.</p>}
        <TicketResult result={result} />
        {(result || cameraError) && (
          <button type="button" onClick={startScanner} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, margin: '20px auto 0', padding: '10px 18px' }}>
            <RefreshCw size={17} /> {cameraError ? 'Try Camera Again' : 'Scan Another Ticket'}
          </button>
        )}
      </div>
    </AdminLayout>
  );
}
