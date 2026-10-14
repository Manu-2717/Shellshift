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

  it("verifies file_moved objective rule", () => {
    const vfs = createInitialVfs({
      "/workspace/src.txt": "payload",
    });
    const objective = {
      description: "Move file to target",
      rules: [
        {
          type: "file_moved" as const,
          path: "/workspace/dest.txt",
          description: "Target exists",
        },
      ],
    };
    expect(evaluateObjective(vfs, objective).isCompleted).toBe(false);
    createFile(vfs.root, "/workspace/dest.txt", "payload");
    expect(evaluateObjective(vfs, objective).isCompleted).toBe(true);
  });
});

describe("Advanced VFS Commands: head, tail, grep, find, echo", () => {
  it("supports head and tail with custom line counts", () => {
    const vfs = createInitialVfs({
      "/workspace/lines.txt": "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12",
    });
    const headRes = executeCommand(vfs, "head -n 3 /workspace/lines.txt");
    expect(headRes.exitCode).toBe(0);
    expect(headRes.output).toBe("1\n2\n3");

    const tailRes = executeCommand(vfs, "tail -n 2 /workspace/lines.txt");
    expect(tailRes.exitCode).toBe(0);
    expect(tailRes.output).toBe("11\n12");
  });

  it("supports grep with -i, -n, and -v flags", () => {
    const vfs = createInitialVfs({
      "/workspace/log.txt": "INFO start\nWARN high cpu\ninfo finished",
    });
    // Case-insensitive grep
    const gCase = executeCommand(vfs, "grep -i info /workspace/log.txt");
    expect(gCase.output).toBe("INFO start\ninfo finished");

    // Line numbered grep
    const gNum = executeCommand(vfs, "grep -n WARN /workspace/log.txt");
    expect(gNum.output).toBe("2:WARN high cpu");

    // Invert match grep
    const gInv = executeCommand(vfs, "grep -v WARN /workspace/log.txt");
    expect(gInv.output).toBe("INFO start\ninfo finished");
  });

  it("supports find with -name pattern and -type filters", () => {
    const vfs = createInitialVfs({
      "/workspace/app.js": "code",
      "/workspace/data.json": "{}",
      "/workspace/docs/readme.md": "docs",
    });

    const findJson = executeCommand(vfs, "find /workspace -name *.json");
    expect(findJson.output).toContain("/workspace/data.json");
    expect(findJson.output).not.toContain("/workspace/app.js");

    const findFiles = executeCommand(vfs, "find /workspace -type f");
    expect(findFiles.output).toContain("/workspace/app.js");
    expect(findFiles.output).not.toContain("/workspace/docs\n");
  });

  it("supports echo with explicit output redirection flag", () => {
    const vfs = createInitialVfs();
    const res = executeCommand(vfs, "echo custom_data -o /workspace/out.txt");
    expect(res.exitCode).toBe(0);
    expect(res.stateChanged).toBe(true);

    const catRes = executeCommand(vfs, "cat /workspace/out.txt");
    expect(catRes.output).toBe("custom_data");
  });
});

