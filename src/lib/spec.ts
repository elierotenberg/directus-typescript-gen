import fetch from "node-fetch";
import { z } from "zod";

export const fetchDirectusSpec = async ({
  email,
  password,
  host,
}: {
  readonly email: string;
  readonly password: string;
  readonly host: string;
}): Promise<unknown> => {
  const {
    data: { access_token: token },
  } = await (
    await fetch(new URL("/auth/login", host).href, {
      method: "post",
      body: JSON.stringify({ email, password, mode: "json" }),
      headers: {
        "Content-Type": "application/json",
      },
    })
  ).json();

  const spec = await (
    await fetch(`${host}/server/specs/oas`, {
      method: "get",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  ).json();

  return spec;
};

const OpenApiSchema = z.object({
  type: z.literal("object"),
  properties: z.record(
    z.intersection(
      z.object({
        nullable: z.boolean().nullish(),
      }),
      z.record(z.unknown()),
    ),
  ),
  ["x-collection"]: z.string(),
});

type OpenApiSchema = z.infer<typeof OpenApiSchema>;

const JsonSchema = z.intersection(
  OpenApiSchema,
  z.object({
    title: z.string(),
    additionalProperties: z.literal(false),
    required: z.array(z.string()),
  }),
);

type JsonSchema = z.infer<typeof JsonSchema>;

const openApiSchemaToJsonSchema = (
  title: string,
  openApiSchema: OpenApiSchema,
): JsonSchema => ({
  title,
  ...openApiSchema,
  required: Object.entries(openApiSchema.properties)
    .filter(([, definition]) => definition.nullable === false)
    .map(([key]) => key),
  additionalProperties: false,
});

const Spec = z.object({
  components: z.object({
    schemas: z.record(z.unknown()),
  }),
});

export const parseSchemas = (
  spec: unknown,
): { readonly collection: string; readonly schema: JsonSchema }[] => {
  const {
    components: { schemas },
  } = Spec.parse(spec);

  return Object.entries(schemas)
    .filter(([key]) => key.startsWith("Items"))
    .map(([key, schema]) => {
      const title = key.slice("Items".length);
      const openApiSchema = OpenApiSchema.parse(schema);
      return {
        collection: `${openApiSchema["x-collection"]}`,
        schema: openApiSchemaToJsonSchema(title, openApiSchema),
      };
    });
};

export const createCollectionsType = (
  typeName: string,
  schemas: { readonly collection: string; readonly schema: JsonSchema }[],
): string => {
  const prefix = `export type ${typeName} = {`;
  const suffix = `};`;
  const properties = schemas.map(
    ({ collection, schema }) => `  ${collection}: ${schema.title};`,
  );
  return [prefix, ...properties, suffix, ""].join("\n");
};
