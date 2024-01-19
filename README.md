# directus-typescript-gen

Dynamically extract typings from an OpenAPI schema or live Directus server and generate TypeScript definition files to be used by the Directus TypeScript SDK!

This enables type-checking, autocompletion, and other TypeScript goodness.

## Usage

Use the generator on a running Directus server to generate the TypeScript definitions:

```
# Generate from a spec file
npx directus-typescript-gen -i directus.oas.json > schema.d.ts
# Generate from a running server
npx directus-typescript-gen --host http://localhost:8055 --email admin@example.com --password <...> --outFile my-collections.d.ts
# Change exported type name (default is "Schema")
npx directus-typescript-gen -i directus.oas.json --typeName MyCollections > schema.d.ts

```

The generated file will look like:

```ts
export interface Article {
  article_id: string;
  title: string;
  body: string;
  publish_date?: string;
}

export interface ArticleAuthor {
  article_id: string;
  author_email: string;
}

export interface Author {
  email: string;
  first_name: string;
  last_name: string;
}

export type MyCollections = {
  article: Article;
  article_author: ArticleAuthor;
  author: Author;
};
```

Then instantiate the Directus SDK client:

```ts
import { Directus } from "@directus/sdk";
import { MyCollections } from "./my-collections.d.ts";

const directus = new Directus<MyCollections>();
```
