import { encodeBase64 } from "../ciphers/ciphers";
import type { SeedChallengeDef } from "./catalogTypes";
import type { ChallengeSolution } from "./solutions";

type Rule = SeedChallengeDef["objectiveConfig"]["rules"][number];

interface Scenario {
  slug: string;
  title: string;
  description: string;
  difficulty: SeedChallengeDef["difficulty"];
  order: number;
  initial?: Record<string, string>;
  rules: Rule[];
  steps: string[];
  negativeCmd: string;
  mapping?: Record<string, string>;
  clueText?: string;
}

const scenarios: Scenario[] = [
  {
    slug: "welcome-folder",
    title: "Create a Welcome Folder",
    description: "Create one folder for a new team member.",
    difficulty: "EASY",
    order: 21,
    rules: [
      {
        id: "welcome-dir",
        type: "dir_exists",
        path: "/workspace/welcome",
        points: 250,
        description: "The welcome folder exists",
      },
    ],
    steps: ["rmdir /workspace/welcome"],
    negativeCmd: "mkdir /workspace/welcome",
    mapping: {
      rmdir: "mkdir",
      mkdir: "rmdir"
},
    clueText: "CLUE: 'rmdir' and 'mkdir' are swapped: typing 'rmdir' creates directories (acting as mkdir). Run 'rmdir /workspace/welcome'.",
  },
  {
    slug: "empty-checklist",
    title: "Make an Empty Checklist",
    description: "Create an empty checklist file in the workspace.",
    difficulty: "EASY",
    order: 22,
    rules: [
      {
        id: "checklist-file",
        type: "file_exists",
        path: "/workspace/checklist.txt",
        points: 250,
        description: "The checklist file exists",
      },
    ],
    steps: ["pwd /workspace/checklist.txt"],
    negativeCmd: "touch /workspace/checklist.txt",
    mapping: {
      pwd: "touch",
      touch: "pwd"
},
    clueText: "CLUE: 'pwd' and 'touch' are swapped: typing 'pwd' creates files (acting as touch). Run 'pwd /workspace/checklist.txt'.",
  },
  {
    slug: "remove-old-note",
    title: "Remove the Old Note",
    description: "Delete the note that is no longer needed.",
    difficulty: "EASY",
    order: 23,
    initial: { "/workspace/old-note.txt": "This note is out of date." },
    rules: [
      {
        id: "old-note-gone",
        type: "file_deleted",
        path: "/workspace/old-note.txt",
        points: 250,
        description: "The old note is deleted",
      },
    ],
    steps: ["touch /workspace/old-note.txt"],
    negativeCmd: "rm /workspace/old-note.txt",
    mapping: {
      touch: "rm",
      rm: "touch"
},
    clueText: "CLUE: 'touch' and 'rm' are swapped: typing 'touch' deletes files (acting as rm). Run 'touch /workspace/old-note.txt'.",
  },
  {
    slug: "copy-readme",
    title: "Copy the Readme",
    description: "Keep a backup copy of the readme file.",
    difficulty: "EASY",
    order: 24,
    initial: {
      "/workspace/readme.txt": "Start here.",
      "/workspace/backup/.keep": "",
    },
    rules: [
      {
        id: "readme-copy",
        type: "file_exists",
        path: "/workspace/backup/readme.txt",
        points: 250,
        description: "A readme copy exists in backup",
      },
    ],
    steps: ["mkdir /workspace/readme.txt /workspace/backup/readme.txt"],
    negativeCmd: "cp /workspace/readme.txt /workspace/backup/readme.txt",
    mapping: {
      mkdir: "cp",
      cp: "mkdir"
},
    clueText: "CLUE: 'mkdir' and 'cp' are swapped: typing 'mkdir' copies files (acting as cp). Run 'mkdir /workspace/readme.txt /workspace/backup/readme.txt'.",
  },
  {
    slug: "move-draft",
    title: "Move the Draft",
    description: "Move the draft into the ready folder.",
    difficulty: "EASY",
    order: 25,
    initial: {
      "/workspace/draft.txt": "Ready to review.",
      "/workspace/ready/.keep": "",
    },
    rules: [
      {
        id: "draft-ready",
        type: "file_exists",
        path: "/workspace/ready/draft.txt",
        points: 125,
        description: "The draft is in ready",
      },
      {
        id: "draft-moved",
        type: "file_deleted",
        path: "/workspace/draft.txt",
        points: 125,
        description: "The draft left its old location",
      },
    ],
    steps: ["head /workspace/draft.txt /workspace/ready/draft.txt"],
    negativeCmd: "mv /workspace/draft.txt /workspace/ready/draft.txt",
    mapping: {
      head: "mv",
      mv: "head"
},
    clueText: "CLUE: 'head' and 'mv' are swapped: typing 'head' moves files (acting as mv). Run 'head /workspace/draft.txt /workspace/ready/draft.txt'.",
  },
  {
    slug: "enter-docs",
    title: "Enter the Docs Folder",
    description: "Move into the docs folder and finish there.",
    difficulty: "EASY",
    order: 26,
    initial: { "/workspace/docs/.keep": "" },
    rules: [
      {
        id: "inside-docs",
        type: "cwd_equals",
        path: "/workspace/docs",
        points: 250,
        description: "The terminal is inside docs",
      },
    ],
    steps: ["pwd /workspace/docs"],
    negativeCmd: "cd /workspace/docs",
    mapping: {
      pwd: "cd",
      cd: "pwd"
},
    clueText: "CLUE: 'pwd' and 'cd' are swapped: typing 'pwd' changes directories (acting as cd). Run 'pwd /workspace/docs'.",
  },
  {
    slug: "save-message",
    title: "Save the Message",
    description: "Copy the supplied message into the answer file.",
    difficulty: "EASY",
    order: 27,
    initial: { "/workspace/message.txt": "HELLO TEAM" },
    rules: [
      {
        id: "answer-message",
        type: "file_exact",
        path: "/workspace/answer.txt",
        content: "HELLO TEAM",
        points: 250,
        description: "The answer contains the exact message",
      },
    ],
    steps: ["cat /workspace/message.txt /workspace/answer.txt"],
    negativeCmd: "cp /workspace/message.txt /workspace/answer.txt",
    mapping: {
      cat: "cp",
      cp: "cat"
},
    clueText: "CLUE: 'cat' and 'cp' are swapped: typing 'cat' copies files (acting as cp). Run 'cat /workspace/message.txt /workspace/answer.txt'.",
  },
  {
    slug: "remove-empty-folder",
    title: "Remove the Empty Folder",
    description: "Delete the unused empty folder.",
    difficulty: "EASY",
    order: 28,
    initial: { "/workspace/unused/.keep": "" },
    rules: [
      {
        id: "unused-gone",
        type: "dir_deleted",
        path: "/workspace/unused",
        points: 250,
        description: "The unused folder is deleted",
      },
    ],
    steps: ["rmdir /workspace/unused/.keep","rm /workspace/unused"],
    negativeCmd: "touch /workspace/unused",
    mapping: {
      rm: "rmdir",
      rmdir: "rm"
},
    clueText: "CLUE: 'rm' and 'rmdir' are swapped: typing 'rmdir' removes files (acting as rm), and typing 'rm' removes empty directories (acting as rmdir). Run 'rmdir /workspace/unused/.keep', then 'rm /workspace/unused'.",
  },
  {
    slug: "copy-team-list",
    title: "Copy the Team List",
    description: "Place a copy of the team list in the shared folder.",
    difficulty: "EASY",
    order: 29,
    initial: {
      "/workspace/team.txt": "Ada\nLinus",
      "/workspace/shared/.keep": "",
    },
    rules: [
      {
        id: "shared-team",
        type: "file_exists",
        path: "/workspace/shared/team.txt",
        points: 250,
        description: "The shared team list exists",
      },
    ],
    steps: ["diff /workspace/team.txt /workspace/shared/team.txt"],
    negativeCmd: "cp /workspace/team.txt /workspace/shared/team.txt",
    mapping: {
      diff: "cp",
      cp: "diff"
},
    clueText: "CLUE: 'diff' and 'cp' are swapped: typing 'diff' copies files (acting as cp). Run 'diff /workspace/team.txt /workspace/shared/team.txt'.",
  },
  {
    slug: "nested-notes",
    title: "Build a Notes Folder",
    description: "Create the nested folder shown in the clue.",
    difficulty: "EASY",
    order: 30,
    rules: [
      {
        id: "daily-notes",
        type: "dir_exists",
        path: "/workspace/notes/daily",
        points: 250,
        description: "The daily notes folder exists",
      },
    ],
    steps: ["grep -p /workspace/notes/daily"],
    negativeCmd: "mkdir -p /workspace/notes/daily",
    mapping: {
      grep: "mkdir",
      mkdir: "grep"
},
    clueText: "CLUE: 'grep' and 'mkdir' are swapped: typing 'grep' creates directories (acting as mkdir). Run 'grep -p /workspace/notes/daily'.",
  },
  {
    slug: "swapped-touch",
    title: "Use the Swapped Create Command",
    description: "The clue says which command now creates a file.",
    difficulty: "EASY",
    order: 31,
    rules: [
      {
        id: "ready-file",
        type: "file_exists",
        path: "/workspace/ready.txt",
        points: 250,
        description: "The ready file exists",
      },
    ],
    steps: ["truncate /workspace/ready.txt"],
    negativeCmd: "touch /workspace/ready.txt",
    mapping: {
      truncate: "touch",
      touch: "truncate"
},
    clueText: "CLUE: 'truncate' and 'touch' are swapped: typing 'truncate' creates files (acting as touch). Run 'truncate /workspace/ready.txt'.",
  },
  {
    slug: "two-command-warmup",
    title: "Complete Two Simple Steps",
    description: "Create a folder, then enter it.",
    difficulty: "EASY",
    order: 32,
    rules: [
      {
        id: "warmup-dir",
        type: "dir_exists",
        path: "/workspace/warmup",
        points: 125,
        description: "The warmup folder exists",
      },
      {
        id: "warmup-cwd",
        type: "cwd_equals",
        path: "/workspace/warmup",
        points: 125,
        description: "The terminal is inside warmup",
      },
    ],
    steps: ["echo /workspace/warmup","cd /workspace/warmup"],
    negativeCmd: "mkdir /workspace/warmup",
    mapping: {
      echo: "mkdir",
      mkdir: "echo"
},
    clueText: "CLUE: 'echo' and 'mkdir' are swapped: typing 'echo' creates directories (acting as mkdir). Run 'echo /workspace/warmup', then 'cd /workspace/warmup'.",
  },
  {
    slug: "stage-release-notes",
    title: "Stage the Release Notes",
    description: "Create the release folder and copy the notes into it.",
    difficulty: "MEDIUM",
    order: 33,
    initial: { "/workspace/notes.txt": "Version 1 is ready." },
    rules: [
      {
        id: "release-dir",
        type: "dir_exists",
        path: "/workspace/release",
        points: 100,
        description: "The release folder exists",
      },
      {
        id: "release-notes",
        type: "file_exists",
        path: "/workspace/release/notes.txt",
        points: 150,
        description: "The notes are in release",
      },
    ],
    steps: ["find /workspace/release","cp /workspace/notes.txt /workspace/release/notes.txt"],
    negativeCmd: "mkdir /workspace/release",
    mapping: {
      find: "mkdir",
      mkdir: "find"
},
    clueText: "CLUE: 'find' and 'mkdir' are swapped: typing 'find' creates directories (acting as mkdir). Run 'find /workspace/release', then 'cp /workspace/notes.txt /workspace/release/notes.txt'.",
  },
  {
    slug: "archive-two-files",
    title: "Archive Two Files",
    description: "Copy both reports into the archive folder.",
    difficulty: "MEDIUM",
    order: 34,
    initial: {
      "/workspace/one.txt": "One",
      "/workspace/two.txt": "Two",
      "/workspace/archive/.keep": "",
    },
    rules: [
      {
        id: "archive-one",
        type: "file_exists",
        path: "/workspace/archive/one.txt",
        points: 125,
        description: "The first report is archived",
      },
      {
        id: "archive-two",
        type: "file_exists",
        path: "/workspace/archive/two.txt",
        points: 125,
        description: "The second report is archived",
      },
    ],
    steps: ["sort /workspace/one.txt /workspace/archive/one.txt","sort /workspace/two.txt /workspace/archive/two.txt"],
    negativeCmd: "cp /workspace/one.txt /workspace/archive/one.txt",
    mapping: {
      sort: "cp",
      cp: "sort"
},
    clueText: "CLUE: 'sort' and 'cp' are swapped: typing 'sort' copies files (acting as cp). Run 'sort /workspace/one.txt /workspace/archive/one.txt' and 'sort /workspace/two.txt /workspace/archive/two.txt'.",
  },
  {
    slug: "replace-old-config",
    title: "Replace the Old Config",
    description: "Move the new config into place and remove the old copy.",
    difficulty: "MEDIUM",
    order: 35,
    initial: {
      "/workspace/new.conf": "MODE=SAFE",
      "/workspace/config/old.conf": "MODE=OLD",
    },
    rules: [
      {
        id: "new-config",
        type: "file_exact",
        path: "/workspace/config/app.conf",
        content: "MODE=SAFE",
        points: 150,
        description: "The safe config is installed",
      },
      {
        id: "old-config-gone",
        type: "file_deleted",
        path: "/workspace/config/old.conf",
        points: 100,
        description: "The old config is removed",
      },
    ],
    steps: ["head /workspace/new.conf /workspace/config/app.conf","rmdir /workspace/config/old.conf"],
    negativeCmd: "mv /workspace/new.conf /workspace/config/app.conf",
    mapping: {
      head: "mv",
      mv: "head",
      rmdir: "rm",
      rm: "rmdir"
},
    clueText: "CLUE: 'head' moves files (acting as mv) and 'rmdir' deletes files (acting as rm). Run 'head /workspace/new.conf /workspace/config/app.conf', then 'rmdir /workspace/config/old.conf'.",
  },
  {
    slug: "collect-log-copy",
    title: "Collect the Error Log",
    description: "Inspect the log and copy it into the review folder.",
    difficulty: "MEDIUM",
    order: 36,
    initial: {
      "/workspace/app.log": "INFO start\nERROR disk full",
      "/workspace/review/.keep": "",
    },
    rules: [
      {
        id: "review-log",
        type: "file_exists",
        path: "/workspace/review/app.log",
        points: 150,
        description: "The log is copied for review",
      },
      {
        id: "two-commands",
        type: "min_commands",
        content: "2",
        points: 100,
        description: "At least two commands were used",
      },
    ],
    steps: ["head ERROR /workspace/app.log","touch /workspace/app.log /workspace/review/app.log"],
    negativeCmd: "grep ERROR /workspace/app.log",
    mapping: {
      head: "grep",
      grep: "head",
      touch: "cp",
      cp: "touch"
},
    clueText: "CLUE: 'head' filters files (acting as grep) and 'touch' copies files (acting as cp). Run 'head ERROR /workspace/app.log', then 'touch /workspace/app.log /workspace/review/app.log'.",
  },
  {
    slug: "sort-project-assets",
    title: "Sort Project Assets",
    description: "Place the script and image in their matching folders.",
    difficulty: "MEDIUM",
    order: 37,
    initial: {
      "/workspace/app.js": "console.log('hi')",
      "/workspace/logo.png": "PNG",
      "/workspace/src/.keep": "",
      "/workspace/images/.keep": "",
    },
    rules: [
      {
        id: "script-sorted",
        type: "file_exists",
        path: "/workspace/src/app.js",
        points: 125,
        description: "The script is in src",
      },
      {
        id: "image-sorted",
        type: "file_exists",
        path: "/workspace/images/logo.png",
        points: 125,
        description: "The image is in images",
      },
    ],
    steps: ["echo /workspace/app.js /workspace/src/app.js","echo /workspace/logo.png /workspace/images/logo.png"],
    negativeCmd: "mv /workspace/app.js /workspace/src/app.js",
    mapping: {
      echo: "mv",
      mv: "echo"
},
    clueText: "CLUE: 'echo' and 'mv' are swapped: typing 'echo' moves files (acting as mv). Run 'echo /workspace/app.js /workspace/src/app.js' and 'echo /workspace/logo.png /workspace/images/logo.png'.",
  },
  {
    slug: "build-backup-tree",
    title: "Build the Backup Tree",
    description:
      "Create a dated backup folder and copy the database file there.",
    difficulty: "MEDIUM",
    order: 38,
    initial: { "/workspace/db.sqlite": "DATA" },
    rules: [
      {
        id: "backup-tree",
        type: "dir_exists",
        path: "/workspace/backups/today",
        points: 100,
        description: "The dated backup folder exists",
      },
      {
        id: "database-backup",
        type: "file_exists",
        path: "/workspace/backups/today/db.sqlite",
        points: 150,
        description: "The database backup exists",
      },
    ],
    steps: ["diff -p /workspace/backups/today","tail /workspace/db.sqlite /workspace/backups/today/db.sqlite"],
    negativeCmd: "mkdir -p /workspace/backups/today",
    mapping: {
      diff: "mkdir",
      mkdir: "diff",
      tail: "cp",
      cp: "tail"
},
    clueText: "CLUE: 'diff' creates directories (acting as mkdir) and 'tail' copies files (acting as cp). Run 'diff -p /workspace/backups/today', then 'tail /workspace/db.sqlite /workspace/backups/today/db.sqlite'.",
  },
  {
    slug: "clean-build-output",
    title: "Clean the Build Output",
    description: "Keep the final bundle and remove two temporary files.",
    difficulty: "MEDIUM",
    order: 39,
    initial: {
      "/workspace/build/app.js": "BUNDLE",
      "/workspace/build/a.tmp": "A",
      "/workspace/build/b.tmp": "B",
    },
    rules: [
      {
        id: "bundle-kept",
        type: "file_exists",
        path: "/workspace/build/app.js",
        points: 50,
        description: "The bundle remains",
      },
      {
        id: "temp-a-gone",
        type: "file_deleted",
        path: "/workspace/build/a.tmp",
        points: 100,
        description: "The first temporary file is removed",
      },
      {
        id: "temp-b-gone",
        type: "file_deleted",
        path: "/workspace/build/b.tmp",
        points: 100,
        description: "The second temporary file is removed",
      },
    ],
    steps: ["cat /workspace/build/a.tmp","cat /workspace/build/b.tmp"],
    negativeCmd: "rm /workspace/build/a.tmp",
    mapping: {
      cat: "rm",
      rm: "cat"
},
    clueText: "CLUE: 'cat' and 'rm' are swapped: typing 'cat' deletes files (acting as rm). Run 'cat /workspace/build/a.tmp' and 'cat /workspace/build/b.tmp'.",
  },
  {
    slug: "swapped-copy-move",
    title: "Follow the Copy and Move Swap",
    description:
      "Use the swapped commands to copy the guide and move the draft.",
    difficulty: "MEDIUM",
    order: 40,
    initial: {
      "/workspace/guide.txt": "GUIDE",
      "/workspace/draft.txt": "DRAFT",
      "/workspace/out/.keep": "",
    },
    rules: [
      {
        id: "guide-out",
        type: "file_exists",
        path: "/workspace/out/guide.txt",
        points: 125,
        description: "The guide is copied",
      },
      {
        id: "draft-out",
        type: "file_exists",
        path: "/workspace/out/draft.txt",
        points: 125,
        description: "The draft is moved",
      },
    ],
    steps: ["rmdir /workspace/guide.txt /workspace/out/guide.txt","diff /workspace/draft.txt /workspace/out/draft.txt"],
    negativeCmd: "cp /workspace/guide.txt /workspace/out/guide.txt",
    mapping: {
      rmdir: "cp",
      cp: "rmdir",
      diff: "mv",
      mv: "diff"
},
    clueText: "CLUE: 'rmdir' copies files (acting as cp) and 'diff' moves files (acting as mv). Run 'rmdir /workspace/guide.txt /workspace/out/guide.txt', then 'diff /workspace/draft.txt /workspace/out/draft.txt'.",
  },
  {
    slug: "prepare-review-pack",
    title: "Prepare a Review Pack",
    description: "Create a review folder and add both requested files.",
    difficulty: "MEDIUM",
    order: 41,
    initial: { "/workspace/code.txt": "CODE", "/workspace/test.txt": "TEST" },
    rules: [
      {
        id: "review-code",
        type: "file_exists",
        path: "/workspace/review/code.txt",
        points: 125,
        description: "The code is in review",
      },
      {
        id: "review-test",
        type: "file_exists",
        path: "/workspace/review/test.txt",
        points: 125,
        description: "The test is in review",
      },
    ],
    steps: ["tail /workspace/review","diff /workspace/code.txt /workspace/review/code.txt","diff /workspace/test.txt /workspace/review/test.txt"],
    negativeCmd: "mkdir /workspace/review",
    mapping: {
      tail: "mkdir",
      mkdir: "tail",
      diff: "cp",
      cp: "diff"
},
    clueText: "CLUE: 'tail' creates directories (acting as mkdir) and 'diff' copies files (acting as cp). Run 'tail /workspace/review', 'diff /workspace/code.txt /workspace/review/code.txt', and 'diff /workspace/test.txt /workspace/review/test.txt'.",
  },
  {
    slug: "move-and-enter",
    title: "Move a File and Enter Its Folder",
    description: "Move the task into done, then finish inside that folder.",
    difficulty: "MEDIUM",
    order: 42,
    initial: { "/workspace/task.txt": "DONE", "/workspace/done/.keep": "" },
    rules: [
      {
        id: "done-task",
        type: "file_exists",
        path: "/workspace/done/task.txt",
        points: 150,
        description: "The task is in done",
      },
      {
        id: "inside-done",
        type: "cwd_equals",
        path: "/workspace/done",
        points: 100,
        description: "The terminal is inside done",
      },
    ],
    steps: ["head /workspace/task.txt /workspace/done/task.txt","echo /workspace/done"],
    negativeCmd: "cp /workspace/task.txt /workspace/done/task.txt",
    mapping: {
      head: "mv",
      mv: "head",
      echo: "cd",
      cd: "echo"
},
    clueText: "CLUE: 'head' moves files (acting as mv) and 'echo' changes directories (acting as cd). Run 'head /workspace/task.txt /workspace/done/task.txt', then 'echo /workspace/done'.",
  },
  {
    slug: "verify-and-store-token",
    title: "Verify and Store the Token",
    description: "Read the token file, then copy it into the secure folder.",
    difficulty: "MEDIUM",
    order: 43,
    initial: {
      "/workspace/token.txt": "TOKEN-42",
      "/workspace/secure/.keep": "",
    },
    rules: [
      {
        id: "stored-token",
        type: "file_exact",
        path: "/workspace/secure/token.txt",
        content: "TOKEN-42",
        points: 150,
        description: "The exact token is stored",
      },
      {
        id: "token-steps",
        type: "min_commands",
        content: "2",
        points: 100,
        description: "The token was checked before storage",
      },
    ],
    steps: ["wc /workspace/token.txt","echo /workspace/token.txt /workspace/secure/token.txt"],
    negativeCmd: "cat /workspace/token.txt",
    mapping: {
      wc: "cat",
      cat: "wc",
      echo: "cp",
      cp: "echo"
},
    clueText: "CLUE: 'wc' displays files (acting as cat) and 'echo' copies files (acting as cp). Run 'wc /workspace/token.txt', then 'echo /workspace/token.txt /workspace/secure/token.txt'.",
  },
  {
    slug: "release-three-assets",
    title: "Release Three Assets",
    description:
      "Build the release tree, copy two assets, and move the manifest.",
    difficulty: "HARD",
    order: 44,
    initial: {
      "/workspace/app.bin": "BIN",
      "/workspace/help.txt": "HELP",
      "/workspace/manifest.json": "{}",
    },
    rules: [
      {
        id: "release-bin",
        type: "file_exists",
        path: "/workspace/release/bin/app.bin",
        points: 100,
        description: "The app is in bin",
      },
      {
        id: "release-help",
        type: "file_exists",
        path: "/workspace/release/docs/help.txt",
        points: 75,
        description: "Help is in docs",
      },
      {
        id: "release-manifest",
        type: "file_exists",
        path: "/workspace/release/manifest.json",
        points: 75,
        description: "The manifest is in release",
      },
    ],
    steps: ["rmdir -p /workspace/release/bin","rmdir -p /workspace/release/docs","echo /workspace/app.bin /workspace/release/bin/app.bin","echo /workspace/help.txt /workspace/release/docs/help.txt","tail /workspace/manifest.json /workspace/release/manifest.json"],
    negativeCmd: "mkdir -p /workspace/release/bin",
    mapping: {
      rmdir: "mkdir",
      mkdir: "rmdir",
      echo: "cp",
      cp: "echo",
      tail: "mv",
      mv: "tail"
},
    clueText: "CLUE: 'rmdir' creates directories (acting as mkdir), 'echo' copies files (acting as cp), and 'tail' moves files (acting as mv). Run: rmdir -p /workspace/release/bin; rmdir -p /workspace/release/docs; echo /workspace/app.bin /workspace/release/bin/app.bin; echo /workspace/help.txt /workspace/release/docs/help.txt; tail /workspace/manifest.json /workspace/release/manifest.json",
  },
  {
    slug: "restore-clean-snapshot",
    title: "Restore a Clean Snapshot",
    description: "Copy the snapshot into place and remove both damaged files.",
    difficulty: "HARD",
    order: 45,
    initial: {
      "/workspace/snapshot.db": "GOOD",
      "/workspace/live.db": "BAD",
      "/workspace/live.tmp": "BROKEN",
      "/workspace/restored/.keep": "",
    },
    rules: [
      {
        id: "snapshot-restored",
        type: "file_exact",
        path: "/workspace/restored/live.db",
        content: "GOOD",
        points: 100,
        description: "The good snapshot is restored",
      },
      {
        id: "bad-live-gone",
        type: "file_deleted",
        path: "/workspace/live.db",
        points: 75,
        description: "The damaged database is removed",
      },
      {
        id: "bad-temp-gone",
        type: "file_deleted",
        path: "/workspace/live.tmp",
        points: 75,
        description: "The broken temporary file is removed",
      },
    ],
    steps: ["cat /workspace/snapshot.db /workspace/restored/live.db","pwd /workspace/live.db","pwd /workspace/live.tmp"],
    negativeCmd: "cp /workspace/snapshot.db /workspace/restored/live.db",
    mapping: {
      cat: "cp",
      cp: "cat",
      pwd: "rm",
      rm: "pwd"
},
    clueText: "CLUE: 'cat' copies files (acting as cp) and 'pwd' deletes files (acting as rm). Run: cat /workspace/snapshot.db /workspace/restored/live.db; pwd /workspace/live.db; pwd /workspace/live.tmp",
  },
  {
    slug: "publish-site-bundle",
    title: "Publish the Site Bundle",
    description:
      "Prepare the public folders, move the page, copy the style, and remove the cache.",
    difficulty: "HARD",
    order: 46,
    initial: {
      "/workspace/index.html": "<h1>Hello</h1>",
      "/workspace/style.css": "body{}",
      "/workspace/cache.tmp": "OLD",
    },
    rules: [
      {
        id: "public-page",
        type: "file_exists",
        path: "/workspace/public/index.html",
        points: 100,
        description: "The page is public",
      },
      {
        id: "public-style",
        type: "file_exists",
        path: "/workspace/public/assets/style.css",
        points: 75,
        description: "The style is in assets",
      },
      {
        id: "site-cache-gone",
        type: "file_deleted",
        path: "/workspace/cache.tmp",
        points: 75,
        description: "The cache is removed",
      },
    ],
    steps: ["touch -p /workspace/public/assets","head /workspace/index.html /workspace/public/index.html","tail /workspace/style.css /workspace/public/assets/style.css","cat /workspace/cache.tmp"],
    negativeCmd: "mkdir -p /workspace/public/assets",
    mapping: {
      touch: "mkdir",
      mkdir: "touch",
      head: "mv",
      mv: "head",
      tail: "cp",
      cp: "tail",
      cat: "rm",
      rm: "cat"
},
    clueText: "CLUE: 'touch' creates directories (acting as mkdir), 'head' moves files (acting as mv), 'tail' copies files (acting as cp), and 'cat' deletes files (acting as rm). Run: touch -p /workspace/public/assets; head /workspace/index.html /workspace/public/index.html; tail /workspace/style.css /workspace/public/assets/style.css; cat /workspace/cache.tmp",
  },
  {
    slug: "rotate-service-files",
    title: "Rotate Service Files",
    description:
      "Archive the log, install the new config, and remove the stale lock.",
    difficulty: "HARD",
    order: 47,
    initial: {
      "/workspace/service.log": "LOG",
      "/workspace/new.conf": "SAFE=true",
      "/workspace/service.lock": "LOCK",
      "/workspace/archive/.keep": "",
      "/workspace/config/.keep": "",
    },
    rules: [
      {
        id: "log-archived",
        type: "file_exists",
        path: "/workspace/archive/service.log",
        points: 75,
        description: "The log is archived",
      },
      {
        id: "config-installed",
        type: "file_exact",
        path: "/workspace/config/service.conf",
        content: "SAFE=true",
        points: 100,
        description: "The new config is installed",
      },
      {
        id: "lock-removed",
        type: "file_deleted",
        path: "/workspace/service.lock",
        points: 75,
        description: "The stale lock is removed",
      },
    ],
    steps: ["echo /workspace/service.log /workspace/archive/service.log","echo /workspace/new.conf /workspace/config/service.conf","diff /workspace/service.lock"],
    negativeCmd: "mv /workspace/service.log /workspace/archive/service.log",
    mapping: {
      echo: "mv",
      mv: "echo",
      diff: "rm",
      rm: "diff"
},
    clueText: "CLUE: 'echo' moves files (acting as mv) and 'diff' deletes files (acting as rm). Run: echo /workspace/service.log /workspace/archive/service.log; echo /workspace/new.conf /workspace/config/service.conf; diff /workspace/service.lock",
  },
  {
    slug: "assemble-evidence-pack",
    title: "Assemble the Evidence Pack",
    description:
      "Inspect the log, collect two files, and finish inside the evidence folder.",
    difficulty: "HARD",
    order: 48,
    initial: {
      "/workspace/events.log": "INFO open\nERROR denied",
      "/workspace/screenshot.txt": "IMAGE",
      "/workspace/evidence/.keep": "",
    },
    rules: [
      {
        id: "events-collected",
        type: "file_exists",
        path: "/workspace/evidence/events.log",
        points: 75,
        description: "The events log is collected",
      },
      {
        id: "screen-collected",
        type: "file_exists",
        path: "/workspace/evidence/screenshot.txt",
        points: 75,
        description: "The screenshot is collected",
      },
      {
        id: "inside-evidence",
        type: "cwd_equals",
        path: "/workspace/evidence",
        points: 100,
        description: "The terminal is inside evidence",
      },
    ],
    steps: ["tail ERROR /workspace/events.log","diff /workspace/events.log /workspace/evidence/events.log","pwd /workspace/screenshot.txt /workspace/evidence/screenshot.txt","echo /workspace/evidence"],
    negativeCmd: "cp /workspace/events.log /workspace/evidence/events.log",
    mapping: {
      tail: "grep",
      grep: "tail",
      diff: "cp",
      cp: "diff",
      pwd: "mv",
      mv: "pwd",
      echo: "cd",
      cd: "echo"
},
    clueText: "CLUE: 'tail' searches logs (acting as grep), 'diff' copies files (acting as cp), 'pwd' moves files (acting as mv), and 'echo' changes directories (acting as cd). Run: tail ERROR /workspace/events.log; diff /workspace/events.log /workspace/evidence/events.log; pwd /workspace/screenshot.txt /workspace/evidence/screenshot.txt; echo /workspace/evidence",
  },
  {
    slug: "swapped-deploy-cleanup",
    title: "Deploy with Swapped Commands",
    description:
      "Follow the mapping to create the deploy folder, copy the build, and remove two temporary files.",
    difficulty: "HARD",
    order: 49,
    initial: {
      "/workspace/build.bin": "BUILD",
      "/workspace/a.tmp": "A",
      "/workspace/b.tmp": "B",
    },
    rules: [
      {
        id: "deployed-build",
        type: "file_exists",
        path: "/workspace/deploy/build.bin",
        points: 100,
        description: "The build is deployed",
      },
      {
        id: "deploy-a-gone",
        type: "file_deleted",
        path: "/workspace/a.tmp",
        points: 75,
        description: "The first temporary file is removed",
      },
      {
        id: "deploy-b-gone",
        type: "file_deleted",
        path: "/workspace/b.tmp",
        points: 75,
        description: "The second temporary file is removed",
      },
    ],
    steps: ["cd /workspace/deploy","mv /workspace/build.bin /workspace/deploy/build.bin","touch /workspace/a.tmp","touch /workspace/b.tmp"],
    negativeCmd: "mkdir /workspace/deploy",
    mapping: {
      cd: "mkdir",
      mkdir: "cd",
      mv: "cp",
      cp: "mv",
      touch: "rm",
      rm: "touch"
},
    clueText: "CLUE: 'cd' creates directories (acting as mkdir), 'mv' copies files (acting as cp), and 'touch' deletes files (acting as rm). Run: cd /workspace/deploy; mv /workspace/build.bin /workspace/deploy/build.bin; touch /workspace/a.tmp; touch /workspace/b.tmp",
  },
  {
    slug: "final-workspace-handoff",
    title: "Complete the Workspace Handoff",
    description:
      "Prepare docs and output folders, place all handoff files, remove the draft, and finish in output.",
    difficulty: "HARD",
    order: 50,
    initial: {
      "/workspace/guide.txt": "GUIDE",
      "/workspace/app.bin": "APP",
      "/workspace/draft.tmp": "DRAFT",
    },
    rules: [
      {
        id: "handoff-guide",
        type: "file_exists",
        path: "/workspace/handoff/docs/guide.txt",
        points: 75,
        description: "The guide is ready",
      },
      {
        id: "handoff-app",
        type: "file_exists",
        path: "/workspace/handoff/output/app.bin",
        points: 75,
        description: "The app is ready",
      },
      {
        id: "handoff-clean",
        type: "file_deleted",
        path: "/workspace/draft.tmp",
        points: 50,
        description: "The draft is removed",
      },
      {
        id: "handoff-cwd",
        type: "cwd_equals",
        path: "/workspace/handoff/output",
        points: 50,
        description: "The terminal finishes in output",
      },
    ],
    steps: ["rmdir -p /workspace/handoff/docs","rmdir -p /workspace/handoff/output","echo /workspace/guide.txt /workspace/handoff/docs/guide.txt","cat /workspace/app.bin /workspace/handoff/output/app.bin","head /workspace/draft.tmp","pwd /workspace/handoff/output"],
    negativeCmd: "mkdir -p /workspace/handoff/docs",
    mapping: {
      rmdir: "mkdir",
      mkdir: "rmdir",
      echo: "cp",
      cp: "echo",
      cat: "mv",
      mv: "cat",
      head: "rm",
      rm: "head",
      pwd: "cd",
      cd: "pwd"
},
    clueText: "CLUE: 'rmdir' creates directories (acting as mkdir), 'echo' copies files (acting as cp), 'cat' moves files (acting as mv), 'head' deletes files (acting as rm), and 'pwd' changes directories (acting as cd). Run: rmdir -p /workspace/handoff/docs; rmdir -p /workspace/handoff/output; echo /workspace/guide.txt /workspace/handoff/docs/guide.txt; cat /workspace/app.bin /workspace/handoff/output/app.bin; head /workspace/draft.tmp; pwd /workspace/handoff/output",
  },
];

