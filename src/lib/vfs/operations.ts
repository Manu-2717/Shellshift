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
      "ShellShift Virtual Shell v2.4 (Simulated Sandbox)",
      "--------------------------------------------------",
      "Available command utilities:",
      "  pwd, ls, cd, cat, mkdir, touch, cp, mv, rm, find, grep, head, tail, echo, tree, help, clear",
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