describe("Familiar read-only shell utilities", () => {
  it("supports system identity commands without leaving the virtual sandbox", () => {
    const vfs = createInitialVfs();
    expect(executeCommand(vfs, "whoami").output).toBe("player");
    expect(executeCommand(vfs, "hostname").output).toBe("shellshift");
    expect(executeCommand(vfs, "id").output).toContain("uid=1000(player)");
    expect(executeCommand(vfs, "uname -a").output).toContain("Linux shellshift");
  });

  it("supports file inspection and wc counts", () => {
    const vfs = createInitialVfs({ "/workspace/note.txt": "one two\nthree" });
    expect(executeCommand(vfs, "file note.txt").output).toBe("note.txt: ASCII text");
    expect(executeCommand(vfs, "wc note.txt").output).toBe("2 3 13 note.txt");
    expect(executeCommand(vfs, "wc -l note.txt").output).toBe("2 note.txt");
  });

  it("supports common path, metadata, environment, and command discovery utilities", () => {
    const vfs = createInitialVfs({ "/workspace/docs/note.txt": "hello world" });
    expect(executeCommand(vfs, "basename /workspace/docs/note.txt .txt").output).toBe("note");
    expect(executeCommand(vfs, "dirname /workspace/docs/note.txt").output).toBe("/workspace/docs");
    expect(executeCommand(vfs, "stat docs/note.txt").output).toContain("regular file");
    expect(executeCommand(vfs, "du -h docs").output).toMatch(/^1K/);
    expect(executeCommand(vfs, "printenv HOME").output).toBe("/workspace");
    expect(executeCommand(vfs, "which grep").output).toBe("/usr/bin/grep");
    expect(executeCommand(vfs, "type grep").output).toContain("virtual shell command");
    expect(executeCommand(vfs, "false").exitCode).toBe(1);
  });

  it("supports common single-file text processing utilities", () => {
    const vfs = createInitialVfs({
      "/workspace/values.txt": "3,pear\n1,apple\n1,apple\n2,banana",
    });
    expect(executeCommand(vfs, "sort values.txt").output.split("\n")[0]).toBe("1,apple");
    expect(executeCommand(vfs, "uniq -c values.txt").output).toContain("2 1,apple");
    expect(executeCommand(vfs, "cut -d, -f2 values.txt").output).toBe("pear\napple\napple\nbanana");
    expect(executeCommand(vfs, "nl values.txt").output).toContain("     1\t3,pear");
    expect(executeCommand(vfs, "tac values.txt").output.split("\n")[0]).toBe("2,banana");
    expect(executeCommand(vfs, "rev values.txt").output.split("\n")[0]).toBe("raep,3");
  });

  it("removes only empty directories with rmdir", () => {
    const vfs = createInitialVfs({
      "/workspace/empty/.keep": "temporary",
      "/workspace/full/data.txt": "data",
    });
    expect(executeCommand(vfs, "rm empty/.keep").exitCode).toBe(0);
    expect(executeCommand(vfs, "rmdir empty").exitCode).toBe(0);
    expect(getNode(vfs.root, "/workspace/empty")).toBeNull();
    expect(executeCommand(vfs, "rmdir full").output).toContain("Directory not empty");
  });

  it("supports cryptographic and checksum utilities (base64, md5sum, sha256sum)", () => {
    const vfs = createInitialVfs({
      "/workspace/secret.txt": "hello world\n",
    });
    const b64 = executeCommand(vfs, "base64 secret.txt");
    expect(b64.exitCode).toBe(0);
    expect(b64.output).toBe(Buffer.from("hello world\n").toString("base64"));

    const md5 = executeCommand(vfs, "md5sum secret.txt");
    expect(md5.exitCode).toBe(0);
    expect(md5.output).toMatch(/^[a-f0-9]{32}\s+secret\.txt$/);

    const sha = executeCommand(vfs, "sha256sum secret.txt");
    expect(sha.exitCode).toBe(0);
    expect(sha.output).toMatch(/^[a-f0-9]{64}\s+secret\.txt$/);
  });

  it("supports hex dump, strings, and stream editing (xxd, strings, sed, tr, awk)", () => {
    const vfs = createInitialVfs({
      "/workspace/msg.txt": "apple banana cherry",
      "/workspace/table.txt": "col1:col2:col3",
    });
    const stringsRes = executeCommand(vfs, "strings msg.txt");
    expect(stringsRes.output).toContain("apple banana cherry");

    const xxdRes = executeCommand(vfs, "xxd msg.txt");
    expect(xxdRes.output).toContain("6170 706c");

    const sedRes = executeCommand(vfs, "sed s/banana/orange/g msg.txt");
    expect(sedRes.output).toBe("apple orange cherry");

    const trRes = executeCommand(vfs, "tr a-z A-Z msg.txt");
    expect(trRes.output).toBe("APPLE BANANA CHERRY");

    const awkRes = executeCommand(vfs, "awk -F : {print $2} table.txt");
    expect(awkRes.output).toBe("col2");
  });

  it("supports file comparison with diff", () => {
    const vfs = createInitialVfs({
      "/workspace/f1.txt": "line1\nline2\nline3",
      "/workspace/f2.txt": "line1\nchanged\nline3",
    });
    const diffRes = executeCommand(vfs, "diff -u f1.txt f2.txt");
    expect(diffRes.output).toContain("-line2");
    expect(diffRes.output).toContain("+changed");
  });

  it("supports shell builtins: cd -, test, expr, history, and alias", () => {
    const vfs = createInitialVfs({
      "/workspace/sub/test.txt": "content",
    });
    executeCommand(vfs, "cd sub");
    expect(vfs.cwd).toBe("/workspace/sub");
    executeCommand(vfs, "cd -");
    expect(vfs.cwd).toBe("/workspace");

    expect(executeCommand(vfs, "test -f sub/test.txt").exitCode).toBe(0);
    expect(executeCommand(vfs, "[ -d sub ]").exitCode).toBe(0);
    expect(executeCommand(vfs, "[ -f non_existent ]").exitCode).toBe(1);

    expect(executeCommand(vfs, "expr 5 + 3").output).toBe("8");

    const histRes = executeCommand(vfs, "history");
    expect(histRes.output).toContain("history");

    executeCommand(vfs, "alias ll=ls -la");
    expect(executeCommand(vfs, "alias").output).toContain("ll='ls -la'");
  });

  it("handles offline sandbox network queries gracefully", () => {
    const vfs = createInitialVfs();
    const loopbackRes = executeCommand(vfs, "ping 127.0.0.1");
    expect(loopbackRes.output).toContain("64 bytes from 127.0.0.1");

    const remoteRes = executeCommand(vfs, "ping 8.8.8.8");
    expect(remoteRes.output).toContain("Network is unreachable (sandbox network isolation active)");
  });
});


