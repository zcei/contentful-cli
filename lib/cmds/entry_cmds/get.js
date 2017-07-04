import Table from 'cli-table2'

import { truncate } from 'lodash'
import { getContext } from '../../context'
import { createManagementClient } from '../../utils/contentful-clients'
import { assertLoggedIn, assertSpaceIdProvided } from '../../utils/assertions'
import { log } from '../../utils/log'
import { handleAsyncError as handle } from '../../utils/async'
import { getId } from '../../utils/helpers'

export const command = 'get'

export const desc = 'Show an entry type'

export const builder = (yargs) => {
  return yargs
  .option('id', { type: 'string', demand: true, describe: 'Entry ID' })
  .option('space-id', { type: 'string', describe: 'Space id' })
  .epilog('Copyright 2017 Contentful, this is a BETA release')
}

async function entryShow (argv) {
  await assertLoggedIn()
  await assertSpaceIdProvided(argv)

  const entryId = getId(argv)
  const { cmaToken, activeSpaceId } = await getContext()
  const spaceId = argv.spaceId || activeSpaceId

  const client = await createManagementClient({
    accessToken: cmaToken
  })

  const space = await client.getSpace(spaceId)
  const {fields, sys} = await space.getEntry(entryId)

  const contentType = await space.getContentType(sys.contentType.sys.id)

  const table = new Table({
    head: ['Entry Property', 'Entry Value']
  })

  table.push(['ID', sys.id])
  table.push(['Content Type ID', sys.contentType.sys.id])

  log(table.toString())

  const fieldsTable = new Table({
    head: ['*', 'Field ID', 'Field Name', 'Locale', 'Field Value']
  })

  Object.entries(fields).forEach(([id, field]) => {
    const fieldsByLocale = Object.entries(field)

    const fieldName = contentType.fields.find((field) => {
      return field.id === id
    }).name

    const isDisplayField = id === contentType.displayField
    const displayFieldIndicator = isDisplayField ? '*' : ''

    const tableData = fieldsByLocale.map(([locale, val], idx) => {
      const localizedField = [locale, truncate(val, {length: 40})]

      if (idx === 0) {
        return [
          {
            rowSpan: fieldsByLocale.length,
            content: displayFieldIndicator
          }, {
            rowSpan: fieldsByLocale.length,
            content: id
          },
          {
            rowSpan: fieldsByLocale.length,
            content: fieldName
          },
          ...localizedField
        ]
      } else {
        return localizedField
      }
    })

    fieldsTable.push(...tableData)
  })

  log(fieldsTable.toString())
}

export const handler = handle(entryShow)
