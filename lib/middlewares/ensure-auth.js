import { getContext } from '../context'
import { PreconditionFailedError } from '../utils/error'
import { highlightStyle } from '../utils/styles'
import { handleAsyncError as handle } from '../utils/async'

async function ensureAuth (argv) {
  // @TODO whitelist commands here if they don't require auth
  // this can be done when by checking the argv._ for the whilisted command and doing an early return

  const managementToken = argv.managementToken || argv.accessToken
  const paramName = argv.accessToken ? '--access-token' : '--management-token'

  const context = await getContext()
  if (!context.cmaToken && !managementToken) {
    throw new PreconditionFailedError(`You have to be logged in to do this.\nYou can log in via ${highlightStyle('contentful login')}\nOr provide a managementToken via ${paramName} argument`)
  }
}
const wrapped = handle(ensureAuth)
export default wrapped
