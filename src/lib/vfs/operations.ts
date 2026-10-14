import crypto from "crypto";
import { ParsedCommandLine } from "./parser";
import {
  copyNode,
  createDirectory,
  createFile,
  generateAsciiTree,
  getDir,
  getFile,
  getNode,
  moveNode,
  removeNode,
  resolvePath,
} from "./vfs";
import { CommandResult, VfsDirectory, VfsNode, VfsState } from "./types";

export interface OperationContext {
  state: VfsState;
  parsed: ParsedCommandLine;
  enteredCommand: string;
  mappedOperation: string;
}

export type OperationHandler = (ctx: OperationContext) => CommandResult;

function commandResult(
  ctx: OperationContext,
  output = "",
  exitCode = 0,
  stateChanged = false
): CommandResult {
  return {
    output,
    exitCode,
    newCwd: ctx.state.cwd,
    stateChanged,
    enteredCommand: ctx.enteredCommand,
    mappedOperation: ctx.mappedOperation,
    objectiveCheckNeeded: stateChanged,
  };
}

function readFileOperand(ctx: OperationContext, command: string) {
  const targetArg = ctx.parsed.positionalArgs.at(-1);
  if (!targetArg) return { error: `${command}: missing file operand` };
  const file = getFile(ctx.state.root, resolvePath(ctx.state.cwd, targetArg));
  if (!file) return { error: `${command}: ${targetArg}: No such file or directory` };
  return { targetArg, file };
}

function hashFile(ctx: OperationContext, algorithm: string): CommandResult {
  const targetArg = ctx.parsed.positionalArgs[0];
  if (!targetArg) return commandResult(ctx, `${algorithm}sum: missing file operand`, 1);
  const file = getFile(ctx.state.root, resolvePath(ctx.state.cwd, targetArg));
  if (!file) return commandResult(ctx, `${algorithm}sum: ${targetArg}: No such file or directory`, 1);
  try {
    const hash = crypto.createHash(algorithm).update(file.content).digest("hex");
    return commandResult(ctx, `${hash}  ${targetArg}`);
  } catch {
    return commandResult(ctx, `${algorithm}sum: hash failure`, 1);
  }
}

function runTestOp(ctx: OperationContext): CommandResult {
  let args = ctx.parsed.args;
  if (args[args.length - 1] === "]") args = args.slice(0, -1);
  if (args.length === 0) return commandResult(ctx, "", 1);

  if (args[0] === "-f" && args[1]) {
    const node = getNode(ctx.state.root, resolvePath(ctx.state.cwd, args[1]));
    return commandResult(ctx, "", node && node.type === "file" ? 0 : 1);
  }
  if (args[0] === "-d" && args[1]) {
    const node = getNode(ctx.state.root, resolvePath(ctx.state.cwd, args[1]));
    return commandResult(ctx, "", node && node.type === "dir" ? 0 : 1);
  }
  if (args[0] === "-e" && args[1]) {
    const node = getNode(ctx.state.root, resolvePath(ctx.state.cwd, args[1]));
    return commandResult(ctx, "", node ? 0 : 1);
  }
  if (args[0] === "-s" && args[1]) {
    const node = getNode(ctx.state.root, resolvePath(ctx.state.cwd, args[1]));
    return commandResult(ctx, "", node && node.type === "file" && node.content.length > 0 ? 0 : 1);
  }
  if (args[0] === "-z" && args[1]) {
    return commandResult(ctx, "", args[1].length === 0 ? 0 : 1);
  }
  if (args[0] === "-n" && args[1]) {
    return commandResult(ctx, "", args[1].length > 0 ? 0 : 1);
  }
  if (args.length === 3) {
    if (args[1] === "=" || args[1] === "==") {
      return commandResult(ctx, "", args[0] === args[2] ? 0 : 1);
    }
    if (args[1] === "!=") {
      return commandResult(ctx, "", args[0] !== args[2] ? 0 : 1);
    }
    const n1 = Number(args[0]), n2 = Number(args[2]);
    if (!isNaN(n1) && !isNaN(n2)) {
      if (args[1] === "-eq") return commandResult(ctx, "", n1 === n2 ? 0 : 1);
      if (args[1] === "-ne") return commandResult(ctx, "", n1 !== n2 ? 0 : 1);
      if (args[1] === "-lt") return commandResult(ctx, "", n1 < n2 ? 0 : 1);
      if (args[1] === "-le") return commandResult(ctx, "", n1 <= n2 ? 0 : 1);
      if (args[1] === "-gt") return commandResult(ctx, "", n1 > n2 ? 0 : 1);
      if (args[1] === "-ge") return commandResult(ctx, "", n1 >= n2 ? 0 : 1);
    }
  }
  return commandResult(ctx, "", 0);
}

