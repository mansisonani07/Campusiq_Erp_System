import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      let q = supabase.from('profile_requests').select('*').order('submitted_at', { ascending: false });
      if (req.query.user_email) q = q.eq('user_email', req.query.user_email);
      if (req.query.status) q = q.eq('status', req.query.status);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const payload = {
        user_email: req.body.user_email,
        user_name: req.body.user_name,
        role: req.body.role,
        changes: req.body.changes, // jsonb: { field: { from, to } }
        note: req.body.note || null,
        status: 'pending',
      };
      const { data, error } = await supabase.from('profile_requests').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...rest } = req.body;
      // Admin review decision
      if (rest.status === 'approved' || rest.status === 'rejected') {
        rest.reviewed_at = new Date().toISOString();
      }
      const { data, error } = await supabase.from('profile_requests').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      const { error } = await supabase.from('profile_requests').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('profile_requests error:', e);
    res.status(500).json({ error: e.message });
  }
}
