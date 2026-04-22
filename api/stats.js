import supabase from './_supabase.js';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const [students, faculty, courses, fees, notifications, admissions] = await Promise.all([
      supabase.from('students').select('id, semester, status', { count: 'exact' }),
      supabase.from('faculty').select('id', { count: 'exact' }),
      supabase.from('courses').select('id', { count: 'exact' }),
      supabase.from('fees').select('amount, status'),
      supabase.from('notifications').select('id', { count: 'exact' }),
      supabase.from('admissions').select('status'),
    ]);
    const feesPaid = (fees.data || []).filter(f => f.status === 'paid').reduce((a, b) => a + Number(b.amount || 0), 0);
    const feesDue = (fees.data || []).filter(f => f.status !== 'paid').reduce((a, b) => a + Number(b.amount || 0), 0);
    const admissionsPending = (admissions.data || []).filter(a => a.status === 'pending').length;
    res.status(200).json({
      students: students.count || 0,
      faculty: faculty.count || 0,
      courses: courses.count || 0,
      notifications: notifications.count || 0,
      feesPaid, feesDue, admissionsPending,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
