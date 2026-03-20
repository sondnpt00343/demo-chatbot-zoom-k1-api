const schema = {
  type: "json_schema",
  json_schema: {
    name: "agent_action",
    strict: true,
    schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["readFile", "writeFile", "exec", "searchWeb", "respond"],
        },
        params: {
          type: "object",
          properties: {
            path: {
              type: ["string", "null"],
              description: "File path. Used by: readFile, writeFile",
            },
            content: {
              type: ["string", "null"],
              description: "File content to write. Used by: writeFile",
            },
            command: {
              type: ["string", "null"],
              description: "Shell command to execute. Used by: exec",
            },
            query: {
              type: ["string", "null"],
              description: "Search query. Used by: searchWeb",
            },
            message: {
              type: ["string", "null"],
              description: "Final response to user. Used by: respond",
            },
            thinking: {
              "type": "string",
              "description": "Brief reasoning: what the agent is about to do and why. Always required."
            },
          },
          required: ["path", "content", "command", "query", "message", "thinking"],
          additionalProperties: false,
        },
      },
      required: ["action", "params"],
      additionalProperties: false,
    },
  },
};

module.exports = schema;
