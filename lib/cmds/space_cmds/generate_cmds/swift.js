import { getContext } from '../../../context'
import { assertLoggedIn, assertSpaceIdProvided } from '../../../utils/assertions'
import { handleAsyncError as handle } from '../../../utils/async'
import { log, success } from '../../../utils/log'
import _ from 'lodash'
import { createClient } from 'contentful-management'
import fs from 'fs'
import Mustache from 'mustache'
import { join } from 'path'

export const command = 'swift'

export const desc = 'Generate Swift classes file for your content model or a specific content type'

export const builder = (yargs) => {
  return yargs
    .usage('Usage: contentful space generate swift')
    .option('space-id', {
      describe: 'ID of the space the content model will belong to',
      alias: 's',
      type: 'string'
    })
    .option('environment-id', {
      describe: 'ID of the environment the content model will belong to. If not provided, defaults to master',
      alias: 'e',
      default: 'master',
      type: 'string'
    })
    .option('content-type-id', {
      describe: 'ID of the content type to generate. If not provided, will generate Swift class files for every content content type in the space',
      alias: 'c',
      type: 'string'
    })
    .option('output-dir', {
      describe: 'Output directory. If not provided, will be the current working directory.',
      alias: 'o',
      type: 'string'
    })
    .epilog([
      'See more at:',
      'https://github.com/contentful/contentful-cli/tree/master/docs/space/generate/migration',
      'Copyright 2018 Contentful, this is a BETA release'
    ].join('\n'))
}

export const getContentTypes = async function (environment, contentTypeId) {
  return contentTypeId ? [await environment.getContentType(contentTypeId)] : (await environment.getContentTypes()).items
}

const createManagementClient = function (cmaToken) {
  return createClient({
    accessToken: cmaToken,
    feature: 'swift-classes-generate' // TODO: Change tracking header
  })
}

const getEnvironment = async function (cmaToken, spaceId, environmentId) {
  const space = await createManagementClient(cmaToken).getSpace(spaceId)
  return space.getEnvironment(environmentId)
}

const renderSwiftClassStrings = function (contentType) {
  const view = {
    // TODO: Put context here
    contentTypeId: contentType.id,
    className: 'testClassName',
    properties: [
      {
        declaration: 'testy',
        initStatement: 'tasty',
        codingKeyStatement: 'toasty'
      }
    ]
  }
  const template = fs.readFileSync(join(__dirname, 'assets', 'SwiftClass.mustache'), 'utf8')
  return Mustache.render(template, view)
}

export async function generateSwiftClasses (argv) {
  await assertLoggedIn(argv)
  await assertSpaceIdProvided(argv)

  const { cmaToken, activeSpaceId, activeEnvironmentId } = await getContext()
  const spaceId = argv.spaceId || activeSpaceId
  const environmentId = argv.environmentId || activeEnvironmentId
  const contentTypeId = argv.contentTypeId
  const outputDir = argv.outputDir || process.cwd()

  const environment = await getEnvironment(
    cmaToken,
    spaceId,
    environmentId
  )

  log('Fetching content model')
  const contentTypes = await getContentTypes(environment, contentTypeId)

  await Promise.all(_.forEach(contentTypes, async (contentType) => {
    const filename = join(outputDir, `${contentType.sys.id}.swift`) // Fix
    fs.writeFileSync(filename, renderSwiftClassStrings(contentType))
    success(`Migration file created at ${filename}`)
  }))
}

export const handler = handle(generateSwiftClasses)
