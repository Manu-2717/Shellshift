import {
  encodeAsciiDecimal,
  encodeBase64,
  encodeBinary,
  encodeHex,
  encodeMorse,
  encodeRot13,
  encodeUrlPercent,
} from "../ciphers/ciphers";
import type { SeedChallengeDef } from "./catalogTypes";

export type { ClueItem, SeedChallengeDef } from "./catalogTypes";

export const SEED_CHALLENGES: SeedChallengeDef[] = [
  // ==========================================
  // ==========================================
  // LEVEL 1: EASY — Operation Inversion
  // ==========================================
  {
    slug: "operation-inversion",
    title: "Inverted Directory Breach",
    description: "",
    difficulty: "EASY",
    order: 1,
    estimatedDuration: "2-4 min",
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
      ls: "cat",
      cat: "ls",
    },
    clues: [
      {
        id: "clue-1-1",
        title: "Transmission: Command Swaps",
        type: "base64",
        plaintextAnswer:
          "TERMINAL ALERT: 'cd' creates directories (acting as mkdir). 'ls' displays file contents (acting as cat). Standard mkdir and cat are redirected.",
        encodedContent: encodeBase64(
          "TERMINAL ALERT: 'cd' creates directories (acting as mkdir). 'ls' displays file contents (acting as cat). Standard mkdir and cat are redirected.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/readme.txt":
        "Diagnostic note: Commands are swapped. Check the clue transmission.",
      "/workspace/signal.txt": "SIGNAL_OK: System diagnostic operational.",
    },
    objectiveConfig: {
      description:
        "Create directory /workspace/breach and inspect /workspace/signal.txt",
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
        title: "Decoding the Clue",
        content: "The clue reveals that 'cd' actually creates directories.",
        penaltySeconds: 15,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Deploying Recovery",
        content:
          "Run 'cd /workspace/breach' to create the folder, then 'ls /workspace/signal.txt' to view the file.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 2: EASY — Make a Folder
  // ==========================================
  {
    slug: "pathfinder-basics",
    title: "Project Folder Creation",
    description: "",
    difficulty: "EASY",
    order: 2,
    estimatedDuration: "2-4 min",
    timeLimitSeconds: 600,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 600,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      cd: "mkdir",
      mkdir: "cd",
    },
    clues: [
      {
        id: "clue-2-1",
        title: "Directive: Folder Creation",
        type: "base64",
        plaintextAnswer:
          "CLUE: 'cd project' creates the directory 'project' directly in /workspace. Standard 'mkdir' is redirected.",
        encodedContent: encodeBase64(
          "CLUE: 'cd project' creates the directory 'project' directly in /workspace. Standard 'mkdir' is redirected.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/readme.txt": "Mission: Create a directory named project.",
    },
    objectiveConfig: {
      description: "Create directory /workspace/project",
      rules: [
        {
          id: "obj-2-project-dir",
          points: 500,
          type: "dir_exists",
          path: "/workspace/project",
          description: "Directory /workspace/project created",
        },
      ],
    },
    hints: [
      {
        title: "Navigation as Creation",
        content:
          "The command 'cd' has been remapped to create directories instead of navigating.",
        penaltySeconds: 15,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Command Syntax",
        content:
          "Enter 'cd project' (or 'cd /workspace/project') to complete the objective.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 3: EASY — Read the Note
  // ==========================================
  {
    slug: "morse-mail",
    title: "Note Inspection & Receipt",
    description: "",
    difficulty: "EASY",
    order: 3,
    estimatedDuration: "2-4 min",
    timeLimitSeconds: 600,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 600,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      touch: "cat",
      cat: "touch",
    },
    clues: [
      {
        id: "clue-3-1",
        title: "Inspection Remap",
        type: "rot13",
        plaintextAnswer:
          "CLUE: 'touch' reads files (acting as cat). 'cat' creates files (acting as touch). Read note.txt then run 'cat /workspace/read.txt'.",
        encodedContent: encodeRot13(
          "CLUE: 'touch' reads files (acting as cat). 'cat' creates files (acting as touch). Read note.txt then run 'cat /workspace/read.txt'.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/note.txt":
        "WELCOME: You read the hidden note! Now run 'cat /workspace/read.txt' to complete.",
    },
    objectiveConfig: {
      description: "Read /workspace/note.txt and create /workspace/read.txt",
      rules: [
        {
          id: "obj-3-read-file",
          points: 500,
          type: "file_exists",
          path: "/workspace/read.txt",
          description: "Confirmation file /workspace/read.txt created",
        },
      ],
    },
    hints: [
      {
        title: "Viewing Files",
        content:
          "The ROT13 clue reveals that 'touch' reads files and 'cat' creates files.",
        penaltySeconds: 15,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Reading and Creating",
        content:
          "Run 'touch /workspace/note.txt' to print the note, then 'cat /workspace/read.txt' to finish.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 4: EASY — Morse Message
  // ==========================================
  {
    slug: "binary-breadcrumbs",
    title: "Hidden Vault Provisioning",
    description: "",
    difficulty: "EASY",
    order: 4,
    estimatedDuration: "2-4 min",
    timeLimitSeconds: 600,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 600,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      cd: "mkdir",
      mkdir: "cd",
    },
    clues: [
      {
        id: "clue-4-1",
        title: "Morse Code Directive",
        type: "morse",
        plaintextAnswer: "SECRET",
        encodedContent: encodeMorse("SECRET"),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/message.txt": "... . -.-. .-. . -",
    },
    objectiveConfig: {
      description:
        "Create directory /workspace/secret revealed by the Morse message",
      rules: [
        {
          id: "obj-4-secret-dir",
          points: 500,
          type: "dir_exists",
          path: "/workspace/secret",
          description: "Directory /workspace/secret created",
        },
      ],
    },
    hints: [
      {
        title: "Decoding Morse",
        content: "'... . -.-. .-. . -' decodes to SECRET in Morse code.",
        penaltySeconds: 15,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Creating Folder",
        content:
          "'cd' creates directories in this level. Run 'cd /workspace/secret'.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 5: EASY — Remove the Temporary File
  // ==========================================
  {
    slug: "hex-in-plain-sight",
    title: "Temporary File Cleanup",
    description: "",
    difficulty: "EASY",
    order: 5,
    estimatedDuration: "2-4 min",
    timeLimitSeconds: 600,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 600,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      mkdir: "rm",
      rm: "mkdir",
    },
    clues: [
      {
        id: "clue-5-1",
        title: "Removal Mapping",
        type: "base64",
        plaintextAnswer:
          "CLUE: 'mkdir' removes files (acting as rm). Standard 'rm' acts as mkdir. Run 'mkdir temp.txt' to delete it.",
        encodedContent: encodeBase64(
          "CLUE: 'mkdir' removes files (acting as rm). Standard 'rm' acts as mkdir. Run 'mkdir temp.txt' to delete it.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/keep.txt": "Required system configuration.",
      "/workspace/temp.txt": "Temporary file to be deleted.",
    },
    objectiveConfig: {
      description:
        "Delete /workspace/temp.txt while preserving /workspace/keep.txt",
      rules: [
        {
          id: "obj-5-temp-del",
          points: 300,
          type: "file_deleted",
          path: "/workspace/temp.txt",
          description: "Temporary file /workspace/temp.txt removed",
        },
        {
          id: "obj-5-keep-exists",
          points: 200,
          type: "file_exists",
          path: "/workspace/keep.txt",
          description: "File /workspace/keep.txt preserved",
        },
      ],
    },
    hints: [
      {
        title: "Deleting with mkdir",
        content:
          "The clue explains that 'mkdir' is remapped to remove files in this challenge.",
        penaltySeconds: 15,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Executing Removal",
        content:
          "Run 'mkdir /workspace/temp.txt' to delete the temporary file.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 6: EASY — Hex Name
  // ==========================================
  {
    slug: "directory-flip",
    title: "Target File Replication",
    description: "",
    difficulty: "EASY",
    order: 6,
    estimatedDuration: "2-4 min",
    timeLimitSeconds: 600,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 600,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      touch: "cp",
      cp: "ls",
    },
    clues: [
      {
        id: "clue-6-1",
        title: "Hex Encoded Target",
        type: "hex",
        plaintextAnswer:
          "TARGET: flag.txt. Use 'touch /workspace/flag.txt /workspace/found.txt' because touch copies files.",
        encodedContent: encodeHex(
          "TARGET: flag.txt. Use 'touch /workspace/flag.txt /workspace/found.txt' because touch copies files.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/flag.txt": "HEX_SUCCESS: You located the hex target file!",
      "/workspace/decoy.txt": "Not this file.",
    },
    objectiveConfig: {
      description: "Deploy target file /workspace/found.txt",
      rules: [
        {
          id: "obj-6-found",
          points: 500,
          type: "file_exists",
          path: "/workspace/found.txt",
          description: "Target file /workspace/found.txt deployed",
        },
      ],
    },
    hints: [
      {
        title: "Decoding Hex",
        content:
          "The hex bytes translate to 'flag.txt'. In this level, 'touch' copies files (acting as cp).",
        penaltySeconds: 15,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Copying Target",
        content:
          "Run 'touch /workspace/flag.txt /workspace/found.txt' to copy the file.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 7: EASY — Copy the File
  // ==========================================
  {
    slug: "the-missing-file",
    title: "Data Backup Duplication",
    description: "",
    difficulty: "EASY",
    order: 7,
    estimatedDuration: "2-4 min",
    timeLimitSeconds: 600,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 600,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      mv: "cp",
      cp: "mv",
    },
    clues: [
      {
        id: "clue-7-1",
        title: "Duplication Directive",
        type: "base64",
        plaintextAnswer:
          "CLUE: 'mv' copies files (acting as cp). 'cp' moves files (acting as mv). Run 'mv data.txt backup/data.txt'.",
        encodedContent: encodeBase64(
          "CLUE: 'mv' copies files (acting as cp). 'cp' moves files (acting as mv). Run 'mv data.txt backup/data.txt'.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/data.txt": "Original data payload.",
      "/workspace/backup/.keep": "",
    },
    objectiveConfig: {
      description:
        "Copy /workspace/data.txt to /workspace/backup/data.txt while keeping original",
      rules: [
        {
          id: "obj-7-backup-file",
          points: 300,
          type: "file_exists",
          path: "/workspace/backup/data.txt",
          description: "File copied to /workspace/backup/data.txt",
        },
        {
          id: "obj-7-orig-file",
          points: 200,
          type: "file_exists",
          path: "/workspace/data.txt",
          description: "Original /workspace/data.txt preserved",
        },
      ],
    },
    hints: [
      {
        title: "Copying with mv",
        content:
          "In this challenge, 'mv' acts as 'cp' without removing the original file.",
        penaltySeconds: 15,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Target Command",
        content: "Run 'mv /workspace/data.txt /workspace/backup/data.txt'.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 8: EASY — First Mission
  // ==========================================
  {
    slug: "first-flag",
    title: "Mission Staging & Briefing Setup",
    description: "",
    difficulty: "EASY",
    order: 8,
    estimatedDuration: "2-4 min",
    timeLimitSeconds: 600,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 600,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      cd: "mkdir",
      mkdir: "cd",
    },
    clues: [
      {
        id: "clue-8-1",
        title: "Combined Mission Directive",
        type: "hex",
        plaintextAnswer:
          "DIRECTIVE: 'cd /workspace/mission' creates folder. 'cp briefing.txt mission/briefing.txt' copies file.",
        encodedContent: encodeHex(
          "DIRECTIVE: 'cd /workspace/mission' creates folder. 'cp briefing.txt mission/briefing.txt' copies file.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/briefing.txt": "MISSION DIRECTIVE: Level 8 complete.",
    },
    objectiveConfig: {
      description: "Create /workspace/mission and copy briefing.txt into it",
      rules: [
        {
          id: "obj-8-mission-dir",
          points: 250,
          type: "dir_exists",
          path: "/workspace/mission",
          description: "Directory /workspace/mission created",
        },
        {
          id: "obj-8-briefing-copy",
          points: 250,
          type: "file_exists",
          path: "/workspace/mission/briefing.txt",
          description: "File /workspace/mission/briefing.txt deployed",
        },
      ],
    },
    hints: [
      {
        title: "Folder Creation",
        content:
          "'cd' creates directories here. First run 'cd /workspace/mission'.",
        penaltySeconds: 15,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Copying Briefing",
        content:
          "Run 'cp /workspace/briefing.txt /workspace/mission/briefing.txt'.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 9: MEDIUM — The Cryptic Agent
  // ==========================================
  {
    slug: "the-cryptic-agent",
    title: "Agent Key Deployment",
    description: "",
    difficulty: "MEDIUM",
    order: 9,
    estimatedDuration: "4-7 min",
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
      pwd: "touch",
      touch: "pwd",
      rm: "cat",
      cat: "rm",
    },
    clues: [
      {
        id: "clue-9-1",
        title: "Operative Clue: File Transposition",
        type: "hex",
        plaintextAnswer:
          "CLUE: 'rm' reads files (acting as cat). 'pwd' creates files (acting as touch). Standard cat and touch are redirected.",
        encodedContent: encodeHex(
          "CLUE: 'rm' reads files (acting as cat). 'pwd' creates files (acting as touch). Standard cat and touch are redirected.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/readme.txt":
        "Operative note: Shell mappings active. Check your mission clue.",
      "/workspace/notes.txt": "AGENT PASSCODE: 0x9F_AGENT_ACTIVE",
    },
    objectiveConfig: {
      description: "Read /workspace/notes.txt and deploy /workspace/agent.key",
      rules: [
        {
          id: "obj-9-agent-key",
          points: 250,
          type: "file_exists",
          path: "/workspace/agent.key",
          description:
            "File /workspace/agent.key has been successfully deployed",
        },
        {
          id: "obj-9-cmd-investigated",
          points: 250,
          type: "min_commands",
          content: "2",
          description: "Executed investigative operations in the terminal",
        },
      ],
    },
    hints: [
      {
        title: "Reading Without Deleting",
        content:
          "The hex clue reveals that 'rm' safely reads files without deleting them.",
        penaltySeconds: 20,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Creating the Key",
        content:
          "Use 'rm /workspace/notes.txt' to view the passcode, then 'pwd /workspace/agent.key' to create the key.",
        penaltySeconds: 40,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 10: MEDIUM — Create Two Folders
  // ==========================================
  {
    slug: "dead-letter",
    title: "Dual Directory Setup",
    description: "",
    difficulty: "MEDIUM",
    order: 10,
    estimatedDuration: "4-7 min",
    timeLimitSeconds: 900,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 900,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      cd: "mkdir",
      mkdir: "cd",
    },
    clues: [
      {
        id: "clue-10-1",
        title: "Dual Directory Directive",
        type: "rot13",
        plaintextAnswer:
          "DIRECTIVE: 'cd' creates directories. Standard 'mkdir' is redirected. Create '/workspace/alpha' and '/workspace/beta'.",
        encodedContent: encodeRot13(
          "DIRECTIVE: 'cd' creates directories. Standard 'mkdir' is redirected. Create '/workspace/alpha' and '/workspace/beta'.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/readme.txt": "Create two directories: alpha and beta.",
    },
    objectiveConfig: {
      description: "Create /workspace/alpha and /workspace/beta",
      rules: [
        {
          id: "obj-10-alpha",
          points: 250,
          type: "dir_exists",
          path: "/workspace/alpha",
          description: "Directory /workspace/alpha created",
        },
        {
          id: "obj-10-beta",
          points: 250,
          type: "dir_exists",
          path: "/workspace/beta",
          description: "Directory /workspace/beta created",
        },
      ],
    },
    hints: [
      {
        title: "Remapped cd",
        content: "'cd' creates directories. Run 'cd /workspace/alpha'.",
        penaltySeconds: 20,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Creating Both",
        content: "Run 'cd /workspace/alpha' followed by 'cd /workspace/beta'.",
        penaltySeconds: 40,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 11: MEDIUM — Find the File
  // ==========================================
  {
    slug: "log-diver",
    title: "Nested File Search & Recovery",
    description: "",
    difficulty: "MEDIUM",
    order: 11,
    estimatedDuration: "4-7 min",
    timeLimitSeconds: 900,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 900,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      grep: "find",
      find: "grep",
    },
    clues: [
      {
        id: "clue-11-1",
        title: "Search Directive",
        type: "base64",
        plaintextAnswer:
          "CLUE: 'grep' searches directory trees (acting as find). 'find' acts as grep. Run 'grep /workspace -name secret.txt', then 'cp' to /workspace/found.txt.",
        encodedContent: encodeBase64(
          "CLUE: 'grep' searches directory trees (acting as find). 'find' acts as grep. Run 'grep /workspace -name secret.txt', then 'cp' to /workspace/found.txt.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/sub1/sub2/sub3/secret.txt": "SECRET_TOKEN_ALPHA",
    },
    objectiveConfig: {
      description: "Locate secret.txt and copy it to /workspace/found.txt",
      rules: [
        {
          id: "obj-11-found",
          points: 300,
          type: "file_exists",
          path: "/workspace/found.txt",
          description: "File /workspace/found.txt deployed",
        },
        {
          id: "obj-11-cmd",
          points: 200,
          type: "min_commands",
          content: "2",
          description: "Executed search and copy operations",
        },
      ],
    },
    hints: [
      {
        title: "Locating the File",
        content:
          "Run 'grep /workspace -name secret.txt' (grep acts as find here) to discover the file path.",
        penaltySeconds: 20,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Copying Target",
        content:
          "Run 'cp /workspace/sub1/sub2/sub3/secret.txt /workspace/found.txt'.",
        penaltySeconds: 40,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 12: MEDIUM — The Hex Note
  // ==========================================
  {
    slug: "the-relocation-protocol",
    title: "Archive Document Relocation",
    description: "",
    difficulty: "MEDIUM",
    order: 12,
    estimatedDuration: "4-7 min",
    timeLimitSeconds: 900,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 900,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      mv: "cp",
      cp: "ls",
    },
    clues: [
      {
        id: "clue-12-1",
        title: "Hex Target Specifier",
        type: "hex",
        plaintextAnswer: "report.doc",
        encodedContent: encodeHex("report.doc"),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/report.doc": "Confidential Report Data",
      "/workspace/archive/.keep": "",
    },
    objectiveConfig: {
      description:
        "Copy /workspace/report.doc to /workspace/archive/report.doc",
      rules: [
        {
          id: "obj-12-archived",
          points: 500,
          type: "file_exists",
          path: "/workspace/archive/report.doc",
          description: "Report safely placed in /workspace/archive/report.doc",
        },
      ],
    },
    hints: [
      {
        title: "Decoding Target",
        content:
          "The hex clue translates to 'report.doc'. 'mv' acts as 'cp', standard 'cp' acts as 'ls'.",
        penaltySeconds: 20,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Archiving File",
        content:
          "Run 'mv /workspace/report.doc /workspace/archive/report.doc'.",
        penaltySeconds: 40,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 13: MEDIUM — Log Hunt
  // ==========================================
  {
    slug: "needle-in-the-archive",
    title: "Server Log Audit & Alert Dispatch",
    description: "",
    difficulty: "MEDIUM",
    order: 13,
    estimatedDuration: "4-7 min",
    timeLimitSeconds: 900,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 900,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      cat: "grep",
      grep: "cat",
      ls: "touch",
      touch: "ls",
    },
    clues: [
      {
        id: "clue-13-1",
        title: "Log Investigation Directive",
        type: "base64",
        plaintextAnswer:
          "CLUE: 'cat' filters logs (acting as grep). 'ls' creates files (acting as touch). Standard grep and touch are redirected. Run 'cat ERROR /workspace/server.log', then 'ls /workspace/alert.txt'.",
        encodedContent: encodeBase64(
          "CLUE: 'cat' filters logs (acting as grep). 'ls' creates files (acting as touch). Standard grep and touch are redirected. Run 'cat ERROR /workspace/server.log', then 'ls /workspace/alert.txt'.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/server.log":
        "INFO boot ok\nINFO worker ready\nERROR critical failure 500\nINFO shutdown complete",
    },
    objectiveConfig: {
      description: "Inspect error log and create /workspace/alert.txt",
      rules: [
        {
          id: "obj-13-alert",
          points: 300,
          type: "file_exists",
          path: "/workspace/alert.txt",
          description: "Acknowledgment file /workspace/alert.txt created",
        },
        {
          id: "obj-13-cmd",
          points: 200,
          type: "min_commands",
          content: "2",
          description: "Executed grep and touch operations",
        },
      ],
    },
    hints: [
      {
        title: "Filtering Logs",
        content:
          "Run 'cat ERROR /workspace/server.log' (cat acts as grep) to inspect the failure.",
        penaltySeconds: 20,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Logging Alert",
        content:
          "Run 'ls /workspace/alert.txt' (ls acts as touch) to acknowledge the error.",
        penaltySeconds: 40,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 14: MEDIUM — Swap the Rules
  // ==========================================
  {
    slug: "ghost-signal",
    title: "Quarantine Creation & Junk Purge",
    description: "",
    difficulty: "MEDIUM",
    order: 14,
    estimatedDuration: "4-7 min",
    timeLimitSeconds: 900,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 900,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      rm: "mkdir",
      mkdir: "rm",
    },
    clues: [
      {
        id: "clue-14-1",
        title: "Reciprocal Command Swaps",
        type: "rot13",
        plaintextAnswer:
          "SWAP: 'rm' creates directories (acting as mkdir). 'mkdir' deletes files (acting as rm).",
        encodedContent: encodeRot13(
          "SWAP: 'rm' creates directories (acting as mkdir). 'mkdir' deletes files (acting as rm).",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/junk.txt": "Temporary file to delete.",
    },
    objectiveConfig: {
      description: "Create /workspace/safe and delete /workspace/junk.txt",
      rules: [
        {
          id: "obj-14-safe-dir",
          points: 250,
          type: "dir_exists",
          path: "/workspace/safe",
          description: "Directory /workspace/safe created",
        },
        {
          id: "obj-14-junk-del",
          points: 250,
          type: "file_deleted",
          path: "/workspace/junk.txt",
          description: "File /workspace/junk.txt removed",
        },
      ],
    },
    hints: [
      {
        title: "Swapped Actions",
        content:
          "'rm' creates directories, and 'mkdir' deletes files in this level.",
        penaltySeconds: 20,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Executing Swapped Commands",
        content:
          "Run 'rm /workspace/safe' to make the folder, and 'mkdir /workspace/junk.txt' to delete the file.",
        penaltySeconds: 40,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 15: MEDIUM — Organize the Files
  // ==========================================
  {
    slug: "three-keys",
    title: "Project Asset Reorganization",
    description: "",
    difficulty: "MEDIUM",
    order: 15,
    estimatedDuration: "4-7 min",
    timeLimitSeconds: 900,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 900,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      cp: "mv",
      mv: "ls",
    },
    clues: [
      {
        id: "clue-15-1",
        title: "Sorting Directive",
        type: "base64",
        plaintextAnswer:
          "'cp' moves files (acting as mv). Standard 'mv' acts as ls. Move code.js to src and style.css to styles.",
        encodedContent: encodeBase64(
          "'cp' moves files (acting as mv). Standard 'mv' acts as ls. Move code.js to src and style.css to styles.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/code.js": "console.log('ShellShift');",
      "/workspace/style.css": "body { margin: 0; }",
      "/workspace/src/.keep": "",
      "/workspace/styles/.keep": "",
    },
    objectiveConfig: {
      description:
        "Move code.js to src/code.js and style.css to styles/style.css",
      rules: [
        {
          id: "obj-15-code-moved",
          points: 250,
          type: "file_exists",
          path: "/workspace/src/code.js",
          description: "File placed in /workspace/src/code.js",
        },
        {
          id: "obj-15-style-moved",
          points: 250,
          type: "file_exists",
          path: "/workspace/styles/style.css",
          description: "File placed in /workspace/styles/style.css",
        },
      ],
    },
    hints: [
      {
        title: "Moving Files",
        content:
          "'cp' moves files instead of copying them. Standard 'mv' acts as ls.",
        penaltySeconds: 20,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Target Commands",
        content:
          "Run 'cp /workspace/code.js /workspace/src/code.js' and 'cp /workspace/style.css /workspace/styles/style.css'.",
        penaltySeconds: 40,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 16: MEDIUM — Decode the Filename
  // ==========================================
  {
    slug: "decoy-protocol",
    title: "Target Verification & Receipt",
    description: "",
    difficulty: "MEDIUM",
    order: 16,
    estimatedDuration: "4-7 min",
    timeLimitSeconds: 900,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 900,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      grep: "cat",
      cat: "grep",
      ls: "touch",
      touch: "ls",
    },
    clues: [
      {
        id: "clue-16-1",
        title: "Encoded Target Filename",
        type: "base64",
        plaintextAnswer: "target_omega.txt",
        encodedContent: encodeBase64("target_omega.txt"),
        hintNote: "",
      },
      {
        id: "clue-16-2",
        title: "Inspection Directive",
        type: "rot13",
        plaintextAnswer:
          "CLUE: 'grep' inspects files (acting as cat). 'ls' creates files (acting as touch). Standard cat and touch are redirected.",
        encodedContent: encodeRot13(
          "CLUE: 'grep' inspects files (acting as cat). 'ls' creates files (acting as touch). Standard cat and touch are redirected.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/target_omega.txt": "ACCESS CODE: 7712",
      "/workspace/decoy.txt": "Decoy file.",
    },
    objectiveConfig: {
      description: "Inspect target file and create /workspace/confirmation.txt",
      rules: [
        {
          id: "obj-16-conf",
          points: 300,
          type: "file_exists",
          path: "/workspace/confirmation.txt",
          description: "Confirmation file /workspace/confirmation.txt created",
        },
        {
          id: "obj-16-cmd",
          points: 200,
          type: "min_commands",
          content: "2",
          description: "Executed file inspection and confirmation commands",
        },
      ],
    },
    hints: [
      {
        title: "Decoding Base64",
        content:
          "The Base64 clue decodes to 'target_omega.txt'. 'grep' acts as 'cat', and 'ls' acts as 'touch'.",
        penaltySeconds: 20,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Inspecting and Confirming",
        content:
          "Run 'grep /workspace/target_omega.txt' then 'ls /workspace/confirmation.txt'.",
        penaltySeconds: 40,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 17: MEDIUM — The Missing Directory
  // ==========================================
  {
    slug: "broken-chain",
    title: "Vault Setup & Binary Staging",
    description: "",
    difficulty: "MEDIUM",
    order: 17,
    estimatedDuration: "4-7 min",
    timeLimitSeconds: 900,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.25,
      timeLimitSeconds: 900,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      cd: "mkdir",
      mkdir: "cd",
    },
    clues: [
      {
        id: "clue-17-1",
        title: "Missing Directory Directive",
        type: "hex",
        plaintextAnswer:
          "DIRECTIVE: 'cd' creates directories. Create '/workspace/vault', then 'cp data.bin vault/data.bin'.",
        encodedContent: encodeHex(
          "DIRECTIVE: 'cd' creates directories. Create '/workspace/vault', then 'cp data.bin vault/data.bin'.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/instructions.txt":
        "MISSING FOLDER: vault. Create /workspace/vault and place data.bin inside.",
      "/workspace/data.bin": "BINARY_PAYLOAD_DATA",
    },
    objectiveConfig: {
      description: "Create /workspace/vault and place data.bin inside it",
      rules: [
        {
          id: "obj-17-vault-dir",
          points: 250,
          type: "dir_exists",
          path: "/workspace/vault",
          description: "Directory /workspace/vault created",
        },
        {
          id: "obj-17-data-copied",
          points: 250,
          type: "file_exists",
          path: "/workspace/vault/data.bin",
          description: "Data placed in /workspace/vault/data.bin",
        },
      ],
    },
    hints: [
      {
        title: "Finding Directory Name",
        content:
          "Read instructions.txt: the missing folder is 'vault'. 'cd' creates directories.",
        penaltySeconds: 20,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Commands Sequence",
        content:
          "Run 'cd /workspace/vault' then 'cp /workspace/data.bin /workspace/vault/data.bin'.",
        penaltySeconds: 40,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 18: HARD — Deep Breach: Operation Babel
  // ==========================================
  {
    slug: "deep-breach-babel",
    title: "Deep Core Infiltration & Sanitization",
    description: "",
    difficulty: "HARD",
    order: 18,
    estimatedDuration: "8-10 min",
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
      grep: "mkdir",
      mkdir: "grep",
      mv: "cp",
      cp: "rm",
      rm: "mv",
    },
    clues: [
      {
        id: "clue-18-1",
        title: "Vault Protocol: Creation & Duplication",
        type: "base64",
        plaintextAnswer:
          "VAULT PROTOCOL: 'grep' creates directories (acting as mkdir). 'mv' copies files (acting as cp).",
        encodedContent: encodeBase64(
          "VAULT PROTOCOL: 'grep' creates directories (acting as mkdir). 'mv' copies files (acting as cp).",
        ),
        hintNote: "",
      },
      {
        id: "clue-18-2",
        title: "Cleanup Protocol: File Deletion",
        type: "hex",
        plaintextAnswer: "CLEANUP PROTOCOL: 'cp' removes files (acting as rm).",
        encodedContent: encodeHex(
          "CLEANUP PROTOCOL: 'cp' removes files (acting as rm).",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/secret.key": "VAULT_MASTER_KEY_ALPHA_2026",
      "/workspace/temp.tmp": "TEMPORARY BUFFER TO PURGE",
    },
    objectiveConfig: {
      description:
        "Establish /workspace/vault/core, copy secret.key into it, and purge temp.tmp",
      rules: [
        {
          id: "obj-18-vault-dir",
          points: 200,
          type: "dir_exists",
          path: "/workspace/vault/core",
          description: "Directory /workspace/vault/core created",
        },
        {
          id: "obj-18-secret-key",
          points: 200,
          type: "file_exists",
          path: "/workspace/vault/core/secret.key",
          description: "Key copied to /workspace/vault/core/secret.key",
        },
        {
          id: "obj-18-temp-purged",
          points: 100,
          type: "file_deleted",
          path: "/workspace/temp.tmp",
          description: "Temporary buffer /workspace/temp.tmp purged",
        },
      ],
    },
    hints: [
      {
        title: "Understanding Mappings",
        content:
          "Check decoded clues: 'grep' makes directories, 'mv' copies files, and 'cp' removes files.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 1,
      },
      {
        title: "Executing Babel Recovery",
        content:
          "Run 'grep -p /workspace/vault/core', 'mv /workspace/secret.key /workspace/vault/core/secret.key', and 'cp /workspace/temp.tmp'.",
        penaltySeconds: 60,
        pointPenalty: 50,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 19: HARD — Simple Vault
  // ==========================================
  {
    slug: "recursive-vault",
    title: "Enclave Vault & Key Storage",
    description: "",
    difficulty: "HARD",
    order: 19,
    estimatedDuration: "8-10 min",
    timeLimitSeconds: 1200,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.5,
      timeLimitSeconds: 1200,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      grep: "mkdir",
      mkdir: "grep",
    },
    clues: [
      {
        id: "clue-19-1",
        title: "Creation Remap",
        type: "base64",
        plaintextAnswer:
          "STEP 1: 'grep /workspace/secure' creates directory '/workspace/secure'.",
        encodedContent: encodeBase64(
          "STEP 1: 'grep /workspace/secure' creates directory '/workspace/secure'.",
        ),
        hintNote: "",
      },
      {
        id: "clue-19-2",
        title: "Placement Step",
        type: "hex",
        plaintextAnswer:
          "STEP 2: 'cp /workspace/key.dat /workspace/secure/key.dat' places key into destination.",
        encodedContent: encodeHex(
          "STEP 2: 'cp /workspace/key.dat /workspace/secure/key.dat' places key into destination.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/vault/clue.txt": "DESTINATION: /workspace/secure",
      "/workspace/key.dat": "SECURE_KEY_VAL_0019",
    },
    objectiveConfig: {
      description: "Create /workspace/secure and copy key.dat into it",
      rules: [
        {
          id: "obj-19-secure-dir",
          points: 250,
          type: "dir_exists",
          path: "/workspace/secure",
          description: "Directory /workspace/secure created",
        },
        {
          id: "obj-19-key-copied",
          points: 250,
          type: "file_exists",
          path: "/workspace/secure/key.dat",
          description: "Key copied to /workspace/secure/key.dat",
        },
      ],
    },
    hints: [
      {
        title: "Inspecting Clue",
        content:
          "Read vault/clue.txt to see the target path '/workspace/secure'. 'grep' creates directories.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 1,
      },
      {
        title: "Executing Vault Sequence",
        content:
          "Run 'grep /workspace/secure' then 'cp /workspace/key.dat /workspace/secure/key.dat'.",
        penaltySeconds: 60,
        pointPenalty: 50,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 20: HARD — Final Challenge
  // ==========================================
  {
    slug: "final-convergence",
    title: "Production Release & Cache Wipe",
    description: "",
    difficulty: "HARD",
    order: 20,
    estimatedDuration: "8-10 min",
    timeLimitSeconds: 1200,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier: 1.5,
      timeLimitSeconds: 1200,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: {
      cd: "mkdir",
      mkdir: "cd",
      mv: "rm",
      rm: "mv",
    },
    clues: [
      {
        id: "clue-20-1",
        title: "Final Operation Directive",
        type: "base64",
        plaintextAnswer:
          "FINAL: 'cd /workspace/production' creates folder. 'cp artifact.dat production/'. 'mv old_cache.tmp' deletes cache.",
        encodedContent: encodeBase64(
          "FINAL: 'cd /workspace/production' creates folder. 'cp artifact.dat production/'. 'mv old_cache.tmp' deletes cache.",
        ),
        hintNote: "",
      },
    ],
    initialFilesystem: {
      "/workspace/artifact.dat": "FINAL_GOLD_ARTIFACT",
      "/workspace/old_cache.tmp": "Temporary cache buffer to purge.",
      "/workspace/notes.txt":
        "Final directives stored in encrypted transmission.",
    },
    objectiveConfig: {
      description:
        "Create /workspace/production, place artifact.dat inside, and remove old_cache.tmp",
      rules: [
        {
          id: "obj-20-prod-dir",
          points: 175,
          type: "dir_exists",
          path: "/workspace/production",
          description: "Directory /workspace/production created",
        },
        {
          id: "obj-20-artifact",
          points: 175,
          type: "file_exists",
          path: "/workspace/production/artifact.dat",
          description: "Artifact placed in /workspace/production/artifact.dat",
        },
        {
          id: "obj-20-cache-del",
          points: 150,
          type: "file_deleted",
          path: "/workspace/old_cache.tmp",
          description: "Old cache /workspace/old_cache.tmp purged",
        },
      ],
    },
    hints: [
      {
        title: "Final Mappings",
        content:
          "'cd' creates the production directory, and 'mv' deletes files in this level.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 1,
      },
      {
        title: "Final Sequence",
        content:
          "Run 'cd /workspace/production', 'cp /workspace/artifact.dat /workspace/production/artifact.dat', and 'mv /workspace/old_cache.tmp'.",
        penaltySeconds: 60,
        pointPenalty: 50,
        order: 2,
      },
    ],
  },
];
