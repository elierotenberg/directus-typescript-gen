# directus-typescript-gen

Dynamically extract typings from a live Directus server and generate TypeScript definition files to be used by the Directus TypeScript SDK!

This enables type-checking, autocompletion, and other TypeScript goodness.

## Usage

Use the generator on a running Directus server to generate the TypeScript definitions:

```
npx directus-typescript-gen --host http://localhost:8055 --email admin@example.com --password <...> --typeName MyCollections --outFile my-collections.d.ts
```

Then instantiate the Directus SDK client:

```ts
import { Directus } from "@directus/sdk";
import { MyCollections } from "./my-collections.d.ts";

const directus = new Directus<MyCollections>();
```
