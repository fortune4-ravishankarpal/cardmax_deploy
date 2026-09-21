# CardMax Swagger & API Permissions Developer Guide

This guide explains how **Swagger (OpenAPI)**, **Custom Endpoints**, and **Role-Based API Permissions** are structured in CardMax, and provides exact step-by-step instructions for adding new collections and endpoints.

---

## ⚡ Quick Start: The One-Command Sync

Whenever you add a new collection or custom endpoint, you don't need to manually edit multiple config files. Just run:

```bash
# 1. Audit and check if any collections or endpoints are missing registrations:
pnpm swagger:check

# 2. Automatically sync all files (getKeeper, APIUsers permissions, allowedEndpoints):
pnpm swagger:sync
```

---

## 🗺️ System Architecture Overview

```
                          ┌───────────────────────────┐
                          │   HTTP Request to /api    │
                          └─────────────┬─────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │   apiPermissionEngine.ts   │
                         │ (Runtime Enforcement Engine)│
                         └──────────────┬─────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│  Administrator View  │     │    Developer View    │     │  Unauthenticated /   │
│  (role === 'admin')  │     │(role === 'developer')│     │   Customer (Users)   │
│                      │     │                      │     │                      │
│ Full access to all   │     │ Filtered strictly to │     │ 401 / 403 Forbidden  │
│ collections & CRUD   │     │ assigned permissions │     │ (Swagger hidden)     │
│ endpoints in Swagger │     │ & allowed endpoints  │     │                      │
└──────────────────────┘     └──────────────────────┘     └──────────────────────┘
```

---

## 📁 The 4 Key Files You Need to Know

| File | Purpose | What to do when adding something new |
| :--- | :--- | :--- |
| **`src/collections/index.ts`** | Master list of all registered Payload collections. | Add your new collection here. |
| **`src/plugins/getKeeper.ts`** | Gatekeeper RBAC exclusion list. | Exclude your collection here to prevent RBAC role lookup collisions (or run `pnpm swagger:sync`). |
| **`src/collections/APIUsers.ts`** | API User model with `permissions` & `allowedEndpoints` options. | Exposes collection & custom endpoint checkboxes in the `/admin` UI (or run `pnpm swagger:sync`). |
| **`src/plugins/openapi/tagOrder.ts`** | Controls section order and descriptions in Swagger UI. | Place your collection or tag in the functional category hierarchy. |

---

## 🛠️ Workflow 1: Adding a New Collection

Follow these 3 simple steps when creating a new collection (e.g. `RewardCoupons`):

### Step 1: Create your collection file
Create `src/collections/RewardCoupons.ts`:
```ts
import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const RewardCoupons: CollectionConfig = {
  slug: 'reward-coupons',
  admin: {
    useAsTitle: 'code',
    group: 'Master',
  },
  access: {
    read: () => true, // Or your custom access control
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'code', type: 'text', required: true },
    { name: 'discount', type: 'number', required: true },
  ],
}
```

### Step 2: Register it in `src/collections/index.ts`
Import and add your collection to `collectionsConfigs`:
```ts
import { RewardCoupons } from './RewardCoupons'

export const collectionsConfigs = [
  // ... existing collections
  RewardCoupons,
]
```

### Step 3: Run the Auto-Sync Command
```bash
pnpm swagger:sync
```
> **What this does automatically:**
> - Adds `'reward-coupons'` to `src/plugins/getKeeper.ts` (`excludeCollections`).
> - Adds `Reward Coupons (reward-coupons)` to the `APIUsers.ts` developer permission dropdown so admins can assign it in `/admin`.

### Step 4 (Optional): Add to Swagger Section Order
Open [src/plugins/openapi/tagOrder.ts](file:///c:/Users/Developer/Desktop/CardMax-Payload/cardmax_payload/src/plugins/openapi/tagOrder.ts):
Add `'RewardCoupons'` into `FUNCTIONAL_TAG_ORDER` under the appropriate category, and add its description in `TAG_METADATA`:
```ts
export const FUNCTIONAL_TAG_ORDER = [
  // ...
  // Under Cards & Banking / Master:
  'RewardCoupons',
]

export const TAG_METADATA = {
  // ...
  RewardCoupons: { description: 'Reward coupons, vouchers and promotional codes' },
}
```

---

## 🛠️ Workflow 2: Adding a Custom API Endpoint

When you create a custom endpoint inside any collection (or `src/payload.config.ts`), follow these steps to make it visible in Swagger and controllable via developer permissions:

### Step 1: Define `custom.openapi` in your endpoint definition
Open your collection (e.g. `src/collections/Users.ts` or `src/collections/RewardCoupons.ts`):
```ts
endpoints: [
  {
    path: '/redeem',
    method: 'post',
    handler: async (req) => {
      // Your endpoint handler logic
      return Response.json({ success: true })
    },
    // ✨ REQUIRED FOR SWAGGER: Add custom.openapi metadata ✨
    custom: {
      openapi: {
        summary: 'Redeem Reward Coupon',
        description: 'Validates and redeems a promotional coupon code.',
        tags: ['RewardCoupons'], // Or 'Authentication', 'Users', etc.
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'PROMO2026' },
                },
                required: ['code'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Coupon redeemed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid or expired coupon' },
        },
      },
    },
  },
]
```

### Step 2: Run Auto-Sync
```bash
pnpm swagger:sync
```
> **What this does automatically:**
> Scans for your new endpoint with `custom.openapi` and registers it in `src/collections/APIUsers.ts` under `allowedEndpoints` (e.g. `Redeem Reward Coupon (POST /api/reward-coupons/redeem)`).

### Step 3: Grant Access in the Admin UI
1. Open the Payload Admin Panel at `http://localhost:3000/admin`.
2. Navigate to **System** -> **API Users**.
3. Select the developer (e.g. `Developer One (Dev1)`).
4. In the **Allowed Endpoints** multi-select field, select `Redeem Reward Coupon (POST /api/reward-coupons/redeem)`.
5. Click **Save**.
6. Refresh Swagger (`/api/swagger`) — the endpoint will immediately appear in their personalized documentation!

---

## 🔒 Security & Runtime Enforcement

CardMax enforces API permissions at two distinct layers:

1. **Swagger Documentation Layer (`dynamicSpecHandler.ts`)**:
   - Authenticates the API user.
   - Filters the OpenAPI document so developers only see endpoints they are allowed to use.
   - Hides obsolete default password endpoints (like `/api/users/login`).

2. **Runtime Request Enforcement Layer (`apiPermissionEngine.ts`)**:
   - `hasApiPermission(req, collectionSlug, operation)` checks incoming HTTP requests.
   - Admin users (`role === 'admin'`) have access to all collections and methods.
   - Developers (`role === 'developer'`) are checked against their assigned collection permissions and `allowedEndpoints`.
