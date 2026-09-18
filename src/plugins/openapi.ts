import { openapi } from '@seshuk/payload-plugin-openapi'
import type { Plugin } from 'payload'
import { dynamicSpecHandler } from './openapi/dynamicSpecHandler'
import { swaggerAuthUiHandler } from './openapi/swaggerAuthUi'

const dynamicSwaggerPlugin: Plugin = (config) => ({
  ...config,
  endpoints: [
    ...(config.endpoints || []),
    {
      path: '/openapi.json',
      method: 'get',
      handler: dynamicSpecHandler,
    },
    {
      path: '/swagger',
      method: 'get',
      handler: swaggerAuthUiHandler,
    },
  ],
})

export const openApiPluginConfigs: Plugin[] = [
  openapi({
    metadata: {
      title: 'CardMax API',
      version: '1.0.0',
      description: 'API documentation for CardMax Payload CMS',
    },
    interactiveAuth: true,
    cache: process.env.NODE_ENV === 'production',
    serve: false, // We serve via our dynamic, authenticated spec handler
  }),
  dynamicSwaggerPlugin,
]