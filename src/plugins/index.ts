import { Plugin } from 'payload'

// import { seoPluginConfig } from './seo'
import { enhancedSidebarConfig } from './sidebar'
// import { redirectsConfig } from './redirect'
import { auditFieldsConfig } from './audit'
// import { contentFreezeConfig } from './contentFreezing' 

import { gatekeeperPluginConfig } from './getKeeper'
import { KanbanBoardConfig } from './kanbanBoard'
export const plugins: Plugin[] = [
  gatekeeperPluginConfig,
  auditFieldsConfig,
  // redirectsConfig,
  enhancedSidebarConfig,
  // contentFreezeConfig,
  // seoPluginConfig,
  KanbanBoardConfig,
]
