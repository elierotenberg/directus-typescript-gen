# directus-typescript-gen

Dynamically extract typings from a live Directus server and generate TypeScript definition files to be used by the Directus TypeScript SDK!

This enables type-checking, autocompletion, and other TypeScript goodness.

## Usage

Use the generator on a running Directus server to generate the TypeScript definitions:

```
npx directus-typescript-gen --host http://localhost:8055 --email admin@example.com --password <...> --typeName MyCollections --directusTypeName DirectusCollections --outFile my-collections.d.ts
```

When using Two-factor Authentication, you can use a Static Token instead of a password and pass the `--passwordIsStaticToken=true` flag.

The generated file will look somewhat like:

```ts
export interface components {
  schemas: {
    ItemsArticle: {
      article_id: string;
      title: string;
      body: string;
      publish_date?: string;
    };
    ItemsArticleAuthor: {
      article_id: string;
      author_email: string;
    };
    ItemsAuthor: {
      email: string;
      first_name: string;
      last_name: string;
    };
    // Directus' own Collections will be printed here as well.
  };
}

export type MyCollections = {
  article: components["schemas"]["ItemsArticle"];
  article_author: components["schemas"]["ItemsArticleAuthor"];
  author: components["schemas"]["ItemsAuthor"];
};

export type DirectusCollections = {
  directus_activity: components["schemas"]["Activity"];
  directus_collections: components["schemas"]["Collections"];
  directus_fields: components["schemas"]["Fields"];
  directus_files: components["schemas"]["Files"];
  directus_files: components["schemas"]["Folders"];
  directus_permissions: components["schemas"]["Permissions"];
  directus_presets: components["schemas"]["Presets"];
  directus_relations: components["schemas"]["Relations"];
  directus_revisions: components["schemas"]["Revisions"];
  directus_roles: components["schemas"]["Roles"];
  directus_settings: components["schemas"]["Settings"];
  directus_users: components["schemas"]["Users"];
  directus_webhooks: components["schemas"]["Webhooks"];
  directus_flows: components["schemas"]["Flows"];
  directus_operations: components["schemas"]["Operations"];
};
```

Then instantiate the Directus SDK client:

```ts
import { Directus } from "@directus/sdk";
import { MyCollections } from "./my-collections.d.ts";

const directus = new Directus<MyCollections>();
```
