import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, Calendar, MapPin, Tag, PlusCircle, MinusCircle } from 'lucide-react';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import AdminLayout from './AdminLayout.jsx';

const EMPTY_EVENT_FORM = {
  name: '', description: '', poster: '', banner: '',
  category: 'Concert', date: '', startTime: '07:00 PM', endTime: '10:00 PM',
  venue: '', location: '', city: 'Mumbai', organizer: '',
  status: 'ACTIVE',
  ticketCategories: [
    { name: 'General Admission', price: 499, totalQuantity: 200, availableQuantity: 200 },
    { name: 'VIP Pass', price: 1499, totalQuantity: 50, availableQuantity: 50 }
  ]
};

const CATEGORIES = ['Concert', 'Comedy', 'Sports', 'Theatre', 'Festival', 'Workshop', 'Exhibition', 'Conference', 'Other'];

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_EVENT_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/events?limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`);
      if (res.data?.success) setEvents(res.data.data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    try {
      const res = await api.get('/venues');
      if (res.data?.success) setVenues(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchVenues();
  }, []);

  const openCreate = () => {
    setForm({
      ...EMPTY_EVENT_FORM,
      venue: venues[0]?._id || '',
    });
    setEditingId(null);
    setShowModal(true);
    setError('');
  };

  const openEdit = (event) => {
    setForm({
      name: event.name || '',
      description: event.description || '',
      poster: event.poster || '',
      banner: event.banner || '',
      category: event.category || 'Concert',
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      venue: event.venue?._id || event.venue || '',
      location: event.location || '',
      city: event.city || 'Mumbai',
      organizer: event.organizer || '',
      status: event.status || 'ACTIVE',
      ticketCategories: event.ticketCategories?.length > 0 ? event.ticketCategories : EMPTY_EVENT_FORM.ticketCategories,
    });
    setEditingId(event._id);
    setShowModal(true);
    setError('');
  };

  const handleTicketCatChange = (index, field, value) => {
    const updated = [...form.ticketCategories];
    updated[index][field] = field === 'name' ? value : Number(value);
    if (field === 'totalQuantity') {
      updated[index].availableQuantity = Number(value);
    }
    setForm(f => ({ ...f, ticketCategories: updated }));
  };

  const addTicketCat = () => {
    setForm(f => ({
      ...f,
      ticketCategories: [
        ...f.ticketCategories,
        { name: 'Standard', price: 999, totalQuantity: 100, availableQuantity: 100 }
      ]
    }));
  };

  const removeTicketCat = (index) => {
    if (form.ticketCategories.length <= 1) return;
    setForm(f => ({
      ...f,
      ticketCategories: f.ticketCategories.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        date: new Date(form.date),
      };

      if (editingId) {
        await api.patch(`/events/${editingId}`, payload);
      } else {
        await api.post('/events', payload);
      }
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this event?')) return;
    try {
      await api.delete(`/events/${id}`);
      fetchEvents();
    } catch (err) {
      alert('Failed to deactivate event.');
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff',
    fontSize: '0.88rem', outline: 'none', marginBottom: '12px'
  };

  return (
    <AdminLayout>
      <div style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>Events Management</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Create and monitor live shows, concerts, and comedy events</p>
          </div>
          <button onClick={openCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add Event
          </button>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Search events by name, organizer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchEvents()}
              style={{ ...inputStyle, marginBottom: 0, paddingLeft: '42px' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button onClick={fetchEvents} className="btn-outline" style={{ padding: '10px 20px' }}>Search</button>
        </div>

        {loading ? <LoadingSpinner message="Loading events..." /> : (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  {['Poster', 'Event Name', 'Category', 'Date & Time', 'Venue / City', 'Tickets', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No events found</td></tr>
                ) : events.map(evt => (
                  <tr key={evt._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <img src={evt.poster} alt={evt.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>{evt.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{evt.organizer}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
                        {evt.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <div>{new Date(evt.date).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.startTime}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <div>{evt.venue?.name || evt.location}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.city}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: '700' }}>
                        ₹{evt.ticketCategories?.[0]?.price || 0} - ₹{evt.ticketCategories?.[evt.ticketCategories?.length - 1]?.price || 0}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {evt.ticketCategories?.length || 0} tiers
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700',
                        backgroundColor: evt.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: evt.status === 'ACTIVE' ? '#22c55e' : '#ef4444'
                      }}>{evt.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEdit(evt)} style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', cursor: 'pointer' }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(evt._id)} style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.3rem' }}>{editingId ? 'Edit Event' : 'Add New Event'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Event Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="Concert or Event Name" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Poster Image URL *</label>
                <input type="text" value={form.poster} onChange={e => setForm(f => ({ ...f, poster: e.target.value }))} style={inputStyle} placeholder="https://..." />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Banner Image URL *</label>
                <input type="text" value={form.banner} onChange={e => setForm(f => ({ ...f, banner: e.target.value }))} style={inputStyle} placeholder="https://..." />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Description *</label>
              <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Full event information..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Event Date *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Start Time *</label>
                <input type="text" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={inputStyle} placeholder="07:00 PM" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>End Time</label>
                <input type="text" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={inputStyle} placeholder="10:00 PM" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Venue *</label>
                <select value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} style={inputStyle}>
                  {venues.map(v => <option key={v._id} value={v._id}>{v.name} ({v.city})</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>City *</label>
                <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle} placeholder="Mumbai" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Organizer</label>
                <input type="text" value={form.organizer} onChange={e => setForm(f => ({ ...f, organizer: e.target.value }))} style={inputStyle} placeholder="Organizer Name" />
              </div>
            </div>

            {/* Ticket Categories */}
            <div style={{ marginTop: '16px', marginBottom: '20px', padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ color: '#fff', fontSize: '0.95rem' }}>Ticket Pricing Categories</h4>
                <button type="button" onClick={addTicketCat} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', color: 'var(--accent-red)', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
                  <PlusCircle size={16} /> Add Tier
                </button>
              </div>

              {form.ticketCategories.map((cat, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Category Name (e.g. VIP)"
                    value={cat.name}
                    onChange={e => handleTicketCatChange(idx, 'name', e.target.value)}
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={cat.price}
                    onChange={e => handleTicketCatChange(idx, 'price', e.target.value)}
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={cat.totalQuantity}
                    onChange={e => handleTicketCatChange(idx, 'totalQuantity', e.target.value)}
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeTicketCat(idx)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  >
                    <MinusCircle size={18} />
                  </button>
                </div>
              ))}
            </div>

            {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '12px' }}>
                {saving ? 'Saving...' : editingId ? 'Update Event' : 'Create Event'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-outline" style={{ flex: 1, padding: '12px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
