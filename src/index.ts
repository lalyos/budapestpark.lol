import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  ADMIN_USER: string
  ADMIN_PASS: string
}

type EventRow = {
  id: number
  title: string
  event_date: string
  event_time: string | null
  price: string | null
  image: string | null
}

const app = new Hono<{ Bindings: Bindings }>()

function isAdmin(authHeader: string | undefined | null, env: Bindings) {
  if (!authHeader?.startsWith('Basic ')) return false
  const raw = authHeader.slice(6)
  const decoded = atob(raw)
  const [user, ...rest] = decoded.split(':')
  const pass = rest.join(':')
  return user === env.ADMIN_USER && pass === env.ADMIN_PASS
}

function adminGuard(c: any) {
  if (!c.env.ADMIN_USER || !c.env.ADMIN_PASS) {
    return c.json({ error: 'Server admin credentials are not configured' }, 500)
  }

  if (isAdmin(c.req.header('Authorization'), c.env)) return null

  c.header('WWW-Authenticate', 'Basic realm="Admin"')
  return c.json({ error: 'Unauthorized' }, 401)
}

app.get('/', (c) => {
  return c.html(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BP Park Events</title>
  <style>
    :root {
      --bg: #0b0b0f;
      --card: #15151d;
      --pink: #ff2478;
      --green: #a8ff3e;
      --text: #f6f6f6;
      --muted: #b9b9c2;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, Arial, sans-serif;
      background: radial-gradient(circle at top, #232334 0%, var(--bg) 45%);
      color: var(--text);
    }
    header {
      border-bottom: 1px solid #2d2d3f;
      padding: 18px 20px;
      position: sticky;
      top: 0;
      background: rgba(11,11,15,0.9);
      backdrop-filter: blur(5px);
      z-index: 2;
    }
    .brand {
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: .05em;
    }
    .brand span { color: var(--green); }
    main {
      max-width: 980px;
      margin: 20px auto;
      padding: 0 16px 40px;
    }
    .hero {
      padding: 18px;
      border: 1px solid #2f2f43;
      background: linear-gradient(120deg, #1d1d2d, #101018);
      border-radius: 12px;
      margin-bottom: 18px;
    }
    .hero h1 { margin: 0 0 8px; font-size: 1.7rem; }
    .hero p { margin: 0; color: var(--muted); }
    .admin {
      margin: 16px 0 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    input, button {
      border: 1px solid #34344a;
      background: #161621;
      color: #fff;
      padding: 8px 10px;
      border-radius: 8px;
    }
    button {
      cursor: pointer;
      background: var(--pink);
      border: none;
      font-weight: 600;
    }
    button.alt { background: #2d2d40; }
    .events {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    }
    .event {
      border: 1px solid #32324a;
      background: var(--card);
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }
    .event img { width: 100%; height: 130px; object-fit: cover; background: #262638; }
    .event .body { padding: 12px; }
    .event h3 { margin: 0 0 6px; font-size: 1rem; }
    .meta { color: var(--muted); font-size: .92rem; }
    .price { color: var(--green); margin-top: 8px; font-weight: 700; }
    .del {
      position: absolute;
      right: 8px;
      top: 8px;
      padding: 5px 8px;
      border-radius: 99px;
      font-size: .75rem;
      display: none;
    }
    .admin-on .del { display: inline-block; }
    .add-form {
      display: none;
      gap: 8px;
      margin: 0 0 16px;
      flex-wrap: wrap;
    }
    .admin-on .add-form { display: flex; }
    .empty { color: var(--muted); padding: 18px 0; }
  </style>
</head>
<body>
  <header><div class="brand">BUDAPEST <span>PARK</span> • Events v0.1</div></header>
  <main id="app">
    <section class="hero">
      <h1>2026 Season Listing</h1>
      <p>One-page event board inspired by Budapest Park style.</p>
    </section>

    <section class="admin">
      <input id="user" placeholder="admin user" />
      <input id="pass" type="password" placeholder="password" />
      <button id="login">Admin mode</button>
      <button id="logout" class="alt">Logout</button>
      <small id="adminState" class="meta">Viewer mode</small>
    </section>

    <form id="addForm" class="add-form">
      <input id="title" required placeholder="Title" />
      <input id="date" required type="date" />
      <input id="time" placeholder="19:00" />
      <input id="price" placeholder="HUF 9 999" />
      <input id="image" placeholder="Image URL (optional)" />
      <button>Add event</button>
    </form>

    <section id="events" class="events"></section>
    <div id="empty" class="empty" style="display:none">No events yet.</div>
  </main>

  <script>
    const state = {
      auth: localStorage.getItem('bp_admin_auth') || '',
      events: []
    }

    const app = document.getElementById('app')
    const eventsEl = document.getElementById('events')
    const emptyEl = document.getElementById('empty')
    const adminStateEl = document.getElementById('adminState')

    function setAdminUi() {
      const adminOn = !!state.auth
      app.classList.toggle('admin-on', adminOn)
      adminStateEl.textContent = adminOn ? 'Admin mode ON' : 'Viewer mode'
    }

    async function loadEvents() {
      const res = await fetch('/events')
      state.events = await res.json()
      renderEvents()
    }

    function renderEvents() {
      eventsEl.innerHTML = state.events.map(e =>
        '<article class="event">' +
          '<button class="del" data-id="' + e.id + '">Delete</button>' +
          '<img src="' + (e.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000') + '" alt="' + e.title + '" />' +
          '<div class="body">' +
            '<h3>' + e.title + '</h3>' +
            '<div class="meta">' + e.event_date + (e.event_time ? ' • ' + e.event_time : '') + '</div>' +
            '<div class="price">' + (e.price || 'Tickets soon') + '</div>' +
          '</div>' +
        '</article>'
      ).join('')

      emptyEl.style.display = state.events.length ? 'none' : 'block'

      document.querySelectorAll('.del').forEach(btn => {
        btn.onclick = async () => {
          if (!confirm('Delete this event?')) return
          const id = btn.getAttribute('data-id')
          await fetch('/events?id=' + id, {
            method: 'DELETE',
            headers: { Authorization: 'Basic ' + state.auth }
          })
          loadEvents()
        }
      })
    }

    document.getElementById('login').onclick = () => {
      const user = document.getElementById('user').value
      const pass = document.getElementById('pass').value
      state.auth = btoa(user + ':' + pass)
      localStorage.setItem('bp_admin_auth', state.auth)
      setAdminUi()
      alert('Admin auth saved in browser.')
    }

    document.getElementById('logout').onclick = () => {
      state.auth = ''
      localStorage.removeItem('bp_admin_auth')
      setAdminUi()
    }

    document.getElementById('addForm').onsubmit = async (e) => {
      e.preventDefault()
      const body = {
        title: document.getElementById('title').value,
        event_date: document.getElementById('date').value,
        event_time: document.getElementById('time').value,
        price: document.getElementById('price').value,
        image: document.getElementById('image').value
      }

      const res = await fetch('/events', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: 'Basic ' + state.auth
        },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        alert('Add failed. Check admin credentials.')
        return
      }

      e.target.reset()
      loadEvents()
    }

    setAdminUi()
    loadEvents()
  </script>
</body>
</html>`)
})

app.get('/events', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, title, event_date, event_time, price, image FROM events ORDER BY event_date ASC, id ASC'
  ).all<EventRow>()

  return c.json(results ?? [])
})

app.post('/events', async (c) => {
  const blocked = adminGuard(c)
  if (blocked) return blocked

  const payload = await c.req.json<Partial<EventRow>>()

  if (!payload.title || !payload.event_date) {
    return c.json({ error: 'title and event_date are required' }, 400)
  }

  const insert = await c.env.DB.prepare(
    'INSERT INTO events (title, event_date, event_time, price, image) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(
      payload.title,
      payload.event_date,
      payload.event_time ?? null,
      payload.price ?? null,
      payload.image ?? null
    )
    .run()

  return c.json({ ok: true, id: insert.meta.last_row_id })
})

app.delete('/events', async (c) => {
  const blocked = adminGuard(c)
  if (blocked) return blocked

  const id = Number(c.req.query('id'))
  if (!id) return c.json({ error: 'id query param required' }, 400)

  await c.env.DB.prepare('DELETE FROM events WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

export default app
