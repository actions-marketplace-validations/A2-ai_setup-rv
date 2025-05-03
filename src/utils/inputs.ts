import * as core from "@actions/core";
import path from "node:path";


export const version = core.getInput("version");
export const ignoreEmptyWorkdir =
  core.getInput("ignore-empty-workdir") === "true";
export const githubToken = core.getInput("github-token");
// helper functions were copied/adapted from
// https://github.com/astral-sh/setup-uv/blob/main/src/utils/inputs.ts
function expandTilde(input: string): string {
  if (input.startsWith("~")) {
    return `${process.env.HOME}${input.substring(1)}`;
  }
  return input;
}
