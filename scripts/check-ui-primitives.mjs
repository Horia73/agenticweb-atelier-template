import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const sourceRoot = path.join(repoRoot, "src")
const uiRoot = path.join(sourceRoot, "components", "ui")
const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx"])
const nativeControl = /<(button|input|textarea|select)(?=[\s/>])/g
const directPrimitiveImport = /from\s+["'](?:radix-ui|@radix-ui\/[^"']+)["']/g
const findings = []

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      walk(absolute)
    } else if (sourceExtensions.has(path.extname(entry.name))) {
      inspect(absolute)
    }
  }
}

function inspect(file) {
  if (file === uiRoot || file.startsWith(`${uiRoot}${path.sep}`)) return

  const relative = path.relative(repoRoot, file)
  const lines = fs.readFileSync(file, "utf8").split("\n")
  lines.forEach((line, index) => {
    if (line.includes("ui-primitive-allow-native")) return

    for (const match of line.matchAll(nativeControl)) {
      findings.push(`${relative}:${index + 1} native <${match[1]}>; use src/components/ui`)
    }
    if (directPrimitiveImport.test(line)) {
      findings.push(`${relative}:${index + 1} direct Radix import; wrap it in src/components/ui`)
    }
    directPrimitiveImport.lastIndex = 0
  })
}

walk(sourceRoot)

if (findings.length > 0) {
  console.error("UI primitive policy failed:\n" + findings.map(item => `- ${item}`).join("\n"))
  console.error("Use the canonical components/ui layer. Document a necessary native exception with ui-primitive-allow-native.")
  process.exitCode = 1
} else {
  console.log("UI primitive policy: ok")
}
