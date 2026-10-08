import React, { useEffect, useState } from 'react';
import { LoaderCircle, ArrowLeft, MessageSquareText } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const COUNTRY_CODES = [
  { label: 'India (+91)', value: '+91' },
  { label: 'United States (+1)', value: '+1' },
  { label: 'United Kingdom (+44)', value: '+44' },
  { label: 'United Arab Emirates (+971)', value: '+971' },
];

export default function PhoneAuthPanel({ onAuthenticated }) {
  const { sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneInput, setPhoneInput] = useState('');
  const [otp, setOtp] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone');
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = window.setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const normalizedPhone = () => {
    let digits = phoneInput.replace(/\D/g, '');
    if (countryCode === '+91' && digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
    if (digits.startsWith(countryCode.slice(1)) && digits.length > countryCode.slice(1).length + 6) digits = digits.slice(countryCode.slice(1).length);
    if (digits.length < 7 || digits.length > 15) return '';
    return `${countryCode}${digits}`;
  };

  const requestCode = async (event) => {
    event?.preventDefault();
    setMessage('');
    const number = normalizedPhone();
    if (!number) {
      setMessage('Enter a valid phone number, including its country code.');
      return;
    }
    setBusy(true);
    const result = await sendPhoneOtp(number);
    setBusy(false);
    if (!result.success) {
      setMessage(result.error);
      return;
    }
    setPhone(number);
    setOtp('');
    setStep('otp');
    setCooldown(30);
    setMessageType('success');
    setMessage('A verification code has been sent.');
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setMessage('Enter the 6-digit code sent to your phone.');
      setMessageType('error');
      return;
    }
    setBusy(true);
    setMessage('');
    const result = await verifyPhoneOtp(phone, otp);
    setBusy(false);
    if (!result.success) {
      setMessage(result.error);
      setMessageType('error');
      return;
    }
    setMessageType('success');
    setMessage('Phone verified. Opening your CineVerse account…');
    onAuthenticated();
  };

  const changePhone = () => {
    setStep('phone');
    setOtp('');
    setMessage('');
  };

  const fieldStyle = {
    width: '100%', padding: '13px 14px', backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff',
    fontSize: '0.95rem', outline: 'none', minWidth: 0,
  };

  return (
    <section aria-label="Phone sign in" style={{ animation: 'fadeIn 220ms ease-out' }}>
      {step === 'phone' ? (
        <form onSubmit={requestCode}>
          <label htmlFor="phone-number" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 500 }}>
            Phone number
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <select aria-label="Country calling code" value={countryCode} onChange={event => setCountryCode(event.target.value)} style={{ ...fieldStyle, width: 'auto', maxWidth: '46%' }}>
              {COUNTRY_CODES.map(country => <option key={country.value} value={country.value}>{country.label}</option>)}
            </select>
            <input
              id="phone-number"
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              value={phoneInput}
              onChange={event => setPhoneInput(event.target.value)}
              placeholder="98765 43210"
              aria-describedby="phone-hint"
              style={fieldStyle}
            />
          </div>
          <p id="phone-hint" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '-6px 0 18px' }}>We’ll text you a one-time verification code.</p>
          <button type="submit" disabled={busy} className="btn-primary" style={{ width: '100%', padding: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            {busy ? <><LoaderCircle size={17} className="animate-spin" /> Sending code…</> : <><MessageSquareText size={17} /> Send OTP</>}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode}>
          <button type="button" onClick={changePhone} style={{ padding: 0, background: 'none', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '18px' }}>
            <ArrowLeft size={15} /> Change phone number
          </button>
          <label htmlFor="phone-otp" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 500 }}>
            Enter the 6-digit code sent to <strong style={{ color: '#fff' }}>{phone}</strong>
          </label>
          <input
            id="phone-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={otp}
            onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            aria-label="6-digit verification code"
            style={{ ...fieldStyle, textAlign: 'center', letterSpacing: '0.6em', fontSize: '1.35rem', marginBottom: '16px' }}
          />
          <button type="submit" disabled={busy || otp.length !== 6} className="btn-primary" style={{ width: '100%', padding: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            {busy ? <><LoaderCircle size={17} className="animate-spin" /> Verifying…</> : 'Verify OTP'}
          </button>
          <div style={{ textAlign: 'center', marginTop: '18px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : <button type="button" disabled={busy} onClick={requestCode} style={{ background: 'none', color: 'var(--accent-cyan)', fontWeight: 600 }}>Resend OTP</button>}
          </div>
        </form>
      )}
      {message && <div role={messageType === 'error' ? 'alert' : 'status'} style={{ marginTop: '16px', padding: '11px 13px', borderRadius: '8px', color: messageType === 'error' ? '#fff' : '#86efac', background: messageType === 'error' ? 'rgba(229,9,20,0.1)' : 'rgba(34,197,94,0.08)', border: `1px solid ${messageType === 'error' ? 'rgba(229,9,20,0.3)' : 'rgba(34,197,94,0.25)'}`, fontSize: '0.86rem' }}>{message}</div>}
    </section>
  );
}
