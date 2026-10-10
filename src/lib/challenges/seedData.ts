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
        | "min_commands"
        | "cwd_equals";
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
  // LEVEL 1: EASY — First Steps (pwd & cd)
  // ==========================================
  {
    slug: "operation-inversion",
    title: "Level 1: First Steps (pwd & cd)",
    description:
      "Welcome to Ubuntu Linux. Verify your current working directory using pwd, view directory contents with ls, and navigate into the system folder with cd /workspace/system.",
    difficulty: "EASY",
    order: 1,
    estimatedDuration: "5-10 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-1-1",
        title: "Mission Directive: Navigation",
        type: "base64",
        plaintextAnswer: "Run 'pwd' to print your location, then 'cd /workspace/system'.",
        encodedContent: "Run 'pwd' to print your location, then 'cd /workspace/system'.",
        hintNote: "Ubuntu navigation basics: pwd prints working directory, cd changes directory.",
      },
      {
        id: "clue-1-2",
        title: "Ubuntu Tip: File Listing",
        type: "base64",
        plaintextAnswer: "Run 'ls' to view files in /workspace/system.",
        encodedContent: "Run 'ls' to view files in /workspace/system.",
        hintNote: "Use 'ls' to list files and subdirectories.",
      },
    ],
    initialFilesystem: {
      "/workspace/readme.txt": "Welcome to Ubuntu Linux CLI. Navigate into the system folder.",
      "/workspace/system/status.txt": "System status: Online.",
    },
    objectiveConfig: {
      description: "Navigate to /workspace/system and inspect system status",
      rules: [
        {
          id: "obj-1-system-dir",
          points: 250,
          type: "cwd_equals",
          path: "/workspace/system",
          description: "Navigated into /workspace/system directory",
        },
        {
          id: "obj-1-cmds",
          points: 250,
          type: "min_commands",
          content: "1",
          description: "Executed commands in terminal",
        },
      ],
    },
    hints: [
      {
        title: "Where Am I?",
        content: "Type 'pwd' to see where you are. The terminal will print /workspace.",
        penaltySeconds: 10,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Changing Directory",
        content: "Type 'cd /workspace/system' or 'cd system' to enter the folder.",
        penaltySeconds: 20,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 2: EASY — Reading Files (cat)
  // ==========================================
  {
    slug: "the-cryptic-agent",
    title: "Level 2: Reading Files (cat)",
    description:
      "Inspect configuration notes. Use cat to display /workspace/notes/config.ini and create an inspection confirmation with touch /workspace/notes/inspected.log.",
    difficulty: "EASY",
    order: 2,
    estimatedDuration: "5-10 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-2-1",
        title: "Mission Directive: File Reading",
        type: "base64",
        plaintextAnswer: "Run 'cat /workspace/notes/config.ini' to view file contents.",
        encodedContent: "Run 'cat /workspace/notes/config.ini' to view file contents.",
        hintNote: "'cat' (concatenate) displays file text directly in the terminal.",
      },
      {
        id: "clue-2-2",
        title: "Action Item: Confirmation File",
        type: "base64",
        plaintextAnswer: "Run 'touch /workspace/notes/inspected.log' to complete inspection.",
        encodedContent: "Run 'touch /workspace/notes/inspected.log' to complete inspection.",
        hintNote: "'touch' creates an empty file if it does not exist.",
      },
    ],
    initialFilesystem: {
      "/workspace/notes/config.ini": "server_port=8080\nenvironment=production\nstatus=ready",
      "/workspace/notes/readme.txt": "Use cat to view config.ini, then touch inspected.log.",
    },
    objectiveConfig: {
      description: "Read config.ini and create /workspace/notes/inspected.log",
      rules: [
        {
          id: "obj-2-inspected-log",
          points: 300,
          type: "file_exists",
          path: "/workspace/notes/inspected.log",
          description: "File /workspace/notes/inspected.log created",
        },
        {
          id: "obj-2-cmds",
          points: 200,
          type: "min_commands",
          content: "1",
          description: "Executed file commands in terminal",
        },
      ],
    },
    hints: [
      {
        title: "Viewing Files",
        content: "Run 'cat /workspace/notes/config.ini' to read the config settings.",
        penaltySeconds: 10,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Creating the Log",
        content: "Run 'touch /workspace/notes/inspected.log' to mark inspection complete.",
        penaltySeconds: 20,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 3: EASY — Creating Directories (mkdir -p)
  // ==========================================
  {
    slug: "deep-breach-babel",
    title: "Level 3: Creating Directories (mkdir -p)",
    description:
      "Organize a web application directory structure. Use mkdir -p to create the nested path /workspace/projects/webapp/src.",
    difficulty: "EASY",
    order: 3,
    estimatedDuration: "5-10 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-3-1",
        title: "Mission Directive: Nested Folders",
        type: "base64",
        plaintextAnswer: "Run 'mkdir -p /workspace/projects/webapp/src'.",
        encodedContent: "Run 'mkdir -p /workspace/projects/webapp/src'.",
        hintNote: "The '-p' flag tells mkdir to create all missing parent directories.",
      },
    ],
    initialFilesystem: {
      "/workspace/projects/readme.txt": "Create webapp/src directory using mkdir -p.",
    },
    objectiveConfig: {
      description: "Create directory tree /workspace/projects/webapp/src",
      rules: [
        {
          id: "obj-3-webapp-src",
          points: 500,
          type: "dir_exists",
          path: "/workspace/projects/webapp/src",
          description: "Directory /workspace/projects/webapp/src created",
        },
      ],
    },
    hints: [
      {
        title: "Parent Directories",
        content: "Without '-p', mkdir errors if intermediate folders don't exist.",
        penaltySeconds: 10,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Exact Command",
        content: "Type: 'mkdir -p /workspace/projects/webapp/src'",
        penaltySeconds: 20,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 4: EASY — Creating Files (touch)
  // ==========================================
  {
    slug: "pathfinder-basics",
    title: "Level 4: Creating Files (touch)",
    description:
      "Initialize source files for a web project. Use touch to create /workspace/src/index.html and /workspace/src/app.js.",
    difficulty: "EASY",
    order: 4,
    estimatedDuration: "5-10 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-4-1",
        title: "Mission Directive: Initialize Files",
        type: "base64",
        plaintextAnswer: "Run 'touch /workspace/src/index.html' and 'touch /workspace/src/app.js'.",
        encodedContent: "Run 'touch /workspace/src/index.html' and 'touch /workspace/src/app.js'.",
        hintNote: "You can create files individually or in one command: touch file1 file2.",
      },
    ],
    initialFilesystem: {
      "/workspace/src/.keep": "",
    },
    objectiveConfig: {
      description: "Create /workspace/src/index.html and /workspace/src/app.js",
      rules: [
        {
          id: "obj-4-index",
          points: 250,
          type: "file_exists",
          path: "/workspace/src/index.html",
          description: "File /workspace/src/index.html created",
        },
        {
          id: "obj-4-app",
          points: 250,
          type: "file_exists",
          path: "/workspace/src/app.js",
          description: "File /workspace/src/app.js created",
        },
      ],
    },
    hints: [
      {
        title: "Creating Files",
        content: "Use 'touch' followed by the target file path.",
        penaltySeconds: 10,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Commands",
        content: "Run 'touch /workspace/src/index.html' then 'touch /workspace/src/app.js'.",
        penaltySeconds: 20,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 5: EASY — Copying Files (cp)
  // ==========================================
  {
    slug: "morse-mail",
    title: "Level 5: Copying Files (cp)",
    description:
      "Make a safety backup of your configuration. Use cp to duplicate /workspace/config/settings.json to /workspace/backups/settings.json.bak.",
    difficulty: "EASY",
    order: 5,
    estimatedDuration: "5-10 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-5-1",
        title: "Mission Directive: File Backup",
        type: "base64",
        plaintextAnswer: "Run 'cp /workspace/config/settings.json /workspace/backups/settings.json.bak'.",
        encodedContent: "Run 'cp /workspace/config/settings.json /workspace/backups/settings.json.bak'.",
        hintNote: "cp <source> <destination> duplicates files.",
      },
    ],
    initialFilesystem: {
      "/workspace/config/settings.json": '{"debug": false, "version": "1.0.0"}',
      "/workspace/backups/.keep": "",
    },
    objectiveConfig: {
      description: "Backup settings.json to /workspace/backups/settings.json.bak",
      rules: [
        {
          id: "obj-5-bak-file",
          points: 300,
          type: "file_exists",
          path: "/workspace/backups/settings.json.bak",
          description: "Backup file created at /workspace/backups/settings.json.bak",
        },
        {
          id: "obj-5-orig-intact",
          points: 200,
          type: "file_exists",
          path: "/workspace/config/settings.json",
          description: "Original config file preserved",
        },
      ],
    },
    hints: [
      {
        title: "Using cp",
        content: "Specify the source path first, then destination path.",
        penaltySeconds: 10,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Exact Command",
        content: "Type: 'cp /workspace/config/settings.json /workspace/backups/settings.json.bak'",
        penaltySeconds: 20,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 6: EASY — Moving & Renaming Files (mv)
  // ==========================================
  {
    slug: "binary-breadcrumbs",
    title: "Level 6: Moving & Renaming (mv)",
    description:
      "Move a draft report to the official documents directory. Use mv to relocate /workspace/downloads/draft_report.pdf to /workspace/documents/report.pdf.",
    difficulty: "EASY",
    order: 6,
    estimatedDuration: "5-10 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-6-1",
        title: "Mission Directive: Relocate File",
        type: "base64",
        plaintextAnswer: "Run 'mv /workspace/downloads/draft_report.pdf /workspace/documents/report.pdf'.",
        encodedContent: "Run 'mv /workspace/downloads/draft_report.pdf /workspace/documents/report.pdf'.",
        hintNote: "'mv' moves files from source to destination and can rename them simultaneously.",
      },
    ],
    initialFilesystem: {
      "/workspace/downloads/draft_report.pdf": "Annual engineering review report.",
      "/workspace/documents/.keep": "",
    },
    objectiveConfig: {
      description: "Move draft_report.pdf to /workspace/documents/report.pdf",
      rules: [
        {
          id: "obj-6-dest-file",
          points: 300,
          type: "file_exists",
          path: "/workspace/documents/report.pdf",
          description: "File moved to /workspace/documents/report.pdf",
        },
        {
          id: "obj-6-src-moved",
          points: 200,
          type: "file_deleted",
          path: "/workspace/downloads/draft_report.pdf",
          description: "Original draft removed from downloads",
        },
      ],
    },
    hints: [
      {
        title: "Using mv",
        content: "mv moves the file without leaving a copy in the original directory.",
        penaltySeconds: 10,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Exact Command",
        content: "Type: 'mv /workspace/downloads/draft_report.pdf /workspace/documents/report.pdf'",
        penaltySeconds: 20,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 7: EASY — File Deletion (rm)
  // ==========================================
  {
    slug: "hex-in-plain-sight",
    title: "Level 7: File Deletion (rm)",
    description:
      "Housekeeping: clean up temporary cache files. Use rm to delete /workspace/cache/junk_01.tmp and /workspace/cache/junk_02.tmp while preserving valid_cache.dat.",
    difficulty: "EASY",
    order: 7,
    estimatedDuration: "5-10 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-7-1",
        title: "Mission Directive: Cache Cleanup",
        type: "base64",
        plaintextAnswer: "Run 'rm /workspace/cache/junk_01.tmp' and 'rm /workspace/cache/junk_02.tmp'.",
        encodedContent: "Run 'rm /workspace/cache/junk_01.tmp' and 'rm /workspace/cache/junk_02.tmp'.",
        hintNote: "'rm' permanently removes specified files.",
      },
    ],
    initialFilesystem: {
      "/workspace/cache/junk_01.tmp": "Temporary cache dump 1",
      "/workspace/cache/junk_02.tmp": "Temporary cache dump 2",
      "/workspace/cache/valid_cache.dat": "VALID_CACHE_DATA_DO_NOT_DELETE",
    },
    objectiveConfig: {
      description: "Delete junk cache files from /workspace/cache",
      rules: [
        {
          id: "obj-7-junk1-del",
          points: 250,
          type: "file_deleted",
          path: "/workspace/cache/junk_01.tmp",
          description: "Junk file 1 deleted",
        },
        {
          id: "obj-7-junk2-del",
          points: 250,
          type: "file_deleted",
          path: "/workspace/cache/junk_02.tmp",
          description: "Junk file 2 deleted",
        },
      ],
    },
    hints: [
      {
        title: "Deleting Files",
        content: "Use 'rm' with the file path to remove it.",
        penaltySeconds: 10,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Exact Commands",
        content: "Run 'rm /workspace/cache/junk_01.tmp' followed by 'rm /workspace/cache/junk_02.tmp'.",
        penaltySeconds: 20,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 8: EASY — Directory Cleanup (rm -r)
  // ==========================================
  {
    slug: "directory-flip",
    title: "Level 8: Directory Cleanup (rm -r)",
    description:
      "Decommission an obsolete directory tree. Use rm -r to recursively remove /workspace/obsolete and all its contents.",
    difficulty: "EASY",
    order: 8,
    estimatedDuration: "5-10 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-8-1",
        title: "Mission Directive: Recursive Removal",
        type: "base64",
        plaintextAnswer: "Run 'rm -r /workspace/obsolete'.",
        encodedContent: "Run 'rm -r /workspace/obsolete'.",
        hintNote: "The '-r' flag (recursive) enables rm to remove directories and everything inside them.",
      },
    ],
    initialFilesystem: {
      "/workspace/obsolete/old1.txt": "Legacy data 1",
      "/workspace/obsolete/old2.txt": "Legacy data 2",
      "/workspace/staging/active.txt": "Active production data",
    },
    objectiveConfig: {
      description: "Recursively delete obsolete folder /workspace/obsolete",
      rules: [
        {
          id: "obj-8-obsolete-del",
          points: 500,
          type: "dir_deleted",
          path: "/workspace/obsolete",
          description: "Directory /workspace/obsolete removed",
        },
      ],
    },
    hints: [
      {
        title: "Recursive Flag",
        content: "Plain 'rm' cannot remove directories; use the '-r' flag.",
        penaltySeconds: 10,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Exact Command",
        content: "Type: 'rm -r /workspace/obsolete'",
        penaltySeconds: 20,
        pointPenalty: 30,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 9: MEDIUM — Pattern Searching (grep)
  // ==========================================
  {
    slug: "the-missing-file",
    title: "Level 9: Pattern Searching (grep)",
    description:
      "Find error codes in server access logs. Use grep to locate ERROR entries in /var/log/nginx/access.log, then create /workspace/reports/error_resolved.log with touch.",
    difficulty: "MEDIUM",
    order: 9,
    estimatedDuration: "10-15 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-9-1",
        title: "Mission Directive: Searching Logs",
        type: "base64",
        plaintextAnswer: "Run 'grep ERROR /var/log/nginx/access.log' then 'touch /workspace/reports/error_resolved.log'.",
        encodedContent: "Run 'grep ERROR /var/log/nginx/access.log' then 'touch /workspace/reports/error_resolved.log'.",
        hintNote: "'grep <pattern> <file>' filters and prints matching lines.",
      },
    ],
    initialFilesystem: {
      "/var/log/nginx/access.log":
        "GET /index 200\nPOST /login 200\nGET /secret 403\nPOST /api 500 ERROR_CODE_500_SERVER_DOWN",
      "/workspace/reports/.keep": "",
    },
    objectiveConfig: {
      description: "Search logs with grep and create /workspace/reports/error_resolved.log",
      rules: [
        {
          id: "obj-9-resolved",
          points: 300,
          type: "file_exists",
          path: "/workspace/reports/error_resolved.log",
          description: "File /workspace/reports/error_resolved.log created",
        },
        {
          id: "obj-9-grep-cmd",
          points: 200,
          type: "min_commands",
          content: "2",
          description: "Executed commands in terminal",
        },
      ],
    },
    hints: [
      {
        title: "Searching Logs",
        content: "Run 'grep ERROR /var/log/nginx/access.log' to isolate the failing line.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Resolution Log",
        content: "Run 'touch /workspace/reports/error_resolved.log' to finish.",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 10: MEDIUM — Locating Files (find)
  // ==========================================
  {
    slug: "first-flag",
    title: "Level 10: Locating Files (find)",
    description:
      "Locate a configuration file buried deep in the filesystem. Use find /etc -name database.conf, then copy it to /workspace/database.conf using cp.",
    difficulty: "MEDIUM",
    order: 10,
    estimatedDuration: "10-15 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-10-1",
        title: "Mission Directive: Find by Name",
        type: "base64",
        plaintextAnswer: "Run 'find /etc -name database.conf' then 'cp /etc/app/deep/nested/sub/database.conf /workspace/database.conf'.",
        encodedContent: "Run 'find /etc -name database.conf' then 'cp /etc/app/deep/nested/sub/database.conf /workspace/database.conf'.",
        hintNote: "'find <dir> -name <filename>' recursively locates files matching the name.",
      },
    ],
    initialFilesystem: {
      "/etc/app/deep/nested/sub/database.conf": "DB_HOST=localhost\nDB_PORT=5432\nDB_NAME=production",
    },
    objectiveConfig: {
      description: "Locate database.conf and copy to /workspace/database.conf",
      rules: [
        {
          id: "obj-10-db-conf",
          points: 300,
          type: "file_exists",
          path: "/workspace/database.conf",
          description: "Database config copied to /workspace/database.conf",
        },
        {
          id: "obj-10-cmds",
          points: 200,
          type: "min_commands",
          content: "2",
          description: "Executed search and copy commands",
        },
      ],
    },
    hints: [
      {
        title: "Finding the File",
        content: "Run 'find /etc -name database.conf' to reveal its full path.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Copying to Workspace",
        content: "Run 'cp /etc/app/deep/nested/sub/database.conf /workspace/database.conf'.",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 11: MEDIUM — Inspecting Headers (head)
  // ==========================================
  {
    slug: "dead-letter",
    title: "Level 11: Inspecting Headers (head)",
    description:
      "Inspect the first lines of the system log. Use head -n 3 /var/log/syslog to view the boot header, then create /workspace/syslog_inspected.ack using touch.",
    difficulty: "MEDIUM",
    order: 11,
    estimatedDuration: "10-15 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-11-1",
        title: "Mission Directive: View First Lines",
        type: "base64",
        plaintextAnswer: "Run 'head -n 3 /var/log/syslog' then 'touch /workspace/syslog_inspected.ack'.",
        encodedContent: "Run 'head -n 3 /var/log/syslog' then 'touch /workspace/syslog_inspected.ack'.",
        hintNote: "'head -n <lines> <file>' displays the top lines of a file.",
      },
    ],
    initialFilesystem: {
      "/var/log/syslog": "HEADER: SYSTEM BOOT\nKERNEL: v6.8.0-generic\nBOOT_ID: 99421\nDevice eth0 UP\nDevice lo UP\nUser session active",
    },
    objectiveConfig: {
      description: "Inspect top lines with head and deploy /workspace/syslog_inspected.ack",
      rules: [
        {
          id: "obj-11-ack",
          points: 300,
          type: "file_exists",
          path: "/workspace/syslog_inspected.ack",
          description: "Acknowledgment /workspace/syslog_inspected.ack created",
        },
        {
          id: "obj-11-cmds",
          points: 200,
          type: "min_commands",
          content: "2",
          description: "Executed commands in terminal",
        },
      ],
    },
    hints: [
      {
        title: "Using head",
        content: "Run 'head -n 3 /var/log/syslog' to print the top 3 lines.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Creating Ack",
        content: "Run 'touch /workspace/syslog_inspected.ack'.",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 12: MEDIUM — Tailing Logs (tail)
  // ==========================================
  {
    slug: "log-diver",
    title: "Level 12: Tailing Logs (tail)",
    description:
      "Inspect the latest security events at the bottom of the authentication log. Use tail -n 2 /var/log/auth.log, then acknowledge by creating /workspace/incident_mitigated.ack.",
    difficulty: "MEDIUM",
    order: 12,
    estimatedDuration: "10-15 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-12-1",
        title: "Mission Directive: View End of File",
        type: "base64",
        plaintextAnswer: "Run 'tail -n 2 /var/log/auth.log' then 'touch /workspace/incident_mitigated.ack'.",
        encodedContent: "Run 'tail -n 2 /var/log/auth.log' then 'touch /workspace/incident_mitigated.ack'.",
        hintNote: "'tail -n <lines> <file>' displays the final lines of a file.",
      },
    ],
    initialFilesystem: {
      "/var/log/auth.log": "Session 1 opened\nSession 2 opened\nSession 3 opened\nCRITICAL: INCIDENT DETECTED AT END OF LOG",
    },
    objectiveConfig: {
      description: "Inspect log tail and create /workspace/incident_mitigated.ack",
      rules: [
        {
          id: "obj-12-ack",
          points: 300,
          type: "file_exists",
          path: "/workspace/incident_mitigated.ack",
          description: "Acknowledgment /workspace/incident_mitigated.ack created",
        },
        {
          id: "obj-12-cmds",
          points: 200,
          type: "min_commands",
          content: "2",
          description: "Executed commands in terminal",
        },
      ],
    },
    hints: [
      {
        title: "Using tail",
        content: "Run 'tail -n 2 /var/log/auth.log' to view the last 2 lines.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Creating File",
        content: "Run 'touch /workspace/incident_mitigated.ack'.",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 13: MEDIUM — Hidden Files (ls -a)
  // ==========================================
  {
    slug: "the-relocation-protocol",
    title: "Level 13: Hidden Files (ls -a)",
    description:
      "Find hidden dotfiles in the workspace using ls -a /workspace, locate .env.secret, and copy it to /workspace/backups/env_backup.txt using cp.",
    difficulty: "MEDIUM",
    order: 13,
    estimatedDuration: "10-15 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-13-1",
        title: "Mission Directive: Reveal Hidden Files",
        type: "base64",
        plaintextAnswer: "Run 'ls -a /workspace' then 'cp /workspace/.env.secret /workspace/backups/env_backup.txt'.",
        encodedContent: "Run 'ls -a /workspace' then 'cp /workspace/.env.secret /workspace/backups/env_backup.txt'.",
        hintNote: "'ls -a' lists all files including hidden dotfiles starting with '.'.",
      },
    ],
    initialFilesystem: {
      "/workspace/.bashrc": "alias ll='ls -la'",
      "/workspace/.env.secret": "API_SECRET_KEY=UBUNTU_SEC_9921",
      "/workspace/backups/.keep": "",
    },
    objectiveConfig: {
      description: "Reveal .env.secret and copy to /workspace/backups/env_backup.txt",
      rules: [
        {
          id: "obj-13-backup",
          points: 500,
          type: "file_exists",
          path: "/workspace/backups/env_backup.txt",
          description: "Secret backup created at /workspace/backups/env_backup.txt",
        },
      ],
    },
    hints: [
      {
        title: "Showing Hidden Files",
        content: "Type 'ls -a' to see all files starting with a dot like .env.secret.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Copying Hidden File",
        content: "Type: 'cp /workspace/.env.secret /workspace/backups/env_backup.txt'",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 14: MEDIUM — Visualizing Trees (tree)
  // ==========================================
  {
    slug: "needle-in-the-archive",
    title: "Level 14: Visualizing Trees (tree)",
    description:
      "Explore the /opt software modules using tree /opt, identify the network module, and copy /opt/modules/net/client.js to /workspace/dist/client.js.",
    difficulty: "MEDIUM",
    order: 14,
    estimatedDuration: "10-15 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-14-1",
        title: "Mission Directive: Tree Inspection",
        type: "base64",
        plaintextAnswer: "Run 'tree /opt' then 'cp /opt/modules/net/client.js /workspace/dist/client.js'.",
        encodedContent: "Run 'tree /opt' then 'cp /opt/modules/net/client.js /workspace/dist/client.js'.",
        hintNote: "'tree' prints a visual hierarchy of directories and files.",
      },
    ],
    initialFilesystem: {
      "/opt/modules/net/client.js": "Network client module v2.1",
      "/opt/modules/auth/oauth.js": "OAuth client module v1.0",
      "/workspace/dist/.keep": "",
    },
    objectiveConfig: {
      description: "Explore module tree and deploy /workspace/dist/client.js",
      rules: [
        {
          id: "obj-14-client-dist",
          points: 500,
          type: "file_exists",
          path: "/workspace/dist/client.js",
          description: "Client module deployed to /workspace/dist/client.js",
        },
      ],
    },
    hints: [
      {
        title: "Running Tree",
        content: "Type 'tree /opt' to visually inspect the folders.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Copying File",
        content: "Type: 'cp /opt/modules/net/client.js /workspace/dist/client.js'",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 15: MEDIUM — Staging a Release (mkdir & cp)
  // ==========================================
  {
    slug: "ghost-signal",
    title: "Level 15: Staging a Release (mkdir & cp)",
    description:
      "Stage a new release build: create /workspace/release/v1 with mkdir -p, then copy both /workspace/src/app.js and /workspace/src/style.css into it.",
    difficulty: "MEDIUM",
    order: 15,
    estimatedDuration: "12-15 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-15-1",
        title: "Mission Directive: Staging Assets",
        type: "base64",
        plaintextAnswer: "Run 'mkdir -p /workspace/release/v1', then 'cp /workspace/src/app.js /workspace/release/v1/app.js' and 'cp /workspace/src/style.css /workspace/release/v1/style.css'.",
        encodedContent: "Run 'mkdir -p /workspace/release/v1', then 'cp /workspace/src/app.js /workspace/release/v1/app.js' and 'cp /workspace/src/style.css /workspace/release/v1/style.css'.",
        hintNote: "Combine mkdir -p with cp to stage files.",
      },
    ],
    initialFilesystem: {
      "/workspace/src/app.js": "console.log('App ready');",
      "/workspace/src/style.css": "body { margin: 0; }",
    },
    objectiveConfig: {
      description: "Create /workspace/release/v1 and copy app.js & style.css into it",
      rules: [
        {
          id: "obj-15-release-dir",
          points: 150,
          type: "dir_exists",
          path: "/workspace/release/v1",
          description: "Release directory created",
        },
        {
          id: "obj-15-app-rel",
          points: 175,
          type: "file_exists",
          path: "/workspace/release/v1/app.js",
          description: "app.js staged in release",
        },
        {
          id: "obj-15-style-rel",
          points: 175,
          type: "file_exists",
          path: "/workspace/release/v1/style.css",
          description: "style.css staged in release",
        },
      ],
    },
    hints: [
      {
        title: "Step 1",
        content: "Run 'mkdir -p /workspace/release/v1'.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Step 2",
        content: "Run 'cp /workspace/src/app.js /workspace/release/v1/app.js' and 'cp /workspace/src/style.css /workspace/release/v1/style.css'.",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 16: MEDIUM — Log Rotation (mv, touch & rm)
  // ==========================================
  {
    slug: "three-keys",
    title: "Level 16: Log Rotation (mv, touch & rm)",
    description:
      "Perform log rotation: move /var/log/access.log to /var/log/archive/access.log.1, touch a new empty /var/log/access.log, and remove stale /var/log/access.log.9.gz.",
    difficulty: "MEDIUM",
    order: 16,
    estimatedDuration: "12-15 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-16-1",
        title: "Mission Directive: Log Rotation Steps",
        type: "base64",
        plaintextAnswer: "Run 'mv /var/log/access.log /var/log/archive/access.log.1', 'touch /var/log/access.log', and 'rm /var/log/access.log.9.gz'.",
        encodedContent: "Run 'mv /var/log/access.log /var/log/archive/access.log.1', 'touch /var/log/access.log', and 'rm /var/log/access.log.9.gz'.",
        hintNote: "Standard sysadmin rotation sequence: archive active log, touch new log, remove stale log.",
      },
    ],
    initialFilesystem: {
      "/var/log/access.log": "Active server access records.",
      "/var/log/access.log.9.gz": "Stale 9-week-old log.",
      "/var/log/archive/.keep": "",
    },
    objectiveConfig: {
      description: "Rotate access.log to archive, touch fresh log, and purge access.log.9.gz",
      rules: [
        {
          id: "obj-16-archived",
          points: 200,
          type: "file_exists",
          path: "/var/log/archive/access.log.1",
          description: "Active log archived to access.log.1",
        },
        {
          id: "obj-16-new-log",
          points: 150,
          type: "file_exists",
          path: "/var/log/access.log",
          description: "Fresh access.log created",
        },
        {
          id: "obj-16-stale-del",
          points: 150,
          type: "file_deleted",
          path: "/var/log/access.log.9.gz",
          description: "Stale compressed log purged",
        },
      ],
    },
    hints: [
      {
        title: "Move and Touch",
        content: "Run 'mv /var/log/access.log /var/log/archive/access.log.1', then 'touch /var/log/access.log'.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Remove Stale",
        content: "Run 'rm /var/log/access.log.9.gz'.",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 17: MEDIUM — Config Migration (cp & mv)
  // ==========================================
  {
    slug: "decoy-protocol",
    title: "Level 17: Config Migration (cp & mv)",
    description:
      "Safely deploy web server configurations: copy /etc/nginx/nginx.conf to /etc/nginx/nginx.conf.bak, and enable site by moving /etc/nginx/sites-available/default to /etc/nginx/sites-enabled/default.",
    difficulty: "MEDIUM",
    order: 17,
    estimatedDuration: "12-15 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-17-1",
        title: "Mission Directive: Config Deployment",
        type: "base64",
        plaintextAnswer: "Run 'cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak' then 'mv /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default'.",
        encodedContent: "Run 'cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak' then 'mv /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default'.",
        hintNote: "Backup configs before modifying, then enable virtual hosts with mv.",
      },
    ],
    initialFilesystem: {
      "/etc/nginx/nginx.conf": "http { server { listen 80; } }",
      "/etc/nginx/sites-available/default": "server { listen 443; }",
      "/etc/nginx/sites-enabled/.keep": "",
    },
    objectiveConfig: {
      description: "Backup nginx.conf and enable default site in sites-enabled",
      rules: [
        {
          id: "obj-17-bak",
          points: 200,
          type: "file_exists",
          path: "/etc/nginx/nginx.conf.bak",
          description: "Config backup /etc/nginx/nginx.conf.bak created",
        },
        {
          id: "obj-17-enabled",
          points: 150,
          type: "file_exists",
          path: "/etc/nginx/sites-enabled/default",
          description: "Site enabled in /etc/nginx/sites-enabled/default",
        },
        {
          id: "obj-17-avail-del",
          points: 150,
          type: "file_deleted",
          path: "/etc/nginx/sites-available/default",
          description: "Source site moved out of sites-available",
        },
      ],
    },
    hints: [
      {
        title: "Backup Step",
        content: "Run 'cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak'.",
        penaltySeconds: 15,
        pointPenalty: 25,
        order: 1,
      },
      {
        title: "Enable Site",
        content: "Run 'mv /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default'.",
        penaltySeconds: 30,
        pointPenalty: 35,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 18: HARD — Forensic Analysis (grep, cp & rm)
  // ==========================================
  {
    slug: "broken-chain",
    title: "Level 18: Forensic Analysis (grep, cp & rm)",
    description:
      "Investigate a security anomaly: search /var/log/audit/ for USER_ESCALATED with grep, copy the offending log /var/log/audit/session_02.log to /workspace/forensics/incident.log, and remove /tmp/exploit.sh with rm.",
    difficulty: "HARD",
    order: 18,
    estimatedDuration: "15-20 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-18-1",
        title: "Mission Directive: Forensic Workflow",
        type: "base64",
        plaintextAnswer: "Search logs with 'grep USER_ESCALATED /var/log/audit/session_02.log', copy incident to /workspace/forensics/incident.log, and remove /tmp/exploit.sh.",
        encodedContent: "Search logs with 'grep USER_ESCALATED /var/log/audit/session_02.log', copy incident to /workspace/forensics/incident.log, and remove /tmp/exploit.sh.",
        hintNote: "Investigate with grep, archive evidence with cp, remove malware with rm.",
      },
    ],
    initialFilesystem: {
      "/var/log/audit/session_01.log": "User login normal",
      "/var/log/audit/session_02.log": "AUDIT ALERT: USER_ESCALATED_UID_0 ROOT_PRIVILEGES_GRANTED",
      "/tmp/exploit.sh": "MALICIOUS_PAYLOAD",
      "/workspace/forensics/.keep": "",
    },
    objectiveConfig: {
      description: "Archive incident log to forensics and remove /tmp/exploit.sh",
      rules: [
        {
          id: "obj-18-incident-log",
          points: 250,
          type: "file_exists",
          path: "/workspace/forensics/incident.log",
          description: "Incident log archived to /workspace/forensics/incident.log",
        },
        {
          id: "obj-18-exploit-del",
          points: 250,
          type: "file_deleted",
          path: "/tmp/exploit.sh",
          description: "Malicious exploit removed from /tmp/exploit.sh",
        },
      ],
    },
    hints: [
      {
        title: "Locate and Copy",
        content: "Run 'cp /var/log/audit/session_02.log /workspace/forensics/incident.log'.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 1,
      },
      {
        title: "Delete Exploit",
        content: "Run 'rm /tmp/exploit.sh'.",
        penaltySeconds: 60,
        pointPenalty: 40,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 19: HARD — Storage Restructuring (mkdir -p, cp & rm -r)
  // ==========================================
  {
    slug: "recursive-vault",
    title: "Level 19: Storage Restructuring (mkdir -p, cp & rm -r)",
    description:
      "Restructure system storage: create /srv/storage/production/data with mkdir -p, copy db_master.sqlite to /srv/storage/production/data/db.sqlite, copy schema.sql to /srv/storage/production/data/schema.sql, and remove /mnt/legacy with rm -r.",
    difficulty: "HARD",
    order: 19,
    estimatedDuration: "15-20 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-19-1",
        title: "Mission Directive: Migration Sequence",
        type: "base64",
        plaintextAnswer: "Run 'mkdir -p /srv/storage/production/data', 'cp /mnt/legacy/db_master.sqlite /srv/storage/production/data/db.sqlite', 'cp /mnt/legacy/schema.sql /srv/storage/production/data/schema.sql', and 'rm -r /mnt/legacy'.",
        encodedContent: "Run 'mkdir -p /srv/storage/production/data', 'cp /mnt/legacy/db_master.sqlite /srv/storage/production/data/db.sqlite', 'cp /mnt/legacy/schema.sql /srv/storage/production/data/schema.sql', and 'rm -r /mnt/legacy'.",
        hintNote: "Build modern storage directories, migrate databases and schemas, and purge legacy mount points.",
      },
    ],
    initialFilesystem: {
      "/mnt/legacy/db_master.sqlite": "SQLITE_MASTER_DATA",
      "/mnt/legacy/schema.sql": "CREATE TABLE users (id INT);",
      "/mnt/legacy/temp.bin": "TEMP_BIN",
      "/srv/storage/.keep": "",
    },
    objectiveConfig: {
      description: "Migrate database and schema to /srv/storage/production/data and purge /mnt/legacy",
      rules: [
        {
          id: "obj-19-data-dir",
          points: 150,
          type: "dir_exists",
          path: "/srv/storage/production/data",
          description: "Production data directory created",
        },
        {
          id: "obj-19-db-file",
          points: 150,
          type: "file_exists",
          path: "/srv/storage/production/data/db.sqlite",
          description: "Database migrated to /srv/storage/production/data/db.sqlite",
        },
        {
          id: "obj-19-schema-file",
          points: 100,
          type: "file_exists",
          path: "/srv/storage/production/data/schema.sql",
          description: "Schema migrated to /srv/storage/production/data/schema.sql",
        },
        {
          id: "obj-19-legacy-del",
          points: 100,
          type: "dir_deleted",
          path: "/mnt/legacy",
          description: "Legacy directory removed",
        },
      ],
    },
    hints: [
      {
        title: "Create and Copy",
        content: "Run 'mkdir -p /srv/storage/production/data' then copy db_master.sqlite and schema.sql.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 1,
      },
      {
        title: "Remove Legacy",
        content: "Run 'rm -r /mnt/legacy'.",
        penaltySeconds: 60,
        pointPenalty: 40,
        order: 2,
      },
    ],
  },

  // ==========================================
  // LEVEL 20: HARD — Full Production Deployment Pipeline
  // ==========================================
  {
    slug: "final-convergence",
    title: "Level 20: Full Production Deployment Pipeline",
    description:
      "Execute complete deployment workflow: create /var/www/production/public and /var/www/production/config with mkdir -p, copy index.html and app.js into public, touch /var/www/production/config/.env, and remove /workspace/staging with rm -r.",
    difficulty: "HARD",
    order: 20,
    estimatedDuration: "15-20 min",
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
    commandMappings: {},
    clues: [
      {
        id: "clue-20-1",
        title: "Mission Directive: Full Deployment Pipeline",
        type: "base64",
        plaintextAnswer: "Create dirs with 'mkdir -p /var/www/production/public /var/www/production/config', copy assets with 'cp /workspace/staging/index.html /var/www/production/public/index.html' and 'cp /workspace/staging/app.js /var/www/production/public/app.js', create config with 'touch /var/www/production/config/.env', and remove staging with 'rm -r /workspace/staging'.",
        encodedContent: "Create dirs with 'mkdir -p /var/www/production/public /var/www/production/config', copy assets with 'cp /workspace/staging/index.html /var/www/production/public/index.html' and 'cp /workspace/staging/app.js /var/www/production/public/app.js', create config with 'touch /var/www/production/config/.env', and remove staging with 'rm -r /workspace/staging'.",
        hintNote: "Comprehensive production release incorporating directory creation, asset deployment, env initialization, and staging cleanup.",
      },
    ],
    initialFilesystem: {
      "/workspace/staging/index.html": "<html><body>Production Ready</body></html>",
      "/workspace/staging/app.js": "console.log('Production Started');",
      "/workspace/staging/build_cache.tmp": "Temporary build cache",
    },
    objectiveConfig: {
      description: "Deploy web assets to /var/www/production and purge staging",
      rules: [
        {
          id: "obj-20-pub-dir",
          points: 100,
          type: "dir_exists",
          path: "/var/www/production/public",
          description: "Public directory created",
        },
        {
          id: "obj-20-html",
          points: 100,
          type: "file_exists",
          path: "/var/www/production/public/index.html",
          description: "index.html deployed to production",
        },
        {
          id: "obj-20-js",
          points: 100,
          type: "file_exists",
          path: "/var/www/production/public/app.js",
          description: "app.js deployed to production",
        },
        {
          id: "obj-20-env",
          points: 100,
          type: "file_exists",
          path: "/var/www/production/config/.env",
          description: "Production .env file created",
        },
        {
          id: "obj-20-staging-del",
          points: 100,
          type: "dir_deleted",
          path: "/workspace/staging",
          description: "Staging directory cleaned up",
        },
      ],
    },
    hints: [
      {
        title: "Setup and Copy",
        content: "Run 'mkdir -p /var/www/production/public /var/www/production/config', then copy index.html and app.js into public.",
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 1,
      },
      {
        title: "Env and Cleanup",
        content: "Run 'touch /var/www/production/config/.env' and 'rm -r /workspace/staging'.",
        penaltySeconds: 60,
        pointPenalty: 40,
        order: 2,
      },
    ],
  },
];
