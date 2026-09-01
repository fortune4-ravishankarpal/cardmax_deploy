/*
import { seoPlugin } from '@payloadcms/plugin-seo'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
// import { Page, Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

// collection to use this seo plugins

let collectionsUsingSeoPlugins = ['post']

const generateTitle: GenerateTitle<any> = ({ doc }) => {
  return doc?.title ? `${doc.title} :: CardMax` : 'CardMax'
}

const generateURL: GenerateURL<any> = ({ doc }) => {
  const url = getServerSideURL()
  return doc?.slug ? `${url}/${doc.slug}` : url
}

const generateDescription: GenerateURL<any> = ({ doc }) => {
  const url = getServerSideURL()
  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const seoPluginConfig = seoPlugin({
  collections: collectionsUsingSeoPlugins,
  generateTitle,
  generateURL,
  generateDescription,
})
*/