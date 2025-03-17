#!/usr/bin/env node

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local first, then fall back to .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

/**
 * Script for importing markdown files from a local Git repository in development mode
 *
 * Usage:
 * npm run import-local-git [localGitPath] [branch] [wikiSubdir]
 *
 * Example:
 * npm run import-local-git /path/to/local/git/repo main wiki
 *
 * If no arguments are provided, the script will use the LOCAL_GIT_PATH, GIT_BRANCH, and WIKI_DIRECTORY environment variables.
 */

import fetch from "node-fetch";

async function importLocalGit() {
  try {
    // Get command line arguments or use defaults
    const args = process.argv.slice(2);
    const localGitPath = args[0] || process.env.LOCAL_GIT_PATH;
    const localGitBranch = args[1] || process.env.GIT_BRANCH || "main";
    const wikiSubdir = args[2] || process.env.WIKI_DIRECTORY || "";

    console.log("localGitPath", localGitPath);
    console.log("localGitBranch", localGitBranch);
    console.log("wikiSubdir", wikiSubdir);

    if (!localGitPath) {
      console.error(
        "Error: Local Git path is required. Provide it as an argument or set LOCAL_GIT_PATH environment variable."
      );
      process.exit(1);
    }

    console.log(
      `Importing from local Git repository with the following parameters:`
    );
    console.log(`- Local Git Path: ${localGitPath}`);
    console.log(`- Branch: ${localGitBranch}`);
    console.log(`- Wiki Subdirectory: ${wikiSubdir || "(root)"}`);
    console.log("\nSending request to API...");

    // Send request to the API
    const response = await fetch("http://localhost:3000/api/db/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "local-git",
        localGitPath,
        localGitBranch,
        wikiSubdir,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("\n✅ Import successful!");
      console.log(`Articles imported: ${result.stats.articlesImported}`);
      console.log(`Relations created: ${result.stats.relationsCreated}`);
    } else {
      console.error("\n❌ Import failed!");
      console.error(`Error: ${result.error}`);
      console.error(`Details: ${result.details}`);
    }
  } catch (error) {
    console.error("\n❌ Error executing script:");
    console.error(error);
  }
}

importLocalGit();
