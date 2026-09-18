/**
 * Integration Test Script for API Access Control and Dynamic Swagger
 * Tests:
 * 1. Authentication for Admin, Dev1, and Dev2
 * 2. Payload Collection Runtime Access Control (GET, POST, DELETE)
 * 3. Dynamic OpenAPI Spec Generation per User
 * 4. Swagger UI HTML rendering
 */

const BASE_URL = 'http://localhost:3000'

async function postJson(endpoint: string, data: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
  })
  const text = await res.text()
  try {
    return { status: res.status, data: JSON.parse(text), headers: res.headers }
  } catch {
    return { status: res.status, data: text, headers: res.headers }
  }
}

async function getJson(endpoint: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...headers },
  })
  const text = await res.text()
  try {
    return { status: res.status, data: JSON.parse(text), headers: res.headers }
  } catch {
    return { status: res.status, data: text, headers: res.headers }
  }
}

async function deleteJson(endpoint: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...headers },
  })
  const text = await res.text()
  try {
    return { status: res.status, data: JSON.parse(text), headers: res.headers }
  } catch {
    return { status: res.status, data: text, headers: res.headers }
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`)
    throw new Error(message)
  }
  console.log(`✅ PASS: ${message}`)
}

async function run() {
  console.log('\n=== STEP 1: AUTHENTICATION TESTS ===\n')

  // 1. Unauthenticated OpenAPI spec
  const unauthSpec = await getJson('/api/openapi.json')
  assert(unauthSpec.status === 401, 'Unauthenticated GET /api/openapi.json returns 401')

  // 2. Login as API Admin
  const adminLogin = await postJson('/api/api-users/login', {
    email: 'api-admin@cardmax.com',
    password: 'Admin@123456',
  })
  assert(adminLogin.status === 200, 'API Admin login successful (200)')
  const adminToken = adminLogin.data.token
  assert(Boolean(adminToken), 'Admin token received')

  // 3. Login as Dev1
  const dev1Login = await postJson('/api/api-users/login', {
    email: 'dev1@cardmax.com',
    password: 'Dev1@123456',
  })
  assert(dev1Login.status === 200, 'Dev1 login successful (200)')
  const dev1Token = dev1Login.data.token
  assert(Boolean(dev1Token), 'Dev1 token received')

  // 4. Login as Dev2
  const dev2Login = await postJson('/api/api-users/login', {
    email: 'dev2@cardmax.com',
    password: 'Dev2@123456',
  })
  assert(dev2Login.status === 200, 'Dev2 login successful (200)')
  const dev2Token = dev2Login.data.token
  assert(Boolean(dev2Token), 'Dev2 token received')

  console.log('\n=== STEP 2: RUNTIME ACCESS CONTROL TESTS (SECURITY LAYER) ===\n')

  const dev1Auth = { Authorization: `Bearer ${dev1Token}` }
  const dev2Auth = { Authorization: `Bearer ${dev2Token}` }
  const adminAuth = { Authorization: `Bearer ${adminToken}` }

  // Test Dev1 permissions:
  // Dev1 has: banks (read), cards (read, create), category-master (read)

  // Dev1 -> banks:read (ALLOWED)
  const dev1BanksGet = await getJson('/api/banks', dev1Auth)
  assert(dev1BanksGet.status === 200, 'Dev1: GET /api/banks is ALLOWED (200)')

  // Dev1 -> banks:create (DENIED)
  const dev1BanksPost = await postJson(
    '/api/banks',
    { name: 'Unauthorized Bank', code: 'UNAUTH1' },
    dev1Auth
  )
  assert(dev1BanksPost.status === 403, 'Dev1: POST /api/banks is DENIED (403)')

  // Dev1 -> banks:delete (DENIED)
  const dev1BanksDel = await deleteJson('/api/banks/invalid-id', dev1Auth)
  assert(dev1BanksDel.status === 403, 'Dev1: DELETE /api/banks/:id is DENIED (403)')

  // Dev1 -> merchant-master:read (DENIED - Dev1 has NO merchant-master permission!)
  const dev1MerchantGet = await getJson('/api/merchant-master', dev1Auth)
  assert(dev1MerchantGet.status === 403, 'Dev1: GET /api/merchant-master is DENIED (403)')

  // Test Dev2 permissions:
  // Dev2 has: banks (read), merchant-master (read, create), subscription-plans (read)

  // Dev2 -> banks:read (ALLOWED)
  const dev2BanksGet = await getJson('/api/banks', dev2Auth)
  assert(dev2BanksGet.status === 200, 'Dev2: GET /api/banks is ALLOWED (200)')

  // Dev2 -> merchant-master:read (ALLOWED)
  const dev2MerchantGet = await getJson('/api/merchant-master', dev2Auth)
  assert(dev2MerchantGet.status === 200, 'Dev2: GET /api/merchant-master is ALLOWED (200)')

  // Dev2 -> category-master:read (DENIED - Dev2 has NO category-master permission!)
  const dev2CategoryGet = await getJson('/api/category-master', dev2Auth)
  assert(dev2CategoryGet.status === 403, 'Dev2: GET /api/category-master is DENIED (403)')

  // Dev2 -> banks:create (DENIED)
  const dev2BanksPost = await postJson(
    '/api/banks',
    { name: 'Unauthorized Bank', code: 'UNAUTH2' },
    dev2Auth
  )
  assert(dev2BanksPost.status === 403, 'Dev2: POST /api/banks is DENIED (403)')

  // Admin -> Has full access to everything
  const adminBanksGet = await getJson('/api/banks', adminAuth)
  assert(adminBanksGet.status === 200, 'Admin: GET /api/banks is ALLOWED (200)')

  const adminMerchantGet = await getJson('/api/merchant-master', adminAuth)
  assert(adminMerchantGet.status === 200, 'Admin: GET /api/merchant-master is ALLOWED (200)')

  const adminCategoryGet = await getJson('/api/category-master', adminAuth)
  assert(adminCategoryGet.status === 200, 'Admin: GET /api/category-master is ALLOWED (200)')

  console.log('\n=== STEP 3: DYNAMIC USER-SPECIFIC SWAGGER / OPENAPI SPEC TESTS ===\n')

  // 1. Dev1 OpenAPI Spec
  const dev1SpecRes = await getJson('/api/openapi.json', dev1Auth)
  assert(dev1SpecRes.status === 200, 'Dev1: GET /api/openapi.json is 200')
  const dev1Spec = dev1SpecRes.data

  // Check Dev1 banks endpoints:
  // Must have GET /api/banks
  assert(Boolean(dev1Spec.paths['/api/banks']?.get), 'Dev1 Spec contains GET /api/banks')
  // Must NOT have POST /api/banks
  assert(!dev1Spec.paths['/api/banks']?.post, 'Dev1 Spec DOES NOT contain POST /api/banks')
  // Must NOT have DELETE /api/banks/{id}
  assert(!dev1Spec.paths['/api/banks/{id}']?.delete, 'Dev1 Spec DOES NOT contain DELETE /api/banks/{id}')
  // Must NOT have merchant-master at all
  assert(!dev1Spec.paths['/api/merchant-master'], 'Dev1 Spec DOES NOT contain /api/merchant-master')
  // Must contain category-master GET
  assert(Boolean(dev1Spec.paths['/api/category-master']?.get), 'Dev1 Spec contains GET /api/category-master')

  // 2. Dev2 OpenAPI Spec
  const dev2SpecRes = await getJson('/api/openapi.json', dev2Auth)
  assert(dev2SpecRes.status === 200, 'Dev2: GET /api/openapi.json is 200')
  const dev2Spec = dev2SpecRes.data

  // Check Dev2:
  assert(Boolean(dev2Spec.paths['/api/banks']?.get), 'Dev2 Spec contains GET /api/banks')
  assert(!dev2Spec.paths['/api/banks']?.post, 'Dev2 Spec DOES NOT contain POST /api/banks')
  // Must contain merchant-master GET & POST
  assert(Boolean(dev2Spec.paths['/api/merchant-master']?.get), 'Dev2 Spec contains GET /api/merchant-master')
  assert(Boolean(dev2Spec.paths['/api/merchant-master']?.post), 'Dev2 Spec contains POST /api/merchant-master')
  // Must NOT have category-master at all
  assert(!dev2Spec.paths['/api/category-master'], 'Dev2 Spec DOES NOT contain /api/category-master')

  // 3. Admin OpenAPI Spec
  const adminSpecRes = await getJson('/api/openapi.json', adminAuth)
  assert(adminSpecRes.status === 200, 'Admin: GET /api/openapi.json is 200')
  const adminSpec = adminSpecRes.data

  // Admin has banks GET, POST, DELETE
  assert(Boolean(adminSpec.paths['/api/banks']?.get), 'Admin Spec contains GET /api/banks')
  assert(Boolean(adminSpec.paths['/api/banks']?.post), 'Admin Spec contains POST /api/banks')
  assert(Boolean(adminSpec.paths['/api/banks/{id}']?.delete), 'Admin Spec contains DELETE /api/banks/{id}')
  // Admin has both merchant-master and category-master
  assert(Boolean(adminSpec.paths['/api/merchant-master']), 'Admin Spec contains /api/merchant-master')
  assert(Boolean(adminSpec.paths['/api/category-master']), 'Admin Spec contains /api/category-master')

  console.log('\n=== STEP 4: SWAGGER UI ENDPOINT TESTS ===\n')

  // Unauthenticated GET /api/swagger -> Returns Sign In HTML
  const unauthSwagger = await fetch(`${BASE_URL}/api/swagger`)
  const unauthHtml = await unauthSwagger.text()
  assert(unauthSwagger.status === 200, 'GET /api/swagger returns 200')
  assert(unauthHtml.includes('CardMax API Portal'), 'Unauthenticated Swagger page contains Sign In portal')
  assert(unauthHtml.includes('loginForm'), 'Unauthenticated Swagger page contains login form')

  // Authenticated GET /api/swagger with Dev1 token/cookie -> Returns Swagger UI
  const dev1Cookie = dev1Login.headers.get('set-cookie') || ''
  const authSwagger = await fetch(`${BASE_URL}/api/swagger`, {
    headers: {
      Cookie: dev1Cookie,
      Authorization: `Bearer ${dev1Token}`,
    },
  })
  const authHtml = await authSwagger.text()
  assert(authSwagger.status === 200, 'Authenticated GET /api/swagger returns 200')
  assert(authHtml.includes('SwaggerUIBundle'), 'Authenticated Swagger page initializes SwaggerUIBundle')
  assert(authHtml.includes('DEVELOPER'), 'Authenticated Swagger page shows DEVELOPER badge')

  // Authenticated GET /api/swagger with API Admin token -> Returns Swagger UI with ADMIN badge
  const adminCookie = adminLogin.headers.get('set-cookie') || ''
  const adminSwagger = await fetch(`${BASE_URL}/api/swagger`, {
    headers: {
      Cookie: adminCookie,
      Authorization: `Bearer ${adminToken}`,
    },
  })
  const adminSwaggerHtml = await adminSwagger.text()
  assert(adminSwagger.status === 200, 'Admin GET /api/swagger returns 200')
  assert(adminSwaggerHtml.includes('ADMIN'), 'Admin Swagger page shows ADMIN badge')

  console.log('\n===========================================')
  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!')
  console.log('===========================================\n')
}

run().catch((err) => {
  console.error('\nTest failed with error:', err)
  process.exit(1)
})
