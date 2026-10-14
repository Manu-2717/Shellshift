import { VfsDirectory, VfsFile, VfsNode, VfsState } from "./types";

const MAX_TOTAL_NODES = 500;
const MAX_FILE_SIZE_BYTES = 64 * 1024; // 64 KB

/**
 * Normalizes a virtual filesystem path.
 * Guaranteed to stay anchored at root '/' and never escape the virtual sandbox.
 */
export function resolvePath(cwd: string, targetPath: string, homeDir: string = "/workspace"): string {
  if (!targetPath || targetPath.trim() === "") {
    return cwd;
  }

  let clean = targetPath.trim();
  if (clean === "~" || clean.startsWith("~/")) {
    clean = homeDir + clean.slice(1);
  }

  const isAbsolute = clean.startsWith("/");
  const segments = (isAbsolute ? clean : `${cwd}/${clean}`).split("/");

  const resolvedStack: string[] = [];
  for (const seg of segments) {
    if (!seg || seg === ".") {
      continue;
    }
    if (seg === "..") {
      if (resolvedStack.length > 0) {
        resolvedStack.pop();
      }
      // If at root, ".." is a no-op (like standard Linux cd /..)
    } else {
      resolvedStack.push(seg);
    }
  }

  return "/" + resolvedStack.join("/");
}

export function splitPath(normalizedPath: string): { dirPath: string; baseName: string } {
  if (normalizedPath === "/") {
    return { dirPath: "/", baseName: "" };
  }
  const parts = normalizedPath.split("/").filter(Boolean);
  const baseName = parts[parts.length - 1];
  const dirPath = "/" + parts.slice(0, parts.length - 1).join("/");
  return { dirPath: dirPath === "" ? "/" : dirPath, baseName };
}

export function getNode(root: VfsDirectory, path: string): VfsNode | null {
  if (path === "/" || path === "") {
    return root;
  }

  const parts = path.split("/").filter(Boolean);
  let current: VfsNode = root;

  for (const part of parts) {
    if (current.type !== "dir") {
      return null;
    }
    const next: VfsNode | undefined = current.children[part];
    if (!next) {
      return null;
    }
    current = next;
  }

  return current;
}

export function getDir(root: VfsDirectory, path: string): VfsDirectory | null {
  const node = getNode(root, path);
  return node && node.type === "dir" ? node : null;
}

export function getFile(root: VfsDirectory, path: string): VfsFile | null {
  const node = getNode(root, path);
  return node && node.type === "file" ? node : null;
}

export function countTotalNodes(node: VfsNode): number {
  if (node.type === "file") return 1;
  let count = 1;
  for (const child of Object.values(node.children)) {
    count += countTotalNodes(child);
  }
  return count;
}

export function createDirectory(
  root: VfsDirectory,
  path: string,
  recursive: boolean = false
): { success: boolean; error?: string } {
  if (path === "/") {
    return { success: true };
  }

  if (countTotalNodes(root) >= MAX_TOTAL_NODES) {
    return { success: false, error: "mkdir: virtual filesystem limit reached" };
  }

  const parts = path.split("/").filter(Boolean);
  let current = root;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;
    const existing = current.children[part];

    if (existing) {
      if (existing.type !== "dir") {
        return { success: false, error: `mkdir: cannot create directory '${part}': Not a directory` };
      }
      if (isLast && !recursive) {
        return { success: false, error: `mkdir: cannot create directory '${part}': File exists` };
      }
      current = existing;
    } else {
      if (!isLast && !recursive) {
        return { success: false, error: `mkdir: cannot create directory '${path}': No such file or directory` };
      }
      const newDir: VfsDirectory = {
        type: "dir",
        name: part,
        children: {},
        modifiedAt: Date.now(),
        permissions: "rwxr-xr-x",
      };
      current.children[part] = newDir;
      current = newDir;
    }
  }

  return { success: true };
}

export function createFile(
  root: VfsDirectory,
  path: string,
  content: string = ""
): { success: boolean; error?: string } {
  if (path === "/") {
    return { success: false, error: "touch: cannot touch root directory" };
  }

  if (content.length > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: "touch: file exceeds virtual quota" };
  }

  if (countTotalNodes(root) >= MAX_TOTAL_NODES) {
    return { success: false, error: "touch: virtual filesystem limit reached" };
  }

  const { dirPath, baseName } = splitPath(path);
  const parentDir = getDir(root, dirPath);

  if (!parentDir) {
    return { success: false, error: `touch: cannot touch '${path}': No such file or directory` };
  }

  const existing = parentDir.children[baseName];
  if (existing) {
    if (existing.type === "file") {
      existing.content = content !== undefined && content !== "" ? content : existing.content;
      existing.modifiedAt = Date.now();
      return { success: true };
    } else {
      return { success: false, error: `touch: '${baseName}' is a directory` };
    }
  }

  parentDir.children[baseName] = {
    type: "file",
    name: baseName,
    content: content || "",
    modifiedAt: Date.now(),
    permissions: "rw-r--r--",
  };

  return { success: true };
}

