export type VfsNodeType = "file" | "dir";

export interface VfsFile {
  type: "file";
  name: string;
  content: string;
  modifiedAt?: number;
  permissions?: string;
}

export interface VfsDirectory {
  type: "dir";
  name: string;
  children: Record<string, VfsNode>;
  modifiedAt?: number;
  permissions?: string;
}

export type VfsNode = VfsFile | VfsDirectory;

export interface VfsState {
  root: VfsDirectory;
  cwd: string;
  env?: Record<string, string>;
  history?: string[];
  aliases?: Record<string, string>;
  oldCwd?: string;
}

export interface CommandMapping {
  // Map entered command tokens (e.g. "cd") to target operations (e.g. "mkdir")
  // Format: Record<enteredCommand, targetOperation>
  [enteredCommand: string]: string;
}

export interface CommandResult {
  output: string;
  exitCode: number;
  newCwd: string;
  stateChanged: boolean;
  enteredCommand: string;
  mappedOperation: string;
  objectiveCheckNeeded: boolean;
  clearScreen?: boolean;
}

export interface ObjectiveRule {
  id?: string;
  points?: number;
  type:
    | "file_exists"
    | "dir_exists"
    | "file_deleted"
    | "dir_deleted"
    | "file_contains"
    | "file_exact"
    | "file_moved"
    | "min_commands"
    | "cwd_equals"
    | "custom";
  path?: string;
  content?: string;
  caseSensitive?: boolean;
  description: string;
}

export interface ObjectiveConfig {
  description: string;
  rules: ObjectiveRule[];
}

export interface ObjectiveEvaluation {
  isCompleted: boolean;
  completedRules: number;
  totalRules: number;
  details: {
    id?: string;
    points?: number;
    description: string;
    passed: boolean;
  }[];
}
