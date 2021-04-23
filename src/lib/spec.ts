import fetch from "node-fetch";
import {
  isBoolean,
  isExactly,
  isOptionOfType,
  isRecord,
  isString,
} from "typed-assert";

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

type OpenApiSchema = {
  readonly type: "object";
  readonly properties: {
    readonly [propertyKey: string]: {
      readonly nullable?: boolean;
      readonly [paramKey: string]: unknown;
    };
  };
  readonly ["x-collection"]: string;
};

const parseOpenApiSchema = (input: unknown): OpenApiSchema => {
  isRecord(input);
  const { type, properties, ["x-collection"]: xCollection } = input;
  isExactly(type, "object");
  isRecord(properties);
  isString(xCollection);
  for (const [propertyKey, definition] of Object.entries(properties)) {
    isString(propertyKey);
    isRecord(definition);
    isOptionOfType(definition.nullable, isBoolean);
  }
  return input as OpenApiSchema;
};

type JsonSchema = OpenApiSchema & {
  readonly title: string;
  readonly additionalProperties: false;
  readonly required: string[];
};

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

export const parseSchemas = (
  spec: unknown,
): { readonly collection: string; readonly schema: JsonSchema }[] => {
  isRecord(spec);
  const { components } = spec;
  isRecord(components);
  const { schemas } = components;
  isRecord(schemas);

  return Object.entries(schemas)
    .filter(([key]) => key.startsWith("Items"))
    .map(([key, schema]) => {
      const title = key.slice("Items".length);
      const openApiSchema = parseOpenApiSchema(schema);
      return {
        collection: `${openApiSchema["x-collection"]}s`,
        schema: openApiSchemaToJsonSchema(title, openApiSchema),
      };
    });
};

export const createCollectionsType = (
  schemas: { readonly collection: string; readonly schema: JsonSchema }[],
): string => {
  const prefix = `export type Collections = {`;
  const suffix = `};`;
  const properties = schemas.map(
    ({ collection, schema }) => `  ${collection}: ${schema.title};`,
  );
  return [prefix, ...properties, suffix, ""].join("\n");
};
