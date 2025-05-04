import * as core from "@actions/core";
import * as github from "@actions/github";
import fs from "node:fs";
import { downloadVersion, resolveVersion } from "./download/dl-version";
import {
  ignoreEmptyWorkdir,
  version as versionInput,
  githubToken,
} from "./utils/inputs";
import {
  type Architecture,
  getArch,
  getPlatform,
  type Platform,
} from "./utils/platforms";
async function run(): Promise<void> {
  const context = github.context;
  // Log the context and inputs
  core.info(`Running in ${context.repo.owner}/${context.repo.repo}`);
  detectEmptyWorkdir();
  const platform = await getPlatform();
  const arch = getArch();
  try {
    if (platform === undefined) {
      throw new Error(`Unsupported platform: ${process.platform}`);
    }
    if (arch === undefined) {
      throw new Error(`Unsupported architecture: ${process.arch}`);
    }
    const setupResult = await setupRv(platform, arch, githubToken);
    core.addPath(setupResult.rvDir);
    core.info(`Added ${setupResult.rvDir} to the path`);
    core.setOutput("rv-path", setupResult.rvPath);
    core.setOutput("rv-version", setupResult.version);
    core.info(`Successfully installed rv version ${setupResult.version}`);

    // Get the GitHub context
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("Unknown error occurred");
    }
  }
}

async function setupRv(
  platform: Platform,
  arch: Architecture,
  githubToken: string
): Promise<{ rvPath: string; rvDir: string, version: string }> {
  const resolvedVersion = await determineVersion();
  const downloadVersionResult = await downloadVersion(
    platform,
    arch,
    resolvedVersion,
    githubToken
  );

  return {
    rvDir: downloadVersionResult.rvDir,
    rvPath: downloadVersionResult.rvPath,
    version: downloadVersionResult.version.slice(1), // remove the v prefix
  };
}

async function determineVersion(): Promise<string> {
  if (versionInput !== "") {
    return await resolveVersion(versionInput, githubToken);
  }
  return await resolveVersion("latest", githubToken);
}

function detectEmptyWorkdir(): void {
  if (fs.readdirSync(".").length === 0) {
    if (ignoreEmptyWorkdir) {
      core.info(
        "Empty workdir detected. Ignoring because ignore-empty-workdir is enabled"
      );
    } else {
      core.warning(
        "Empty workdir detected. This may cause unexpected behavior. You can enable ignore-empty-workdir to mute this warning."
      );
    }
  }
}

// Run the action
run();
