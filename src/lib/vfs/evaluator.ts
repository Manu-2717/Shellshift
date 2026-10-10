import { getDir, getFile, getNode, resolvePath } from "./vfs";
import { ObjectiveConfig, ObjectiveEvaluation, VfsState } from "./types";

export function evaluateObjective(
  state: VfsState,
  config: ObjectiveConfig,
  commandCount: number = 0
): ObjectiveEvaluation {
  if (!config || !config.rules || config.rules.length === 0) {
    return {
      isCompleted: false,
      completedRules: 0,
      totalRules: 0,
      details: [],
    };
  }

  const details: ObjectiveEvaluation["details"] = [];
  let passedCount = 0;

  for (const rule of config.rules) {
    let passed = false;

    switch (rule.type) {
      case "dir_exists": {
        if (rule.path) {
          const normPath = resolvePath("/", rule.path);
          const dir = getDir(state.root, normPath);
          passed = dir !== null;
        }
        break;
      }

      case "file_exists": {
        if (rule.path) {
          const normPath = resolvePath("/", rule.path);
          const file = getFile(state.root, normPath);
          passed = file !== null;
        }
        break;
      }

      case "file_deleted": {
        if (rule.path) {
          const normPath = resolvePath("/", rule.path);
          const node = getNode(state.root, normPath);
          passed = node === null;
        }
        break;
      }

      case "dir_deleted": {
        if (rule.path) {
          const normPath = resolvePath("/", rule.path);
          const node = getNode(state.root, normPath);
          passed = node === null;
        }
        break;
      }

      case "file_contains": {
        if (rule.path && rule.content !== undefined) {
          const normPath = resolvePath("/", rule.path);
          const file = getFile(state.root, normPath);
          if (file) {
            const fileContent = rule.caseSensitive ? file.content : file.content.toLowerCase();
            const expected = rule.caseSensitive ? rule.content : rule.content.toLowerCase();
            passed = fileContent.includes(expected.trim());
          }
        }
        break;
      }

      case "file_exact": {
        if (rule.path && rule.content !== undefined) {
          const normPath = resolvePath("/", rule.path);
          const file = getFile(state.root, normPath);
          if (file) {
            const actual = rule.caseSensitive ? file.content.trim() : file.content.trim().toLowerCase();
            const expected = rule.caseSensitive ? rule.content.trim() : rule.content.trim().toLowerCase();
            passed = actual === expected;
          }
        }
        break;
      }

      case "file_moved": {
        // file_moved succeeds if destination path exists and is a file
        if (rule.path) {
          const normPath = resolvePath("/", rule.path);
          const file = getFile(state.root, normPath);
          passed = file !== null;
        }
        break;
      }

      case "min_commands": {
        const minReq = parseInt(rule.content || "1", 10);
        passed = commandCount >= minReq;
        break;
      }

      case "cwd_equals": {
        if (rule.path) {
          const normPath = resolvePath("/", rule.path);
          passed = state.cwd === normPath;
        }
        break;
      }

      default:
        passed = false;
        break;
    }

    if (passed) {
      passedCount++;
    }

    details.push({
      id: rule.id,
      points: rule.points,
      description: rule.description,
      passed,
    });
  }

  const isCompleted = passedCount === config.rules.length;

  return {
    isCompleted,
    completedRules: passedCount,
    totalRules: config.rules.length,
    details,
  };
}
