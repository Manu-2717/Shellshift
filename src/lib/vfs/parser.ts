export interface ParsedCommandLine {
  raw: string;
  command: string;
  args: string[];
  flags: Set<string>;
  positionalArgs: string[];
  error?: string;
}

const MAX_COMMAND_LENGTH = 500;

const FORBIDDEN_SHELL_PATTERNS = [
  { pattern: /\|/, message: "bash: syntax error: pipes ('|') are disabled in this cipher terminal" },
  { pattern: /;/, message: "bash: syntax error: command chaining (';') is disabled in this cipher terminal" },
  { pattern: /&&/, message: "bash: syntax error: conditional execution ('&&') is disabled in this cipher terminal" },
  { pattern: /\|\|/, message: "bash: syntax error: conditional execution ('||') is disabled in this cipher terminal" },
  { pattern: />/, message: "bash: syntax error: output redirection ('>') is disabled in this cipher terminal" },
  { pattern: /</, message: "bash: syntax error: input redirection ('<') is disabled in this cipher terminal" },
  { pattern: /`/, message: "bash: syntax error: backtick substitution is disabled in this cipher terminal" },
  { pattern: /\$\(/, message: "bash: syntax error: command substitution ('$()') is disabled in this cipher terminal" },
  { pattern: /&(?![&])/, message: "bash: syntax error: background tasks ('&') are disabled in this cipher terminal" },
];

/**
 * Tokenizes a command string safely respecting single and double quotes.
 */
export function tokenizeCommand(input: string): { tokens: string[]; error?: string } {
  const tokens: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (char === " " || char === "\t") {
      if (inSingleQuote || inDoubleQuote) {
        current += char;
      } else {
        if (current.length > 0) {
          tokens.push(current);
          current = "";
        }
      }
    } else {
      current += char;
    }
  }

  if (inSingleQuote || inDoubleQuote) {
    return { tokens: [], error: "bash: syntax error: unexpected EOF while looking for matching quote" };
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return { tokens };
}

/**
 * Parses command input safely and extracts command, flags, and arguments.
 */
export function parseCommandLine(input: string): ParsedCommandLine {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      raw: input,
      command: "",
      args: [],
      flags: new Set(),
      positionalArgs: [],
    };
  }

  if (trimmed.length > MAX_COMMAND_LENGTH) {
    return {
      raw: input,
      command: "",
      args: [],
      flags: new Set(),
      positionalArgs: [],
      error: `bash: command exceeds maximum permitted length (${MAX_COMMAND_LENGTH} chars)`,
    };
  }

  // Check forbidden shell constructs
  for (const check of FORBIDDEN_SHELL_PATTERNS) {
    if (check.pattern.test(trimmed)) {
      return {
        raw: input,
        command: "",
        args: [],
        flags: new Set(),
        positionalArgs: [],
        error: check.message,
      };
    }
  }

  const { tokens, error } = tokenizeCommand(trimmed);
  if (error || tokens.length === 0) {
    return {
      raw: input,
      command: "",
      args: [],
      flags: new Set(),
      positionalArgs: [],
      error: error || "",
    };
  }

  const command = tokens[0].toLowerCase();
  const args = tokens.slice(1);
  const flags = new Set<string>();
  const positionalArgs: string[] = [];

  for (const arg of args) {
    if (arg.startsWith("--") && arg.length > 2) {
      flags.add(arg.slice(2));
    } else if (arg.startsWith("-") && arg.length > 1) {
      for (let i = 1; i < arg.length; i++) {
        flags.add(arg[i]);
      }
    } else {
      positionalArgs.push(arg);
    }
  }

  return {
    raw: input,
    command,
    args,
    flags,
    positionalArgs,
  };
}
