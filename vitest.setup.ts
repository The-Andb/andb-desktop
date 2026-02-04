import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/vue';
import { afterEach } from 'vitest';

// auto-cleanup is enabled by default in @testing-library/vue, but explicitly adding it 
// or other global cleanups is good practice if we have custom needs.
afterEach(() => {
  cleanup();
});
