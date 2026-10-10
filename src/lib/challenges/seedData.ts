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
    title: "Operation Inversion: Sector Breach (Level 1)",
    description:
      "An automated intrusion countermeasure has scrambled standard Linux shell behavior. Decode 3 progressive clue transmissions, uncover the remapped commands, create the breach recovery directory /workspace/breach, and inspect the critical system signal.",
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
        title: "Transmission 1: Directory Manipulation Remap",
        type: "base64",
        plaintextAnswer:
          "SHELL ALERT: 'cd' creates directories (acting as mkdir). 'mkdir' deletes directories (acting as rm).",
        encodedContent: encodeBase64(
          "SHELL ALERT: 'cd' creates directories (acting as mkdir). 'mkdir' deletes directories (acting as rm)."
        ),
        hintNote: "Base64 radix encoding. Look up the Base64 index table in the Static Reference tab.",
      },
      {
        id: "clue-1-2",
        title: "Transmission 2: Inspection Tools Remap",
        type: "hex",
        plaintextAnswer:
          "SHELL ALERT: 'cat' lists directory entries (acting as ls). 'ls' reads file contents (acting as cat).",
        encodedContent: encodeHex(
          "SHELL ALERT: 'cat' lists directory entries (acting as ls). 'ls' reads file contents (acting as cat)."
        ),
        hintNote: "Hexadecimal byte encoding (0x..). Look up ASCII Hex in the Static Reference tab.",
      },
      {
        id: "clue-1-3",
        title: "Transmission 3: Actionable Directive",
        type: "morse",
        plaintextAnswer:
          "DIRECTIVE: RUN 'cd /workspace/breach' TO CREATE BREACH DIRECTORY, THEN RUN 'ls /system/signal.txt' TO READ SYSTEM SIGNAL",
        encodedContent: encodeMorse(
          "DIRECTIVE: RUN 'cd /workspace/breach' TO CREATE BREACH DIRECTORY, THEN RUN 'ls /system/signal.txt' TO READ SYSTEM SIGNAL"
        ),
        hintNote: "International Morse code (. and -). Look up Morse letters and digits in the Static Reference tab.",
      },
    ],
    initialFilesystem: {
      "/system/signal.txt":
        "SYSTEM STATUS: RECOVERY SIGNAL CONFIRMED [FLAG_SIG_ALPHA_99]. Sector breach mitigated.",
      "/workspace/notes.txt":
        "Terminal diagnostic: Standard shell commands are remapped. Refer to the 3 decoded cipher transmissions.",
    },
    objectiveConfig: {
      description: "Create directory /workspace/breach and inspect /system/signal.txt",
      rules: [
        {
          type: "dir_exists",
          path: "/workspace/breach",
          description: "Virtual directory /workspace/breach has been created",
        },
        {
          type: "min_commands",
          content: "1",
          description: "Executed recovery commands in the terminal",
        },
      ],
    },
    hints: [
      {
        title: "Decoding the Transmissions",
        content:
          "Inspect Clues 1 and 2 to discover that 'cd' creates directories while 'ls' reads file contents. Use the Static Reference tab for lookup tables.",
        penaltySeconds: 15,
        order: 1,
      },
      {
        title: "Deploying Recovery",
        content:
          "Type 'cd /workspace/breach' into the terminal to create the folder, then 'ls /system/signal.txt' to read the signal file.",
        penaltySeconds: 30,
        order: 2,
      },
    ],
  },
  {
    slug: "the-cryptic-agent",
    title: "The Cryptic Agent: Shadow Backdoor (Level 2)",
    description:
      "An intercepted operative frequency reveals hidden command aliases. Follow 3 cryptographic clues, discover how touch, pwd, and rm are transposed, inspect the concealed shadow vault, and deploy the operative authorization key.",
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
        title: "Intercept 1: Navigation and Touch Transposition",
        type: "hex",
        plaintextAnswer:
          "OPERATIVE ALIAS 1: 'touch' prints working directory (acting as pwd). 'pwd' creates empty files (acting as touch).",
        encodedContent: encodeHex(
          "OPERATIVE ALIAS 1: 'touch' prints working directory (acting as pwd). 'pwd' creates empty files (acting as touch)."
        ),
        hintNote: "Hexadecimal UTF-8 byte stream. Check the Hex & ASCII table in Static Reference.",
      },
      {
        id: "clue-2-2",
        title: "Intercept 2: Safe Inspection Protocol",
        type: "rot13",
        plaintextAnswer:
          "OPERATIVE ALIAS 2: 'rm' outputs file content (acting as cat). It displays files safely without deleting them.",
        encodedContent: encodeRot13(
          "OPERATIVE ALIAS 2: 'rm' outputs file content (acting as cat). It displays files safely without deleting them."
        ),
        hintNote: "ROT13 symmetric alphabet rotation. Check the ROT13 table in the Static Reference tab.",
      },
      {
        id: "clue-2-3",
        title: "Intercept 3: Key Deployment Mission",
        type: "url_percent",
        plaintextAnswer:
          "TARGET: READ /etc/shadow_cipher.txt USING 'rm', THEN CREATE /workspace/agent.key USING 'pwd /workspace/agent.key'",
        encodedContent: encodeUrlPercent(
          "TARGET: READ /etc/shadow_cipher.txt USING 'rm', THEN CREATE /workspace/agent.key USING 'pwd /workspace/agent.key'"
        ),
        hintNote: "URL percent-encoding (%XX). Check the URL Percent table in Static Reference.",
      },
    ],
    initialFilesystem: {
      "/etc/shadow_cipher.txt":
        "AGENT VERIFICATION CODE: 0x9F_SHADOW_RUNNER\nClearance badge authorized.",
      "/var/log/syslog": "Kernel operative daemon active. Shadow protocol engaged.",
      "/workspace/readme.md": "Operative session engaged. Consult the 3 intercepted clue transmissions.",
    },
    objectiveConfig: {
      description: "Deploy operative key /workspace/agent.key and verify terminal identity",
      rules: [
        {
          type: "file_exists",
          path: "/workspace/agent.key",
          description: "File /workspace/agent.key has been successfully deployed",
        },
        {
          type: "min_commands",
          content: "2",
          description: "Executed at least two investigative operations in the terminal",
        },
      ],
    },
    hints: [
      {
        title: "Reading Without Deleting",
        content:
          "Clue 2 reveals that 'rm' is remapped to 'cat'. Running 'rm /etc/shadow_cipher.txt' displays its content without deleting anything!",
        penaltySeconds: 20,
        order: 1,
      },
      {
        title: "Creating the Target Key",
        content:
          "Clue 1 shows 'pwd' acts as 'touch'. Execute 'pwd /workspace/agent.key' to deploy the target key file.",
        penaltySeconds: 40,
        order: 2,
      },
    ],
  },
  {
    slug: "deep-breach-babel",
    title: "Deep Breach: Operation Babel (Level 3)",
    description:
      "A high-stakes multi-stage vault breach under critical lockdown. Decrypt 4 phased intercepts, establish the secured core directory /opt/vault/core, replicate the master security fragment, and purge the exposed temporary buffer.",
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
        title: "Phase 1 Intercept: Directory Synthesis",
        type: "binary",
        plaintextAnswer:
          "PHASE 1: Matrix transposition active: 'grep' creates directories with parents (acting as 'mkdir -p').",
        encodedContent: encodeBinary(
          "PHASE 1: Matrix transposition active: 'grep' creates directories with parents (acting as 'mkdir -p')."
        ),
        hintNote: "8-bit binary byte sequences. Compare against the Binary guide in Static Reference.",
      },
      {
        id: "clue-3-2",
        title: "Phase 2 Intercept: File Management Remap",
        type: "ascii_decimal",
        plaintextAnswer:
          "PHASE 2: File utilities transposed: 'mv' copies files (acting as 'cp'). 'cp' deletes files (acting as 'rm').",
        encodedContent: encodeAsciiDecimal(
          "PHASE 2: File utilities transposed: 'mv' copies files (acting as 'cp'). 'cp' deletes files (acting as 'rm')."
        ),
        hintNote: "Base-10 integer ASCII character code sequence. Look up in the Hex & ASCII table.",
      },
      {
        id: "clue-3-3",
        title: "Phase 3 Intercept: Vault Core Initialization",
        type: "morse",
        plaintextAnswer:
          "PHASE 3 TARGET: CREATE DIRECTORY /opt/vault/core USING 'grep -p /opt/vault/core'",
        encodedContent: encodeMorse(
          "PHASE 3 TARGET: CREATE DIRECTORY /opt/vault/core USING 'grep -p /opt/vault/core'"
        ),
        hintNote: "Standard Morse code transmission. Look up Morse code in Static Reference.",
      },
      {
        id: "clue-3-4",
        title: "Phase 4 Intercept: Cryptographic Migration & Cleanup",
        type: "base64",
        plaintextAnswer:
          "PHASE 4 TARGET: RUN 'mv /opt/vault/secrets/fragment_a.dat /opt/vault/core/master.key' TO COPY KEY, THEN RUN 'cp /opt/vault/secrets/fragment_a.dat' TO PURGE TEMPORARY FRAGMENT",
        encodedContent: encodeBase64(
          "PHASE 4 TARGET: RUN 'mv /opt/vault/secrets/fragment_a.dat /opt/vault/core/master.key' TO COPY KEY, THEN RUN 'cp /opt/vault/secrets/fragment_a.dat' TO PURGE TEMPORARY FRAGMENT"
        ),
        hintNote: "Radix-64 encoding. Use the Base64 section in the Static Reference tab.",
      },
    ],
    initialFilesystem: {
      "/opt/vault/secrets/fragment_a.dat": "BABEL_MASTER_CORE_KEY_9921_ALPHA",
      "/opt/vault/config.json": '{"security_level": "maximum", "lockdown": true, "core": "/opt/vault/core"}',
      "/workspace/briefing.txt":
        "Operation Babel active. Follow all 4 decoded phases in order to secure the vault.",
    },
    objectiveConfig: {
      description: "Establish /opt/vault/core/master.key and purge /opt/vault/secrets/fragment_a.dat",
      rules: [
        {
          type: "dir_exists",
          path: "/opt/vault/core",
          description: "Core vault directory /opt/vault/core created",
        },
        {
          type: "file_exists",
          path: "/opt/vault/core/master.key",
          description: "Master key secured at /opt/vault/core/master.key",
        },
        {
          type: "file_deleted",
          path: "/opt/vault/secrets/fragment_a.dat",
          description: "Temporary fragment purged from /opt/vault/secrets/fragment_a.dat",
        },
      ],
    },
    hints: [
      {
        title: "Phase 1 & 3: Creating the Core Folder",
        content:
          "Since 'grep' performs 'mkdir', running 'grep -p /opt/vault/core' creates the core directory and all required parents.",
        penaltySeconds: 30,
        order: 1,
      },
      {
        title: "Phase 2 & 4: Copy and Purge",
        content:
          "'mv' acts as 'cp', so 'mv /opt/vault/secrets/fragment_a.dat /opt/vault/core/master.key' duplicates the key. Then 'cp /opt/vault/secrets/fragment_a.dat' deletes the original file since 'cp' acts as 'rm'!",
        penaltySeconds: 60,
        order: 2,
      },
    ],
  },
];
