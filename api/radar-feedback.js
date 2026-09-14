module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const title = String(body.title || '').trim().slice(0, 180);
    const source = String(body.source || '').trim().slice(0, 500);
    const details = String(body.details || '').trim().slice(0, 1500);
    const website = String(body.website || '').trim();
    if (website) return res.status(200).json({ ok: true });
    if (!title) return res.status(400).json({ error: 'Укажите, что добавить или проверить' });
    if (source && !/^https?:\/\//i.test(source)) return res.status(400).json({ error: 'Ссылка должна начинаться с http:// или https://' });
    const submission = {
      type: 'HORECA_RADAR_SUGGESTION',
      receivedAt: new Date().toISOString(),
      title,
      source: source || null,
      details: details || null,
      userAgent: String(req.headers['user-agent'] || '').slice(0, 250)
    };
    console.log('HORECA_RADAR_SUGGESTION ' + JSON.stringify(submission));
    return res.status(202).json({ ok: true, status: 'accepted' });
  } catch (e) {
    console.error('HORECA_RADAR_SUGGESTION_ERROR', e);
    return res.status(500).json({ error: 'Не удалось принять заявку' });
  }
};