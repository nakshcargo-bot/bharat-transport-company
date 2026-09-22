import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { customerAPI } from '../api';

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500";
const labelCls = "block text-xs font-semibold text-gray-600 mb-1";

const emptyForm = {
  customer_name: '', mobile: '', whatsapp: '', email: '',
  address: '', city: '', state: '', pincode: '',
  gst_no: '', pan_no: '', customer_type: 'credit',
  credit_limit: '', credit_days: '', opening_balance: ''
};

export default function PartyEntry() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      setFetching(true);
      customerAPI.getOne(id)
        .then(res => setForm({ ...emptyForm, ...res.data }))
        .catch(() => setError('Party load नहीं हुई'))
        .finally(() => setFetching(false));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name.trim()) { setError('Party name जरूरी है'); return; }
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await customerAPI.update(id, form);
      } else {
        await customerAPI.create(form);
      }
      navigate('/party');
    } catch (err) {
      setError(err.response?.data?.error || 'Save नहीं हुआ, दोबारा कोशिश करें');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-6 text-gray-500">Loading...</div>;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">
          {isEdit ? '✏️ Party Edit' : '➕ New Party'}
        </h1>
        <Link to="/party" className="text-sm text-blue-600 hover:underline">
          ← Party List
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-5 grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="md:col-span-2">
          <label className={labelCls}>Party Name *</label>
          <input name="customer_name" value={form.customer_name} onChange={handleChange}
            className={inputCls} placeholder="जैसे: Vedant Sales Corporation" required />
        </div>

        <div>
          <label className={labelCls}>Mobile</label>
          <input name="mobile" value={form.mobile} onChange={handleChange}
            className={inputCls} placeholder="10 digit mobile" />
        </div>
        <div>
          <label className={labelCls}>WhatsApp No</label>
          <input name="whatsapp" value={form.whatsapp} onChange={handleChange}
            className={inputCls} placeholder="खाली छोड़ें तो mobile ही लेगा" />
        </div>

        <div>
          <label className={labelCls}>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange}
            className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>City</label>
          <input name="city" value={form.city} onChange={handleChange} className={inputCls} />
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Address</label>
          <input name="address" value={form.address} onChange={handleChange} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>State</label>
          <input name="state" value={form.state} onChange={handleChange} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Pincode</label>
          <input name="pincode" value={form.pincode} onChange={handleChange} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>GST No</label>
          <input name="gst_no" value={form.gst_no} onChange={handleChange}
            className={inputCls + " uppercase"} placeholder="08CMRPP0955N1Z5" />
        </div>
        <div>
          <label className={labelCls}>PAN No</label>
          <input name="pan_no" value={form.pan_no} onChange={handleChange}
            className={inputCls + " uppercase"} />
        </div>

        <div>
          <label className={labelCls}>Party Type</label>
          <select name="customer_type" value={form.customer_type} onChange={handleChange} className={inputCls}>
            <option value="credit">Credit</option>
            <option value="cash">Cash</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Credit Days</label>
          <input name="credit_days" type="number" value={form.credit_days}
            onChange={handleChange} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Credit Limit (₹)</label>
          <input name="credit_limit" type="number" value={form.credit_limit}
            onChange={handleChange} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Opening Balance (₹)</label>
          <input name="opening_balance" type="number" value={form.opening_balance}
            onChange={handleChange} className={inputCls} />
        </div>

        <div className="md:col-span-2 flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : (isEdit ? 'Update Party' : 'Save Party')}
          </button>
          <Link to="/party"
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
