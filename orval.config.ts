import { defineConfig } from 'orval';

// Source of truth: the LIVE OpenAPI spec served by the parker-api backend (separate repo).
// Generated output is committed (see README.md "API client codegen" section for why) —
// run `npm run api:codegen` against a running backend whenever the API surface changes.
export default defineConfig({
  catCare: {
    input: {
      target: 'http://localhost:3001/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/generated',
      schemas: 'src/api/generated/model',
      client: 'react-query',
      clean: true,
      override: {
        mutator: {
          path: 'src/api/mutator.ts',
          name: 'customInstance',
        },
      },
    },
  },
  // Separate zod-client generation so React Hook Form can consume orval-generated
  // Zod schemas directly (issue #2 resolution: no second, hand-maintained schema).
  catCareZod: {
    input: {
      target: 'http://localhost:3001/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/generated-zod',
      client: 'zod',
      clean: true,
    },
  },
});
