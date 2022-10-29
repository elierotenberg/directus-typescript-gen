#!/usr/bin/env node

import { promises } from "fs";
import { resolve } from "path";

import { snakeCase } from "change-case";
import fetch from "node-fetch";
import { z } from "zod";
import yargs from "yargs";
import openApiTs, { OpenAPI3 } from "openapi-typescript";

const Argv = z.object({
  host: z.string(),
  email: z.string().nullish(),
  password: z.string().nullish(),
  staticToken: z.string().nullish(),
  typeName: z.string(),
  specOutFile: z.string().nullish(),
  outFile: z.string(),
});

type Argv = z.infer<typeof Argv>;

const main = async (): Promise<void> => {
  const argv = Argv.parse(
    await yargs(process.argv.slice(2))
      .option(`host`, { demandOption: true, type: `string` })
      .option(`email`, { demandOption: false, type: `string` })
      .option(`password`, { demandOption: false, type: `string` })
      .option(`typeName`, { demandOption: true, type: `string` })
      .option(`specOutFile`, { demandOption: false, type: `string` })
      .option(`staticToken`, { demandOption: false, type: `string` })
      .option(`outFile`, { demandOption: true, type: `string` })
      .help().argv,
  );

  const { host, email, password, typeName, specOutFile, outFile, staticToken } =
    argv;

  let accessToken = ``;
  if (!staticToken) {
    if (!email || !password) {
      throw new Error(`Must provide either staticToken or email and password`);
    }
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
    accessToken = token;
  }

  const spec = await (
    await fetch(
      `${host}/server/specs/oas${
        staticToken ? `?access_token=${staticToken}` : ``
      }`,
      {
        method: `get`,
        headers: staticToken
          ? {}
          : {
              Authorization: `Bearer ${accessToken}`,
            },
      },
    )
  ).json();

  if (specOutFile) {
    await promises.writeFile(
      resolve(process.cwd(), specOutFile),
      JSON.stringify(spec, null, 2),
      {
        encoding: `utf-8`,
      },
    );
  }

  const baseSource = openApiTs(spec as OpenAPI3);

  const itemPattern = /^    Items([^\:]*)/;

  const exportProperties = baseSource
    .split(`\n`)
    .map((line) => {
      const match = line.match(itemPattern);
      if (!match) {
        return null;
      }
      const [, collectionName] = match;
      const propertyKey = snakeCase(collectionName);
      return `  ${propertyKey}: components["schemas"]["Items${collectionName}"];`;
    })
    .filter((line): line is string => typeof line === `string`)
    .join(`\n`);

  const exportSource = `export type ${typeName} = {\n${exportProperties}\n};`;

  const source = [baseSource, exportSource].join(`\n`);

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
