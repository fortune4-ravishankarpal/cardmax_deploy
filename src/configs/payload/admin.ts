import { AdminUsers } from "@/collections/AdminUser";
import { env } from "@/lib/env";

import type { Config } from "payload";
import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const adminConfig: Config["admin"] = {
  user: AdminUsers.slug,
  importMap: {
    baseDir: path.resolve(dirname),
  },
  autoLogin: {
    email: env.CMS_SEED_ADMIN_EMAIL,
    password: env.CMS_SEED_ADMIN_PASSWORD,
  },
  suppressHydrationWarning: true,
};
