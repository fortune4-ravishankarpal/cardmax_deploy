#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const isFixMode = process.argv.includes('--fix') || process.argv.includes('--sync')

console.log('\n=================================================================')
console.log(`🔍 CardMax Swagger & Permissions Inspector ${isFixMode ? '(Sync Mode)' : '(Audit Mode)'}`)
console.log('=================================================================\n')

// 1. Scan src/collections/index.ts for all configured collections
const collectionsIndexPath = path.join(rootDir, 'src', 'collections', 'index.ts')
if (!fs.existsSync(collectionsIndexPath)) {
  console.error('❌ Could not find src/collections/index.ts')
  process.exit(1)
}

const collectionsIndexContent = fs.readFileSync(collectionsIndexPath, 'utf8')
const importMatches = [...collectionsIndexContent.matchAll(/import\s+\{\s*(\w+)\s*\}\s+from\s+['"]\.\/([^'"]+)['"]/g)]

const collectionsMap = new Map() // slug -> { varName, fileRelPath, fullPath, slug, label, customEndpoints }

for (const match of importMatches) {
  const varName = match[1]
  const relPath = match[2]
  const fullPath = path.join(rootDir, 'src', 'collections', `${relPath}.ts`)
  const altPath = path.join(rootDir, 'src', 'collections', `${relPath}.tsx`)
  const targetFile = fs.existsSync(fullPath) ? fullPath : fs.existsSync(altPath) ? altPath : null

  if (!targetFile) continue

  const content = fs.readFileSync(targetFile, 'utf8')
  const slugMatch = content.match(/slug:\s*['"]([^'"]+)['"]/)
  if (!slugMatch) continue

  const slug = slugMatch[1]
  const label = slug
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')

  // Find custom endpoints in this collection
  const customEndpoints = []
  const endpointRegex = /\{\s*path:\s*['"]([^'"]+)['"],\s*method:\s*['"](\w+)['"]/g
  let epMatch
  while ((epMatch = endpointRegex.exec(content)) !== null) {
    const rawPath = epMatch[1]
    const method = epMatch[2].toUpperCase()
    // Check if endpoint defines openapi doc
    const snippet = content.slice(epMatch.index, epMatch.index + 800)
    const hasOpenApi = snippet.includes('openapi:') || snippet.includes('custom:')
    const fullApiPath = `/api/${slug}${rawPath.startsWith('/') ? '' : '/'}${rawPath}`
    const summaryMatch = snippet.match(/summary:\s*['"]([^'"]+)['"]/)
    const summary = summaryMatch ? summaryMatch[1] : `${method} ${fullApiPath}`

    customEndpoints.push({
      method,
      path: rawPath,
      fullApiPath,
      hasOpenApi,
      summary,
    })
  }

  collectionsMap.set(slug, {
    varName,
    relPath,
    fullPath: targetFile,
    slug,
    label,
    customEndpoints,
  })
}

console.log(`📦 Discovered ${collectionsMap.size} Collections in src/collections/index.ts:`)
for (const [slug, info] of collectionsMap.entries()) {
  const epCount = info.customEndpoints.length
  console.log(`  • ${info.label.padEnd(25)} (slug: ${slug.padEnd(22)}) [${epCount} custom endpoint${epCount === 1 ? '' : 's'}]`)
}
console.log('')

// 2. Audit getKeeper.ts excludeCollections
const getKeeperPath = path.join(rootDir, 'src', 'plugins', 'getKeeper.ts')
let getKeeperContent = fs.readFileSync(getKeeperPath, 'utf8')
const excludeMatch = getKeeperContent.match(/excludeCollections:\s*\[([\s\S]*?)\]/)
const excludedSlugs = new Set()
if (excludeMatch) {
  const matches = [...excludeMatch[1].matchAll(/['"]([^'"]+)['"]/g)]
  matches.forEach((m) => excludedSlugs.add(m[1]))
}

const missingFromGatekeeper = []
for (const slug of collectionsMap.keys()) {
  if (!excludedSlugs.has(slug)) {
    missingFromGatekeeper.push(slug)
  }
}

// 3. Audit APIUsers.ts permissions & allowedEndpoints
const apiUsersPath = path.join(rootDir, 'src', 'collections', 'APIUsers.ts')
let apiUsersContent = fs.readFileSync(apiUsersPath, 'utf8')

// Parse existing collection options in APIUsers.ts
const registeredApiUserCollections = new Set()
const collOptionsRegex = /\{\s*label:\s*['"][^'"]+['"],\s*value:\s*['"]([^'"]+)['"]\s*\}/g
const collSectionMatch = apiUsersContent.match(/name:\s*['"]collection['"][\s\S]*?options:\s*\[([\s\S]*?)\]/)
if (collSectionMatch) {
  let m
  while ((m = collOptionsRegex.exec(collSectionMatch[1])) !== null) {
    registeredApiUserCollections.add(m[1])
  }
}

const missingFromApiUsers = []
for (const slug of collectionsMap.keys()) {
  if (!registeredApiUserCollections.has(slug)) {
    missingFromApiUsers.push(slug)
  }
}

// Parse existing allowedEndpoints options in APIUsers.ts
const registeredAllowedEndpoints = new Set()
const epSectionMatch = apiUsersContent.match(/name:\s*['"]allowedEndpoints['"][\s\S]*?options:\s*\[([\s\S]*?)\]/)
if (epSectionMatch) {
  let m
  while ((m = collOptionsRegex.exec(epSectionMatch[1])) !== null) {
    registeredAllowedEndpoints.add(m[1])
  }
}

const documentedCustomEndpoints = []
for (const col of collectionsMap.values()) {
  for (const ep of col.customEndpoints) {
    if (ep.hasOpenApi) {
      documentedCustomEndpoints.push(ep)
    }
  }
}

const missingAllowedEndpoints = []
for (const ep of documentedCustomEndpoints) {
  if (!registeredAllowedEndpoints.has(ep.fullApiPath)) {
    missingAllowedEndpoints.push(ep)
  }
}

// 4. Audit tagOrder.ts
const tagOrderPath = path.join(rootDir, 'src', 'plugins', 'openapi', 'tagOrder.ts')
const tagOrderContent = fs.readFileSync(tagOrderPath, 'utf8')
const functionalTags = new Set()
const tagMatches = [...tagOrderContent.matchAll(/['"]([A-Za-z0-9_-]+)['"]/g)]
tagMatches.forEach((m) => functionalTags.add(m[1].toLowerCase()))

const missingFromTagOrder = []
for (const col of collectionsMap.values()) {
  const pascal = col.slug
    .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/^([a-z])/, (_, c) => c.toUpperCase())
  if (!functionalTags.has(col.slug.toLowerCase()) && !functionalTags.has(pascal.toLowerCase())) {
    missingFromTagOrder.push({ slug: col.slug, pascal })
  }
}

// -------------------------------------------------------------
// Report Findings
// -------------------------------------------------------------
let hasIssues = false

console.log('--- 📋 Audit Report ---')

if (missingFromGatekeeper.length === 0) {
  console.log('✅ Gatekeeper: All collections are safely excluded in src/plugins/getKeeper.ts')
} else {
  hasIssues = true
  console.log(`⚠️ Gatekeeper: ${missingFromGatekeeper.length} collection(s) NOT excluded (Risk of RBAC role error):`)
  missingFromGatekeeper.forEach((s) => console.log(`   - ${s}`))
}

if (missingFromApiUsers.length === 0) {
  console.log('✅ APIUsers: All collections are available for developer permissions in src/collections/APIUsers.ts')
} else {
  hasIssues = true
  console.log(`⚠️ APIUsers: ${missingFromApiUsers.length} collection(s) missing from permissions dropdown:`)
  missingFromApiUsers.forEach((s) => console.log(`   - ${s}`))
}

if (missingAllowedEndpoints.length === 0) {
  console.log(`✅ Custom Endpoints: All ${documentedCustomEndpoints.length} OpenAPI custom endpoint(s) registered in APIUsers allowedEndpoints`)
} else {
  hasIssues = true
  console.log(`⚠️ Custom Endpoints: ${missingAllowedEndpoints.length} endpoint(s) missing from APIUsers allowedEndpoints:`)
  missingAllowedEndpoints.forEach((e) => console.log(`   - ${e.method} ${e.fullApiPath} ("${e.summary}")`))
}

if (missingFromTagOrder.length === 0) {
  console.log('✅ Swagger Tag Ordering: All collections are ordered in src/plugins/openapi/tagOrder.ts')
} else {
  console.log(`ℹ️ Swagger Tag Ordering: ${missingFromTagOrder.length} collection(s) unlisted in FUNCTIONAL_TAG_ORDER (will sort alphabetically at bottom):`)
  missingFromTagOrder.forEach((t) => console.log(`   - ${t.slug} (${t.pascal})`))
}

console.log('')

// -------------------------------------------------------------
// Auto-Sync Fixes (if --fix was requested)
// -------------------------------------------------------------
if (isFixMode) {
  let modifiedFiles = 0

  // 1. Sync getKeeper.ts
  if (missingFromGatekeeper.length > 0) {
    const formattedAdditions = missingFromGatekeeper.map((s) => `    '${s}',`).join('\n')
    getKeeperContent = getKeeperContent.replace(
      /excludeCollections:\s*\[([\s\S]*?)\]/,
      (match, p1) => `excludeCollections: [\n${p1.trim()}\n${formattedAdditions}\n  ]`
    )
    fs.writeFileSync(getKeeperPath, getKeeperContent, 'utf8')
    console.log(`✨ Synced src/plugins/getKeeper.ts (+${missingFromGatekeeper.length} collections)`)
    modifiedFiles++
  }

  // 2. Sync APIUsers.ts
  if (missingFromApiUsers.length > 0 || missingAllowedEndpoints.length > 0) {
    // Sync collections
    if (missingFromApiUsers.length > 0) {
      const newCollEntries = missingFromApiUsers
        .map((s) => {
          const info = collectionsMap.get(s)
          return `            { label: '${info.label} (${s})', value: '${s}' },`
        })
        .join('\n')

      apiUsersContent = apiUsersContent.replace(
        /(name:\s*['"]collection['"][\s\S]*?options:\s*\[)([\s\S]*?)(\])/,
        (match, p1, p2, p3) => `${p1}\n${p2.trim()}\n${newCollEntries}\n          ${p3}`
      )
    }

    // Sync allowedEndpoints
    if (missingAllowedEndpoints.length > 0) {
      const newEpEntries = missingAllowedEndpoints
        .map((ep) => `        { label: '${ep.summary} (${ep.method} ${ep.fullApiPath})', value: '${ep.fullApiPath}' },`)
        .join('\n')

      apiUsersContent = apiUsersContent.replace(
        /(name:\s*['"]allowedEndpoints['"][\s\S]*?options:\s*\[)([\s\S]*?)(\])/,
        (match, p1, p2, p3) => `${p1}\n${p2.trim()}\n${newEpEntries}\n      ${p3}`
      )
    }

    fs.writeFileSync(apiUsersPath, apiUsersContent, 'utf8')
    console.log(`✨ Synced src/collections/APIUsers.ts (+${missingFromApiUsers.length} collections, +${missingAllowedEndpoints.length} endpoints)`)
    modifiedFiles++
  }

  if (modifiedFiles > 0) {
    console.log(`\n🎉 Successfully synced ${modifiedFiles} file(s)! Everything is up to date.`)
  } else {
    console.log('🎉 No changes needed. Everything is already perfectly synchronized!')
  }
} else {
  if (hasIssues) {
    console.log('💡 Tip: Run `npm run swagger:sync` to automatically sync missing collections & endpoints across all files!')
  } else {
    console.log('🎉 All Swagger definitions, permissions, and RBAC exclusions are in sync!')
  }
}
console.log('')
