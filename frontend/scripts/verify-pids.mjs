// Temporary verification script - exercises the real store + Settings component.
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createPinia, setActivePinia } from 'pinia'

const frontendRoot = fileURLToPath(new URL('..', import.meta.url))

// Browser-like localStorage stub (must exist before the store reads it)
const backing = new Map()
const localStorage = {
  getItem: (k) => (backing.has(k) ? backing.get(k) : null),
  setItem: (k, v) => backing.set(k, String(v)),
  removeItem: (k) => backing.delete(k),
  clear: () => backing.clear(),
}
globalThis.window = { localStorage }
globalThis.localStorage = localStorage

const results = []
const check = (name, actual, expected) => {
  results.push({ name, ok: JSON.stringify(actual) === JSON.stringify(expected), actual, expected })
}

const server = await createServer({
  root: frontendRoot,
  configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

const { useOBDStore } = await server.ssrLoadModule('/src/stores/obd.ts')
const Settings = (await server.ssrLoadModule('/src/views/Settings.vue')).default

const pinia = createPinia()
setActivePinia(pinia)
const store = useOBDStore(pinia)

const ALL = ['0C', '0D', '05', '04', '0B', '0F', '11', '10']

// --- 1. defaults ---
check('default selection', store.monitoredPids, ['0C', '0D', '05', '11'])

// --- 2. all 8 PIDs selectable (bug #1: no cap) ---
store.setMonitoredPids(ALL)
check('all 8 PIDs selectable', store.monitoredPids, ALL)
check('all 8 persisted', JSON.parse(backing.get('obd.monitoredPids')), ALL)

// --- 3. Settings renders the CURRENT store selection (bug #2) ---
const render = async () => {
  const app = createSSRApp(Settings)
  app.use(pinia)
  return renderToString(app)
}
const checkedPids = (html) =>
  [...html.matchAll(/<input[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => /value="[0-9A-F]{2}"/.test(tag) && /\schecked/.test(tag))
    .map((tag) => tag.match(/value="([^"]*)"/)[1])
    .sort()
const sorted = (arr) => [...arr].sort()

let html = await render()
check('all 8 PID checkboxes rendered', (html.match(/value="[0-9A-F]{2}"/g) || []).length, 8)
check('checkboxes reflect store (8 checked)', checkedPids(html), sorted(ALL))

// --- 4. store changes are reflected in the view ---
store.setMonitoredPids(['0C', '0B'])
html = await render()
check('checkboxes follow store changes', checkedPids(html), sorted(['0C', '0B']))

// --- 5. reset ---
store.resetMonitoredPids()
check('reset restores defaults', store.monitoredPids, ['0C', '0D', '05', '11'])
html = await render()
check('checkboxes after reset', checkedPids(html), sorted(['0C', '0D', '05', '11']))

// --- 6. persistence across a reload (fresh module + fresh pinia) ---
const fresh = async (tag) => {
  const mod = await server.ssrLoadModule(`/src/stores/obd.ts?reload=${tag}`)
  const p = createPinia()
  setActivePinia(p)
  return mod.useOBDStore(p)
}
const store2 = await fresh(1)
check('selection restored after reload', store2.monitoredPids, ['0C', '0D', '05', '11'])

// --- 7. corrupt storage falls back to defaults ---
backing.set('obd.monitoredPids', '{not json')
const store3 = await fresh(2)
check('corrupt storage -> defaults', store3.monitoredPids, ['0C', '0D', '05', '11'])

// --- 8. unknown PIDs are dropped ---
backing.set('obd.monitoredPids', JSON.stringify(['0C', 'ZZ', '0B']))
const store4 = await fresh(3)
check('unknown PIDs dropped', store4.monitoredPids, ['0C', '0B'])

// --- 9. empty selection is allowed ---
store4.setMonitoredPids([])
check('empty selection allowed', store4.monitoredPids, [])

// --- 10. mock data follows the monitored PID selection (no cap of 5) ---
store.setMonitoredPids(ALL)
await store.initializeConnection()
await new Promise((r) => setTimeout(r, 1200))
check('simulation produces all 8 PIDs', store.latestReadings.map((r) => r.pid).sort(), sorted(ALL))
check('all readings have values', store.latestReadings.every((r) => typeof r.value === 'number'), true)

store.setMonitoredPids(['0C', '0B'])
check('selection change refreshes data instantly', store.latestReadings.map((r) => r.pid).sort(), sorted(['0C', '0B']))

store.setMonitoredPids([])
check('empty selection -> no readings', store.latestReadings.length, 0)

store.disconnect()

// --- 11. Dashboard still renders (label/unit refactor) ---
const Dashboard = (await server.ssrLoadModule('/src/views/Dashboard.vue')).default
const dashApp = createSSRApp(Dashboard)
dashApp.use(pinia)
const dashHtml = await renderToString(dashApp)
check('dashboard renders without error', dashHtml.includes('Live Telemetry'), true)

await server.close()

let failed = 0
for (const r of results) {
  if (!r.ok) failed++
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`)
  if (!r.ok) {
    console.log(`      expected ${JSON.stringify(r.expected)}`)
    console.log(`      actual   ${JSON.stringify(r.actual)}`)
  }
}
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
