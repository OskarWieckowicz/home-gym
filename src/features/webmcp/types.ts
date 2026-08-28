export type JsonSchema = Readonly<Record<string, unknown>>;

export type WebMcpExecuteOptions = {
  readonly signal?: AbortSignal;
};

export type WebMcpTool = {
  readonly name: string;
  readonly title?: string;
  readonly description: string;
  readonly inputSchema: JsonSchema;
  readonly annotations?: {
    readonly readOnlyHint: boolean;
  };
  readonly execute: (
    input: unknown,
    options?: WebMcpExecuteOptions,
  ) => unknown | Promise<unknown>;
};

export type WebMcpModelContext = {
  registerTool(
    tool: WebMcpTool,
    options?: { readonly signal?: AbortSignal },
  ): Promise<void>;
};

export type WebMcpDocument = Document & {
  readonly modelContext?: WebMcpModelContext;
};