export const operations: Record<string, OperationHandler> = {
  pwd: (ctx) => {
    return {
      output: ctx.state.cwd,
      exitCode: 0,
      newCwd: ctx.state.cwd,
      stateChanged: false,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: false,
    };
  },

  cd: (ctx) => {
    let targetArg = ctx.parsed.positionalArgs[0] || "~";
    let isDash = false;
    if (targetArg === "-") {
      targetArg = ctx.state.oldCwd || "/workspace";
      isDash = true;
    }
    const targetPath = resolvePath(ctx.state.cwd, targetArg);
    const targetNode = getNode(ctx.state.root, targetPath);

    if (!targetNode) {
      return {
        output: `bash: cd: ${targetArg}: No such file or directory`,
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    if (targetNode.type !== "dir") {
      return {
        output: `bash: cd: ${targetArg}: Not a directory`,
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    ctx.state.oldCwd = ctx.state.cwd;
    ctx.state.cwd = targetPath;
    return {
      output: isDash ? targetPath : "",
      exitCode: 0,
      newCwd: targetPath,
      stateChanged: true,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: true,
    };
  },

  ls: (ctx) => {
    const showAll = ctx.parsed.flags.has("a");
    const longFormat = ctx.parsed.flags.has("l");
    const targetArg = ctx.parsed.positionalArgs[0] || ".";
    const targetPath = resolvePath(ctx.state.cwd, targetArg);
    const node = getNode(ctx.state.root, targetPath);

    if (!node) {
      return {
        output: `ls: cannot access '${targetArg}': No such file or directory`,
        exitCode: 2,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    if (node.type === "file") {
      if (longFormat) {
        return {
          output: `${node.permissions || "-rw-r--r--"} 1 player player ${node.content.length.toString().padStart(6)} ${node.name}`,
          exitCode: 0,
          newCwd: ctx.state.cwd,
          stateChanged: false,
          enteredCommand: ctx.enteredCommand,
          mappedOperation: ctx.mappedOperation,
          objectiveCheckNeeded: false,
        };
      }
      return {
        output: node.name,
        exitCode: 0,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const dir = node as VfsDirectory;
    const entries = Object.keys(dir.children).sort();
    const visibleEntries = showAll ? [".", "..", ...entries] : entries.filter((e) => !e.startsWith("."));

    if (visibleEntries.length === 0) {
      return {
        output: "",
        exitCode: 0,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    if (longFormat) {
      const lines = visibleEntries.map((name) => {
        if (name === "." || name === "..") {
          return `drwxr-xr-x 2 player player   4096 ${name}`;
        }
        const child = dir.children[name];
        const isDir = child.type === "dir";
        const perms = child.permissions || (isDir ? "drwxr-xr-x" : "-rw-r--r--");
        const size = isDir ? "4096" : child.content.length.toString();
        return `${perms} 1 player player ${size.padStart(6)} ${name}${isDir ? "/" : ""}`;
      });
      return {
        output: lines.join("\n"),
        exitCode: 0,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const formatted = visibleEntries
      .map((name) => {
        if (name === "." || name === "..") return `${name}/`;
        const child = dir.children[name];
        return child && child.type === "dir" ? `${name}/` : name;
      })
      .join("  ");

    return {
      output: formatted,
      exitCode: 0,
      newCwd: ctx.state.cwd,
      stateChanged: false,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: false,
    };
  },

  cat: (ctx) => {
    if (ctx.parsed.positionalArgs.length === 0) {
      return {
        output: "cat: missing file operand",
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const showLineNums = ctx.parsed.flags.has("n");
    const outputs: string[] = [];
    let exitCode = 0;
    let lineNum = 1;

    for (const targetArg of ctx.parsed.positionalArgs) {
      const targetPath = resolvePath(ctx.state.cwd, targetArg);
      const node = getNode(ctx.state.root, targetPath);

      if (!node) {
        outputs.push(`cat: ${targetArg}: No such file or directory`);
        exitCode = 1;
      } else if (node.type === "dir") {
        outputs.push(`cat: ${targetArg}: Is a directory`);
        exitCode = 1;
      } else {
        if (showLineNums) {
          const formatted = node.content.split("\n").map((l) => `${String(lineNum++).padStart(6)}\t${l}`).join("\n");
          outputs.push(formatted);
        } else {
          outputs.push(node.content);
        }
      }
    }

    return {
      output: outputs.join("\n"),
      exitCode,
      newCwd: ctx.state.cwd,
      stateChanged: false,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: false,
    };
  },

  mkdir: (ctx) => {
    if (ctx.parsed.positionalArgs.length === 0) {
      return {
        output: "mkdir: missing operand",
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const recursive = ctx.parsed.flags.has("p");
    const errors: string[] = [];
    let stateChanged = false;

    for (const targetArg of ctx.parsed.positionalArgs) {
      const targetPath = resolvePath(ctx.state.cwd, targetArg);
      const res = createDirectory(ctx.state.root, targetPath, recursive);
      if (!res.success) {
        errors.push(res.error || `mkdir: cannot create directory '${targetArg}'`);
      } else {
        stateChanged = true;
      }
    }

    return {
      output: errors.join("\n"),
      exitCode: errors.length > 0 ? 1 : 0,
      newCwd: ctx.state.cwd,
      stateChanged,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: stateChanged,
    };
  },

  touch: (ctx) => {
    if (ctx.parsed.positionalArgs.length === 0) {
      return {
        output: "touch: missing file operand",
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const errors: string[] = [];
    let stateChanged = false;

    for (const targetArg of ctx.parsed.positionalArgs) {
      const targetPath = resolvePath(ctx.state.cwd, targetArg);
      const res = createFile(ctx.state.root, targetPath, "");
      if (!res.success) {
        errors.push(res.error || `touch: cannot touch '${targetArg}'`);
      } else {
        stateChanged = true;
      }
    }

    return {
      output: errors.join("\n"),
      exitCode: errors.length > 0 ? 1 : 0,
      newCwd: ctx.state.cwd,
      stateChanged,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: stateChanged,
    };
  },

  rm: (ctx) => {
    if (ctx.parsed.positionalArgs.length === 0) {
      return {
        output: "rm: missing operand",
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const recursive = ctx.parsed.flags.has("r") || ctx.parsed.flags.has("R");
    const force = ctx.parsed.flags.has("f");
    const errors: string[] = [];
    let stateChanged = false;

    for (const targetArg of ctx.parsed.positionalArgs) {
      const targetPath = resolvePath(ctx.state.cwd, targetArg);
      const res = removeNode(ctx.state.root, targetPath, recursive);
      if (!res.success) {
        if (!force) {
          errors.push(res.error || `rm: cannot remove '${targetArg}'`);
        }
      } else {
        stateChanged = true;
      }
    }

    return {
      output: errors.join("\n"),
      exitCode: errors.length > 0 ? 1 : 0,
      newCwd: ctx.state.cwd,
      stateChanged,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: stateChanged,
    };
  },

  cp: (ctx) => {
    if (ctx.parsed.positionalArgs.length < 2) {
      return {
        output: "cp: missing destination file operand",
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const recursive = ctx.parsed.flags.has("r") || ctx.parsed.flags.has("R");
    const srcArg = ctx.parsed.positionalArgs[0];
    const destArg = ctx.parsed.positionalArgs[1];
    const srcPath = resolvePath(ctx.state.cwd, srcArg);
    const destPath = resolvePath(ctx.state.cwd, destArg);

    const res = copyNode(ctx.state.root, srcPath, destPath, recursive);
    return {
      output: res.success ? "" : res.error || "cp: copy failed",
      exitCode: res.success ? 0 : 1,
      newCwd: ctx.state.cwd,
      stateChanged: res.success,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: res.success,
    };
  },

  mv: (ctx) => {
    if (ctx.parsed.positionalArgs.length < 2) {
      return {
        output: "mv: missing destination file operand",
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const srcArg = ctx.parsed.positionalArgs[0];
    const destArg = ctx.parsed.positionalArgs[1];
    const srcPath = resolvePath(ctx.state.cwd, srcArg);
    const destPath = resolvePath(ctx.state.cwd, destArg);

    const res = moveNode(ctx.state.root, srcPath, destPath);
    return {
      output: res.success ? "" : res.error || "mv: move failed",
      exitCode: res.success ? 0 : 1,
      newCwd: ctx.state.cwd,
      stateChanged: res.success,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: res.success,
    };
  },

  find: (ctx) => {
    let startArg = ".";
    let namePattern: string | null = null;
    let typeFilter: string | null = null;

    for (let i = 0; i < ctx.parsed.args.length; i++) {
      const arg = ctx.parsed.args[i];
      if (arg === "-name" && i + 1 < ctx.parsed.args.length) {
        namePattern = ctx.parsed.args[i + 1];
        i++;
      } else if (arg === "-type" && i + 1 < ctx.parsed.args.length) {
        typeFilter = ctx.parsed.args[i + 1];
        i++;
      } else if (!arg.startsWith("-") && startArg === ".") {
        startArg = arg;
      }
    }

    const startPath = resolvePath(ctx.state.cwd, startArg);
    const startNode = getNode(ctx.state.root, startPath);

    if (!startNode) {
      return {
        output: `find: '${startArg}': No such file or directory`,
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const matchesPattern = (name: string, pat: string) => {
      if (pat.startsWith("*") && pat.endsWith("*") && pat.length > 2) {
        return name.includes(pat.slice(1, -1));
      }
      if (pat.startsWith("*")) {
        return name.endsWith(pat.slice(1));
      }
      if (pat.endsWith("*")) {
        return name.startsWith(pat.slice(0, -1));
      }
      return name === pat;
    };

    const results: string[] = [];
    const walk = (currPath: string, node: VfsNode, name: string) => {
      let include = true;
      if (typeFilter === "f" && node.type !== "file") include = false;
      if (typeFilter === "d" && node.type !== "dir") include = false;
      if (namePattern && !matchesPattern(name, namePattern)) include = false;

      if (include) {
        results.push(currPath);
      }

      if (node.type === "dir") {
        for (const [childName, child] of Object.entries(node.children)) {
          walk(currPath === "/" ? `/${childName}` : `${currPath}/${childName}`, child, childName);
        }
      }
    };

    const baseName = startPath === "/" ? "/" : startPath.split("/").pop() || "";
    walk(startPath === "/" ? "/" : startPath, startNode, baseName);

    return {
      output: results.join("\n"),
      exitCode: 0,
      newCwd: ctx.state.cwd,
      stateChanged: false,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: false,
    };
  },

  grep: (ctx) => {
    const caseInsensitive = ctx.parsed.flags.has("i");
    const showLineNums = ctx.parsed.flags.has("n");
    const invert = ctx.parsed.flags.has("v");
    const nonFlagArgs = ctx.parsed.args.filter((a) => !a.startsWith("-"));

    if (nonFlagArgs.length < 2) {
      return {
        output: "grep: missing pattern or file operand",
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const pattern = nonFlagArgs[0];
    const fileArg = nonFlagArgs[1];
    const filePath = resolvePath(ctx.state.cwd, fileArg);
    const file = getFile(ctx.state.root, filePath);

    if (!file) {
      return {
        output: `grep: ${fileArg}: No such file or directory`,
        exitCode: 2,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const lines = file.content.split("\n");
    const testPattern = caseInsensitive ? pattern.toLowerCase() : pattern;
    const matched: string[] = [];

    lines.forEach((line, idx) => {
      const testLine = caseInsensitive ? line.toLowerCase() : line;
      const contains = testLine.includes(testPattern);
      const isMatch = invert ? !contains : contains;
      if (isMatch) {
        matched.push(showLineNums ? `${idx + 1}:${line}` : line);
      }
    });

    return {
      output: matched.join("\n"),
      exitCode: matched.length > 0 ? 0 : 1,
      newCwd: ctx.state.cwd,
      stateChanged: false,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: false,
    };
  },

  head: (ctx) => {
    let count = 10;
    const fileArgs: string[] = [];

    for (let i = 0; i < ctx.parsed.args.length; i++) {
      const arg = ctx.parsed.args[i];
      if (arg === "-n" && i + 1 < ctx.parsed.args.length) {
        const parsedNum = parseInt(ctx.parsed.args[i + 1], 10);
        if (!isNaN(parsedNum) && parsedNum > 0) {
          count = parsedNum;
        }
        i++;
      } else if (arg.startsWith("-n") && arg.length > 2) {
        const parsedNum = parseInt(arg.slice(2), 10);
        if (!isNaN(parsedNum) && parsedNum > 0) {
          count = parsedNum;
        }
      } else if (/^-\d+$/.test(arg)) {
        const parsedNum = parseInt(arg.slice(1), 10);
        if (!isNaN(parsedNum) && parsedNum > 0) {
          count = parsedNum;
        }
      } else if (!arg.startsWith("-")) {
        fileArgs.push(arg);
      }
    }

    if (fileArgs.length === 0) {
      return {
        output: "head: missing file operand",
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const fileArg = fileArgs[0];
    const filePath = resolvePath(ctx.state.cwd, fileArg);
    const file = getFile(ctx.state.root, filePath);

    if (!file) {
      return {
        output: `head: cannot open '${fileArg}': No such file or directory`,
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const lines = file.content.split("\n");
    return {
      output: lines.slice(0, count).join("\n"),
      exitCode: 0,
      newCwd: ctx.state.cwd,
      stateChanged: false,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: false,
    };
  },

  tail: (ctx) => {
    let count = 10;
    const fileArgs: string[] = [];

    for (let i = 0; i < ctx.parsed.args.length; i++) {
      const arg = ctx.parsed.args[i];
      if (arg === "-n" && i + 1 < ctx.parsed.args.length) {
        const parsedNum = parseInt(ctx.parsed.args[i + 1], 10);
        if (!isNaN(parsedNum) && parsedNum > 0) {
          count = parsedNum;
        }
        i++;
      } else if (arg.startsWith("-n") && arg.length > 2) {
        const parsedNum = parseInt(arg.slice(2), 10);
        if (!isNaN(parsedNum) && parsedNum > 0) {
          count = parsedNum;
        }
      } else if (/^-\d+$/.test(arg)) {
        const parsedNum = parseInt(arg.slice(1), 10);
        if (!isNaN(parsedNum) && parsedNum > 0) {
          count = parsedNum;
        }
      } else if (!arg.startsWith("-")) {
        fileArgs.push(arg);
      }
    }

    if (fileArgs.length === 0) {
      return {
        output: "tail: missing file operand",
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const fileArg = fileArgs[0];
    const filePath = resolvePath(ctx.state.cwd, fileArg);
    const file = getFile(ctx.state.root, filePath);

    if (!file) {
      return {
        output: `tail: cannot open '${fileArg}': No such file or directory`,
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const lines = file.content.split("\n");
    return {
      output: lines.slice(-count).join("\n"),
      exitCode: 0,
      newCwd: ctx.state.cwd,
      stateChanged: false,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: false,
    };
  },

  echo: (ctx) => {
    let outputFile: string | null = null;
    const textParts: string[] = [];

    for (let i = 0; i < ctx.parsed.args.length; i++) {
      const arg = ctx.parsed.args[i];
      if ((arg === "-o" || arg === "--output") && i + 1 < ctx.parsed.args.length) {
        outputFile = ctx.parsed.args[i + 1];
        i++;
      } else {
        textParts.push(arg);
      }
    }

    if (outputFile) {
      const destPath = resolvePath(ctx.state.cwd, outputFile);
      createFile(ctx.state.root, destPath, textParts.join(" "));
      return {
        output: "",
        exitCode: 0,
        newCwd: ctx.state.cwd,
        stateChanged: true,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: true,
      };
    }

    // Heuristic: if exactly 2 positional arguments and 2nd argument has '/' or recognized extension
    if (ctx.parsed.positionalArgs.length === 2) {
      const text = ctx.parsed.positionalArgs[0];
      const destArg = ctx.parsed.positionalArgs[1];
      const hasExt = /\.(txt|dat|key|log|conf|json|csv|md|bin)$/i.test(destArg);
      if (destArg.includes("/") || hasExt) {
        const destPath = resolvePath(ctx.state.cwd, destArg);
        createFile(ctx.state.root, destPath, text);
        return {
          output: "",
          exitCode: 0,
          newCwd: ctx.state.cwd,
          stateChanged: true,
          enteredCommand: ctx.enteredCommand,
          mappedOperation: ctx.mappedOperation,
          objectiveCheckNeeded: true,
        };
      }
    }

    const text = textParts.join(" ");
    return {
      output: text,
      exitCode: 0,
      newCwd: ctx.state.cwd,
      stateChanged: false,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: false,
    };
  },

  tree: (ctx) => {
    const targetArg = ctx.parsed.positionalArgs[0] || ".";
    const targetPath = resolvePath(ctx.state.cwd, targetArg);
    const targetDir = getDir(ctx.state.root, targetPath);

    if (!targetDir) {
      return {
        output: `${targetArg} [error opening dir]`,
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }

    const treeLines = generateAsciiTree(targetDir);
    return {
      output: `${targetArg}\n` + (treeLines.length > 0 ? treeLines.join("\n") : "└── (empty)"),
      exitCode: 0,
      newCwd: ctx.state.cwd,
      stateChanged: false,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: false,
    };
  },

  whoami: (ctx) => ({
    output: "player",
    exitCode: 0,
    newCwd: ctx.state.cwd,
    stateChanged: false,
    enteredCommand: ctx.enteredCommand,
    mappedOperation: ctx.mappedOperation,
    objectiveCheckNeeded: false,
  }),

  hostname: (ctx) => ({
    output: "shellshift",
    exitCode: 0,
    newCwd: ctx.state.cwd,
    stateChanged: false,
    enteredCommand: ctx.enteredCommand,
    mappedOperation: ctx.mappedOperation,
    objectiveCheckNeeded: false,
  }),

  id: (ctx) => ({
    output: "uid=1000(player) gid=1000(player) groups=1000(player)",
    exitCode: 0,
    newCwd: ctx.state.cwd,
    stateChanged: false,
    enteredCommand: ctx.enteredCommand,
    mappedOperation: ctx.mappedOperation,
    objectiveCheckNeeded: false,
  }),

  uname: (ctx) => ({
    output: ctx.parsed.flags.has("a")
      ? "Linux shellshift 6.8.0-virtual #1 SMP x86_64 GNU/Linux"
      : "Linux",
    exitCode: 0,
    newCwd: ctx.state.cwd,
    stateChanged: false,
    enteredCommand: ctx.enteredCommand,
    mappedOperation: ctx.mappedOperation,
    objectiveCheckNeeded: false,
  }),

  file: (ctx) => {
    const targetArg = ctx.parsed.positionalArgs[0];
    if (!targetArg) {
      return {
        output: "file: missing file operand",
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }
    const node = getNode(ctx.state.root, resolvePath(ctx.state.cwd, targetArg));
    return {
      output: !node
        ? `${targetArg}: cannot open: No such file or directory`
        : node.type === "dir"
          ? `${targetArg}: directory`
          : `${targetArg}: ASCII text`,
      exitCode: node ? 0 : 1,
      newCwd: ctx.state.cwd,
      stateChanged: false,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: false,
    };
  },

  wc: (ctx) => {
    const targetArg = ctx.parsed.positionalArgs[0];
    const file = targetArg
      ? getFile(ctx.state.root, resolvePath(ctx.state.cwd, targetArg))
      : null;
    if (!targetArg || !file) {
      return {
        output: targetArg ? `wc: ${targetArg}: No such file or directory` : "wc: missing file operand",
        exitCode: 1,
        newCwd: ctx.state.cwd,
        stateChanged: false,
        enteredCommand: ctx.enteredCommand,
        mappedOperation: ctx.mappedOperation,
        objectiveCheckNeeded: false,
      };
    }
    const lines = file.content === "" ? 0 : file.content.split("\n").length;
    const words = file.content.trim() ? file.content.trim().split(/\s+/).length : 0;
    const bytes = Buffer.byteLength(file.content, "utf8");
    const counts = ctx.parsed.flags.has("l")
      ? `${lines}`
      : ctx.parsed.flags.has("w")
        ? `${words}`
        : ctx.parsed.flags.has("c")
          ? `${bytes}`
          : `${lines} ${words} ${bytes}`;
    return {
      output: `${counts} ${targetArg}`,
      exitCode: 0,
      newCwd: ctx.state.cwd,
      stateChanged: false,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: false,
    };
  },

  rmdir: (ctx) => {
    if (ctx.parsed.positionalArgs.length === 0) return commandResult(ctx, "rmdir: missing operand", 1);
    const errors: string[] = [];
    let changed = false;
    for (const targetArg of ctx.parsed.positionalArgs) {
      const path = resolvePath(ctx.state.cwd, targetArg);
      const node = getNode(ctx.state.root, path);
      if (!node) errors.push(`rmdir: failed to remove '${targetArg}': No such file or directory`);
      else if (node.type !== "dir") errors.push(`rmdir: failed to remove '${targetArg}': Not a directory`);
      else if (Object.keys(node.children).length > 0) errors.push(`rmdir: failed to remove '${targetArg}': Directory not empty`);
      else {
        const removed = removeNode(ctx.state.root, path, true);
        if (removed.success) changed = true;
        else errors.push(removed.error || `rmdir: failed to remove '${targetArg}'`);
      }
    }
    return commandResult(ctx, errors.join("\n"), errors.length ? 1 : 0, changed);
  },

  basename: (ctx) => {
    const input = ctx.parsed.positionalArgs[0];
    if (!input) return commandResult(ctx, "basename: missing operand", 1);
    const clean = input.replace(/\/+$/, "") || "/";
    let value = clean === "/" ? "/" : clean.split("/").pop() || "";
    const suffix = ctx.parsed.positionalArgs[1];
    if (suffix && value.endsWith(suffix)) value = value.slice(0, -suffix.length);
    return commandResult(ctx, value);
  },

  dirname: (ctx) => {
    const input = ctx.parsed.positionalArgs[0];
    if (!input) return commandResult(ctx, "dirname: missing operand", 1);
    const clean = input.replace(/\/+$/, "") || "/";
    const slash = clean.lastIndexOf("/");
    return commandResult(ctx, slash < 0 ? "." : slash === 0 ? "/" : clean.slice(0, slash));
  },

  stat: (ctx) => {
    const targetArg = ctx.parsed.positionalArgs[0];
    if (!targetArg) return commandResult(ctx, "stat: missing operand", 1);
    const node = getNode(ctx.state.root, resolvePath(ctx.state.cwd, targetArg));
    if (!node) return commandResult(ctx, `stat: cannot stat '${targetArg}': No such file or directory`, 1);
    const size = node.type === "file" ? Buffer.byteLength(node.content, "utf8") : 4096;
    const kind = node.type === "file" ? "regular file" : "directory";
    const perms = node.permissions || (node.type === "file" ? "rw-r--r--" : "rwxr-xr-x");
    return commandResult(ctx, `  File: ${targetArg}\n  Size: ${size}\tType: ${kind}\nAccess: (${perms})\tOwner: player\nModify: virtual filesystem`);
  },

  du: (ctx) => {
    const targetArg = ctx.parsed.positionalArgs[0] || ".";
    const node = getNode(ctx.state.root, resolvePath(ctx.state.cwd, targetArg));
    if (!node) return commandResult(ctx, `du: cannot access '${targetArg}': No such file or directory`, 1);
    const bytes = (current: VfsNode): number => current.type === "file"
      ? Buffer.byteLength(current.content, "utf8")
      : Object.values(current.children).reduce((total, child) => total + bytes(child), 0);
    const size = bytes(node);
    return commandResult(ctx, `${ctx.parsed.flags.has("h") ? `${Math.max(1, Math.ceil(size / 1024))}K` : Math.max(1, Math.ceil(size / 1024))}\t${targetArg}`);
  },

  sort: (ctx) => {
    const source = readFileOperand(ctx, "sort");
    if (source.error || !source.file) return commandResult(ctx, source.error, 1);
    const numeric = ctx.parsed.flags.has("n");
    const reverse = ctx.parsed.flags.has("r");
    const unique = ctx.parsed.flags.has("u");
    let lines = source.file.content.split("\n").sort((a, b) => numeric ? Number(a) - Number(b) : a.localeCompare(b));
    if (unique) lines = lines.filter((line, index) => index === 0 || line !== lines[index - 1]);
    if (reverse) lines.reverse();
    return commandResult(ctx, lines.join("\n"));
  },

  uniq: (ctx) => {
    const source = readFileOperand(ctx, "uniq");
    if (source.error || !source.file) return commandResult(ctx, source.error, 1);
    const lines = source.file.content.split("\n");
    const groups: Array<{ line: string; count: number }> = [];
    for (const line of lines) {
      const last = groups.at(-1);
      if (last?.line === line) last.count++;
      else groups.push({ line, count: 1 });
    }
    const selected = groups.filter((group) => !ctx.parsed.flags.has("d") || group.count > 1);
    return commandResult(ctx, selected.map((group) => ctx.parsed.flags.has("c") ? `${String(group.count).padStart(7)} ${group.line}` : group.line).join("\n"));
  },

  nl: (ctx) => {
    const source = readFileOperand(ctx, "nl");
    if (source.error || !source.file) return commandResult(ctx, source.error, 1);
    return commandResult(ctx, source.file.content.split("\n").map((line, index) => `${String(index + 1).padStart(6)}\t${line}`).join("\n"));
  },

  tac: (ctx) => {
    const source = readFileOperand(ctx, "tac");
    if (source.error || !source.file) return commandResult(ctx, source.error, 1);
    return commandResult(ctx, source.file.content.split("\n").reverse().join("\n"));
  },

  rev: (ctx) => {
    const source = readFileOperand(ctx, "rev");
    if (source.error || !source.file) return commandResult(ctx, source.error, 1);
    return commandResult(ctx, source.file.content.split("\n").map((line) => [...line].reverse().join("")).join("\n"));
  },

  cut: (ctx) => {
    let delimiter = "\t";
    let field = 0;
    let fileArg = "";
    for (let i = 0; i < ctx.parsed.args.length; i++) {
      const arg = ctx.parsed.args[i];
      if (arg === "-d" && ctx.parsed.args[i + 1]) delimiter = ctx.parsed.args[++i];
      else if (arg.startsWith("-d") && arg.length > 2) delimiter = arg.slice(2);
      else if (arg === "-f" && ctx.parsed.args[i + 1]) field = Number(ctx.parsed.args[++i]);
      else if (arg.startsWith("-f") && arg.length > 2) field = Number(arg.slice(2));
      else if (!arg.startsWith("-")) fileArg = arg;
    }
    if (!field || !fileArg) return commandResult(ctx, "cut: you must specify a field list and file", 1);
    const file = getFile(ctx.state.root, resolvePath(ctx.state.cwd, fileArg));
    if (!file) return commandResult(ctx, `cut: ${fileArg}: No such file or directory`, 1);
    return commandResult(ctx, file.content.split("\n").map((line) => line.split(delimiter)[field - 1] ?? "").join("\n"));
  },

  date: (ctx) => commandResult(ctx, new Date().toUTCString()),

  env: (ctx) => commandResult(ctx, Object.entries({ HOME: "/workspace", USER: "player", SHELL: "/bin/shellshift", PWD: ctx.state.cwd, ...(ctx.state.env || {}) }).map(([key, value]) => `${key}=${value}`).join("\n")),

  printenv: (ctx) => {
    const vars = { HOME: "/workspace", USER: "player", SHELL: "/bin/shellshift", PWD: ctx.state.cwd, ...(ctx.state.env || {}) };
    const name = ctx.parsed.positionalArgs[0];
    if (!name) return commandResult(ctx, Object.entries(vars).map(([key, value]) => `${key}=${value}`).join("\n"));
    return name in vars ? commandResult(ctx, vars[name as keyof typeof vars]) : commandResult(ctx, "", 1);
  },

  which: (ctx) => {
    const name = ctx.parsed.positionalArgs[0];
    if (!name) return commandResult(ctx, "which: missing command name", 1);
    return operations[name] ? commandResult(ctx, `/usr/bin/${name}`) : commandResult(ctx, `${name} not found`, 1);
  },

  type: (ctx) => {
    const name = ctx.parsed.positionalArgs[0];
    if (!name) return commandResult(ctx, "type: missing command name", 1);
    return operations[name] ? commandResult(ctx, `${name} is a virtual shell command`) : commandResult(ctx, `bash: type: ${name}: not found`, 1);
  },

  true: (ctx) => commandResult(ctx),
  false: (ctx) => commandResult(ctx, "", 1),

  clear: (ctx) => {
    return {
      output: "",
      exitCode: 0,
      newCwd: ctx.state.cwd,
      stateChanged: false,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: false,
      clearScreen: true,
    };
  },

  help: (ctx) => {
    const msg = [
      "ShellShift Virtual Shell v3.0 (Simulated Linux Sandbox)",
      "--------------------------------------------------",
      "Available command utilities:",
      "  Navigation: pwd, ls, cd, tree, realpath, readlink",
      "  Files: cat, touch, mkdir, rmdir, cp, mv, rm, file, stat, du, wc, ln, truncate, shred",
      "  Inspection/Dump: strings, xxd, hexdump, od, less, more",
      "  Crypto/Checksums: base64, base32, md5sum, sha1sum, sha256sum, sha512sum, shasum, cksum, sum",
      "  Paths: basename, dirname",
      "  Search/Text: find, grep, egrep, fgrep, head, tail, sort, uniq, cut, nl, tac, rev, tr, diff, cmp, comm, paste, fold, sed, awk, echo, printf, tee",
      "  System: whoami, hostname, id, groups, uname, arch, date, cal, uptime, w, who, env, printenv, export, set, unset, which, whereis, type, df, free, ps, top, kill, pkill, umask",
      "  Network (Sandboxed): ping, curl, wget, nc, netcat, ssh, netstat, ifconfig, ip",
      "  Control: true, false, test, [, sleep, expr, bc, seq, yes, xargs, bash, sh, source, ., alias, unalias, history, clear, reset, exit, logout, help",
      "",
      "NOTE: In this cipher race, command tokens may be mapped to unexpected operations!",
      "Decode the cipher sheet clues to reveal the active command matrix.",
    ].join("\n");

    return {
      output: msg,
      exitCode: 0,
      newCwd: ctx.state.cwd,
      stateChanged: false,
      enteredCommand: ctx.enteredCommand,
      mappedOperation: ctx.mappedOperation,
      objectiveCheckNeeded: false,
    };
  },

  diff: (ctx) => {
    if (ctx.parsed.positionalArgs.length < 2) {
      return commandResult(ctx, "diff: missing operand after '" + (ctx.parsed.positionalArgs[0] || "") + "'", 2);
    }
    const f1 = readFileOperand({ ...ctx, parsed: { ...ctx.parsed, positionalArgs: [ctx.parsed.positionalArgs[0]] } }, "diff");
    const f2 = readFileOperand({ ...ctx, parsed: { ...ctx.parsed, positionalArgs: [ctx.parsed.positionalArgs[1]] } }, "diff");
    if (f1.error || !f1.file) return commandResult(ctx, f1.error || "diff: error reading file", 2);
    if (f2.error || !f2.file) return commandResult(ctx, f2.error || "diff: error reading file", 2);
    if (f1.file.content === f2.file.content) return commandResult(ctx);
    const l1 = f1.file.content.split("\n");
    const l2 = f2.file.content.split("\n");
    const isUnified = ctx.parsed.flags.has("u");
    if (isUnified) {
      const diffLines = [
        `--- ${ctx.parsed.positionalArgs[0]}`,
        `+++ ${ctx.parsed.positionalArgs[1]}`,
        `@@ -1,${l1.length} +1,${l2.length} @@`
      ];
      l1.forEach(l => diffLines.push("-" + l));
      l2.forEach(l => diffLines.push("+" + l));
      return commandResult(ctx, diffLines.join("\n"), 1);
    }
    const diffLines = [`1,${l1.length}c1,${l2.length}`];
    l1.forEach(l => diffLines.push("< " + l));
    diffLines.push("---");
    l2.forEach(l => diffLines.push("> " + l));
    return commandResult(ctx, diffLines.join("\n"), 1);
  },

  cmp: (ctx) => {
    if (ctx.parsed.positionalArgs.length < 2) return commandResult(ctx, "cmp: missing operand", 2);
    const f1 = readFileOperand({ ...ctx, parsed: { ...ctx.parsed, positionalArgs: [ctx.parsed.positionalArgs[0]] } }, "cmp");
    const f2 = readFileOperand({ ...ctx, parsed: { ...ctx.parsed, positionalArgs: [ctx.parsed.positionalArgs[1]] } }, "cmp");
    if (f1.error || !f1.file) return commandResult(ctx, f1.error || "cmp: error reading file", 2);
    if (f2.error || !f2.file) return commandResult(ctx, f2.error || "cmp: error reading file", 2);
    if (f1.file.content === f2.file.content) return commandResult(ctx);
    const b1 = Buffer.from(f1.file.content);
    const b2 = Buffer.from(f2.file.content);
    let byte = 1, line = 1;
    for (let i = 0; i < Math.max(b1.length, b2.length); i++) {
      if (b1[i] !== b2[i]) {
        return commandResult(ctx, `${ctx.parsed.positionalArgs[0]} ${ctx.parsed.positionalArgs[1]} differ: byte ${byte}, line ${line}`, 1);
      }
      if (b1[i] === 10) line++;
      byte++;
    }
    return commandResult(ctx);
  },

  strings: (ctx) => {
    const targetArg = ctx.parsed.positionalArgs[0];
    if (!targetArg) return commandResult(ctx, "strings: missing file operand", 1);
    const node = getNode(ctx.state.root, resolvePath(ctx.state.cwd, targetArg));
    if (!node || node.type !== "file") return commandResult(ctx, `strings: '${targetArg}': No such file`, 1);
    const minLen = 4;
    const matches = node.content.match(new RegExp(`[\\x20-\\x7E]{${minLen},}`, "g")) || [];
    return commandResult(ctx, matches.join("\n"));
  },

  base64: (ctx) => {
    const isDecode = ctx.parsed.flags.has("d") || ctx.parsed.flags.has("decode");
    let content = "";
    const targetArg = ctx.parsed.positionalArgs[0];
    if (targetArg) {
      const node = getNode(ctx.state.root, resolvePath(ctx.state.cwd, targetArg));
      if (node && node.type === "file") {
        content = node.content;
      } else {
        content = targetArg;
      }
    } else {
      return commandResult(ctx, "base64: missing operand", 1);
    }
    try {
      if (isDecode) {
        const decoded = Buffer.from(content.trim(), "base64").toString("utf8");
        return commandResult(ctx, decoded);
      } else {
        const encoded = Buffer.from(content).toString("base64");
        return commandResult(ctx, encoded);
      }
    } catch {
      return commandResult(ctx, "base64: invalid input", 1);
    }
  },

  base32: (ctx) => {
    const isDecode = ctx.parsed.flags.has("d") || ctx.parsed.flags.has("decode");
    const targetArg = ctx.parsed.positionalArgs[0];
    if (!targetArg) return commandResult(ctx, "base32: missing operand", 1);
    const node = getNode(ctx.state.root, resolvePath(ctx.state.cwd, targetArg));
    const content = node && node.type === "file" ? node.content : targetArg;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    if (isDecode) {
      let bits = 0, val = 0, output = "";
      for (const char of content.toUpperCase().replace(/=/g, "").trim()) {
        const idx = alphabet.indexOf(char);
        if (idx === -1) continue;
        val = (val << 5) | idx;
        bits += 5;
        if (bits >= 8) {
          bits -= 8;
          output += String.fromCharCode((val >> bits) & 0xff);
        }
      }
      return commandResult(ctx, output);
    } else {
      let bits = 0, val = 0, output = "";
      for (let i = 0; i < content.length; i++) {
        val = (val << 8) | content.charCodeAt(i);
        bits += 8;
        while (bits >= 5) {
          bits -= 5;
          output += alphabet[(val >> bits) & 0x1f];
        }
      }
      if (bits > 0) output += alphabet[(val << (5 - bits)) & 0x1f];
      while (output.length % 8 !== 0) output += "=";
      return commandResult(ctx, output);
    }
  },

  tr: (ctx) => {
    if (ctx.parsed.args.length === 0) return commandResult(ctx, "tr: missing operand", 1);
    const isDelete = ctx.parsed.flags.has("d");
    let set1 = "";
    let set2 = "";
    let inputStr = "";
    const pos = ctx.parsed.positionalArgs;
    if (isDelete) {
      set1 = pos[0] || "";
      if (pos[1]) {
        const f = getFile(ctx.state.root, resolvePath(ctx.state.cwd, pos[1]));
        inputStr = f ? f.content : pos[1];
      }
      if (!inputStr && pos.length > 1) inputStr = pos.slice(1).join(" ");
      const chars = new Set(set1);
      const res = [...inputStr].filter(c => !chars.has(c)).join("");
      return commandResult(ctx, res);
    }
    set1 = pos[0] || "";
    set2 = pos[1] || "";
    if (pos[2]) {
      const f = getFile(ctx.state.root, resolvePath(ctx.state.cwd, pos[2]));
      inputStr = f ? f.content : pos.slice(2).join(" ");
    }
    const expand = (s: string) => {
      let res = "";
      for (let i = 0; i < s.length; i++) {
        if (s[i + 1] === "-" && s[i + 2]) {
          const start = s.charCodeAt(i);
          const end = s.charCodeAt(i + 2);
          for (let c = start; c <= end; c++) res += String.fromCharCode(c);
          i += 2;
        } else {
          res += s[i];
        }
      }
      return res;
    };
    const exp1 = expand(set1);
    const exp2 = expand(set2);
    const map = new Map<string, string>();
    for (let i = 0; i < exp1.length; i++) {
      map.set(exp1[i], exp2[i] ?? exp2[exp2.length - 1] ?? "");
    }
    const res = [...inputStr].map(c => map.get(c) ?? c).join("");
    return commandResult(ctx, res);
  },

  md5sum: (ctx) => hashFile(ctx, "md5"),
  sha1sum: (ctx) => hashFile(ctx, "sha1"),
  sha256sum: (ctx) => hashFile(ctx, "sha256"),
  sha512sum: (ctx) => hashFile(ctx, "sha512"),
  shasum: (ctx) => {
    let algo = "sha1";
    for (let i = 0; i < ctx.parsed.args.length; i++) {
      if (ctx.parsed.args[i] === "-a" && ctx.parsed.args[i + 1]) {
        const val = ctx.parsed.args[i + 1];
        if (val === "256") algo = "sha256";
        else if (val === "512") algo = "sha512";
        else if (val === "1") algo = "sha1";
      }
    }
    return hashFile(ctx, algo);
  },
  cksum: (ctx) => {
    const targetArg = ctx.parsed.positionalArgs[0];
    if (!targetArg) return commandResult(ctx, "cksum: missing operand", 1);
    const file = getFile(ctx.state.root, resolvePath(ctx.state.cwd, targetArg));
    if (!file) return commandResult(ctx, `cksum: ${targetArg}: No such file or directory`, 1);
    let crc = 0;
    const buf = Buffer.from(file.content);
    for (let i = 0; i < buf.length; i++) crc = (crc + buf[i]) >>> 0;
    return commandResult(ctx, `${crc} ${buf.length} ${targetArg}`);
  },
  sum: (ctx) => {
    const targetArg = ctx.parsed.positionalArgs[0];
    if (!targetArg) return commandResult(ctx, "sum: missing operand", 1);
    const file = getFile(ctx.state.root, resolvePath(ctx.state.cwd, targetArg));
    if (!file) return commandResult(ctx, `sum: ${targetArg}: No such file or directory`, 1);
    const buf = Buffer.from(file.content);
    const blocks = Math.ceil(buf.length / 1024);
    return commandResult(ctx, `00000 ${blocks} ${targetArg}`);
  },

  chmod: (ctx) => {
    if (ctx.parsed.positionalArgs.length < 2) return commandResult(ctx, "chmod: missing operand", 1);
    const mode = ctx.parsed.positionalArgs[0];
    const target = ctx.parsed.positionalArgs[1];
    const node = getNode(ctx.state.root, resolvePath(ctx.state.cwd, target));
    if (!node) return commandResult(ctx, `chmod: cannot access '${target}': No such file or directory`, 1);
    node.permissions = mode.startsWith("+") || mode.startsWith("-")
      ? (mode === "+x" ? (node.type === "dir" ? "rwxr-xr-x" : "rwxr-xr-x") : node.permissions)
      : mode;
    return commandResult(ctx, "", 0, true);
  },
  chown: (ctx) => {
    if (ctx.parsed.positionalArgs.length < 2) return commandResult(ctx, "chown: missing operand", 1);
    return commandResult(ctx, "", 0, true);
  },
  chgrp: (ctx) => {
    if (ctx.parsed.positionalArgs.length < 2) return commandResult(ctx, "chgrp: missing operand", 1);
    return commandResult(ctx, "", 0, true);
  },
  umask: (ctx) => commandResult(ctx, "0022"),

  ln: (ctx) => {
    const isSym = ctx.parsed.flags.has("s");
    if (ctx.parsed.positionalArgs.length < 2) return commandResult(ctx, "ln: missing destination file operand", 1);
    const srcArg = ctx.parsed.positionalArgs[0];
    const destArg = ctx.parsed.positionalArgs[1];
    const srcPath = resolvePath(ctx.state.cwd, srcArg);
    const destPath = resolvePath(ctx.state.cwd, destArg);
    const srcNode = getNode(ctx.state.root, srcPath);
    if (!srcNode) return commandResult(ctx, `ln: failed to access '${srcArg}': No such file or directory`, 1);
    if (isSym) {
      createFile(ctx.state.root, destPath, srcNode.type === "file" ? srcNode.content : srcPath);
    } else {
      if (srcNode.type === "dir") return commandResult(ctx, `ln: '${srcArg}': hard link not allowed for directory`, 1);
      createFile(ctx.state.root, destPath, srcNode.content);
    }
    return commandResult(ctx, "", 0, true);
  },

  xxd: (ctx) => {
    const isReverse = ctx.parsed.flags.has("r");
    const targetArg = ctx.parsed.positionalArgs[0];
    if (!targetArg) return commandResult(ctx, "xxd: missing file operand", 1);
    const file = getFile(ctx.state.root, resolvePath(ctx.state.cwd, targetArg));
    if (!file) return commandResult(ctx, `xxd: ${targetArg}: No such file or directory`, 1);
    if (isReverse) {
      const lines = file.content.split("\n");
      const bytes: number[] = [];
      for (const line of lines) {
        const match = line.match(/^[0-9a-fA-F]+:\s+((?:[0-9a-fA-F]{2}\s*)+)/);
        if (match) {
          const hexPart = match[1].replace(/\s+/g, "");
          for (let i = 0; i < hexPart.length; i += 2) {
            bytes.push(parseInt(hexPart.slice(i, i + 2), 16));
          }
        }
      }
      return commandResult(ctx, Buffer.from(bytes).toString("utf8"));
    }
    const buf = Buffer.from(file.content);
    const lines: string[] = [];
    for (let i = 0; i < buf.length; i += 16) {
      const slice = buf.slice(i, i + 16);
      const offset = i.toString(16).padStart(8, "0");
      let hex = "";
      for (let j = 0; j < 16; j++) {
        if (j < slice.length) {
          hex += slice[j].toString(16).padStart(2, "0");
        } else {
          hex += "  ";
        }
        if (j % 2 === 1) hex += " ";
      }
      let ascii = "";
      for (let j = 0; j < slice.length; j++) {
        const byte = slice[j];
        ascii += byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".";
      }
      lines.push(`${offset}: ${hex} ${ascii}`);
    }
    return commandResult(ctx, lines.join("\n"));
  },

  hexdump: (ctx) => {
    const targetArg = ctx.parsed.positionalArgs[0];
    if (!targetArg) return commandResult(ctx, "hexdump: missing file operand", 1);
    const file = getFile(ctx.state.root, resolvePath(ctx.state.cwd, targetArg));
    if (!file) return commandResult(ctx, `hexdump: ${targetArg}: No such file or directory`, 1);
    const buf = Buffer.from(file.content);
    const lines: string[] = [];
    for (let i = 0; i < buf.length; i += 16) {
      const slice = buf.slice(i, i + 16);
      const offset = i.toString(16).padStart(7, "0");
      const hex = [...slice].map(b => b.toString(16).padStart(2, "0")).join(" ");
      lines.push(`${offset} ${hex}`);
    }
    lines.push(buf.length.toString(16).padStart(7, "0"));
    return commandResult(ctx, lines.join("\n"));
  },

  od: (ctx) => {
    const targetArg = ctx.parsed.positionalArgs[0];
    if (!targetArg) return commandResult(ctx, "od: missing file operand", 1);
    const file = getFile(ctx.state.root, resolvePath(ctx.state.cwd, targetArg));
    if (!file) return commandResult(ctx, `od: ${targetArg}: No such file or directory`, 1);
    const buf = Buffer.from(file.content);
    const lines: string[] = [];
    for (let i = 0; i < buf.length; i += 16) {
      const slice = buf.slice(i, i + 16);
      const offset = i.toString(8).padStart(7, "0");
      const octal = [...slice].map(b => b.toString(8).padStart(3, "0")).join(" ");
      lines.push(`${offset} ${octal}`);
    }
    lines.push(buf.length.toString(8).padStart(7, "0"));
    return commandResult(ctx, lines.join("\n"));
  },

  less: (ctx) => operations.cat(ctx),
  more: (ctx) => operations.cat(ctx),

  history: (ctx) => {
    if (ctx.parsed.flags.has("c")) {
      ctx.state.history = [];
      return commandResult(ctx);
    }
    const h = ctx.state.history || [];
    const lines = h.map((cmd, idx) => `${String(idx + 1).padStart(5)}  ${cmd}`);
    return commandResult(ctx, lines.join("\n"));
  },

  alias: (ctx) => {
    if (!ctx.state.aliases) ctx.state.aliases = {};
    if (ctx.parsed.args.length === 0) {
      const lines = Object.entries(ctx.state.aliases).map(([k, v]) => `alias ${k}='${v}'`);
      return commandResult(ctx, lines.join("\n"));
    }
    const fullArgs = ctx.parsed.args.join(" ");
    const eq = fullArgs.indexOf("=");
    if (eq > 0) {
      const k = fullArgs.slice(0, eq).trim();
      const v = fullArgs.slice(eq + 1).replace(/^['"]|['"]$/g, "").trim();
      ctx.state.aliases[k] = v;
      return commandResult(ctx);
    }
    for (const arg of ctx.parsed.positionalArgs) {
      const eqPos = arg.indexOf("=");
      if (eqPos > 0) {
        const k = arg.slice(0, eqPos).trim();
        const v = arg.slice(eqPos + 1).replace(/^['"]|['"]$/g, "").trim();
        ctx.state.aliases[k] = v;
      }
    }
    return commandResult(ctx);
  },
  unalias: (ctx) => {
    if (!ctx.state.aliases) return commandResult(ctx);
    for (const arg of ctx.parsed.positionalArgs) {
      delete ctx.state.aliases[arg];
    }
    return commandResult(ctx);
  },

  export: (ctx) => {
    if (!ctx.state.env) ctx.state.env = {};
    if (ctx.parsed.positionalArgs.length === 0) {
      return operations.env(ctx);
    }
    for (const arg of ctx.parsed.positionalArgs) {
      const eq = arg.indexOf("=");
      if (eq > 0) {
        const k = arg.slice(0, eq).trim();
        const v = arg.slice(eq + 1).replace(/^['"]|['"]$/g, "").trim();
        ctx.state.env[k] = v;
      }
    }
    return commandResult(ctx);
  },
  set: (ctx) => operations.env(ctx),
  unset: (ctx) => {
    if (ctx.state.env) {
      for (const arg of ctx.parsed.positionalArgs) delete ctx.state.env[arg];
    }
    return commandResult(ctx);
  },

  test: (ctx) => runTestOp(ctx),
  "[": (ctx) => runTestOp(ctx),

  exit: (ctx) => commandResult(ctx, "exit: ShellShift virtual sandbox session remains active. Use UI navigation to exit.", 0),
  logout: (ctx) => commandResult(ctx, "logout: ShellShift virtual sandbox session remains active.", 0),

  bash: (ctx) => {
    if (ctx.parsed.flags.has("version") || ctx.parsed.args.includes("--version")) {
      return commandResult(ctx, "GNU bash, version 5.2.15(1)-release (x86_64-pc-linux-gnu)\nCopyright (C) 2022 Free Software Foundation, Inc.");
    }
    if (ctx.parsed.args[0] === "-c" && ctx.parsed.args[1]) {
      const { executeCommand } = require("./engine");
      return executeCommand(ctx.state, ctx.parsed.args[1]);
    }
    const scriptFile = ctx.parsed.positionalArgs[0];
    if (scriptFile) {
      const f = getFile(ctx.state.root, resolvePath(ctx.state.cwd, scriptFile));
      if (!f) return commandResult(ctx, `bash: ${scriptFile}: No such file or directory`, 127);
      const { executeCommand } = require("./engine");
      const lines = f.content.split("\n");
      const outputs: string[] = [];
      let lastExit = 0;
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const res = executeCommand(ctx.state, trimmed);
        if (res.output) outputs.push(res.output);
        lastExit = res.exitCode;
      }
      return commandResult(ctx, outputs.join("\n"), lastExit, true);
    }
    return commandResult(ctx, "ShellShift sandbox bash environment active.");
  },
  sh: (ctx) => operations.bash(ctx),
  source: (ctx) => {
    const scriptFile = ctx.parsed.positionalArgs[0];
    if (!scriptFile) return commandResult(ctx, "source: filename argument required", 2);
    return operations.bash(ctx);
  },
  ".": (ctx) => operations.source(ctx),

  tee: (ctx) => {
    const isAppend = ctx.parsed.flags.has("a");
    const target = ctx.parsed.positionalArgs[0];
    if (!target) return commandResult(ctx);
    const targetPath = resolvePath(ctx.state.cwd, target);
    if (isAppend) {
      const existing = getFile(ctx.state.root, targetPath);
      createFile(ctx.state.root, targetPath, (existing?.content || "") + "\n");
    } else {
      createFile(ctx.state.root, targetPath, "");
    }
    return commandResult(ctx, "", 0, true);
  },

  sed: (ctx) => {
    let expr = "";
    let fileArg = "";
    for (let i = 0; i < ctx.parsed.args.length; i++) {
      const arg = ctx.parsed.args[i];
      if (arg === "-e" && ctx.parsed.args[i + 1]) expr = ctx.parsed.args[++i];
      else if (!arg.startsWith("-") && !expr) expr = arg;
      else if (!arg.startsWith("-")) fileArg = arg;
    }
    if (!expr || !fileArg) return commandResult(ctx, "sed: missing expression or file", 1);
    const file = getFile(ctx.state.root, resolvePath(ctx.state.cwd, fileArg));
    if (!file) return commandResult(ctx, `sed: can't read ${fileArg}: No such file or directory`, 2);
    const match = expr.match(/^s\/(.*?)\/(.*?)(?:\/([gi]*))?$/);
    if (match) {
      const [, pat, rep, flags] = match;
      const re = new RegExp(pat, flags || "");
      const res = file.content.split("\n").map(l => l.replace(re, rep)).join("\n");
      if (ctx.parsed.flags.has("i")) {
        file.content = res;
        return commandResult(ctx, "", 0, true);
      }
      return commandResult(ctx, res);
    }
    return commandResult(ctx, file.content);
  },

  awk: (ctx) => {
    let script = "";
    let fileArg = "";
    let delim = /\s+/;
    const remaining: string[] = [];

    for (let i = 0; i < ctx.parsed.args.length; i++) {
      const arg = ctx.parsed.args[i];
      if (arg === "-F" && ctx.parsed.args[i + 1]) {
        delim = new RegExp(ctx.parsed.args[++i]);
      } else if (arg.startsWith("-F") && arg.length > 2) {
        delim = new RegExp(arg.slice(2));
      } else {
        remaining.push(arg);
      }
    }

    if (remaining.length > 0) {
      if (remaining[0].startsWith("{")) {
        const bracketParts: string[] = [];
        while (remaining.length > 0) {
          const part = remaining.shift()!;
          bracketParts.push(part);
          if (part.endsWith("}")) break;
        }
        script = bracketParts.join(" ");
        fileArg = remaining.shift() || "";
      } else {
        script = remaining.shift() || "";
        fileArg = remaining.shift() || "";
      }
    }

    if (!script || !fileArg) return commandResult(ctx, "awk: missing script or file", 1);
    const file = getFile(ctx.state.root, resolvePath(ctx.state.cwd, fileArg));
    if (!file) return commandResult(ctx, `awk: fatal: cannot open file '${fileArg}'`, 2);
    const printMatch = script.match(/\{print\s+\$(\d+)\}/);
    if (printMatch) {
      const col = parseInt(printMatch[1], 10);
      const lines = file.content.split("\n").map(l => {
        const parts = l.trim().split(delim);
        return parts[col - 1] || "";
      });
      return commandResult(ctx, lines.join("\n"));
    }
    return commandResult(ctx, file.content);
  },

  xargs: (ctx) => {
    const cmd = ctx.parsed.positionalArgs[0] || "echo";
    const args = ctx.parsed.positionalArgs.slice(1);
    const { executeCommand } = require("./engine");
    return executeCommand(ctx.state, `${cmd} ${args.join(" ")}`);
  },

  egrep: (ctx) => operations.grep(ctx),
  fgrep: (ctx) => operations.grep(ctx),

  groups: (ctx) => commandResult(ctx, "player sudo"),
  arch: (ctx) => commandResult(ctx, "x86_64"),

  ps: (ctx) => {
    return commandResult(ctx, "  PID TTY          TIME CMD\n    1 pts/0    00:00:00 init\n   42 pts/0    00:00:00 bash\n   98 pts/0    00:00:00 ps");
  },
  top: (ctx) => {
    return commandResult(ctx, "top - 13:17:00 up 2:30,  1 user,  load average: 0.08, 0.03, 0.01\nTasks:   3 total,   1 running,   2 sleeping,   0 stopped,   0 zombie\n%Cpu(s):  0.3 us,  0.2 sy,  0.0 ni, 99.5 id,  0.0 wa,  0.0 hi,  0.0 si\nMiB Mem :  16384.0 total,  14120.0 free,   1240.0 used,   1024.0 buff/cache\n\n  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n    1 player    20   0   18400   3200   2800 S   0.0   0.0   0:00.04 init\n   42 player    20   0   24200   5400   3600 S   0.0   0.0   0:00.12 bash\n   98 player    20   0   19100   3800   3100 R   0.0   0.0   0:00.01 top");
  },

  kill: (ctx) => commandResult(ctx, "bash: kill: operation not permitted (virtual sandbox)", 1),
  pkill: (ctx) => commandResult(ctx, "bash: pkill: operation not permitted (virtual sandbox)", 1),

  uptime: (ctx) => commandResult(ctx, " 13:17:00 up 2:30,  1 user,  load average: 0.08, 0.03, 0.01"),
  w: (ctx) => commandResult(ctx, " 13:17:00 up 2:30,  1 user,  load average: 0.08, 0.03, 0.01\nUSER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT\nplayer   pts/0    10.0.0.1         11:00    0.00s  0.15s  0.01s bash"),
  who: (ctx) => commandResult(ctx, "player   pts/0        2026-10-14 11:00 (:0)"),

  df: (ctx) => commandResult(ctx, "Filesystem     1K-blocks    Used Available Use% Mounted on\n/dev/root       20971520 1468006  19503514   7% /\ntmpfs            1638400       0   1638400   0% /dev/shm\n/dev/vda1       10485760  524288   9961472   5% /workspace"),
  free: (ctx) => commandResult(ctx, "               total        used        free      shared  buff/cache   available\nMem:        16777216     1269760    14483456       12288     1024000    15147008\nSwap:        4194304           0     4194304"),

  ping: (ctx) => {
    const host = ctx.parsed.positionalArgs[0] || "localhost";
    if (host === "127.0.0.1" || host === "localhost") {
      return commandResult(ctx, `PING ${host} (127.0.0.1) 56(84) bytes of data.\n64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.032 ms\n64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=0.028 ms\n\n--- ${host} ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss, time 1001ms`);
    }
    return commandResult(ctx, `ping: connect: Network is unreachable (sandbox network isolation active)`, 2);
  },
  curl: (ctx) => commandResult(ctx, "curl: (6) Could not resolve host (sandbox network isolation active)", 6),
  wget: (ctx) => commandResult(ctx, "wget: unable to resolve host address (sandbox network isolation active)", 4),
  nc: (ctx) => commandResult(ctx, "nc: connect to host: Connection refused (sandbox network isolation active)", 1),
  netcat: (ctx) => operations.nc(ctx),
  ssh: (ctx) => commandResult(ctx, "ssh: connect to host: Network is unreachable (sandbox network isolation active)", 255),
  netstat: (ctx) => commandResult(ctx, "Active Internet connections (only servers)\nProto Recv-Q Send-Q Local Address           Foreign Address         State\ntcp        0      0 127.0.0.1:22            0.0.0.0:*               LISTEN"),
  ifconfig: (ctx) => commandResult(ctx, "lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0\n        inet6 ::1  prefixlen 128  scopeid 0x10<host>\n        loop  txqueuelen 1000  (Local Loopback)\n        RX packets 0  bytes 0 (0.0 B)\n        TX packets 0  bytes 0 (0.0 B)"),
  ip: (ctx) => commandResult(ctx, "1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000\n    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n    inet 127.0.0.1/8 scope host lo\n       valid_lft forever preferred_lft forever"),

  reset: (ctx) => operations.clear(ctx),
  yes: (ctx) => {
    const word = ctx.parsed.positionalArgs[0] || "y";
    return commandResult(ctx, Array(5).fill(word).join("\n"));
  },
  seq: (ctx) => {
    const nums = ctx.parsed.positionalArgs.map(Number).filter(n => !isNaN(n));
    let start = 1, step = 1, end = 1;
    if (nums.length === 1) end = nums[0];
    else if (nums.length === 2) { start = nums[0]; end = nums[1]; }
    else if (nums.length >= 3) { start = nums[0]; step = nums[1]; end = nums[2]; }
    const res: number[] = [];
    if (step > 0) {
      for (let i = start; i <= end && res.length < 1000; i += step) res.push(i);
    }
    return commandResult(ctx, res.join("\n"));
  },
  printf: (ctx) => {
    const fmt = ctx.parsed.positionalArgs[0] || "";
    const args = ctx.parsed.positionalArgs.slice(1);
    let out = fmt.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    let argIdx = 0;
    out = out.replace(/%[sd]/g, () => args[argIdx++] ?? "");
    return commandResult(ctx, out);
  },
  expr: (ctx) => {
    const [n1, op, n2] = ctx.parsed.positionalArgs;
    const a = Number(n1), b = Number(n2);
    if (isNaN(a) || isNaN(b)) return commandResult(ctx, "expr: non-integer argument", 2);
    if (op === "+") return commandResult(ctx, String(a + b));
    if (op === "-") return commandResult(ctx, String(a - b));
    if (op === "*") return commandResult(ctx, String(a * b));
    if (op === "/") return commandResult(ctx, b === 0 ? "expr: division by zero" : String(Math.floor(a / b)), b === 0 ? 2 : 0);
    if (op === "%") return commandResult(ctx, b === 0 ? "expr: division by zero" : String(a % b), b === 0 ? 2 : 0);
    return commandResult(ctx, "expr: syntax error", 2);
  },
  bc: (ctx) => {
    const expr = ctx.parsed.positionalArgs.join(" ") || "0";
    try {
      if (/^[0-9+\-*/%().\s]+$/.test(expr)) {
        const res = Function(`"use strict"; return (${expr})`)();
        return commandResult(ctx, String(res));
      }
    } catch {}
    return commandResult(ctx, "0");
  },
  cal: (ctx) => {
    const now = new Date();
    const month = now.toLocaleString("default", { month: "long" });
    const year = now.getFullYear();
    return commandResult(ctx, `    ${month} ${year}\nSu Mo Tu We Th Fr Sa\n 1  2  3  4  5  6  7\n 8  9 10 11 12 13 14\n15 16 17 18 19 20 21\n22 23 24 25 26 27 28\n29 30 31`);
  },
  fold: (ctx) => {
    const width = 80;
    const targetArg = ctx.parsed.positionalArgs[0];
    if (!targetArg) return commandResult(ctx, "fold: missing file operand", 1);
    const file = getFile(ctx.state.root, resolvePath(ctx.state.cwd, targetArg));
    if (!file) return commandResult(ctx, `fold: ${targetArg}: No such file or directory`, 1);
    const lines = file.content.split("\n").map(l => {
      const chunks = [];
      for (let i = 0; i < l.length; i += width) chunks.push(l.slice(i, i + width));
      return chunks.join("\n");
    });
    return commandResult(ctx, lines.join("\n"));
  },
  paste: (ctx) => {
    if (ctx.parsed.positionalArgs.length < 2) return commandResult(ctx, "paste: missing operand", 1);
    const f1 = getFile(ctx.state.root, resolvePath(ctx.state.cwd, ctx.parsed.positionalArgs[0]));
    const f2 = getFile(ctx.state.root, resolvePath(ctx.state.cwd, ctx.parsed.positionalArgs[1]));
    if (!f1 || !f2) return commandResult(ctx, "paste: No such file or directory", 1);
    const l1 = f1.content.split("\n");
    const l2 = f2.content.split("\n");
    const max = Math.max(l1.length, l2.length);
    const out = [];
    for (let i = 0; i < max; i++) out.push(`${l1[i] || ""}\t${l2[i] || ""}`);
    return commandResult(ctx, out.join("\n"));
  },
  comm: (ctx) => {
    if (ctx.parsed.positionalArgs.length < 2) return commandResult(ctx, "comm: missing operand", 1);
    const f1 = getFile(ctx.state.root, resolvePath(ctx.state.cwd, ctx.parsed.positionalArgs[0]));
    const f2 = getFile(ctx.state.root, resolvePath(ctx.state.cwd, ctx.parsed.positionalArgs[1]));
    if (!f1 || !f2) return commandResult(ctx, "comm: No such file or directory", 1);
    const s1 = new Set(f1.content.split("\n"));
    const s2 = new Set(f2.content.split("\n"));
    const common = [...s1].filter(x => s2.has(x));
    return commandResult(ctx, common.map(x => `\t\t${x}`).join("\n"));
  },
  realpath: (ctx) => {
    const target = ctx.parsed.positionalArgs[0] || ".";
    return commandResult(ctx, resolvePath(ctx.state.cwd, target));
  },
  readlink: (ctx) => {
    const target = ctx.parsed.positionalArgs[0];
    if (!target) return commandResult(ctx, "readlink: missing operand", 1);
    return commandResult(ctx, resolvePath(ctx.state.cwd, target));
  },
  sleep: (ctx) => commandResult(ctx),
  whereis: (ctx) => {
    const name = ctx.parsed.positionalArgs[0];
    if (!name) return commandResult(ctx, "whereis: missing operand", 1);
    return operations[name] ? commandResult(ctx, `${name}: /usr/bin/${name}`) : commandResult(ctx, `${name}:`);
  },
  truncate: (ctx) => {
    const target = ctx.parsed.positionalArgs[0];
    if (!target) return commandResult(ctx, "truncate: missing operand", 1);
    const f = getFile(ctx.state.root, resolvePath(ctx.state.cwd, target));
    if (!f) return commandResult(ctx, `truncate: cannot open '${target}': No such file or directory`, 1);
    f.content = "";
    return commandResult(ctx, "", 0, true);
  },
  shred: (ctx) => {
    const target = ctx.parsed.positionalArgs[0];
    if (!target) return commandResult(ctx, "shred: missing operand", 1);
    const path = resolvePath(ctx.state.cwd, target);
    removeNode(ctx.state.root, path, false);
    return commandResult(ctx, "", 0, true);
  },
  tar: (ctx) => commandResult(ctx, "tar: virtual archive utility ready. Specify input files."),
  gzip: (ctx) => {
    const target = ctx.parsed.positionalArgs[0];
    if (!target) return commandResult(ctx, "gzip: missing operand", 1);
    return commandResult(ctx, "", 0, true);
  },
  gunzip: (ctx) => {
    const target = ctx.parsed.positionalArgs[0];
    if (!target) return commandResult(ctx, "gunzip: missing operand", 1);
    return commandResult(ctx, "", 0, true);
  },
  zip: (ctx) => commandResult(ctx, "zip: virtual archive utility ready."),
  unzip: (ctx) => commandResult(ctx, "unzip: virtual archive utility ready."),
  man: (ctx) => {
    const name = ctx.parsed.positionalArgs[0];
    if (!name) return commandResult(ctx, "What manual page do you want?");
    if (operations[name]) {
      return commandResult(ctx, `NAME\n    ${name} - virtual sandbox shell command\n\nSYNOPSIS\n    ${name} [OPTION]... [FILE]...\n\nDESCRIPTION\n    Executes the standard ${name} command in the ShellShift virtual filesystem.`);
    }
    return commandResult(ctx, `No manual entry for ${name}`, 1);
  },
  info: (ctx) => operations.man(ctx),
};
