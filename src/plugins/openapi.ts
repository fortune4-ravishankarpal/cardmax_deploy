import { openapi, scalar, swaggerUi } from '@seshuk/payload-plugin-openapi'
import type { Plugin } from 'payload'

export const openApiPluginConfigs: Plugin[] = [
    openapi({
        metadata: {
            title: "CardMax API",
            version: '1.0.0',
            description: 'API documentation for CardMax Payload CMS',
        },
        interactiveAuth: true,
        cache: process.env.NODE_ENV === "production",
    }),
    scalar({
        path: '/docs'
    }),
    swaggerUi({
        path: '/swagger'
    })
]