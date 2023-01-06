#!/usr/bin/env node

import { promises } from "fs";
import { resolve } from "path";

import fetch from "node-fetch";
import { z } from "zod";
import yargs from "yargs";
import openApiTs, { OpenAPI3 } from "openapi-typescript";

const Argv = z.object({
  host: z.string(),
  email: z.string(),
  password: z.string(),
  passwordIsStaticToken: z.boolean(),
  appTypeName: z.string(),
  directusTypeName: z.string(),
  allTypeName: z.string(),
  specOutFile: z.string().nullish(),
  outFile: z.string(),
});

type Argv = z.infer<typeof Argv>;

const argv = Argv.parse(
  await yargs(process.argv.slice(2))
    .option(`host`, { demandOption: true, type: `string` })
    .option(`email`, { demandOption: true, type: `string` })
    .option(`password`, { demandOption: true, type: `string` })
    .option(`passwordIsStaticToken`, {
      demandOption: false,
      type: `boolean`,
      default: false,
    })
    .option(`appTypeName`, {
      alias: `typeName`,
      demandOption: false,
      type: `string`,
      default: `AppCollections`,
    })
    .option(`directusTypeName`, {
      demandOption: false,
      type: `string`,
      default: `DirectusCollections`,
    })
    .option(`allTypeName`, {
      demandOption: false,
      type: `string`,
      default: `Collections`,
    })
    .option(`specOutFile`, { demandOption: false, type: `string` })
    .option(`outFile`, { demandOption: true, type: `string` })
    .help().argv,
);

const {
  host,
  email,
  password,
  passwordIsStaticToken,
  appTypeName: appCollectionsTypeName,
  directusTypeName: directusCollectionsTypeName,
  allTypeName: allCollectionsTypeName,
  specOutFile,
  outFile,
} = argv;

let token;
if (passwordIsStaticToken) {
  token = password;
}
else {
  const response = await fetch(new URL(`/auth/login`, host).href, {
    method: `post`,
    body: JSON.stringify({ email, password, mode: `json` }),
    headers: {
      "Content-Type": `application/json`,
    },
  });

  const json = await response.json() as {
    data: {
      access_token: string;
    };
  };

  token = json.data.access_token;
}

const spec = (await (
  await fetch(`${host}/server/specs/oas`, {
    method: `get`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
).json()) as OpenAPI3 & {
  components: {
    schemas: {
      [key: string]: {
        [`x-collection`]: string;
      };
    };
  };
};

if (specOutFile) {
  await promises.writeFile(
    resolve(process.cwd(), specOutFile),
    JSON.stringify(spec, null, 2),
    {
      encoding: `utf-8`,
    },
  );
}

const baseSource = await openApiTs(spec);

const exportUserCollectionsProperties: string[] = [];
const exportDirectusCollectionsProperties: string[] = [];

for (const [schemaKey, schema] of Object.entries(spec.components.schemas)) {
  const collectionId = schema[`x-collection`];
  const line = `  ${collectionId}: components["schemas"]["${schemaKey}"];`;
  const isUserCollection = schemaKey.startsWith(`Items`);

  (isUserCollection
    ? exportUserCollectionsProperties
    : exportDirectusCollectionsProperties
  ).push(line);
}

const exportUserCollectionsType = `export type ${appCollectionsTypeName} = {\n${exportUserCollectionsProperties.join(
  `\n`,
)}\n};\n`;

const exportDirectusCollectionsType = `export type ${directusCollectionsTypeName} = {\n${exportDirectusCollectionsProperties.join(
  `\n`,
)}\n};\n`;

const exportAllCollectionsType = `export type ${allCollectionsTypeName} = ${directusCollectionsTypeName} & ${appCollectionsTypeName};\n`;

const source = [
  baseSource,
  exportUserCollectionsType,
  exportDirectusCollectionsType,
  exportAllCollectionsType,
].join(`\n`);

await promises.writeFile(resolve(process.cwd(), outFile), source, {
  encoding: `utf-8`,
});
