# directus-typescript-gen-with-static-token


This package is originally created by Elie Rotenberg <elie@rotenberg.io>

Just added static token support  :)


Dynamically extract typings from a live Directus server and generate TypeScript definition files to be used by the Directus TypeScript SDK!

This enables type-checking, autocompletion, and other TypeScript goodness.

## Usage with email and password

Use the generator on a running Directus server to generate the TypeScript definitions:

```
npx directus-typescript-gen --host http://localhost:8055 --email admin@example.com --password <...> --typeName MyCollections --outFile my-collections.d.ts
```

## Usage with static token

Use the generator on a running Directus server to generate the TypeScript definitions:

```
npx directus-typescript-gen --host http://localhost:8055 --staticToken pixnJMxRKpx2uxVpD2OJxhwCxbPoHxlhJ --typeName MyCollections --outFile my-collections.d.ts
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
