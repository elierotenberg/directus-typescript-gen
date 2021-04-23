#!/usr/bin/env node

import { promises } from "fs";
import { resolve } from "path";

import { mapAsyncConcurrent } from "typed-utilities";
import { isString } from "typed-assert";
import yargs from "yargs";
import { compile } from "json-schema-to-typescript";

import {
  createCollectionsType,
  fetchDirectusSpec,
  parseSchemas,
} from "./lib/spec";

const main = async (): Promise<void> => {
  type Argv = {
    readonly host?: string;
    readonly email?: string;
    readonly password?: string;
    readonly outFile?: string;
  };

  const argv: Argv = yargs(process.argv.slice(2))
    .option("host", { demandOption: true, type: "string" })
    .option("email", { demandOption: true, type: "string" })
    .option("password", { demandOption: true, type: "string" })
    .option("outFile", { demandOption: true, type: "string" })
    .help().argv;

  const { host, email, password, outFile } = argv;
  isString(host);
  isString(email);
  isString(password);
  isString(outFile);
  const spec = await fetchDirectusSpec({
    email,
    host,
    password,
  });

  const schemas = parseSchemas(spec);

  const definitions = await mapAsyncConcurrent(
    schemas,
    async ({ schema }) =>
      await compile(schema, schema.title, {
        bannerComment: "",
        unknownAny: true,
        strictIndexSignatures: true,
      }),
  );

  const collectionsType = createCollectionsType(schemas);

  const source = [...definitions, collectionsType].join("\n");

  await promises.writeFile(resolve(process.cwd(), outFile), source, {
    encoding: "utf-8",
  });
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  throw new Error("This should be the main module.");
}
