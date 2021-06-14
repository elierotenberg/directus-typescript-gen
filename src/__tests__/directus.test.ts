import { Directus } from "@directus/sdk";
import { z } from "zod";

import { MyCollections } from "./fixtures/directus.gen";

describe(`Directus SDK`, () => {
  test(`Connect and fetch`, async () => {
    const client = new Directus<MyCollections>(`http://localhost:17055`);
    await client.auth.login({
      email: `admin@example.com`,
      password: `admin-password`,
    });

    expect(await client.items(`author`).readMany({})).toEqual({ data: [] });

    await client.items(`author`).createMany([
      {
        email: `john.doe@example.com`,
        first_name: `John`,
        last_name: `Doe`,
      },
      { email: `jane.doe@example.com`, first_name: `Jane`, last_name: `Doe` },
    ]);

    expect(
      await client.items(`author`).readOne(`john.doe@example.com`, {
        fields: [`first_name`, `last_name`],
      }),
    ).toEqual({
      first_name: `John`,
      last_name: `Doe`,
    });

    await client.items(`author`).deleteMany([`john.doe@example.com`]);

    await expect(() =>
      client.items(`author`).readOne(`john.doe@example.com`, {
        fields: [`first_name`, `last_name`],
      }),
    ).rejects.toBeTruthy();

    await client
      .items(`author`)
      .deleteMany([`john.doe@example.com`, `jane.doe@example.com`]);

    expect(await client.items(`author`).readMany({})).toEqual({ data: [] });

    await client.items(`author`).createMany([
      {
        email: `john.doe@example.com`,
        first_name: `John`,
        last_name: `Doe`,
      },
      { email: `jane.doe@example.com`, first_name: `Jane`, last_name: `Doe` },
    ]);

    expect(
      await client.items(`author`).readOne(`john.doe@example.com`, {
        fields: [`first_name`, `last_name`],
      }),
    ).toEqual({
      first_name: `John`,
      last_name: `Doe`,
    });

    await client.items(`article`).createOne({
      article_id: `article1`,
      title: `Title for Article 1`,
      body: `Body for Article 1`,
      publish_date: new Date().toISOString(),
    });

    const articleAuthor = await client.items(`article_author`).createOne({
      article_id: `article1`,
      author_email: `john.doe@example.com`,
    });

    const articleAuthorId = z.string().parse(articleAuthor?.article_author_id);

    expect(
      await client
        .items(`article_author`)
        .readOne(articleAuthorId, { fields: [`article_id`, `author_email`] }),
    ).toEqual({
      article_id: `article1`,
      author_email: `john.doe@example.com`,
    });

    expect(
      await client.items(`article_author`).readMany({
        filter: {
          author_email: `john.doe@example.com`,
        },
        fields: [`article_id`],
      }),
    ).toEqual({
      data: [
        {
          article_id: `article1`,
        },
      ],
    });

    expect(
      await client.items(`article_author`).readMany({
        filter: {
          author_email: `jane.doe@example.com`,
        },
        fields: [`article_id`],
      }),
    ).toEqual({
      data: [],
    });

    await client
      .items(`author`)
      .deleteMany([`john.doe@example.com`, `jane.doe@example.com`]);

    expect(await client.items(`article_author`).readMany({})).toEqual({
      data: [],
    });

    await client.items(`article`).deleteMany([`article1`]);

    expect(await client.items(`article`).readMany({})).toEqual({ data: [] });
  });
});
