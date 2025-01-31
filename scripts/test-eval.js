import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createRequire } from 'module'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '../.env') })

// Import and run the test
const require = createRequire(import.meta.url)
require('tsx/cjs')
require('../src/lib/test-evaluation.ts') 