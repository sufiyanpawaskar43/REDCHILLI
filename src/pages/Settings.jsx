
import { useCallback, useEffect, useState } from 'react';
import { Building2, Save, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { FullPageSpinner } from '@/components/ui/Loading';

export default function Settings() {
  const toast = useToast();
  const [hotel, setHotel] = useState(null);
  const [tax, setTax] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hotelRes, taxRes] = await Promise.all([
        supabase.from('hotel_settings').select('*').limit(1).maybeSingle(),
        supabase.from('tax_settings').select('*').limit(1).maybeSingle(),
      ]);
      if (hotelRes.error) throw hotelRes.error;
      if (taxRes.error) throw taxRes.error;
      setHotel(hotelRes.data || { hotel_name: 'Red Chilli', address: '', phone: '', email: '', gst_number: '', logo_url: '' });
      setTax(taxRes.data || { cgst_rate: 0, sgst_rate: 0, igst_rate: 0, other_tax_rate: 0 });
    } catch (err) {
      console.error(err);
      toast.error('Unable to load settings.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const updateHotel = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('hotel_settings').update({
        hotel_name: hotel.hotel_name,
        address: hotel.address || null,
        phone: hotel.phone || null,
        email: hotel.email || null,
        gst_number: hotel.gst_number || null,
        logo_url: hotel.logo_url || null,
      }).eq('id', hotel.id);
      if (error) throw error;
      toast.success('Hotel settings saved.');
    } catch (err) {
      console.error(err);
      toast.error('Unable to save hotel settings.');
    } finally {
      setSaving(false);
    }
  };

  const updateTax = async () => {
    setSaving(true);
    try {
      const payload = {
        cgst_rate: Number(tax.cgst_rate) || 0,
        sgst_rate: Number(tax.sgst_rate) || 0,
        igst_rate: Number(tax.igst_rate) || 0,
        other_tax_rate: Number(tax.other_tax_rate) || 0,
      };
      const { error } = await supabase.from('tax_settings').update(payload).eq('id', tax.id);
      if (error) throw error;
      toast.success('Tax settings saved.');
    } catch (err) {
      console.error(err);
      toast.error('Unable to save tax settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FullPageSpinner label="Loading settings..." />;

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400 font-semibold">Admin</p>
        <h1 className="text-2xl font-bold mt-1">Red Chilli Settings</h1>
        <p className="text-sm text-charcoal-500 mt-1">Hotel identity and billing tax configuration.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="card p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-chilli-600/15 flex items-center justify-center"><Building2 className="w-5 h-5 text-chilli-400" /></div>
            <div><h2 className="font-bold">Hotel Details</h2><p className="text-xs text-charcoal-500">Shown on invoices and printouts.</p></div>
          </div>
          <div className="space-y-4">
            <Field label="Hotel Name" value={hotel.hotel_name} onChange={(value) => setHotel({ ...hotel, hotel_name: value })} />
            <Field label="Address" value={hotel.address || ''} onChange={(value) => setHotel({ ...hotel, address: value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone" value={hotel.phone || ''} onChange={(value) => setHotel({ ...hotel, phone: value })} />
              <Field label="Email" value={hotel.email || ''} onChange={(value) => setHotel({ ...hotel, email: value })} />
            </div>
            <Field label="GST Number" value={hotel.gst_number || ''} onChange={(value) => setHotel({ ...hotel, gst_number: value })} />
            <button className="btn-primary" disabled={saving} onClick={updateHotel}><Save className="w-4 h-4" /> Save Hotel</button>
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-gold-400" /></div>
            <div><h2 className="font-bold">Tax Settings</h2><p className="text-xs text-charcoal-500">Used by the server-side billing calculation.</p></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="CGST %" value={tax.cgst_rate} onChange={(value) => setTax({ ...tax, cgst_rate: value })} />
            <NumberField label="SGST %" value={tax.sgst_rate} onChange={(value) => setTax({ ...tax, sgst_rate: value })} />
            <NumberField label="IGST %" value={tax.igst_rate} onChange={(value) => setTax({ ...tax, igst_rate: value })} />
            <NumberField label="Other Tax %" value={tax.other_tax_rate} onChange={(value) => setTax({ ...tax, other_tax_rate: value })} />
          </div>
          <div className="mt-4 p-3 rounded-lg bg-charcoal-800/70 text-xs text-charcoal-500">
            The backend remains the final authority for tax and totals. Changing these rates affects future orders/invoices.
          </div>
          <button className="btn-gold mt-4" disabled={saving} onClick={updateTax}><Save className="w-4 h-4" /> Save Tax</button>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return <div><label className="label">{label}</label><input className="input" value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}

function NumberField({ label, value, onChange }) {
  return <div><label className="label">{label}</label><input type="number" min="0" step="0.01" className="input" value={value ?? 0} onChange={(e) => onChange(e.target.value)} /></div>;
}
