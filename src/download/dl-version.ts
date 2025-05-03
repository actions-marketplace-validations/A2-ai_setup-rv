import * as core from "@actions/core";
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { OWNER, REPO, TOOL_CACHE_NAME } from "../utils/constants";
import type { Architecture, Platform } from "../utils/platforms";
import * as tc from "@actions/tool-cache";
import * as github from "@actions/github";

export async function downloadVersion(
  platform: Platform,
  arch: Architecture,
  version: string,
  githubToken: string
): Promise<{ version: string; rvDir: string, rvPath: string }> {
  const resolvedVersion = await resolveVersion(version, githubToken);
  const artifact = `rv-${resolvedVersion}-${arch}-${platform}`;
  let extension = ".tar.gz";
  if (platform === "pc-windows-msvc") {
    extension = ".zip";
  }
  const downloadUrl = `https://github.com/${OWNER}/${REPO}/releases/download/${resolvedVersion}/${artifact}${extension}`;
  core.info(`Downloading rv from "${downloadUrl}"`);
  const downloadPath = await tc.downloadTool(
    downloadUrl,
    undefined,
    githubToken
  );
  core.info(`Downloaded to ${downloadPath}`);
  // await validateChecksum(
  //   checkSum,
  //   downloadPath,
  //   arch,
  //   platform,
  //   resolvedVersion,
  // );
  let rvPath: string;
  if (platform === "pc-windows-msvc") {
    const fullPathWithExtension = `${downloadPath}${extension}`;
    await fs.copyFile(downloadPath, fullPathWithExtension);
    rvPath = await tc.extractZip(fullPathWithExtension);
    // On windows extracting the zip does not create an intermediate directory
  } else {
    core.info(
      `Extracting ${downloadPath}`
    )
    const extractedDir = await tc.extractTar(downloadPath);
    rvPath = path.join(extractedDir, "rv");
  }
  core.debug(`Extracted to ${rvPath}`);
//   const cachedToolDir = await tc.cacheDir(
//     rvDir,
//     TOOL_CACHE_NAME,
//     resolvedVersion,
//     arch
//   );
  return { version: resolvedVersion, rvDir: path.dirname(rvPath), rvPath: rvPath };
}

export async function resolveVersion(
  versionInput: string,
  githubToken: string
): Promise<string> {
  core.debug(`Resolving version: ${versionInput}`);
  const version =
    versionInput === "latest"
      ? await getLatestVersion(githubToken)
      : versionInput;
  if (tc.isExplicitVersion(version)) {
    core.debug(`Version ${version} is an explicit version.`);
    // add a v prefix to the version
    if (!version.startsWith("v")) {
      core.debug(`Adding v prefix to version ${version}`);
      return `v${version}`;
    }
    return version;
  }
  const availableVersions = await getAvailableVersions(githubToken);
  core.debug(`Available versions: ${availableVersions}`);
  const resolvedVersion = maxSatisfying(availableVersions, version);
  if (resolvedVersion === undefined) {
    throw new Error(`No version found for ${version}`);
  }
  return resolvedVersion;
}

async function getAvailableVersions(githubToken: string): Promise<string[]> {
  try {
    const octokit = github.getOctokit(githubToken);
    return await getReleaseTagNames(octokit);
  } catch (err) {
    if ((err as Error).message.includes("Bad credentials")) {
      core.error("No (valid) GitHub token provided");
    }
    throw err;
  }
}

async function getReleaseTagNames(
  octokit: ReturnType<typeof github.getOctokit>
): Promise<string[]> {
  const response = await octokit.paginate(octokit.rest.repos.listReleases, {
    owner: OWNER,
    repo: REPO,
  });
  return response.map((release) => release.tag_name);
}

async function getLatestVersion(githubToken: string): Promise<string> {
  core.debug("Getting latest version...");
  const octokit = github.getOctokit(githubToken);

  let latestRelease: { tag_name: string } | undefined;
  try {
    latestRelease = await getLatestRelease(octokit);
  } catch (err) {
    if (err instanceof Error) {
      core.debug(err.message);
    }
    throw new Error("Could not determine latest release.");
  }
  core.debug(`Latest version: ${latestRelease.tag_name}`);
  return latestRelease.tag_name;
}

async function getLatestRelease(octokit: ReturnType<typeof github.getOctokit>) {
  const { data: latestRelease } = await octokit.rest.repos.getLatestRelease({
    owner: OWNER,
    repo: REPO,
  });
  return latestRelease;
}

function maxSatisfying(
  versions: string[],
  version: string
): string | undefined {
  const maxSemver = tc.evaluateVersions(versions, version);
  if (maxSemver !== "") {
    core.debug(`Found a version that satisfies the semver range: ${maxSemver}`);
    return maxSemver;
  }
  return undefined;
}
