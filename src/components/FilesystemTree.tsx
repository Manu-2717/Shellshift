"use client";

import React, { useMemo, useState } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  Copy,
  Check,
  Search,
  HardDrive,
  RefreshCw,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export interface FilesystemTreeItem {
  path: string;
  name: string;
  type: "file" | "dir";
  size?: number;
}

interface FilesystemTreeProps {
  treeList: FilesystemTreeItem[];
  currentWorkingDir: string;
  onRefresh?: () => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  children: Record<string, TreeNode>;
}

export function FilesystemTree({
  treeList = [],
  currentWorkingDir,
  onRefresh,
}: FilesystemTreeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [collapsedPaths, setCollapsedPaths] = useState<Record<string, boolean>>({});

  const toggleCollapse = (path: string) => {
    setCollapsedPaths((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCopy = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  // Build hierarchical tree structure from flat path list
  const rootNode = useMemo(() => {
    const root: TreeNode = {
      name: "root",
      path: "",
      type: "dir",
      children: {},
    };

    for (const item of treeList) {
      const parts = item.path.split("/").filter(Boolean);
      let current = root;
      let builtPath = "";

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        builtPath += "/" + part;
        const isLeaf = i === parts.length - 1;

        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: builtPath,
            type: isLeaf ? item.type : "dir",
            size: isLeaf ? item.size : undefined,
            children: {},
          };
        } else if (isLeaf) {
          current.children[part].type = item.type;
          current.children[part].size = item.size;
        }

        current = current.children[part];
      }
    }

    return root;
  }, [treeList]);

  // Filter nodes matching search query
  const matchesSearch = (node: TreeNode, query: string): boolean => {
    if (!query) return true;
    if (node.name.toLowerCase().includes(query.toLowerCase()) || node.path.toLowerCase().includes(query.toLowerCase())) {
      return true;
    }
    return Object.values(node.children).some((child) => matchesSearch(child, query));
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isDir = node.type === "dir";
    const isCwd = currentWorkingDir === node.path;
    const isCollapsed = !searchQuery && !!collapsedPaths[node.path];
    const hasChildren = Object.keys(node.children).length > 0;

    if (searchQuery && !matchesSearch(node, searchQuery)) {
      return null;
    }

    const sortedChildren = Object.values(node.children).sort((a, b) => {
      // Directories first, then alphabetical
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return (
      <div key={node.path} className="select-none font-mono text-xs">
        {node.path !== "" && (
          <div
            onClick={() => isDir && toggleCollapse(node.path)}
            style={{ paddingLeft: `${Math.max(depth * 14, 4)}px` }}
            className={`group flex items-center justify-between py-1 px-2 rounded hover:bg-[#18181b] cursor-pointer transition-colors ${
              isCwd
                ? "bg-cyan-950/30 text-cyan-300 font-bold border-l-2 border-cyan-400"
                : "text-[#a1a1aa] hover:text-[#fafafa]"
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {isDir ? (
                <>
                  <span className="w-3.5 h-3.5 flex items-center justify-center text-neutral-500 group-hover:text-neutral-300">
                    {hasChildren ? (
                      isCollapsed ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )
                    ) : null}
                  </span>
                  {isCollapsed ? (
                    <Folder className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  ) : (
                    <FolderOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  )}
                </>
              ) : (
                <>
                  <span className="w-3.5 h-3.5 shrink-0" />
                  <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                </>
              )}

              <span className={`truncate text-xs ${isCwd ? "text-cyan-300 font-bold" : "text-[#fafafa]"}`}>
                {node.name}
              </span>

              {isCwd && (
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 shrink-0">
                  CWD
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {node.size !== undefined && (
                <span className="text-[10px] text-neutral-500 font-mono">
                  {node.size}B
                </span>
              )}
              <button
                type="button"
                onClick={(e) => handleCopy(node.path, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-white transition-opacity"
                title={`Copy path: ${node.path}`}
              >
                {copiedPath === node.path ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-neutral-500" />
                )}
              </button>
            </div>
          </div>
        )}

        {isDir && !isCollapsed && (
          <div>
            {sortedChildren.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-2.5">
      {/* Header and Controls */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#a1a1aa] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search paths (e.g. workspace, project)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded bg-[#18181b] border border-[#27272a] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] text-neutral-400 hover:text-white transition-colors"
            title="Refresh Filesystem Tree"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Working Directory Indicator */}
      <div className="px-2.5 py-1.5 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-between text-[11px] font-mono text-[#a1a1aa] shrink-0">
        <span className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Active Directory:</span>
        </span>
        <span className="text-cyan-300 font-bold truncate max-w-[180px] sm:max-w-xs">
          {currentWorkingDir}
        </span>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-1 bg-[#121215] border border-[#27272a] rounded-lg">
        {treeList.length === 0 ? (
          <div className="p-8 text-center text-[#a1a1aa] text-xs font-mono">
            Empty virtual filesystem root.
          </div>
        ) : (
          renderNode(rootNode)
        )}
      </div>
    </div>
  );
}
