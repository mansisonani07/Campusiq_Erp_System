import supabase from './_supabase.js';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      let q = supabase.from('attendance').select('*').order('session_date', { ascending: false });
      if (req.query.student_id) q = q.eq('student_id', req.query.student_id);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') { const { data, error } = await supabase.from('attendance').insert(req.body).select().single(); if (error) throw error; return res.status(201).json(data); }
    if (req.method === 'PUT') { const { id, ...rest } = req.body; const { data, error } = await supabase.from('attendance').update(rest).eq('id', id).select().single(); if (error) throw error; return res.status(200).json(data); }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
