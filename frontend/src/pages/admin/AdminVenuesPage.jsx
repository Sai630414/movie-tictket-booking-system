import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, Building, Monitor, CheckCircle } from 'lucide-react';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import AdminLayout from './AdminLayout.jsx';

const EMPTY_VENUE_FORM = {
  name: '', type: 'CINEMA', address: '', city: 'Mumbai', state: 'Maharashtra',
  description: '', amenities: 'Dolby Atmos, Recliner Seats, 4K Projection',
  totalCapacity: 150, status: 'ACTIVE'
};

const EMPTY_SCREEN_FORM = {
  venueId: '', venueName: '', name: 'Screen 1', rows: 8, columns: 12
};

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showScreenModal, setShowScreenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_VENUE_FORM);
  const [screenForm, setScreenForm] = useState(EMPTY_SCREEN_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (typeFilter) query.set('type', typeFilter);
      const res = await api.get(`/venues?${query.toString()}`);
      if (res.data?.success) setVenues(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [typeFilter]);

  const openCreate = () => {
    setForm(EMPTY_VENUE_FORM);
    setEditingId(null);
    setShowModal(true);
    setError('');
  };

  const openEdit = (venue) => {
    setForm({
      name: venue.name || '',
      type: venue.type || 'CINEMA',
      address: venue.address || '',
      city: venue.city || 'Mumbai',
      state: venue.state || 'Maharashtra',
      description: venue.description || '',
      amenities: Array.isArray(venue.amenities) ? venue.amenities.join(', ') : (venue.amenities || ''),
      totalCapacity: venue.totalCapacity || 100,
      status: venue.status || 'ACTIVE',
    });
    setEditingId(venue._id);
    setShowModal(true);
    setError('');
  };

  const openAddScreen = (venue) => {
    setScreenForm({
      venueId: venue._id,
      venueName: venue.name,
      name: `Screen ${(venues.length % 5) + 1}`,
      rows: 8,
      columns: 12,
    });
    setShowScreenModal(true);
    setError('');
  };

  const handleSaveVenue = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        amenities: form.amenities.split(',').map(s => s.trim()).filter(Boolean),
        totalCapacity: Number(form.totalCapacity),
      };

      if (editingId) {
        await api.patch(`/venues/${editingId}`, payload);
      } else {
        await api.post('/venues', payload);
      }
      setShowModal(false);
      fetchVenues();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScreen = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post(`/venues/${screenForm.venueId}/screens`, {
        name: screenForm.name,
        rows: Number(screenForm.rows),
        columns: Number(screenForm.columns),
      });
      setShowScreenModal(false);
      setSuccessMsg(`Screen added successfully to ${screenForm.venueName}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add screen');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this venue?')) return;
    try {
      await api.delete(`/venues/${id}`);
      fetchVenues();
    } catch (err) {
      alert('Failed to deactivate venue.');
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
            <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>Venues & Theatres Management</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Manage movie cinemas, auditoriums, and open-air event arenas</p>
          </div>
          <button onClick={openCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add Venue
          </button>
        </div>

        {successMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', color: '#22c55e', marginBottom: '20px' }}>
            <CheckCircle size={18} /> {successMsg}
          </div>
        )}

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Search venues by name or address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchVenues()}
              style={{ ...inputStyle, marginBottom: 0, paddingLeft: '42px' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[['', 'All'], ['CINEMA', 'Cinemas'], ['EVENT_VENUE', 'Event Arenas']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTypeFilter(val)}
                style={{
                  padding: '10px 16px', borderRadius: '6px', border: '1px solid',
                  borderColor: typeFilter === val ? 'var(--accent-red)' : 'var(--border-color)',
                  backgroundColor: typeFilter === val ? 'var(--accent-red)' : 'var(--bg-card)',
                  color: '#fff', fontSize: '0.85rem', cursor: 'pointer', fontWeight: typeFilter === val ? '700' : '400'
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button onClick={fetchVenues} className="btn-outline" style={{ padding: '10px 20px' }}>Search</button>
        </div>

        {loading ? <LoadingSpinner message="Loading venues..." /> : (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  {['Venue Name', 'Type', 'Address & City', 'Amenities', 'Capacity', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {venues.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No venues found</td></tr>
                ) : venues.map(venue => (
                  <tr key={venue._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.92rem' }}>{venue.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>{venue.state}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700',
                        backgroundColor: venue.type === 'CINEMA' ? 'rgba(229,9,20,0.15)' : 'rgba(0,229,255,0.15)',
                        color: venue.type === 'CINEMA' ? 'var(--accent-red)' : 'var(--accent-cyan)'
                      }}>
                        {venue.type === 'CINEMA' ? '🎬 Cinema' : '🎪 Event Arena'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <div>{venue.address}</div>
                      <div style={{ color: '#fff', fontWeight: '500', fontSize: '0.8rem' }}>{venue.city}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                        {venue.amenities?.slice(0, 3).map(a => (
                          <span key={a} style={{ padding: '2px 6px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {a}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#fff', fontWeight: '700', fontSize: '0.88rem' }}>
                      {venue.totalCapacity}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700',
                        backgroundColor: venue.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: venue.status === 'ACTIVE' ? '#22c55e' : '#ef4444'
                      }}>{venue.status}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {venue.type === 'CINEMA' && (
                          <button
                            onClick={() => openAddScreen(venue)}
                            title="Add screen to cinema"
                            style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '600' }}
                          >
                            <Monitor size={13} /> + Screen
                          </button>
                        )}
                        <button onClick={() => openEdit(venue)} style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', cursor: 'pointer' }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(venue._id)} style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer' }}>
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

      {/* Modal: Add/Edit Venue */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.3rem' }}>{editingId ? 'Edit Venue' : 'Add New Venue'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Venue Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="e.g. CineVerse IMAX Palladium" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Venue Type *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                  <option value="CINEMA">CINEMA</option>
                  <option value="EVENT_VENUE">EVENT_VENUE</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Address *</label>
              <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={inputStyle} placeholder="Mall Name, Street, Area" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>City *</label>
                <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle} placeholder="Mumbai" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>State</label>
                <input type="text" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} style={inputStyle} placeholder="Maharashtra" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Capacity</label>
                <input type="number" value={form.totalCapacity} onChange={e => setForm(f => ({ ...f, totalCapacity: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Amenities (comma separated)</label>
              <input type="text" value={form.amenities} onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))} style={inputStyle} placeholder="Dolby Atmos, Recliner Seats, Food Court, Parking" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Venue overview and luxury highlights" />
            </div>

            {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button onClick={handleSaveVenue} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '12px' }}>
                {saving ? 'Saving...' : editingId ? 'Update Venue' : 'Create Venue'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-outline" style={{ flex: 1, padding: '12px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Screen to Cinema */}
      {showScreenModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ color: '#fff', fontSize: '1.25rem' }}>Add Screen / Audi</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px' }}>To: {screenForm.venueName}</p>
              </div>
              <button onClick={() => setShowScreenModal(false)} style={{ background: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Screen Name *</label>
              <input type="text" value={screenForm.name} onChange={e => setScreenForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="e.g. Screen 1 (IMAX Laser)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Rows (A to H...)</label>
                <input type="number" min="2" max="15" value={screenForm.rows} onChange={e => setScreenForm(f => ({ ...f, rows: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Columns per Row</label>
                <input type="number" min="4" max="25" value={screenForm.columns} onChange={e => setScreenForm(f => ({ ...f, columns: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Calculated Total Capacity</div>
              <div style={{ color: '#fff', fontSize: '1.3rem', fontWeight: '800', marginTop: '2px' }}>
                {Number(screenForm.rows) * Number(screenForm.columns)} Seats
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '4px' }}>
                Layout with Regular, VIP, and Recliner tiers will be generated automatically.
              </p>
            </div>

            {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleSaveScreen} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '12px' }}>
                {saving ? 'Creating Screen...' : 'Add Screen'}
              </button>
              <button onClick={() => setShowScreenModal(false)} className="btn-outline" style={{ flex: 1, padding: '12px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
