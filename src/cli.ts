#!/usr/bin/env node

import { promises } from "fs";
import { resolve } from "path";

import { z } from "zod";
import { mapAsyncConcurrent } from "typed-utilities";
import yargs from "yargs";
import { compile } from "json-schema-to-typescript";

import {
  createCollectionsType,
  fetchDirectusSpec,
  parseSchemas,
} from "./lib/spec";

const Argv = z.object({
  host: z.string(),
  email: z.string(),
  password: z.string(),
  typeName: z.string().nullish(),
  outFile: z.string(),
});

type Argv = z.infer<typeof Argv>;

const main = async (): Promise<void> => {
  const argv = Argv.parse(
    await yargs(process.argv.slice(2))
      .option("host", { demandOption: true, type: "string" })
      .option("email", { demandOption: true, type: "string" })
      .option("password", { demandOption: true, type: "string" })
      .option("typeName", { demandOption: false, type: "string" })
      .option("outFile", { demandOption: true, type: "string" })
      .help().argv,
  );

  const { host, email, password, typeName, outFile } = argv;
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

  const collectionsType = createCollectionsType(
    typeName ?? "Collections",
    schemas,
  );

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
