async function test() {
  const res = await fetch('http://127.0.0.1:3003/api/v1/projects/6daad3d0-26bd-4275-bb9f-ab36538d551e/characters/d15791b2-b0fe-4471-a153-5de1f380d29f/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
