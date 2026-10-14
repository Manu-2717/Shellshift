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
    steps: ["mkdir /workspace/welcome"],
    negativeCmd: "touch /workspace/welcome",
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
    steps: ["touch /workspace/checklist.txt"],
    negativeCmd: "mkdir /workspace/checklist.txt",
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
    steps: ["rm /workspace/old-note.txt"],
    negativeCmd: "cat /workspace/old-note.txt",
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
    steps: ["cp /workspace/readme.txt /workspace/backup/readme.txt"],
    negativeCmd: "cat /workspace/readme.txt",
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
    steps: ["mv /workspace/draft.txt /workspace/ready/draft.txt"],
    negativeCmd: "cp /workspace/draft.txt /workspace/ready/draft.txt",
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
    steps: ["cd /workspace/docs"],
    negativeCmd: "ls /workspace/docs",
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
    steps: ["cp /workspace/message.txt /workspace/answer.txt"],
    negativeCmd: "touch /workspace/answer.txt",
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
    steps: ["rm /workspace/unused/.keep", "rmdir /workspace/unused"],
    negativeCmd: "ls /workspace/unused",
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
    steps: ["cp /workspace/team.txt /workspace/shared/team.txt"],
    negativeCmd: "cat /workspace/team.txt",
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
    steps: ["mkdir -p /workspace/notes/daily"],
    negativeCmd: "mkdir /workspace/daily",
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
    steps: ["pwd /workspace/ready.txt"],
    negativeCmd: "touch /workspace/ready.txt",
    mapping: { pwd: "touch", touch: "pwd" },
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
    steps: ["mkdir /workspace/warmup", "cd /workspace/warmup"],
    negativeCmd: "touch /workspace/warmup",
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
    steps: [
      "mkdir /workspace/release",
      "cp /workspace/notes.txt /workspace/release/notes.txt",
    ],
    negativeCmd: "mkdir /workspace/release",
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
    steps: [
      "cp /workspace/one.txt /workspace/archive/one.txt",
      "cp /workspace/two.txt /workspace/archive/two.txt",
    ],
    negativeCmd: "cp /workspace/one.txt /workspace/archive/one.txt",
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
    steps: [
      "mv /workspace/new.conf /workspace/config/app.conf",
      "rm /workspace/config/old.conf",
    ],
    negativeCmd: "cp /workspace/new.conf /workspace/config/app.conf",
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
    steps: [
      "grep ERROR /workspace/app.log",
      "cp /workspace/app.log /workspace/review/app.log",
    ],
    negativeCmd: "cp /workspace/app.log /workspace/review/app.log",
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
    steps: [
      "mv /workspace/app.js /workspace/src/app.js",
      "mv /workspace/logo.png /workspace/images/logo.png",
    ],
    negativeCmd: "mv /workspace/app.js /workspace/src/app.js",
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
    steps: [
      "mkdir -p /workspace/backups/today",
      "cp /workspace/db.sqlite /workspace/backups/today/db.sqlite",
    ],
    negativeCmd: "mkdir -p /workspace/backups/today",
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
    steps: ["rm /workspace/build/a.tmp", "rm /workspace/build/b.tmp"],
    negativeCmd: "rm /workspace/build/a.tmp",
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
    steps: [
      "mv /workspace/guide.txt /workspace/out/guide.txt",
      "cp /workspace/draft.txt /workspace/out/draft.txt",
    ],
    negativeCmd: "cp /workspace/guide.txt /workspace/out/guide.txt",
    mapping: { cp: "mv", mv: "cp" },
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
    steps: [
      "mkdir /workspace/review",
      "cp /workspace/code.txt /workspace/review/code.txt",
      "cp /workspace/test.txt /workspace/review/test.txt",
    ],
    negativeCmd: "mkdir /workspace/review",
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
    steps: [
      "mv /workspace/task.txt /workspace/done/task.txt",
      "cd /workspace/done",
    ],
    negativeCmd: "cp /workspace/task.txt /workspace/done/task.txt",
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
    steps: [
      "cat /workspace/token.txt",
      "cp /workspace/token.txt /workspace/secure/token.txt",
    ],
    negativeCmd: "cp /workspace/token.txt /workspace/secure/token.txt",
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
    steps: [
      "mkdir -p /workspace/release/bin",
      "mkdir -p /workspace/release/docs",
      "cp /workspace/app.bin /workspace/release/bin/app.bin",
      "cp /workspace/help.txt /workspace/release/docs/help.txt",
      "mv /workspace/manifest.json /workspace/release/manifest.json",
    ],
    negativeCmd: "mkdir -p /workspace/release/bin",
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
    steps: [
      "cp /workspace/snapshot.db /workspace/restored/live.db",
      "rm /workspace/live.db",
      "rm /workspace/live.tmp",
    ],
    negativeCmd: "cp /workspace/snapshot.db /workspace/restored/live.db",
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
    steps: [
      "mkdir -p /workspace/public/assets",
      "mv /workspace/index.html /workspace/public/index.html",
      "cp /workspace/style.css /workspace/public/assets/style.css",
      "rm /workspace/cache.tmp",
    ],
    negativeCmd: "mkdir -p /workspace/public/assets",
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
    steps: [
      "mv /workspace/service.log /workspace/archive/service.log",
      "mv /workspace/new.conf /workspace/config/service.conf",
      "rm /workspace/service.lock",
    ],
    negativeCmd: "mv /workspace/service.log /workspace/archive/service.log",
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
    steps: [
      "grep ERROR /workspace/events.log",
      "cp /workspace/events.log /workspace/evidence/events.log",
      "mv /workspace/screenshot.txt /workspace/evidence/screenshot.txt",
      "cd /workspace/evidence",
    ],
    negativeCmd: "cp /workspace/events.log /workspace/evidence/events.log",
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
    steps: [
      "cd /workspace/deploy",
      "mv /workspace/build.bin /workspace/deploy/build.bin",
      "touch /workspace/a.tmp",
      "touch /workspace/b.tmp",
    ],
    negativeCmd: "mkdir /workspace/deploy",
    mapping: {
      cd: "mkdir",
      mkdir: "cd",
      mv: "cp",
      cp: "mv",
      touch: "rm",
      rm: "touch",
    },
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
    steps: [
      "mkdir -p /workspace/handoff/docs",
      "mkdir -p /workspace/handoff/output",
      "cp /workspace/guide.txt /workspace/handoff/docs/guide.txt",
      "mv /workspace/app.bin /workspace/handoff/output/app.bin",
      "rm /workspace/draft.tmp",
      "cd /workspace/handoff/output",
    ],
    negativeCmd: "mkdir -p /workspace/handoff/docs",
  },
];

