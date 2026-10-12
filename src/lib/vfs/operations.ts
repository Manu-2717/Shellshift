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
    const targetArg = ctx.parsed.positionalArgs[0] || "~";
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

    ctx.state.cwd = targetPath;
    return {
      output: "",
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

    const outputs: string[] = [];
    let exitCode = 0;

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
        outputs.push(node.content);
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
      "ShellShift Virtual Shell v2.5 (Simulated Sandbox)",
      "--------------------------------------------------",
      "Available command utilities:",
      "  Navigation: pwd, ls, cd, tree",
      "  Files: cat, touch, mkdir, rmdir, cp, mv, rm, file, stat, du, wc",
      "  Paths: basename, dirname",
      "  Search/text: find, grep, head, tail, sort, uniq, cut, nl, tac, rev, echo",
      "  System: whoami, hostname, id, uname, date, env, printenv, which, type",
      "  Control: true, false, help, clear",
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
};