export function removeNode(
  root: VfsDirectory,
  path: string,
  recursive: boolean = false
): { success: boolean; error?: string } {
  if (path === "/") {
    return { success: false, error: "rm: it is dangerous to operate recursively on '/'" };
  }

  const { dirPath, baseName } = splitPath(path);
  const parentDir = getDir(root, dirPath);

  if (!parentDir || !parentDir.children[baseName]) {
    return { success: false, error: `rm: cannot remove '${path}': No such file or directory` };
  }

  const target = parentDir.children[baseName];
  if (target.type === "dir") {
    if (!recursive) {
      return { success: false, error: `rm: cannot remove '${baseName}': Is a directory` };
    }
  }

  delete parentDir.children[baseName];
  return { success: true };
}

export function cloneNode(node: VfsNode, newName?: string): VfsNode {
  if (node.type === "file") {
    return {
      type: "file",
      name: newName ?? node.name,
      content: node.content,
      modifiedAt: Date.now(),
      permissions: node.permissions,
    };
  }

  const newChildren: Record<string, VfsNode> = {};
  for (const [k, v] of Object.entries(node.children)) {
    newChildren[k] = cloneNode(v);
  }

  return {
    type: "dir",
    name: newName ?? node.name,
    children: newChildren,
    modifiedAt: Date.now(),
    permissions: node.permissions,
  };
}

export function copyNode(
  root: VfsDirectory,
  srcPath: string,
  destPath: string,
  recursive: boolean = false
): { success: boolean; error?: string } {
  const srcNode = getNode(root, srcPath);
  if (!srcNode) {
    return { success: false, error: `cp: cannot stat '${srcPath}': No such file or directory` };
  }

  if (srcNode.type === "dir" && !recursive) {
    return { success: false, error: `cp: -r not specified; omitting directory '${srcPath}'` };
  }

  const { dirPath: destDir, baseName: destBase } = splitPath(destPath);
  const parentDir = getDir(root, destDir);
  if (!parentDir) {
    return { success: false, error: `cp: cannot create regular file '${destPath}': No such file or directory` };
  }

  // If destination is an existing directory, copy inside it
  const destExisting = getNode(root, destPath);
  if (destExisting && destExisting.type === "dir") {
    const srcBase = splitPath(srcPath).baseName;
    destExisting.children[srcBase] = cloneNode(srcNode, srcBase);
    return { success: true };
  }

  parentDir.children[destBase] = cloneNode(srcNode, destBase);
  return { success: true };
}

export function moveNode(
  root: VfsDirectory,
  srcPath: string,
  destPath: string
): { success: boolean; error?: string } {
  if (srcPath === "/" || destPath === "/") {
    return { success: false, error: "mv: cannot move root directory" };
  }

  const srcNode = getNode(root, srcPath);
  if (!srcNode) {
    return { success: false, error: `mv: cannot stat '${srcPath}': No such file or directory` };
  }

  const copyRes = copyNode(root, srcPath, destPath, true);
  if (!copyRes.success) {
    return copyRes;
  }

  removeNode(root, srcPath, true);
  return { success: true };
}

export function generateAsciiTree(dir: VfsDirectory, prefix: string = ""): string[] {
  const lines: string[] = [];
  const entries = Object.keys(dir.children).sort();

  for (let i = 0; i < entries.length; i++) {
    const name = entries[i];
    const child = dir.children[name];
    const isChildLast = i === entries.length - 1;
    const connector = isChildLast ? "└── " : "├── ";
    const childPrefix = isChildLast ? "    " : "│   ";

    if (child.type === "dir") {
      lines.push(`${prefix}${connector}${name}/`);
      lines.push(...generateAsciiTree(child, `${prefix}${childPrefix}`));
    } else {
      lines.push(`${prefix}${connector}${name}`);
    }
  }

  return lines;
}

export function createInitialVfs(seed?: Record<string, string>, initialCwd: string = "/workspace"): VfsState {
  const root: VfsDirectory = {
    type: "dir",
    name: "",
    children: {
      workspace: {
        type: "dir",
        name: "workspace",
        children: {},
        modifiedAt: Date.now(),
        permissions: "rwxr-xr-x",
      },
      etc: {
        type: "dir",
        name: "etc",
        children: {
          motd: {
            type: "file",
            name: "motd",
            content: "Welcome to ShellShift Cipher Shell v2.4.\nObserve carefully. Commands may not behave as expected.",
            modifiedAt: Date.now(),
            permissions: "r--r--r--",
          },
        },
        modifiedAt: Date.now(),
        permissions: "r-xr-xr-x",
      },
      var: {
        type: "dir",
        name: "var",
        children: {
          log: {
            type: "dir",
            name: "log",
            children: {},
            modifiedAt: Date.now(),
            permissions: "rwxr-xr-x",
          },
        },
        modifiedAt: Date.now(),
        permissions: "r-xr-xr-x",
      },
    },
    modifiedAt: Date.now(),
    permissions: "r-xr-xr-x",
  };

  // Populate seed files if provided:
  if (seed) {
    for (const [rawPath, content] of Object.entries(seed)) {
      const normalized = resolvePath("/", rawPath);
      const { dirPath, baseName } = splitPath(normalized);
      createDirectory(root, dirPath, true);
      const targetDir = getDir(root, dirPath);
      if (targetDir) {
        targetDir.children[baseName] = {
          type: "file",
          name: baseName,
          content,
          modifiedAt: Date.now(),
          permissions: "rw-r--r--",
        };
      }
    }
  }

  return {
    root,
    cwd: initialCwd,
    env: {
      USER: "player",
      HOME: "/workspace",
      TERM: "xterm-256color",
      SHELL: "/bin/shiftsh",
    },
  };
}
