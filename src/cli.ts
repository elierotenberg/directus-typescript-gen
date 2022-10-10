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
  typeName: z.string(),
  directusTypeName: z.string(),
  specOutFile: z.string().nullish(),
  outFile: z.string(),
});

type Argv = z.infer<typeof Argv>;

const main = async (): Promise<void> => {
  const argv = Argv.parse(
    await yargs(process.argv.slice(2))
      .option(`host`, { demandOption: true, type: `string` })
      .option(`email`, { demandOption: true, type: `string` })
      .option(`password`, { demandOption: true, type: `string` })
      .option(`typeName`, { demandOption: true, type: `string` })
      .option(`directusTypeName`, { demandOption: true, type: `string` })
      .option(`specOutFile`, { demandOption: false, type: `string` })
      .option(`outFile`, { demandOption: true, type: `string` })
      .help().argv,
  );

  const {
    host,
    email,
    password,
    typeName,
    directusTypeName,
    specOutFile,
    outFile,
  } = argv;

  const {
    data: { access_token: token },
  } = await (
    await fetch(new URL(`/auth/login`, host).href, {
      method: `post`,
      body: JSON.stringify({ email, password, mode: `json` }),
      headers: {
        "Content-Type": `application/json`,
      },
    })
  ).json();

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

  const baseSource = openApiTs(spec);

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

  const exportUserCollectionsSource = `export type ${typeName} = {\n${exportUserCollectionsProperties.join(
    `\n`,
  )}\n};\n`;

  const exportDirectusCollectionsSource = `export type ${directusTypeName} = {\n${exportDirectusCollectionsProperties.join(
    `\n`,
  )}\n};\n`;

  const source = [
    baseSource,
    exportUserCollectionsSource,
    exportDirectusCollectionsSource,
  ].join(`\n`);

  await promises.writeFile(resolve(process.cwd(), outFile), source, {
    encoding: `utf-8`,
  });
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  throw new Error(`This should be the main module.`);
}