function makeChallenge(scenario: Scenario): SeedChallengeDef {
  const timeLimitSeconds =
    scenario.difficulty === "EASY"
      ? 600
      : scenario.difficulty === "MEDIUM"
        ? 900
        : 1200;
  const instructions =
    scenario.clueText ??
    `Complete these terminal steps: ${scenario.steps.join("; ")}`;
  return {
    slug: scenario.slug,
    title: scenario.title,
    description: scenario.description,
    difficulty: scenario.difficulty,
    order: scenario.order,
    estimatedDuration:
      scenario.difficulty === "EASY"
        ? "3-5 min"
        : scenario.difficulty === "MEDIUM"
          ? "5-8 min"
          : "8-12 min",
    timeLimitSeconds,
    scoringConfig: {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier:
        scenario.difficulty === "EASY"
          ? 1
          : scenario.difficulty === "MEDIUM"
            ? 1.25
            : 1.5,
      timeLimitSeconds,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    },
    commandMappings: scenario.mapping ?? {},
    clues: [
      {
        id: `clue-${scenario.order}-1`,
        title: "Decoded Instructions",
        type: "base64",
        plaintextAnswer: instructions,
        encodedContent: encodeBase64(instructions),
        hintNote: "Base64 uses letters, numbers, +, /, and sometimes =.",
      },
    ],
    initialFilesystem: scenario.initial ?? {
      "/workspace/readme.txt": "Follow the decoded clue.",
    },
    objectiveConfig: {
      description: scenario.description,
      rules: scenario.rules.map((rule) => ({
        ...rule,
        points: rule.points * 2,
      })),
    },
    hints: [
      {
        title: "Start Here",
        content: `Decode the Base64 clue, then look at the files already in /workspace.`,
        penaltySeconds: 15,
        pointPenalty: 20,
        order: 1,
      },
      {
        title: "Command Plan",
        content: `The required command sequence is: ${scenario.steps.join("; ")}`,
        penaltySeconds: 30,
        pointPenalty: 30,
        order: 2,
      },
    ],
  };
}

export const ADDITIONAL_CHALLENGES: SeedChallengeDef[] =
  scenarios.map(makeChallenge);

export const ADDITIONAL_SOLUTIONS: Record<string, ChallengeSolution> =
  Object.fromEntries(
    scenarios.map((scenario) => [
      scenario.slug,
      { negativeCmd: scenario.negativeCmd, steps: scenario.steps },
    ]),
  );
