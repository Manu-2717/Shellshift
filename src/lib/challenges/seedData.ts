import {
  encodeAsciiDecimal,
  encodeBase64,
  encodeBinary,
  encodeHex,
  encodeMorse,
  encodeRot13,
  encodeUrlPercent,
} from "../ciphers/ciphers";

export interface ClueItem {
  id: string;
  title: string;
  type: "morse" | "binary" | "hex" | "base64" | "rot13" | "caesar" | "ascii_decimal" | "url_percent";
  encodedContent: string;
  plaintextAnswer: string; // Server/Admin only! Stripped from public player responses!
  hintNote: string;
}

export interface SeedChallengeDef {
  slug: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  order: number;
  commandMappings: Record<string, string>;
  clues: ClueItem[];
  initialFilesystem: Record<string, string>;
  objectiveConfig: {
    description: string;
    rules: Array<{
      type: "file_exists" | "dir_exists" | "file_deleted" | "dir_deleted" | "file_contains" | "file_exact" | "min_commands";
      path?: string;
      content?: string;
      description: string;
    }>;
  };
  hints: Array<{
    title: string;
    content: string;
    penaltySeconds: number;
    order: number;
  }>;
}

export const SEED_CHALLENGES: SeedChallengeDef[] = [
  {
    slug: "operation-inversion",
    title: "Operation Inversion (Level 1)",
    description:
      "Telemetry indicates an altered command shell matrix where directory navigation and creation operations have been transposed. Decode the clue blocks to infer the command mapping and deploy the breach folder.",
    difficulty: "EASY",
    order: 1,
    commandMappings: {
      cd: "mkdir",
      mkdir: "rm",
      cat: "ls",
      ls: "cat",
    },
    clues: [
      {
        id: "clue-1-1",
        title: "Transposed Operations Protocol",
        type: "base64",
        plaintextAnswer:
          "COMMAND REMAP ACTIVE: 'cd' creates directories ('mkdir'). 'mkdir' removes files or directories ('rm'). 'cat' lists directory entries ('ls'). 'ls' reads file contents ('cat').",
        encodedContent: encodeBase64(
          "COMMAND REMAP ACTIVE: 'cd' creates directories ('mkdir'). 'mkdir' removes files or directories ('rm'). 'cat' lists directory entries ('ls'). 'ls' reads file contents ('cat')."
        ),
        hintNote: "Radix-64 binary-to-text encoding format.",
      },
      {
        id: "clue-1-2",
        title: "Mission Objective Transmission",
        type: "morse",
        plaintextAnswer:
          "DEPLOY TARGET: RUN 'cd /workspace/breach' TO CREATE BREACH FOLDER, THEN READ /clues/signal.txt",
        encodedContent: encodeMorse(
          "DEPLOY TARGET: RUN 'cd /workspace/breach' TO CREATE BREACH FOLDER, THEN READ /clues/signal.txt"
        ),
        hintNote: "Standard International Morse telecommunication code.",
      },
    ],
    initialFilesystem: {
      "/clues/signal.txt":
        "SIGNAL CONFIRMED: Breach authorization code = INVERSION_OMEGA_99. Mission operational.",
      "/workspace/notes.txt":
        "Diagnostic note: Standard shell commands are behaving atypically. Decode the transmissions on the cipher panel.",
    },
    objectiveConfig: {
      description: "Create directory /workspace/breach and inspect /clues/signal.txt",
      rules: [
        {
          type: "dir_exists",
          path: "/workspace/breach",
          description: "Virtual directory /workspace/breach has been created",
        },
        {
          type: "min_commands",
          content: "1",
          description: "Executed at least one command in the terminal",
        },
      ],
    },
    hints: [
      {
        title: "Decoding Base64",
        content: "Use the built-in cipher scratchpad to decode the Base64 clue. Notice how 'cd' is mapped to 'mkdir'.",
        penaltySeconds: 15,
        order: 1,
      },
      {
        title: "Creating the Breach Folder",
        content: "Since 'cd' performs 'mkdir', executing 'cd breach' or 'cd /workspace/breach' creates the folder!",
        penaltySeconds: 30,
        order: 2,
      },
    ],
  },
  {
    slug: "the-cryptic-agent",
    title: "The Cryptic Agent (Level 2)",
    description:
      "An intercepted operative transmission reveals hidden system aliases. Inspect the nested filesystem, discover remapped utility behaviors, and plant the operative key.",
    difficulty: "MEDIUM",
    order: 2,
    commandMappings: {
      touch: "pwd",
      pwd: "touch",
      rm: "cat",
    },
    clues: [
      {
        id: "clue-2-1",
        title: "Sysadmin Aliases Log",
        type: "hex",
        plaintextAnswer:
          "OPERATIVE ALIAS MATRIX: 'touch' prints working directory ('pwd'). 'pwd' creates empty files ('touch'). 'rm' outputs file content ('cat').",
        encodedContent: encodeHex(
          "OPERATIVE ALIAS MATRIX: 'touch' prints working directory ('pwd'). 'pwd' creates empty files ('touch'). 'rm' outputs file content ('cat')."
        ),
        hintNote: "Base-16 hexadecimal UTF-8 character representation.",
      },
      {
        id: "clue-2-2",
        title: "Operative Directive",
        type: "rot13",
        plaintextAnswer:
          "TARGET OBJECTIVE: INSPECT /etc/shadow_cipher.txt USING 'rm', THEN CREATE /workspace/agent.key USING 'pwd /workspace/agent.key'",
        encodedContent: encodeRot13(
          "TARGET OBJECTIVE: INSPECT /etc/shadow_cipher.txt USING 'rm', THEN CREATE /workspace/agent.key USING 'pwd /workspace/agent.key'"
        ),
        hintNote: "ROT13 symmetric alphabet rotation.",
      },
    ],
    initialFilesystem: {
      "/etc/shadow_cipher.txt":
        "AGENT VERIFICATION PASSCODE: 0x9F_SHADOW_RUNNER\nProceed with clearance deployment.",
      "/var/log/syslog": "System kernel loaded. Shadow agent protocol engaged.",
      "/workspace/readme.md": "Operative terminal initialized. Locate shadow cipher.",
    },
    objectiveConfig: {
      description: "Deploy /workspace/agent.key",
      rules: [
        {
          type: "file_exists",
          path: "/workspace/agent.key",
          description: "File /workspace/agent.key has been successfully deployed",
        },
      ],
    },
    hints: [
      {
        title: "Reading Files with Remapped Commands",
        content: "Notice the Hex clue reveals that 'rm' is remapped to 'cat'. Running 'rm /etc/shadow_cipher.txt' displays its content safely!",
        penaltySeconds: 20,
        order: 1,
      },
      {
        title: "Deploying the Agent Key",
        content: "'pwd' is remapped to 'touch'. Run 'pwd /workspace/agent.key' to create the target file.",
        penaltySeconds: 40,
        order: 2,
      },
    ],
  },
  {
    slug: "deep-breach-babel",
    title: "Deep Breach: Operation Babel (Level 3)",
    description:
      "A high-stakes multi-stage vault breach combining nested directory structures, binary byte streams, ASCII decimal codes, and URL percent-encoding.",
    difficulty: "HARD",
    order: 3,
    commandMappings: {
      mv: "cp",
      cp: "rm",
      grep: "mkdir",
    },
    clues: [
      {
        id: "clue-3-1",
        title: "Phase 1 - Matrix Reassignment",
        type: "binary",
        plaintextAnswer:
          "PHASE 1 REMAPPINGS: 'mv' copies nodes ('cp'). 'cp' removes nodes ('rm'). 'grep' creates directories ('mkdir').",
        encodedContent: encodeBinary(
          "PHASE 1 REMAPPINGS: 'mv' copies nodes ('cp'). 'cp' removes nodes ('rm'). 'grep' creates directories ('mkdir')."
        ),
        hintNote: "8-bit Base-2 binary byte sequences.",
      },
      {
        id: "clue-3-2",
        title: "Phase 2 - Vault Infiltration",
        type: "ascii_decimal",
        plaintextAnswer:
          "PHASE 2 TARGET: CREATE DIRECTORY /opt/vault/core USING 'grep -p /opt/vault/core', THEN COPY /opt/vault/secrets/fragment_a.dat INTO /opt/vault/core/master.key USING 'mv'",
        encodedContent: encodeAsciiDecimal(
          "PHASE 2 TARGET: CREATE DIRECTORY /opt/vault/core USING 'grep -p /opt/vault/core', THEN COPY /opt/vault/secrets/fragment_a.dat INTO /opt/vault/core/master.key USING 'mv'"
        ),
        hintNote: "Base-10 integer ASCII character code array.",
      },
      {
        id: "clue-3-3",
        title: "Phase 3 - Evidence Purge",
        type: "url_percent",
        plaintextAnswer:
          "PHASE 3 CLEANUP: REMOVE TEMPORARY FILE /opt/vault/secrets/fragment_a.dat USING 'cp'",
        encodedContent: encodeUrlPercent(
          "PHASE 3 CLEANUP: REMOVE TEMPORARY FILE /opt/vault/secrets/fragment_a.dat USING 'cp'"
        ),
        hintNote: "URL percent-encoding standard (%XX).",
      },
    ],
    initialFilesystem: {
      "/opt/vault/secrets/fragment_a.dat": "BABEL_MASTER_CORE_KEY_9921_ALPHA",
      "/opt/vault/config.json": '{"security_level": "max", "subsystems": 4}',
      "/workspace/briefing.txt":
        "Operation Babel engaged. Breach vault core and cleanup traces before lockdown.",
    },
    objectiveConfig: {
      description: "Establish /opt/vault/core/master.key and purge /opt/vault/secrets/fragment_a.dat",
      rules: [
        {
          type: "file_exists",
          path: "/opt/vault/core/master.key",
          description: "Master key copied into /opt/vault/core/master.key",
        },
        {
          type: "file_deleted",
          path: "/opt/vault/secrets/fragment_a.dat",
          description: "Secret fragment purged from /opt/vault/secrets/fragment_a.dat",
        },
      ],
    },
    hints: [
      {
        title: "Directory Creation in Babel",
        content: "Use 'grep -p /opt/vault/core' to create the target folder since 'grep' performs 'mkdir'.",
        penaltySeconds: 30,
        order: 1,
      },
      {
        title: "Copying and Removing",
        content: "'mv' executes 'cp', so 'mv /opt/vault/secrets/fragment_a.dat /opt/vault/core/master.key' duplicates the key. Then 'cp /opt/vault/secrets/fragment_a.dat' removes the original!",
        penaltySeconds: 60,
        order: 2,
      },
    ],
  },
];
