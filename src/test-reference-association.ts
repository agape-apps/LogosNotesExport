#!/usr/bin/env bun

import { testReferenceAssociation } from './reference-associator.js';

try {
  await testReferenceAssociation();
} catch (error) {
  console.error('❌ Error testing reference association:', error);
  process.exit(1);
} 