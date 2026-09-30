const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.');

const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' };
const staff = [
  { email: 'amelia@saffronember.com', name: 'Amelia Carter', propertyId: '22222222-2222-4222-8222-222222222222', role: 'manager' },
  { email: 'chef@grandpalms.com', name: 'Grand Palms Chef', propertyId: '33333333-3333-4333-8333-333333333333', role: 'kitchen' },
];
const customer = { email: 'sara@email.com', name: 'Sara Demo' };

async function adminCreateUser(email, name) {
  const response = await fetch(`${url}/auth/v1/admin/users`, { method: 'POST', headers, body: JSON.stringify({ email, password: 'demo1234', email_confirm: true, user_metadata: { full_name: name } }) });
  const body = await response.json();
  if (response.ok) return body;
  if (body.code === 'email_exists' || /already/i.test(body.msg || body.message || '')) {
    const list = await fetch(`${url}/auth/v1/admin/users?per_page=1000`, { headers });
    const data = await list.json();
    const found = (data.users || []).find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
  }
  throw new Error(`Unable to create ${email}: ${JSON.stringify(body)}`);
}

async function post(path, body) {
  const response = await fetch(`${url}/rest/v1/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Post ${path} failed: ${await response.text()}`);
}

const sara = await adminCreateUser(customer.email, customer.name);
await post('profiles', { id: sara.id, full_name: customer.name, email: customer.email });

for (const user of staff) {
  const created = await adminCreateUser(user.email, user.name);
  await post('profiles', { id: created.id, full_name: user.name, email: user.email });
  await post('property_members', { property_id: user.propertyId, user_id: created.id, role: user.role, is_active: true });
}

console.log('Demo accounts ready:');
console.log('  sara@email.com / demo1234');
console.log('  amelia@saffronember.com / demo1234');
console.log('  chef@grandpalms.com / demo1234');