function makeChallenge(scenario: Scenario): SeedChallengeDef {
  const timeLimitSeconds =
    scenario.difficulty === "EASY"
      ? 600
      : scenario.difficulty === "MEDIUM"
        ? 900
        : 1200;
  let instructions = `Complete these terminal steps: ${scenario.steps.join("; ")}`;
  if (scenario.slug === "swapped-touch") {
    instructions = `CLUE: 'pwd' and 'touch' are swapped: 'pwd' creates files (acting as touch). Run: pwd /workspace/ready.txt`;
  } else if (scenario.slug === "swapped-copy-move") {
    instructions = `CLUE: 'cp' and 'mv' are swapped: 'mv' copies files (acting as cp), while 'cp' moves files (acting as mv). Run: mv /workspace/guide.txt /workspace/out/guide.txt; cp /workspace/draft.txt /workspace/out/draft.txt`;
  } else if (scenario.slug === "swapped-deploy-cleanup") {
    instructions = `CLUE: Swapped commands: 'cd' creates folders (acting as mkdir), 'mv' copies files (acting as cp), and 'touch' deletes files (acting as rm). Run: cd /workspace/deploy; mv /workspace/build.bin /workspace/deploy/build.bin; touch /workspace/a.tmp; touch /workspace/b.tmp`;
  }
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
      rules: scenario.rules,
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
