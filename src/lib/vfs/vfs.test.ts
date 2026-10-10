import { describe, expect, it } from "vitest";
import {
  createDirectory,
  createFile,
  createInitialVfs,
  getNode,
  removeNode,
  resolvePath,
} from "./vfs";
import { parseCommandLine } from "./parser";
import { executeCommand } from "./engine";
import { evaluateObjective } from "./evaluator";

describe("Virtual Filesystem & Path Traversal Security", () => {
  it("strictly traps traversal outside virtual root", () => {
    expect(resolvePath("/workspace", "../../../../../etc")).toBe("/etc");
    expect(resolvePath("/workspace", "../../../../../")).toBe("/");
    expect(resolvePath("/workspace", "/../../../../var/log")).toBe("/var/log");
  });

  it("resolves home directory symbol ~ safely", () => {
    expect(resolvePath("/var", "~")).toBe("/workspace");
    expect(resolvePath("/var", "~/keys/token.txt")).toBe("/workspace/keys/token.txt");
  });

  it("handles directory creation, nesting, and file operations in sandbox", () => {
    const vfs = createInitialVfs();
    const resDir = createDirectory(vfs.root, "/workspace/secret_dir", true);
    expect(resDir.success).toBe(true);

    const resFile = createFile(vfs.root, "/workspace/secret_dir/data.txt", "FLAG{TEST_VFS}");
    expect(resFile.success).toBe(true);

    const node = getNode(vfs.root, "/workspace/secret_dir/data.txt");
    expect(node).not.toBeNull();
    expect(node?.type).toBe("file");
    if (node?.type === "file") {
      expect(node.content).toBe("FLAG{TEST_VFS}");
    }
  });

  it("prevents deleting root directory", () => {
    const vfs = createInitialVfs();
    const res = removeNode(vfs.root, "/", true);
    expect(res.success).toBe(false);
    expect(res.error).toContain("dangerous");
  });
});

describe("Command Parser & Shell Injection Defense", () => {
  it("rejects shell chaining and pipes without host execution", () => {
    const p1 = parseCommandLine("cat file.txt | grep secret");
    expect(p1.error).toContain("pipes");

    const p2 = parseCommandLine("ls ; rm -rf /");
    expect(p2.error).toContain("command chaining");

    const p3 = parseCommandLine("echo test && whoami");
    expect(p3.error).toContain("conditional execution");

    const p4 = parseCommandLine("cat $(whoami)");
    expect(p4.error).toContain("command substitution");

    const p5 = parseCommandLine("cat `id`");
    expect(p5.error).toContain("backtick substitution");
  });

  it("rejects oversized commands", () => {
    const longCmd = "a".repeat(501);
    const p = parseCommandLine(longCmd);
    expect(p.error).toContain("maximum permitted length");
  });

  it("correctly tokenizes quoted arguments", () => {
    const p = parseCommandLine('echo "hello world" test');
    expect(p.command).toBe("echo");
    expect(p.positionalArgs).toEqual(["hello world", "test"]);
  });
});

describe("Configurable Command Remapping Engine", () => {
  it("executes remapped operations according to puzzle matrix", () => {
    const vfs = createInitialVfs();
    // Puzzle mapping: "cd" -> "mkdir", "cat" -> "ls"
    const mapping = {
      cd: "mkdir",
      cat: "ls",
    };

    // Running 'cd new_dir' should actually execute 'mkdir new_dir'
    const result = executeCommand(vfs, "cd new_dir", mapping);
    expect(result.exitCode).toBe(0);
    expect(result.mappedOperation).toBe("mkdir");
    expect(result.stateChanged).toBe(true);

    // Verify the directory was created in VFS
    const dirNode = getNode(vfs.root, "/workspace/new_dir");
    expect(dirNode).not.toBeNull();
    expect(dirNode?.type).toBe("dir");
  });

  it("retains normal unmapped commands", () => {
    const vfs = createInitialVfs();
    const result = executeCommand(vfs, "pwd", { cd: "mkdir" });
    expect(result.exitCode).toBe(0);
    expect(result.output).toBe("/workspace");
    expect(result.mappedOperation).toBe("pwd");
  });
});

describe("Objective Evaluator", () => {
  it("verifies multi-condition puzzle completion", () => {
    const vfs = createInitialVfs({
      "/workspace/flag.txt": "SECRET_KEY_1234",
    });

    const objective = {
      description: "Extract secret key and create proof file",
      rules: [
        {
          type: "file_exists" as const,
          path: "/workspace/proof.key",
          description: "Proof file exists",
        },
        {
          type: "file_contains" as const,
          path: "/workspace/proof.key",
          content: "SECRET_KEY_1234",
          description: "Proof contains secret key",
        },
      ],
    };

    // Initially incomplete
    let evalRes = evaluateObjective(vfs, objective);
    expect(evalRes.isCompleted).toBe(false);
    expect(evalRes.completedRules).toBe(0);

    // Create proof file with key
    createFile(vfs.root, "/workspace/proof.key", "SECRET_KEY_1234");
    evalRes = evaluateObjective(vfs, objective);
    expect(evalRes.isCompleted).toBe(true);
    expect(evalRes.completedRules).toBe(2);
  });
});
