#!/usr/bin/env node

import { writeFile } from "fs/promises";
import { resolve } from "path";

import yargs from "yargs";
import type { OpenAPI3 } from "openapi-typescript";

import { generateTypeScript, readSpecFile } from ".";

const main = async (): Promise<void> => {
  const argv = await yargs.options({
    email: {
      alias: `e`,
      description: `Email address`,
      type: `string`,
    },
    host: {
      alias: `h`,
      description: `Remote host`,
      type: `string`,
    },
    outFile: {
      alias: `o`,
      description: `Output file`,
      type: `string`,
    },
    password: {
      alias: `p`,
      description: `Password`,
      type: `string`,
    },
    specFile: {
      alias: `i`,
      description: `Input spec file`,
      type: `string`,
    },
    typeName: {
      alias: `t`,
      default: `Schema`,
      description: `Type name`,
      type: `string`,
    },
  }).argv;

  const spec = await readSpecFile(argv);

  const ts = await generateTypeScript(spec as OpenAPI3, {
    typeName: argv.typeName,
  });

  if (typeof argv.outFile === `string`) {
    await writeFile(resolve(process.cwd(), argv.outFile), ts, {
      encoding: `utf-8`,
    });
  } else {
    console.log(ts);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
