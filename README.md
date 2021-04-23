# directus-typescript-gen

Dynamically extract typings from a live Directus server and generate TypeScript definition files to be used by the Directus TypeScript SDK!

## Usage

```
npx directus-typescript-gen --host http://localhost:8055 --email admin@example.com --password <...> --outFile collections.d.ts
```