import type { PayloadRequest } from 'payload'
import { FUNCTIONAL_TAG_ORDER } from './tagOrder'

export const swaggerAuthUiHandler = async (req: PayloadRequest): Promise<Response> => {
  try {
    const user = req.user as {
      collection?: string
      role?: string
      email?: string
      name?: string
    } | null

    const isAuthenticated = Boolean(
      user && (user.collection === 'api-users' || user.collection === 'admin')
    )

    // 1. UNAUTHENTICATED: Render Sign-in view
    if (!isAuthenticated) {
    const loginHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CardMax API Documentation - Sign In</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      width: 100%;
      max-width: 440px;
      padding: 2.5rem 2rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .brand-icon {
      width: 36px;
      height: 36px;
      background: #3b82f6;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.25rem;
    }
    h1 {
      font-size: 1.35rem;
      font-weight: 600;
      color: #f8fafc;
    }
    p.subtitle {
      font-size: 0.875rem;
      color: #94a3b8;
      margin-bottom: 1.75rem;
      line-height: 1.4;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    label {
      display: block;
      font-size: 0.825rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: #cbd5e1;
    }
    input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      color: #f8fafc;
      font-size: 0.95rem;
      transition: border-color 0.2s;
    }
    input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 1px #3b82f6;
    }
    button {
      width: 100%;
      padding: 0.85rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 0.5rem;
      transition: background 0.2s;
    }
    button:hover { background: #1d4ed8; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .alert {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 1.25rem;
      display: none;
    }
    .alert.error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid #ef4444;
      color: #fca5a5;
    }
    .hint {
      margin-top: 1.5rem;
      font-size: 0.775rem;
      color: #64748b;
      text-align: center;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">
      <div class="brand-icon">⚡</div>
      <h1>CardMax API Portal</h1>
    </div>
    <p class="subtitle">Enter your API User credentials to access personalized API documentation and live endpoints.</p>
    
    <div id="alertBox" class="alert error"></div>

    <form id="loginForm">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" required autocomplete="username" placeholder="dev1@cardmax.com">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" required autocomplete="current-password" placeholder="••••••••">
      </div>
      <button type="submit" id="submitBtn">Sign In to Swagger</button>
    </form>

    <div class="hint">
      Authorized API Developers and Administrators only. Role-based visibility will be automatically applied.
    </div>
  </div>

  <script>
    const form = document.getElementById('loginForm');
    const alertBox = document.getElementById('alertBox');
    const submitBtn = document.getElementById('submitBtn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerText = 'Verifying credentials...';

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      try {
        // Attempt 1: Authenticate as API User
        let res = await fetch('/api/api-users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        // Attempt 2: If failed, try Admin collection
        if (!res.ok) {
          res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
        }

        if (res.ok) {
          submitBtn.innerText = 'Authenticated! Loading Swagger...';
          window.location.reload();
        } else {
          const errData = await res.json().catch(() => ({}));
          alertBox.innerText = errData.errors?.[0]?.message || 'Invalid email or password. Please check your credentials.';
          alertBox.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.innerText = 'Sign In to Swagger';
        }
      } catch (err) {
        alertBox.innerText = 'Connection error. Please try again.';
        alertBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerText = 'Sign In to Swagger';
      }
    });
  </script>
</body>
</html>`

    return new Response(loginHtml, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  // 2. AUTHENTICATED: Render Swagger UI with user badge
  const userDisplayName = user?.name || user?.email || 'User'
  let rawRole = 'developer'
  if (user?.role) {
    if (typeof user.role === 'string') {
      rawRole = user.role
    } else if (typeof user.role === 'object' && 'name' in user.role && typeof (user.role as any).name === 'string') {
      rawRole = (user.role as any).name
    }
  } else if (user?.collection === 'admin') {
    rawRole = 'admin'
  }
  const userRoleBadge = String(rawRole).toUpperCase()

  const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CardMax API Reference - ${userDisplayName}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body {
      margin: 0;
      background: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .api-header-bar {
      background: #0f172a;
      color: #f8fafc;
      padding: 0.75rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    .api-header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .api-header-left h2 {
      font-size: 1.15rem;
      font-weight: 600;
      margin: 0;
    }
    .api-header-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      font-size: 0.85rem;
    }
    .user-info {
      color: #cbd5e1;
    }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-left: 0.35rem;
    }
    .badge-admin {
      background: #8b5cf6;
      color: #ffffff;
    }
    .badge-dev {
      background: #0284c7;
      color: #ffffff;
    }
    .btn-logout {
      background: #334155;
      color: #f8fafc;
      border: 1px solid #475569;
      border-radius: 6px;
      padding: 0.4rem 0.85rem;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-logout:hover {
      background: #dc2626;
      border-color: #dc2626;
    }
    .swagger-ui .topbar { display: none !important; }
  </style>
</head>
<body>
  <div class="api-header-bar">
    <div class="api-header-left">
      <h2>⚡ CardMax API Documentation</h2>
    </div>
    <div class="api-header-right">
      <div class="user-info">
        Signed in as: <strong>${userDisplayName}</strong>
        <span class="badge ${userRoleBadge === 'ADMIN' ? 'badge-admin' : 'badge-dev'}">${userRoleBadge}</span>
      </div>
      <button class="btn-logout" id="logoutBtn">Sign Out</button>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      try {
        await fetch('/api/api-users/logout', { method: 'POST' });
        await fetch('/api/admin/logout', { method: 'POST' });
      } catch (e) {}
      window.location.reload();
    });

    window.onload = () => {
      const tagOrder = ${JSON.stringify(FUNCTIONAL_TAG_ORDER.map((t) => t.toLowerCase()))};
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        tagsSorter: (a, b) => {
          const idxA = tagOrder.indexOf(a.toLowerCase());
          const idxB = tagOrder.indexOf(b.toLowerCase());
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.localeCompare(b);
        },
        operationsSorter: 'alpha',
        requestInterceptor: (request) => {
          request.credentials = 'same-origin';
          return request;
        }
      });
    };
  </script>
</body>
</html>`

    return new Response(swaggerHtml, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error: any) {
    console.error('Error in swaggerAuthUiHandler:', error)
    return new Response(`Swagger UI Handler Error: ${error?.message}\n${error?.stack}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}
