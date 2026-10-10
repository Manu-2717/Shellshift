import { parseCommandLine } from "./parser";
import { operations } from "./operations";
import { CommandMapping, CommandResult, VfsState } from "./types";

export function executeCommand(
  state: VfsState,
  commandLine: string,
  mapping: CommandMapping = {}
): CommandResult {
  const parsed = parseCommandLine(commandLine);

  if (parsed.error) {
    return {
      output: parsed.error,
      exitCode: 2,
      newCwd: state.cwd,
      stateChanged: false,
      enteredCommand: commandLine,
      mappedOperation: parsed.command || "unknown",
      objectiveCheckNeeded: false,
    };
  }

  if (!parsed.command) {
    return {
      output: "",
      exitCode: 0,
      newCwd: state.cwd,
      stateChanged: false,
      enteredCommand: commandLine,
      mappedOperation: "",
      objectiveCheckNeeded: false,
    };
  }

  // Remap command token if present in puzzle's command mapping
  const mappedOperation = mapping[parsed.command] !== undefined
    ? mapping[parsed.command]
    : parsed.command;

  const handler = operations[mappedOperation];
  if (!handler) {
    return {
      output: `bash: ${parsed.command}: command not found`,
      exitCode: 127,
      newCwd: state.cwd,
      stateChanged: false,
      enteredCommand: commandLine,
      mappedOperation,
      objectiveCheckNeeded: false,
    };
  }

  return handler({
    state,
    parsed,
    enteredCommand: commandLine,
    mappedOperation,
  });
}
