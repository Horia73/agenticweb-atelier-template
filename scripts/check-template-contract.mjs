import fs from 'node:fs'
import path from 'node:path'
import Ajv from 'ajv'

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const contract = read('studio.template.json')
const schema = read('schemas/studio-template-v1.schema.json')
const validate = new Ajv({ allErrors: true }).compile(schema)
if (!validate(contract)) throw new Error(JSON.stringify(validate.errors, null, 2))
const pkg = read('package.json')
for (const script of [...Object.values(contract.scripts), contract.ui.enforcementScript]) {
  if (script && !pkg.scripts[script]) throw new Error('Missing script: ' + script)
}
const { experience, ui, paths, agenticwebApps } = contract
const files = [...Object.values(paths), ui.config, ui.components, ui.skill,
  ...Object.values(agenticwebApps?.components ?? {}),
  ...['registry', 'catalog', 'grammar', 'components', 'skill', 'responsiveContract'].map(key => experience?.[key])].filter(Boolean)
for (const file of files) {
  if (path.isAbsolute(file) || file.replaceAll('\\', '/').split('/').includes('..')) throw new Error('Unsafe path: ' + file)
  let current = process.cwd()
  for (const part of file.replaceAll('\\', '/').split('/')) {
    current = path.join(current, part)
    if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Symlink contract path: ' + file)
  }
}
if (!pkg.dependencies.next) throw new Error('Next.js dependency missing')
if (!fs.readFileSync('next.config.ts', 'utf8').includes(contract.preview.distDirEnv)) throw new Error('Preview distDir isolation missing')
console.log('Studio template contract v1: valid')
