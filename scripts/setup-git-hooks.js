#!/usr/bin/env node

/**
 * Simple script to install git hooks from .github/hooks
 * Cross-platform compatible (Windows & Linux)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const HOOKS_DIR = path.join(process.cwd(), '.github', 'hooks')
const GIT_HOOKS_DIR = path.join(process.cwd(), '.git', 'hooks')

function setupHooks() {
  if (!fs.existsSync(HOOKS_DIR)) {
    console.error(`❌ Error: ${HOOKS_DIR} directory not found`)
    process.exit(1)
  }

  if (!fs.existsSync(GIT_HOOKS_DIR)) {
    console.error(`❌ Error: ${GIT_HOOKS_DIR} directory not found. Are you in a git repository?`)
    process.exit(1)
  }

  console.log('📦 Setting up git hooks...')

  const hookFile = path.join(HOOKS_DIR, 'pre-commit')
  const targetHook = path.join(GIT_HOOKS_DIR, 'pre-commit')

  if (fs.existsSync(hookFile)) {
    const hookContent = fs.readFileSync(hookFile, 'utf8')
    fs.writeFileSync(targetHook, hookContent, 'utf8')
    
    // Make executable on Linux (Windows handles Node.js scripts automatically)
    try {
      fs.chmodSync(targetHook, '755')
    } catch (error) {
      // Ignore chmod errors on Windows
    }

    console.log('✅ Installed pre-commit hook')
  } else {
    console.error(`❌ Error: Hook file not found: ${hookFile}`)
    process.exit(1)
  }

  console.log('✨ Git hooks setup complete!')
}

setupHooks()
