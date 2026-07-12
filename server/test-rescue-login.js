fetch('https://api.classgrid.in/api/rescue/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'nikhil.shinde@classgrid.in', password: 'Nikhil@5049' })
}).then(r => r.json()).then(console.log).catch(console.error);
