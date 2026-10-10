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
  estimatedDuration: string;
  timeLimitSeconds: number;
  scoringConfig: {
    maxBaseScore: number;
    intermediateBudget: number;
    completionBonus: number;
    speedBonusMax: number;
    hintPenaltyCap: number;
    defaultHintPenalty: number;
    difficultyMultiplier: number;
    timeLimitSeconds: number;
    partialCreditOnExpiry: boolean;
    countsTowardLeaderboard: boolean;
  };
  commandMappings: Record<string, string>;
  clues: ClueItem[];
  initialFilesystem: Record<string, string>;
  objectiveConfig: {
    description: string;
    rules: Array<{
      id: string;
      points: number;
      type:
        | "file_exists"
        | "dir_exists"
        | "file_deleted"
        | "dir_deleted"
        | "file_contains"
        | "file_exact"
        | "file_moved"
        | "min_commands";
      path?: string;
      content?: string;
      caseSensitive?: boolean;
      description: string;
    }>;
  };
  hints: Array<{
    title: string;
    content: string;
    penaltySeconds: number;
    pointPenalty: number;
    order: number;
  }>;
}

export const SEED_CHALLENGES: SeedChallengeDef[] = [
  // ==========================================
  // LEVEL 1: EASY (Preserved)
  // ==========================================
  {
    slug: "operation-inversion",
    title: "Operation Inversion: Sector Breach (Level 1)",
    description:
      "An automated intrusion countermeasure has scrambled standard Linux shell behavior. Decode progressive clue transmissions, uncover the remapped commands, create the breach recovery directory /workspace/breach, and inspect the critical system signal.",
    difficulty: "EASY",
    order: 1,
    estimatedDuration: "10-15 min",
    timeLimitSeconds: 1200,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 1200,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
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
          id: "obj-1-breach-dir",
          points: 250,
          type: "dir_exists",
          path: "/workspace/breach",
          description: "Virtual directory /workspace/breach has been created",
        },
        {
          id: "obj-1-cmd-executed",
          points: 250,
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
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Deploying Recovery",
        content:
          "Type 'cd /workspace/breach' into the terminal to create the folder, then 'ls /system/signal.txt' to read the signal file.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 2: MEDIUM (Preserved)
  // ==========================================
  {
    slug: "the-cryptic-agent",
    title: "The Cryptic Agent: Shadow Backdoor (Level 2)",
    description:
      "An intercepted operative frequency reveals hidden command aliases. Follow 3 cryptographic clues, discover how touch, pwd, and rm are transposed, inspect the concealed shadow vault, and deploy the operative authorization key.",
    difficulty: "MEDIUM",
    order: 2,
    estimatedDuration: "15-20 min",
    timeLimitSeconds: 1500,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 1500,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
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
          id: "obj-2-agent-key",
          points: 250,
          type: "file_exists",
          path: "/workspace/agent.key",
          description: "File /workspace/agent.key has been successfully deployed",
        },
        {
          id: "obj-2-cmd-investigated",
          points: 250,
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
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Creating the Target Key",
        content:
          "Clue 1 shows 'pwd' acts as 'touch'. Execute 'pwd /workspace/agent.key' to deploy the target key file.",
        penaltySeconds: 40,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 3: HARD (Preserved)
  // ==========================================
  {
    slug: "deep-breach-babel",
    title: "Deep Breach: Operation Babel (Level 3)",
    description:
      "A high-stakes multi-stage vault breach under critical lockdown. Decrypt 4 phased intercepts, establish the secured core directory /opt/vault/core, replicate the master security fragment, and purge the exposed temporary buffer.",
    difficulty: "HARD",
    order: 3,
    estimatedDuration: "25-30 min",
    timeLimitSeconds: 1800,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.5,
      timeLimitSeconds: 1800,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
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
          id: "obj-3-vault-core",
          points: 150,
          type: "dir_exists",
          path: "/opt/vault/core",
          description: "Core vault directory /opt/vault/core created",
        },
        {
          id: "obj-3-master-key",
          points: 200,
          type: "file_exists",
          path: "/opt/vault/core/master.key",
          description: "Master key secured at /opt/vault/core/master.key",
        },
        {
          id: "obj-3-purge-fragment",
          points: 150,
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
        pointPenalty: 30,
        order: 1,
      },
      {
        title: "Phase 2 & 4: Copy and Purge",
        content:
          "'mv' acts as 'cp', so 'mv /opt/vault/secrets/fragment_a.dat /opt/vault/core/master.key' duplicates the key. Then 'cp /opt/vault/secrets/fragment_a.dat' deletes the original file since 'cp' acts as 'rm'!",
        penaltySeconds: 60,
        pointPenalty: 40,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 4: EASY — Pathfinder Basics
  // ==========================================
  {
    slug: "pathfinder-basics",
    title: "Pathfinder Basics: Route Recovery (Level 4)",
    description:
      "Explore the virtual filesystem hierarchy to recover an offline network lane. Inspect route statuses, decipher the remapped touch tool, and establish the recovery path /routes/recovery.",
    difficulty: "EASY",
    order: 4,
    estimatedDuration: "10-12 min",
    timeLimitSeconds: 1200,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 1200,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      touch: "mkdir",
    },
    clues: [
      {
        id: "clue-4-1",
        title: "Transmission: Route Configuration Remap",
        type: "hex",
        plaintextAnswer:
          "ROUTE DISPATCH: 'touch' creates directories (acting as mkdir). Run 'touch /routes/recovery' to establish recovery lane.",
        encodedContent: encodeHex(
          "ROUTE DISPATCH: 'touch' creates directories (acting as mkdir). Run 'touch /routes/recovery' to establish recovery lane."
        ),
        hintNote: "Hexadecimal byte encoding. Check ASCII Hex in the Static Reference tab.",
      },
    ],
    initialFilesystem: {
      "/workspace/readme.txt": "Route mapping disrupted. Investigate /routes/primary and /routes/backup.",
      "/routes/primary/config.log": "Primary route offline. Switch to recovery lane.",
      "/routes/backup/token.txt": "ROUTE_TOKEN_7421",
    },
    objectiveConfig: {
      description: "Establish recovery lane directory /routes/recovery",
      rules: [
        {
          id: "obj-4-recovery-dir",
          points: 300,
          type: "dir_exists",
          path: "/routes/recovery",
          description: "Directory /routes/recovery created",
        },
        {
          id: "obj-4-explored",
          points: 200,
          type: "min_commands",
          content: "2",
          description: "Executed investigative commands in the terminal",
        },
      ],
    },
    hints: [
      {
        title: "Investigating the Routes",
        content: "Use 'ls /routes' and 'cat /routes/primary/config.log' to understand the situation.",
        penaltySeconds: 10,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Creating the Recovery Path",
        content: "Since 'touch' acts as 'mkdir', run 'touch /routes/recovery' to create the folder.",
        penaltySeconds: 20,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 5: EASY — Morse Mail
  // ==========================================
  {
    slug: "morse-mail",
    title: "Morse Mail: Dispatch Dispatcher (Level 5)",
    description:
      "A raw teleprinter dispatch arrived in /mail/inbox/dispatch.txt. Inspect the Morse-encoded text manually, discover the swapped navigation tool, and create the dispatch queue /workspace/dispatch.",
    difficulty: "EASY",
    order: 5,
    estimatedDuration: "10-12 min",
    timeLimitSeconds: 1200,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 1200,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      cd: "mkdir",
      mkdir: "cd",
    },
    clues: [
      {
        id: "clue-5-1",
        title: "Dispatch Memo: Telecom Remap",
        type: "morse",
        plaintextAnswer:
          "DISPATCH MEMO: 'cd' CREATES DIRECTORIES (ACTING AS MKDIR). RUN 'cd /workspace/dispatch'",
        encodedContent: encodeMorse(
          "DISPATCH MEMO: 'cd' CREATES DIRECTORIES (ACTING AS MKDIR). RUN 'cd /workspace/dispatch'"
        ),
        hintNote: "Standard Morse transmission. Look up Morse characters in Static Reference.",
      },
    ],
    initialFilesystem: {
      "/mail/inbox/dispatch.txt":
        "-.-. -.. / -.-. .-. . .- - . ... / -.. .. .-. . -.-. - --- .-. .. . ...",
      "/mail/outbox/.keep": "",
      "/workspace/notes.txt":
        "Incoming telegram stored in /mail/inbox/dispatch.txt. Use 'cat' to read it.",
    },
    objectiveConfig: {
      description: "Create /workspace/dispatch using remapped shell navigation",
      rules: [
        {
          id: "obj-5-dispatch-dir",
          points: 300,
          type: "dir_exists",
          path: "/workspace/dispatch",
          description: "Directory /workspace/dispatch established",
        },
        {
          id: "obj-5-cmds",
          points: 200,
          type: "min_commands",
          content: "1",
          description: "Executed required shell instructions",
        },
      ],
    },
    hints: [
      {
        title: "Reading the Telegram",
        content: "Run 'cat /mail/inbox/dispatch.txt' to view the Morse code message.",
        penaltySeconds: 10,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Directory Creation",
        content: "The command 'cd' acts as 'mkdir'. Type 'cd /workspace/dispatch' to finish.",
        penaltySeconds: 20,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 6: EASY — Binary Breadcrumbs
  // ==========================================
  {
    slug: "binary-breadcrumbs",
    title: "Binary Breadcrumbs: The Cache Trace (Level 6)",
    description:
      "A cache trace file in binary UTF-8 points to one specific node among candidate directories. Decode the byte stream, uncover the remapped ls command, and mark the active node with /cache/node_beta/verified.",
    difficulty: "EASY",
    order: 6,
    estimatedDuration: "10-15 min",
    timeLimitSeconds: 1200,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 1200,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      ls: "touch",
      touch: "ls",
    },
    clues: [
      {
        id: "clue-6-1",
        title: "Trace Intercept: Node Selection",
        type: "binary",
        plaintextAnswer:
          "NODE TRACE: 'ls' CREATES EMPTY FILES (ACTING AS TOUCH). TARGET: CREATE /cache/node_beta/verified",
        encodedContent: encodeBinary(
          "NODE TRACE: 'ls' CREATES EMPTY FILES (ACTING AS TOUCH). TARGET: CREATE /cache/node_beta/verified"
        ),
        hintNote: "8-bit binary representation. Compare against the Binary guide in Static Reference.",
      },
    ],
    initialFilesystem: {
      "/cache/node_alpha/dummy.dat": "Alpha node idle.",
      "/cache/node_beta/status.txt": "Node Beta selected for synchronization.",
      "/cache/node_gamma/dummy.dat": "Gamma node offline.",
      "/workspace/trace.bin": "Inspect clue transmission for the binary trace.",
    },
    objectiveConfig: {
      description: "Mark cache node Beta with /cache/node_beta/verified",
      rules: [
        {
          id: "obj-6-verified-file",
          points: 350,
          type: "file_exists",
          path: "/cache/node_beta/verified",
          description: "File /cache/node_beta/verified created",
        },
        {
          id: "obj-6-cmds",
          points: 150,
          type: "min_commands",
          content: "1",
          description: "Executed commands in terminal",
        },
      ],
    },
    hints: [
      {
        title: "Translating 8-bit Binary",
        content: "Convert the 8-bit groups to ASCII characters using the Binary Reference table.",
        penaltySeconds: 10,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Placing the File",
        content: "'ls' acts as 'touch'. Execute 'ls /cache/node_beta/verified' to complete the challenge.",
        penaltySeconds: 20,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 7: EASY — Hex in Plain Sight
  // ==========================================
  {
    slug: "hex-in-plain-sight",
    title: "Hex in Plain Sight: Firmware Patch (Level 7)",
    description:
      "A hexadecimal firmware payload is stored in the subsystem. Translate the hex stream to reveal the command anomaly, and deploy the patch confirmation file /workspace/patch.ack.",
    difficulty: "EASY",
    order: 7,
    estimatedDuration: "10-15 min",
    timeLimitSeconds: 1200,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 1200,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      cat: "touch",
      echo: "cat",
    },
    clues: [
      {
        id: "clue-7-1",
        title: "Firmware Hex Directive",
        type: "hex",
        plaintextAnswer:
          "PATCH NOTICE: 'cat' creates empty files (acting as touch). Run 'cat /workspace/patch.ack'",
        encodedContent: encodeHex(
          "PATCH NOTICE: 'cat' creates empty files (acting as touch). Run 'cat /workspace/patch.ack'"
        ),
        hintNote: "Hex byte sequence. Look up Hex & ASCII in the Static Reference tab.",
      },
    ],
    initialFilesystem: {
      "/firmware/v1/config.rom": "ROM_V1_STABLE",
      "/firmware/v2/patch.hex": "4649524d574152452055504752414445",
      "/workspace/instructions.txt": "Translate the hex clue to deploy the patch acknowledgment.",
    },
    objectiveConfig: {
      description: "Deploy firmware acknowledgment file /workspace/patch.ack",
      rules: [
        {
          id: "obj-7-patch-ack",
          points: 300,
          type: "file_exists",
          path: "/workspace/patch.ack",
          description: "File /workspace/patch.ack deployed",
        },
        {
          id: "obj-7-cmds",
          points: 200,
          type: "min_commands",
          content: "1",
          description: "Executed commands in terminal",
        },
      ],
    },
    hints: [
      {
        title: "Deciphering Hex Values",
        content: "Convert pairs of hexadecimal digits into ASCII characters using the Reference tab.",
        penaltySeconds: 10,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Executing the Patch",
        content: "Since 'cat' creates files (acting as touch), run 'cat /workspace/patch.ack'.",
        penaltySeconds: 20,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 8: EASY — Directory Flip
  // ==========================================
  {
    slug: "directory-flip",
    title: "Directory Flip: Inverted Maintenance (Level 8)",
    description:
      "A maintenance script swapped directory creation and removal. Follow the inverted directives: purge the corrupted /staging/temp_garbage directory, and establish the clean /staging/production directory.",
    difficulty: "EASY",
    order: 8,
    estimatedDuration: "12-15 min",
    timeLimitSeconds: 1200,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 1200,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      mkdir: "rm",
      rm: "mkdir",
    },
    clues: [
      {
        id: "clue-8-1",
        title: "Inversion Briefing",
        type: "base64",
        plaintextAnswer:
          "SWAP ALERT: 'mkdir' removes files/folders (acting as rm -r). 'rm' creates directories (acting as mkdir -p).",
        encodedContent: encodeBase64(
          "SWAP ALERT: 'mkdir' removes files/folders (acting as rm -r). 'rm' creates directories (acting as mkdir -p)."
        ),
        hintNote: "Base64 encoding. Use the Base64 section in Static Reference.",
      },
      {
        id: "clue-8-2",
        title: "Maintenance Directives",
        type: "rot13",
        plaintextAnswer:
          "ACTION: Run 'mkdir -r /staging/temp_garbage' to purge junk, then 'rm /staging/production' to create production.",
        encodedContent: encodeRot13(
          "ACTION: Run 'mkdir -r /staging/temp_garbage' to purge junk, then 'rm /staging/production' to create production."
        ),
        hintNote: "ROT13 alphabet shift. Rotate letters by 13 positions.",
      },
    ],
    initialFilesystem: {
      "/staging/temp_garbage/junk.tmp": "Stale junk files from prior run.",
      "/staging/config.json": '{"status": "awaiting_production"}',
    },
    objectiveConfig: {
      description: "Create /staging/production and remove /staging/temp_garbage",
      rules: [
        {
          id: "obj-8-prod-created",
          points: 250,
          type: "dir_exists",
          path: "/staging/production",
          description: "Directory /staging/production created",
        },
        {
          id: "obj-8-garbage-deleted",
          points: 250,
          type: "dir_deleted",
          path: "/staging/temp_garbage",
          description: "Stale directory /staging/temp_garbage removed",
        },
      ],
    },
    hints: [
      {
        title: "Understanding Swapped Tools",
        content: "'mkdir' now deletes targets, and 'rm' now creates directories.",
        penaltySeconds: 10,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Commands Sequence",
        content: "Run 'mkdir -r /staging/temp_garbage' followed by 'rm /staging/production'.",
        penaltySeconds: 20,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 9: EASY — The Missing File
  // ==========================================
  {
    slug: "the-missing-file",
    title: "The Missing File: Decoy Vault (Level 9)",
    description:
      "Multiple decoy keys clutter /vault/keys. Decode the Base64 clue to identify the authentic key, understand how cat is remapped to cp, and duplicate the real key into /workspace/unlocked.key.",
    difficulty: "EASY",
    order: 9,
    estimatedDuration: "12-15 min",
    timeLimitSeconds: 1200,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 1200,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      cat: "cp",
      head: "cat",
    },
    clues: [
      {
        id: "clue-9-1",
        title: "Target Identification",
        type: "base64",
        plaintextAnswer:
          "TARGET FILE: /vault/keys/authentic.key. COMMAND REMAP: 'head' reads files (cat). 'cat' copies files (cp).",
        encodedContent: encodeBase64(
          "TARGET FILE: /vault/keys/authentic.key. COMMAND REMAP: 'head' reads files (cat). 'cat' copies files (cp)."
        ),
        hintNote: "Base64 encoding table in Static Reference.",
      },
      {
        id: "clue-9-2",
        title: "Key Replication Directive",
        type: "morse",
        plaintextAnswer:
          "EXECUTE: RUN 'cat /vault/keys/authentic.key /workspace/unlocked.key' TO DUPLICATE THE KEY",
        encodedContent: encodeMorse(
          "EXECUTE: RUN 'cat /vault/keys/authentic.key /workspace/unlocked.key' TO DUPLICATE THE KEY"
        ),
        hintNote: "Morse code dots and dashes.",
      },
    ],
    initialFilesystem: {
      "/vault/keys/decoy_alpha.key": "DECOY_KEY_ALPHA_INVALID",
      "/vault/keys/decoy_beta.key": "DECOY_KEY_BETA_INVALID",
      "/vault/keys/authentic.key": "VAULT_KEY_VALIDATED_9941_SIG",
      "/workspace/notes.txt": "Find the authentic key and copy it to /workspace/unlocked.key.",
    },
    objectiveConfig: {
      description: "Replicate authentic key to /workspace/unlocked.key",
      rules: [
        {
          id: "obj-9-unlocked-key",
          points: 300,
          type: "file_exists",
          path: "/workspace/unlocked.key",
          description: "Key deployed to /workspace/unlocked.key",
        },
        {
          id: "obj-9-cmds",
          points: 200,
          type: "min_commands",
          content: "1",
          description: "Executed commands in terminal",
        },
      ],
    },
    hints: [
      {
        title: "Inspecting Without Deleting",
        content: "Use 'head /vault/keys/authentic.key' to inspect its contents (head acts as cat).",
        penaltySeconds: 10,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Copying the Key",
        content: "'cat' is remapped to 'cp'. Run 'cat /vault/keys/authentic.key /workspace/unlocked.key'.",
        penaltySeconds: 20,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 10: EASY — First Flag
  // ==========================================
  {
    slug: "first-flag",
    title: "First Flag: The Pioneer Relay (Level 10)",
    description:
      "A sequential beginner relay. Decipher two phased transmissions to discover that touch creates directories and echo creates empty files. Create /relay/checkpoint_alpha and deploy /relay/checkpoint_alpha/flag.txt.",
    difficulty: "EASY",
    order: 10,
    estimatedDuration: "12-15 min",
    timeLimitSeconds: 1200,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 1200,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      touch: "mkdir",
      echo: "touch",
    },
    clues: [
      {
        id: "clue-10-1",
        title: "Relay Phase 1: Remap Scheme",
        type: "hex",
        plaintextAnswer:
          "RELAY REMAP: 'touch' creates directories (acting as mkdir). 'echo' creates empty files (acting as touch).",
        encodedContent: encodeHex(
          "RELAY REMAP: 'touch' creates directories (acting as mkdir). 'echo' creates empty files (acting as touch)."
        ),
        hintNote: "Hex byte values.",
      },
      {
        id: "clue-10-2",
        title: "Relay Phase 2: Deployment",
        type: "morse",
        plaintextAnswer:
          "TARGET: RUN 'touch /relay/checkpoint_alpha' THEN 'echo /relay/checkpoint_alpha/flag.txt'",
        encodedContent: encodeMorse(
          "TARGET: RUN 'touch /relay/checkpoint_alpha' THEN 'echo /relay/checkpoint_alpha/flag.txt'"
        ),
        hintNote: "Standard Morse transmission.",
      },
    ],
    initialFilesystem: {
      "/relay/station/checkpoint_zero.txt": "RELAY INITIALIZED. PROCEED TO CHECKPOINT ALPHA.",
      "/workspace/relay.log": "Awaiting deployment of Checkpoint Alpha flag.",
    },
    objectiveConfig: {
      description: "Establish /relay/checkpoint_alpha/flag.txt",
      rules: [
        {
          id: "obj-10-checkpoint-dir",
          points: 250,
          type: "dir_exists",
          path: "/relay/checkpoint_alpha",
          description: "Checkpoint directory /relay/checkpoint_alpha created",
        },
        {
          id: "obj-10-flag-file",
          points: 250,
          type: "file_exists",
          path: "/relay/checkpoint_alpha/flag.txt",
          description: "Flag file /relay/checkpoint_alpha/flag.txt planted",
        },
      ],
    },
    hints: [
      {
        title: "Phase Order",
        content: "First create the directory using 'touch', then plant the flag with 'echo'.",
        penaltySeconds: 10,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Exact Commands",
        content: "Run 'touch /relay/checkpoint_alpha' followed by 'echo /relay/checkpoint_alpha/flag.txt'.",
        penaltySeconds: 20,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 11: MEDIUM — Dead Letter
  // ==========================================
  {
    slug: "dead-letter",
    title: "Dead Letter: Abandoned Drop (Level 11)",
    description:
      "A classified dead letter is hidden in an abandoned storage sector. Decrypt the Base64 and ROT13 clues, discover how cd and mv swapped roles, and relocate the letter to /workspace/recovered.txt.",
    difficulty: "MEDIUM",
    order: 11,
    estimatedDuration: "15-20 min",
    timeLimitSeconds: 1500,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 1500,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      cd: "mv",
      mv: "cd",
    },
    clues: [
      {
        id: "clue-11-1",
        title: "Dropzone Intercept 1",
        type: "base64",
        plaintextAnswer:
          "DROPZONE ALIAS: 'cd' moves files (acting as mv). 'mv' navigates directories (acting as cd).",
        encodedContent: encodeBase64(
          "DROPZONE ALIAS: 'cd' moves files (acting as mv). 'mv' navigates directories (acting as cd)."
        ),
        hintNote: "Base64 character decoding.",
      },
      {
        id: "clue-11-2",
        title: "Dropzone Intercept 2",
        type: "rot13",
        plaintextAnswer:
          "TARGET: Move /dropzone/locker_3/classified/letter.txt to /workspace/recovered.txt using 'cd'.",
        encodedContent: encodeRot13(
          "TARGET: Move /dropzone/locker_3/classified/letter.txt to /workspace/recovered.txt using 'cd'."
        ),
        hintNote: "ROT13 substitution.",
      },
    ],
    initialFilesystem: {
      "/dropzone/locker_1/stale.dat": "EMPTY_LOCKER",
      "/dropzone/locker_2/noise.log": "00 44 22 99",
      "/dropzone/locker_3/classified/letter.txt":
        "CONFIDENTIAL_DROP_CONTENT: KEY_CODE_9901_CONFIRMED",
    },
    objectiveConfig: {
      description: "Move dead letter to /workspace/recovered.txt",
      rules: [
        {
          id: "obj-11-recovered-letter",
          points: 300,
          type: "file_exists",
          path: "/workspace/recovered.txt",
          description: "Letter recovered at /workspace/recovered.txt",
        },
        {
          id: "obj-11-letter-moved",
          points: 200,
          type: "file_deleted",
          path: "/dropzone/locker_3/classified/letter.txt",
          description: "Original letter cleared from dead drop",
        },
      ],
    },
    hints: [
      {
        title: "Role Reversal",
        content: "'cd' moves files, and 'mv' changes directories.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Moving the File",
        content: "Run 'cd /dropzone/locker_3/classified/letter.txt /workspace/recovered.txt'.",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 12: MEDIUM — Log Diver
  // ==========================================
  {
    slug: "log-diver",
    title: "Log Diver: Audit Anomaly (Level 12)",
    description:
      "A security breach is buried within noisy system logs. Decode the ASCII decimal and Hex clues, discover how cat filters logs while grep touches files, search /var/log/audit.log, and record acknowledgment /var/log/incident_ack.log.",
    difficulty: "MEDIUM",
    order: 12,
    estimatedDuration: "15-20 min",
    timeLimitSeconds: 1500,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 1500,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      cat: "grep",
      grep: "touch",
      head: "cat",
    },
    clues: [
      {
        id: "clue-12-1",
        title: "Log Search Protocol",
        type: "ascii_decimal",
        plaintextAnswer:
          "LOG PROTOCOL: 'cat' filters matching lines (acting as grep). 'grep' creates empty files (acting as touch).",
        encodedContent: encodeAsciiDecimal(
          "LOG PROTOCOL: 'cat' filters matching lines (acting as grep). 'grep' creates empty files (acting as touch)."
        ),
        hintNote: "ASCII decimal codes.",
      },
      {
        id: "clue-12-2",
        title: "Audit Query Directive",
        type: "hex",
        plaintextAnswer:
          "RUN 'cat CRITICAL /var/log/audit.log' TO FIND INCIDENT, THEN 'grep /var/log/incident_ack.log' TO RECORD ACK",
        encodedContent: encodeHex(
          "RUN 'cat CRITICAL /var/log/audit.log' TO FIND INCIDENT, THEN 'grep /var/log/incident_ack.log' TO RECORD ACK"
        ),
        hintNote: "Hex byte sequence.",
      },
    ],
    initialFilesystem: {
      "/var/log/audit.log":
        "[INFO-101] System boot normal\n[DEBUG-202] Syncing network adapters\n[ALERT-942] CRITICAL INCIDENT: ROOT_SESSION_ESCALATED ID=SEC_8829_REVOKED\n[INFO-103] Heartbeat ok",
      "/var/log/auth.log": "User login ok\nSession closed",
      "/var/log/syslog": "System status nominal",
    },
    objectiveConfig: {
      description: "Filter critical log entry and deploy /var/log/incident_ack.log",
      rules: [
        {
          id: "obj-12-incident-ack",
          points: 300,
          type: "file_exists",
          path: "/var/log/incident_ack.log",
          description: "Incident acknowledgment /var/log/incident_ack.log created",
        },
        {
          id: "obj-12-audit-searched",
          points: 200,
          type: "min_commands",
          content: "2",
          description: "Investigated system logs with terminal tools",
        },
      ],
    },
    hints: [
      {
        title: "Searching Logs",
        content: "'cat' acts as grep. Run 'cat CRITICAL /var/log/audit.log' to view the critical line.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Creating Acknowledgment",
        content: "'grep' acts as touch. Run 'grep /var/log/incident_ack.log' to record the file.",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 13: MEDIUM — The Relocation Protocol
  // ==========================================
  {
    slug: "the-relocation-protocol",
    title: "The Relocation Protocol: Secure Transport (Level 13)",
    description:
      "A sensitive package in /transport/dock/package_alpha.pkg must be relocated into /transport/vault. Decipher the Base64 and Morse transmissions to understand why cp moves files while mv deletes them.",
    difficulty: "MEDIUM",
    order: 13,
    estimatedDuration: "15-20 min",
    timeLimitSeconds: 1500,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 1500,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      cp: "mv",
      mv: "rm",
      ls: "cp",
    },
    clues: [
      {
        id: "clue-13-1",
        title: "Transport Protocol Remap",
        type: "base64",
        plaintextAnswer:
          "PROTOCOL REMAP: 'cp' moves files (acting as mv). 'mv' deletes files (acting as rm).",
        encodedContent: encodeBase64(
          "PROTOCOL REMAP: 'cp' moves files (acting as mv). 'mv' deletes files (acting as rm)."
        ),
        hintNote: "Base64 table in Static Reference.",
      },
      {
        id: "clue-13-2",
        title: "Relocation Target",
        type: "morse",
        plaintextAnswer:
          "RUN 'cp /transport/dock/package_alpha.pkg /transport/vault/package_alpha.pkg' TO SAFELY RELOCATE",
        encodedContent: encodeMorse(
          "RUN 'cp /transport/dock/package_alpha.pkg /transport/vault/package_alpha.pkg' TO SAFELY RELOCATE"
        ),
        hintNote: "Morse code dots and dashes.",
      },
    ],
    initialFilesystem: {
      "/transport/dock/package_alpha.pkg": "ASSET_ALPHA_PAYLOAD_9921_CONFIDENTIAL",
      "/transport/dock/manifest.txt": "Package Alpha awaiting vault relocation.",
      "/transport/vault/.keep": "",
    },
    objectiveConfig: {
      description: "Move package from dock to /transport/vault/package_alpha.pkg",
      rules: [
        {
          id: "obj-13-dest-file",
          points: 250,
          type: "file_exists",
          path: "/transport/vault/package_alpha.pkg",
          description: "Package Alpha secured in vault",
        },
        {
          id: "obj-13-src-deleted",
          points: 250,
          type: "file_deleted",
          path: "/transport/dock/package_alpha.pkg",
          description: "Original package cleared from transport dock",
        },
      ],
    },
    hints: [
      {
        title: "Tool Caution",
        content: "Do not use 'mv' as it acts as 'rm' and will delete the package!",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Relocation Command",
        content: "Run 'cp /transport/dock/package_alpha.pkg /transport/vault/package_alpha.pkg'.",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 14: MEDIUM — Needle in the Archive
  // ==========================================
  {
    slug: "needle-in-the-archive",
    title: "Needle in the Archive: Decoy Depository (Level 14)",
    description:
      "A target artifact is concealed across nested archive boxes filled with decoy files. Decrypt the Binary and Hex clues, discover how cat searches files (find) while touch replicates files (cp), and retrieve /workspace/target.dat.",
    difficulty: "MEDIUM",
    order: 14,
    estimatedDuration: "15-20 min",
    timeLimitSeconds: 1500,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 1500,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      find: "cat",
      cat: "find",
      touch: "cp",
    },
    clues: [
      {
        id: "clue-14-1",
        title: "Archive Search Tool Remap",
        type: "binary",
        plaintextAnswer:
          "ARCHIVE TOOL REMAP: 'cat' searches filenames (acting as find). 'touch' copies files (acting as cp).",
        encodedContent: encodeBinary(
          "ARCHIVE TOOL REMAP: 'cat' searches filenames (acting as find). 'touch' copies files (acting as cp)."
        ),
        hintNote: "8-bit binary representation.",
      },
      {
        id: "clue-14-2",
        title: "Retrieval Directive",
        type: "hex",
        plaintextAnswer:
          "TARGET: Search with 'cat /archive -name target_artifact.dat', then replicate with 'touch /archive/sector_3/box_d/target_artifact.dat /workspace/target.dat'",
        encodedContent: encodeHex(
          "TARGET: Search with 'cat /archive -name target_artifact.dat', then replicate with 'touch /archive/sector_3/box_d/target_artifact.dat /workspace/target.dat'"
        ),
        hintNote: "Hex byte values in Static Reference.",
      },
    ],
    initialFilesystem: {
      "/archive/sector_1/box_a/file_1.dat": "DUMMY_RECORD_01",
      "/archive/sector_1/box_b/file_2.dat": "DUMMY_RECORD_02",
      "/archive/sector_2/box_c/file_3.dat": "DUMMY_RECORD_03",
      "/archive/sector_3/box_d/target_artifact.dat": "GENUINE_ARCHIVE_ARTIFACT_TOKEN_7718",
      "/archive/sector_3/box_e/file_4.dat": "DUMMY_RECORD_04",
    },
    objectiveConfig: {
      description: "Locate and retrieve target artifact to /workspace/target.dat",
      rules: [
        {
          id: "obj-14-target-replicated",
          points: 300,
          type: "file_exists",
          path: "/workspace/target.dat",
          description: "Artifact replicated to /workspace/target.dat",
        },
        {
          id: "obj-14-cmd-searched",
          points: 200,
          type: "min_commands",
          content: "2",
          description: "Searched archive using terminal commands",
        },
      ],
    },
    hints: [
      {
        title: "Finding the Artifact",
        content: "Run 'cat /archive -name target_artifact.dat' to locate the file in the archive boxes.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Copying the File",
        content: "'touch' acts as 'cp'. Run 'touch /archive/sector_3/box_d/target_artifact.dat /workspace/target.dat'.",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 15: MEDIUM — Ghost Signal
  // ==========================================
  {
    slug: "ghost-signal",
    title: "Ghost Signal: Fragment Fusion (Level 15)",
    description:
      "Fragmented radio signals require combining binary and ROT13 decodings. Discover how rm creates directories while mkdir creates files, establish /signals/beacon, and lock the frequency file /signals/beacon/freq.lock.",
    difficulty: "MEDIUM",
    order: 15,
    estimatedDuration: "15-20 min",
    timeLimitSeconds: 1500,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 1500,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      rm: "mkdir",
      mkdir: "touch",
    },
    clues: [
      {
        id: "clue-15-1",
        title: "Radio Fragment Alpha",
        type: "binary",
        plaintextAnswer:
          "SIGNAL ALIAS: 'rm' creates directories (acting as mkdir -p). 'mkdir' creates empty files (acting as touch).",
        encodedContent: encodeBinary(
          "SIGNAL ALIAS: 'rm' creates directories (acting as mkdir -p). 'mkdir' creates empty files (acting as touch)."
        ),
        hintNote: "Binary UTF-8 characters.",
      },
      {
        id: "clue-15-2",
        title: "Radio Fragment Beta",
        type: "rot13",
        plaintextAnswer:
          "DIRECTIVE: Create directory /signals/beacon using 'rm', then create file /signals/beacon/freq.lock using 'mkdir'.",
        encodedContent: encodeRot13(
          "DIRECTIVE: Create directory /signals/beacon using 'rm', then create file /signals/beacon/freq.lock using 'mkdir'."
        ),
        hintNote: "ROT13 alphabet shift.",
      },
    ],
    initialFilesystem: {
      "/radio/frequencies/band_1.txt": "Frequency lock candidate: 1420.405 MHz",
      "/radio/logs/reception.log": "Beacon ping detected on sector 4.",
    },
    objectiveConfig: {
      description: "Establish /signals/beacon/freq.lock using remapped tools",
      rules: [
        {
          id: "obj-15-beacon-dir",
          points: 250,
          type: "dir_exists",
          path: "/signals/beacon",
          description: "Directory /signals/beacon created",
        },
        {
          id: "obj-15-freq-lock",
          points: 250,
          type: "file_exists",
          path: "/signals/beacon/freq.lock",
          description: "Lock file /signals/beacon/freq.lock deployed",
        },
      ],
    },
    hints: [
      {
        title: "Combining Clues",
        content: "'rm' creates directories, and 'mkdir' creates files.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Commands Flow",
        content: "Run 'rm -p /signals/beacon' followed by 'mkdir /signals/beacon/freq.lock'.",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 16: MEDIUM — Three Keys
  // ==========================================
  {
    slug: "three-keys",
    title: "Three Keys: The Trifecta Gate (Level 16)",
    description:
      "A three-stage security gate. Decode Morse, Base64, and Hex clues to progress through 3 sequential objectives: build /gate/vault/slot1 with pwd, copy the key with cd, and purge the source key with cat.",
    difficulty: "MEDIUM",
    order: 16,
    estimatedDuration: "18-22 min",
    timeLimitSeconds: 1500,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 1500,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      pwd: "mkdir",
      cd: "cp",
      cat: "rm",
    },
    clues: [
      {
        id: "clue-16-1",
        title: "Stage 1 Gate Key",
        type: "morse",
        plaintextAnswer:
          "STAGE 1: 'pwd' CREATES DIRECTORIES. RUN 'pwd /gate/vault/slot1'",
        encodedContent: encodeMorse(
          "STAGE 1: 'pwd' CREATES DIRECTORIES. RUN 'pwd /gate/vault/slot1'"
        ),
        hintNote: "Morse code characters.",
      },
      {
        id: "clue-16-2",
        title: "Stage 2 Gate Key",
        type: "base64",
        plaintextAnswer:
          "STAGE 2: 'cd' COPIES FILES. RUN 'cd /gate/key1_source.txt /gate/vault/slot1/key1.txt'",
        encodedContent: encodeBase64(
          "STAGE 2: 'cd' COPIES FILES. RUN 'cd /gate/key1_source.txt /gate/vault/slot1/key1.txt'"
        ),
        hintNote: "Base64 encoding table.",
      },
      {
        id: "clue-16-3",
        title: "Stage 3 Gate Key",
        type: "hex",
        plaintextAnswer:
          "STAGE 3: 'cat' PURGES FILES. RUN 'cat /gate/key1_source.txt' TO SEAL THE GATE",
        encodedContent: encodeHex(
          "STAGE 3: 'cat' PURGES FILES. RUN 'cat /gate/key1_source.txt' TO SEAL THE GATE"
        ),
        hintNote: "ASCII Hex byte values.",
      },
    ],
    initialFilesystem: {
      "/gate/key1_source.txt": "TRIFECTA_KEY_ALPHA_SECURE",
      "/gate/vault/.keep": "",
    },
    objectiveConfig: {
      description: "Establish /gate/vault/slot1/key1.txt and purge source key",
      rules: [
        {
          id: "obj-16-slot1-dir",
          points: 150,
          type: "dir_exists",
          path: "/gate/vault/slot1",
          description: "Vault slot directory /gate/vault/slot1 created",
        },
        {
          id: "obj-16-key1-file",
          points: 200,
          type: "file_exists",
          path: "/gate/vault/slot1/key1.txt",
          description: "Key secured at /gate/vault/slot1/key1.txt",
        },
        {
          id: "obj-16-source-purged",
          points: 150,
          type: "file_deleted",
          path: "/gate/key1_source.txt",
          description: "Source key /gate/key1_source.txt securely purged",
        },
      ],
    },
    hints: [
      {
        title: "Stage 1 & 2 Execution",
        content: "Run 'pwd /gate/vault/slot1' to make the folder, then 'cd /gate/key1_source.txt /gate/vault/slot1/key1.txt' to copy the key.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Stage 3 Sealing",
        content: "'cat' acts as 'rm'. Run 'cat /gate/key1_source.txt' to purge the source file.",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 17: MEDIUM — Decoy Protocol
  // ==========================================
  {
    slug: "decoy-protocol",
    title: "Decoy Protocol: Forensic Filter (Level 17)",
    description:
      "Honeypot decoys corrupt the evidence archive. Decrypt the URL percent and Base64 transmissions, discover how ls acts as grep while grep acts as cp and cp acts as rm, copy authentic evidence to /workspace/case.dat, and purge the decoys.",
    difficulty: "MEDIUM",
    order: 17,
    estimatedDuration: "18-22 min",
    timeLimitSeconds: 1500,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 1500,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      ls: "grep",
      grep: "cp",
      cp: "rm",
    },
    clues: [
      {
        id: "clue-17-1",
        title: "Forensic Extraction Scheme",
        type: "url_percent",
        plaintextAnswer:
          "FORENSIC ALERT: 'grep' copies files (acting as cp). 'cp' deletes files (acting as rm).",
        encodedContent: encodeUrlPercent(
          "FORENSIC ALERT: 'grep' copies files (acting as cp). 'cp' deletes files (acting as rm)."
        ),
        hintNote: "URL percent-encoding (%XX).",
      },
      {
        id: "clue-17-2",
        title: "Evidence Archiving Target",
        type: "base64",
        plaintextAnswer:
          "TARGET: Run 'grep /evidence/authentic_case.dat /workspace/case.dat' to archive, then purge decoys with 'cp /evidence/fake_1.doc' and 'cp /evidence/fake_2.doc'",
        encodedContent: encodeBase64(
          "TARGET: Run 'grep /evidence/authentic_case.dat /workspace/case.dat' to archive, then purge decoys with 'cp /evidence/fake_1.doc' and 'cp /evidence/fake_2.doc'"
        ),
        hintNote: "Base64 table in Static Reference.",
      },
    ],
    initialFilesystem: {
      "/evidence/fake_1.doc": "HONEYPOT_FAKE_RECORD_A",
      "/evidence/fake_2.doc": "HONEYPOT_FAKE_RECORD_B",
      "/evidence/authentic_case.dat": "GENUINE_EVIDENCE_RECORD_9921",
    },
    objectiveConfig: {
      description: "Archive authentic evidence and purge fake honeypots",
      rules: [
        {
          id: "obj-17-case-archived",
          points: 250,
          type: "file_exists",
          path: "/workspace/case.dat",
          description: "Evidence archived at /workspace/case.dat",
        },
        {
          id: "obj-17-fake1-deleted",
          points: 125,
          type: "file_deleted",
          path: "/evidence/fake_1.doc",
          description: "Decoy /evidence/fake_1.doc removed",
        },
        {
          id: "obj-17-fake2-deleted",
          points: 125,
          type: "file_deleted",
          path: "/evidence/fake_2.doc",
          description: "Decoy /evidence/fake_2.doc removed",
        },
      ],
    },
    hints: [
      {
        title: "Copying Authentic File",
        content: "'grep' acts as 'cp'. Run 'grep /evidence/authentic_case.dat /workspace/case.dat'.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Purging Decoys",
        content: "'cp' acts as 'rm'. Run 'cp /evidence/fake_1.doc' and 'cp /evidence/fake_2.doc'.",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 18: MEDIUM — Broken Chain
  // ==========================================
  {
    slug: "broken-chain",
    title: "Broken Chain: Pipeline Restoration (Level 18)",
    description:
      "A broken pipeline left input artifacts misplaced. Decrypt the Hex and ROT13 instructions, discover how rm creates directories and touch moves files, create /pipeline/staging/run1, and relocate /pipeline/step_1_input.dat to /pipeline/staging/run1/input.dat.",
    difficulty: "MEDIUM",
    order: 18,
    estimatedDuration: "18-22 min",
    timeLimitSeconds: 1500,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 1500,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      touch: "mv",
      rm: "mkdir",
      mv: "touch",
    },
    clues: [
      {
        id: "clue-18-1",
        title: "Pipeline Chain Remap",
        type: "hex",
        plaintextAnswer:
          "PIPELINE REMAP: 'rm' creates directories (acting as mkdir). 'touch' moves files (acting as mv).",
        encodedContent: encodeHex(
          "PIPELINE REMAP: 'rm' creates directories (acting as mkdir). 'touch' moves files (acting as mv)."
        ),
        hintNote: "Hex byte values.",
      },
      {
        id: "clue-18-2",
        title: "Pipeline Restoration Directive",
        type: "rot13",
        plaintextAnswer:
          "RUN 'rm -p /pipeline/staging/run1' THEN 'touch /pipeline/step_1_input.dat /pipeline/staging/run1/input.dat'",
        encodedContent: encodeRot13(
          "RUN 'rm -p /pipeline/staging/run1' THEN 'touch /pipeline/step_1_input.dat /pipeline/staging/run1/input.dat'"
        ),
        hintNote: "ROT13 alphabet shift.",
      },
    ],
    initialFilesystem: {
      "/pipeline/step_1_input.dat": "SEED_INPUT_DATA_STREAM_01",
      "/pipeline/step_3_output.dat": "STALE_OUTPUT_RUN_00",
    },
    objectiveConfig: {
      description: "Establish /pipeline/staging/run1/input.dat from misplaced input",
      rules: [
        {
          id: "obj-18-staging-run1",
          points: 250,
          type: "dir_exists",
          path: "/pipeline/staging/run1",
          description: "Staging directory /pipeline/staging/run1 created",
        },
        {
          id: "obj-18-input-moved",
          points: 150,
          type: "file_exists",
          path: "/pipeline/staging/run1/input.dat",
          description: "Seed input relocated to /pipeline/staging/run1/input.dat",
        },
        {
          id: "obj-18-src-purged",
          points: 100,
          type: "file_deleted",
          path: "/pipeline/step_1_input.dat",
          description: "Misplaced file cleared from /pipeline root",
        },
      ],
    },
    hints: [
      {
        title: "Pipeline Creation",
        content: "Run 'rm -p /pipeline/staging/run1' to construct the staging path.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Relocation Step",
        content: "'touch' acts as 'mv'. Execute 'touch /pipeline/step_1_input.dat /pipeline/staging/run1/input.dat'.",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 19: HARD — Recursive Vault
  // ==========================================
  {
    slug: "recursive-vault",
    title: "Recursive Vault: Subterfuge Depths (Level 19)",
    description:
      "A deeply nested subterranean vault architecture. Decrypt four cryptographic phases (Binary, ASCII Decimal, Hex, and Base64), discover how find acts as mkdir, grep acts as cp, and cp acts as rm, create /vault/secure_chamber, secure the core key, and purge all temporary decoys.",
    difficulty: "HARD",
    order: 19,
    estimatedDuration: "25-30 min",
    timeLimitSeconds: 1800,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.5,
      timeLimitSeconds: 1800,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      find: "mkdir",
      grep: "cp",
      cp: "rm",
      cat: "find",
    },
    clues: [
      {
        id: "clue-19-1",
        title: "Phase 1: Depth Matrix Remap",
        type: "binary",
        plaintextAnswer:
          "PHASE 1: 'find' creates directories with parents (acting as mkdir -p). 'grep' copies files (acting as cp). 'cp' deletes files (acting as rm).",
        encodedContent: encodeBinary(
          "PHASE 1: 'find' creates directories with parents (acting as mkdir -p). 'grep' copies files (acting as cp). 'cp' deletes files (acting as rm)."
        ),
        hintNote: "8-bit binary representation.",
      },
      {
        id: "clue-19-2",
        title: "Phase 2: Secure Chamber Construction",
        type: "ascii_decimal",
        plaintextAnswer:
          "PHASE 2 TARGET: RUN 'find -p /vault/secure_chamber' TO CONSTRUCT THE SECURE CHAMBER",
        encodedContent: encodeAsciiDecimal(
          "PHASE 2 TARGET: RUN 'find -p /vault/secure_chamber' TO CONSTRUCT THE SECURE CHAMBER"
        ),
        hintNote: "ASCII decimal character codes.",
      },
      {
        id: "clue-19-3",
        title: "Phase 3: Deep Core Key Extraction",
        type: "hex",
        plaintextAnswer:
          "PHASE 3 TARGET: RUN 'grep /vault/level1/level2/level3/chamber_b/target_fragment.dat /vault/secure_chamber/core.key'",
        encodedContent: encodeHex(
          "PHASE 3 TARGET: RUN 'grep /vault/level1/level2/level3/chamber_b/target_fragment.dat /vault/secure_chamber/core.key'"
        ),
        hintNote: "Hex byte values.",
      },
      {
        id: "clue-19-4",
        title: "Phase 4: Decoy & Buffer Purge",
        type: "base64",
        plaintextAnswer:
          "PHASE 4 TARGET: RUN 'cp /vault/level1/level2/temp_buffer.tmp' AND 'cp /vault/level1/level2/level3/chamber_a/decoy.bin'",
        encodedContent: encodeBase64(
          "PHASE 4 TARGET: RUN 'cp /vault/level1/level2/temp_buffer.tmp' AND 'cp /vault/level1/level2/level3/chamber_a/decoy.bin'"
        ),
        hintNote: "Base64 encoding table.",
      },
    ],
    initialFilesystem: {
      "/vault/level1/level2/level3/chamber_a/decoy.bin": "DECOY_EMPTY_DATA",
      "/vault/level1/level2/level3/chamber_b/target_fragment.dat": "RECURSIVE_VAULT_CORE_TOKEN_9102",
      "/vault/level1/level2/temp_buffer.tmp": "BUFFER_CLEAR_REQUIRED",
      "/vault/security.conf": '{"depth": 3, "chambers": ["a", "b"]}',
    },
    objectiveConfig: {
      description: "Establish /vault/secure_chamber/core.key and purge decoys and temp buffer",
      rules: [
        {
          id: "obj-19-secure-dir",
          points: 125,
          type: "dir_exists",
          path: "/vault/secure_chamber",
          description: "Secure chamber /vault/secure_chamber established",
        },
        {
          id: "obj-19-core-key",
          points: 175,
          type: "file_exists",
          path: "/vault/secure_chamber/core.key",
          description: "Core key secured at /vault/secure_chamber/core.key",
        },
        {
          id: "obj-19-temp-purged",
          points: 100,
          type: "file_deleted",
          path: "/vault/level1/level2/temp_buffer.tmp",
          description: "Temporary buffer /vault/level1/level2/temp_buffer.tmp purged",
        },
        {
          id: "obj-19-decoy-purged",
          points: 100,
          type: "file_deleted",
          path: "/vault/level1/level2/level3/chamber_a/decoy.bin",
          description: "Decoy /vault/level1/level2/level3/chamber_a/decoy.bin purged",
        },
      ],
    },
    hints: [
      {
        title: "Chamber Creation & Key Copy",
        content: "Run 'find -p /vault/secure_chamber' to create the folder, then 'grep /vault/level1/level2/level3/chamber_b/target_fragment.dat /vault/secure_chamber/core.key'.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 1,
      },
      {
        title: "Purge Operations",
        content: "'cp' acts as 'rm'. Execute 'cp /vault/level1/level2/temp_buffer.tmp' and 'cp /vault/level1/level2/level3/chamber_a/decoy.bin'.",
        penaltySeconds: 60,
        pointPenalty: 40,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 20: HARD — Final Convergence
  // ==========================================
  {
    slug: "final-convergence",
    title: "Final Convergence: Master Protocol (Level 20)",
    description:
      "The ultimate test of command mastery and cryptographic decoding. Solve 5 phased transmissions across Morse, Base64, Hex, Binary, and ROT13. Disclose the directory and file remappings, establish /core/vault/fusion, deploy both fragments, and purge residual data buffers.",
    difficulty: "HARD",
    order: 20,
    estimatedDuration: "25-30 min",
    timeLimitSeconds: 1800,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.5,
      timeLimitSeconds: 1800,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      mkdir: "cd",
      cd: "mkdir",
      head: "cp",
      tail: "rm",
      mv: "cat",
    },
    clues: [
      {
        id: "clue-20-1",
        title: "Phase 1: Shell Navigation Inversion",
        type: "morse",
        plaintextAnswer:
          "PHASE 1: 'cd' CREATES DIRECTORIES (ACTING AS MKDIR -P). 'mkdir' NAVIGATES (ACTING AS CD).",
        encodedContent: encodeMorse(
          "PHASE 1: 'cd' CREATES DIRECTORIES (ACTING AS MKDIR -P). 'mkdir' NAVIGATES (ACTING AS CD)."
        ),
        hintNote: "Morse code dots and dashes.",
      },
      {
        id: "clue-20-2",
        title: "Phase 2: Stream Manipulation Tools",
        type: "base64",
        plaintextAnswer:
          "PHASE 2: 'head' COPIES FILES (ACTING AS CP). 'tail' DELETES FILES (ACTING AS RM).",
        encodedContent: encodeBase64(
          "PHASE 2: 'head' COPIES FILES (ACTING AS CP). 'tail' DELETES FILES (ACTING AS RM)."
        ),
        hintNote: "Base64 character decoding.",
      },
      {
        id: "clue-20-3",
        title: "Phase 3: Fusion Chamber Initialization",
        type: "hex",
        plaintextAnswer:
          "PHASE 3 TARGET: RUN 'cd -p /core/vault/fusion' TO CREATE THE FUSION VAULT",
        encodedContent: encodeHex(
          "PHASE 3 TARGET: RUN 'cd -p /core/vault/fusion' TO CREATE THE FUSION VAULT"
        ),
        hintNote: "ASCII Hex byte values.",
      },
      {
        id: "clue-20-4",
        title: "Phase 4: Fragment Fusion Deployment",
        type: "binary",
        plaintextAnswer:
          "PHASE 4 TARGET: RUN 'head /core/matrix/stage1/fragment_alpha.bin /core/vault/fusion/part1.dat' AND 'head /core/matrix/stage2/fragment_beta.bin /core/vault/fusion/part2.dat'",
        encodedContent: encodeBinary(
          "PHASE 4 TARGET: RUN 'head /core/matrix/stage1/fragment_alpha.bin /core/vault/fusion/part1.dat' AND 'head /core/matrix/stage2/fragment_beta.bin /core/vault/fusion/part2.dat'"
        ),
        hintNote: "Binary UTF-8 bytes.",
      },
      {
        id: "clue-20-5",
        title: "Phase 5: Matrix Buffer Decontamination",
        type: "rot13",
        plaintextAnswer:
          "PHASE 5 TARGET: RUN 'tail /core/matrix/garbage_buffer.log' AND 'tail /core/matrix/stage1/fragment_alpha.bin'",
        encodedContent: encodeRot13(
          "PHASE 5 TARGET: RUN 'tail /core/matrix/garbage_buffer.log' AND 'tail /core/matrix/stage1/fragment_alpha.bin'"
        ),
        hintNote: "ROT13 alphabet shift.",
      },
    ],
    initialFilesystem: {
      "/core/matrix/stage1/fragment_alpha.bin": "CONVERGENCE_ALPHA_SIG_7718",
      "/core/matrix/stage2/fragment_beta.bin": "CONVERGENCE_BETA_SIG_8829",
      "/core/matrix/garbage_buffer.log": "CORRUPTED_STREAM_GARBAGE_BUFFER",
      "/core/system_manifest.json": '{"status": "convergence_ready", "fragments": 2}',
    },
    objectiveConfig: {
      description: "Establish /core/vault/fusion with part1 & part2, and purge buffer & alpha source",
      rules: [
        {
          id: "obj-20-fusion-dir",
          points: 100,
          type: "dir_exists",
          path: "/core/vault/fusion",
          description: "Fusion vault /core/vault/fusion created",
        },
        {
          id: "obj-20-part1-file",
          points: 100,
          type: "file_exists",
          path: "/core/vault/fusion/part1.dat",
          description: "Fragment 1 secured at /core/vault/fusion/part1.dat",
        },
        {
          id: "obj-20-part2-file",
          points: 100,
          type: "file_exists",
          path: "/core/vault/fusion/part2.dat",
          description: "Fragment 2 secured at /core/vault/fusion/part2.dat",
        },
        {
          id: "obj-20-garbage-purged",
          points: 100,
          type: "file_deleted",
          path: "/core/matrix/garbage_buffer.log",
          description: "Garbage buffer /core/matrix/garbage_buffer.log purged",
        },
        {
          id: "obj-20-alpha-purged",
          points: 100,
          type: "file_deleted",
          path: "/core/matrix/stage1/fragment_alpha.bin",
          description: "Source fragment /core/matrix/stage1/fragment_alpha.bin cleared",
        },
      ],
    },
    hints: [
      {
        title: "Fusion Directory & Copy",
        content: "Run 'cd -p /core/vault/fusion' to create the vault. Then use 'head' to duplicate fragment_alpha into part1.dat and fragment_beta into part2.dat.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 1,
      },
      {
        title: "Buffer Decontamination",
        content: "'tail' acts as 'rm'. Run 'tail /core/matrix/garbage_buffer.log' and 'tail /core/matrix/stage1/fragment_alpha.bin' to finish.",
        penaltySeconds: 60,
        pointPenalty: 40,
        order: 2,
      },
    ],
  },
];
