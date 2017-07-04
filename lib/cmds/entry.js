export const command = 'entry'
export const aliases = ['entries']

export const desc = 'Manage and list the entries in your space'

export const builder = function (yargs) {
  return yargs
    .commandDir('entry_cmds')
    .demandCommand(4, 'Please specify a sub command.')
}
