import Table from 'cli-table2'

import { truncate } from 'lodash'
import { getContext } from '../../context'
import { createManagementClient } from '../../utils/contentful-clients'
import { handleAsyncError as handle } from '../../utils/async'
import { assertLoggedIn, assertSpaceIdProvided } from '../../utils/assertions'
import { log } from '../../utils/log'

export const command = 'list'

export const desc = 'List your entries'

export const aliases = ['ls']

export const builder = (yargs) => {
  return yargs
    .option('space-id', { type: 'string', describe: 'Space id' })
    .option('skip', {type: 'string', describe: 'Result page'})
    .epilog('Copyright 2017 Contentful, this is a BETA release')
}

async function entryList (argv) {
  await assertLoggedIn()
  await assertSpaceIdProvided(argv)

  const { cmaToken, activeSpaceId } = await getContext()
  const spaceId = argv.spaceId || activeSpaceId
  const skip = argv.skip || 0

  const client = await createManagementClient({
    accessToken: cmaToken
  })

  const space = await client.getSpace(spaceId)

  const cts = await space.getContentTypes()

  const {items, total} = await space.getEntries({
    skip
  })

  const table = new Table({
    head: ['Entry ID', 'Content Type', 'Locale', 'Display Field']
  })

  items.forEach((entry) => {
    const ct = cts.items.find((ct) => {
      return ct.sys.id === entry.sys.contentType.sys.id
    })

    const fieldsByLocale = Object.entries(entry.fields)

    fieldsByLocale.forEach(([id, field], idx) => {
      const locales = Object.entries(field)

      const allLocales = locales.map(([locale, val], idx) => {
        const localizedField = [locale, truncate(val, {length: 40})]

        if (idx === 0) {
          return [
            {
              rowSpan: locales.length,
              content: entry.sys.id
            },
            {
              rowSpan: locales.length,
              content: ct.sys.id
            },
            ...localizedField
          ]
        } else {
          return localizedField
        }
      })

      table.push(...allLocales)
    })
  })

  log(table.toString())

  log(`Displaying ${items.length} of ${total} entries`)
}

export const handler = handle(entryList)
