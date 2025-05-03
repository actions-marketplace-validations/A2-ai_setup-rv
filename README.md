# setup-rv

Set up your GitHub Actions workflow with a specific version of [rv](https://github.com/a2-ai/rv).

- Install a version of rv and add it to PATH
- Use the latest version or specify a particular version
- Support for various platforms and architectures

## Contents

- [setup-rv](#setup-rv)
  - [Contents](#contents)
  - [Usage](#usage)
    - [Install the latest version (default)](#install-the-latest-version-default)
    - [Install a specific version](#install-a-specific-version)
    - [Working directory](#working-directory)
    - [GitHub authentication token](#github-authentication-token)
  - [Outputs](#outputs)
  - [How it works](#how-it-works)
  - [FAQ](#faq)
    - [What is the default version?](#what-is-the-default-version)
    - [Do I have to run `actions/checkout` before or after `setup-rv`?](#do-i-have-to-run-actionscheckout-before-or-after-setup-rv)

## Usage

### Install the latest version (default)

```yaml
- name: Install the latest version of rv
  uses: a2-ai/setup-rv@v1
```

If you do not specify a version, this action will install the latest version.

### Install a specific version

```yaml
- name: Install a specific version of rv
  uses: a2-ai/setup-rv@v1
  with:
    version: "0.4.1"
```

### Working directory

You can set the working directory with the `working-directory` input:

```yaml
- name: Install rv
  uses: a2-ai/setup-rv@v1
  with:
    working-directory: my/subproject/dir
```

### GitHub authentication token

This action uses the GitHub API to fetch the rv release artifacts. To avoid hitting the GitHub API
rate limit too quickly, an authentication token can be provided via the `github-token` input. By
default, the `GITHUB_TOKEN` secret is used, which is automatically provided by GitHub Actions.

```yaml
- name: Install the latest version of rv with a custom GitHub token
  uses: a2-ai/setup-rv@v1
  with:
    github-token: ${{ secrets.CUSTOM_GITHUB_TOKEN }}
```

## Outputs

This action provides the following outputs:

- `rv-version`: The version of rv that was installed
- `rv-path`: The path to the installed rv binary

Example usage of outputs:

```yaml
- name: Install the latest version of rv
  id: setup-rv
  uses: a2-ai/setup-rv@v1

- name: Print rv version
  run: echo "Installed rv version is ${{ steps.setup-rv.outputs.rv-version }}"
```

## How it works

This action downloads rv from the rv repo's official
[GitHub Releases](https://github.com/a2-ai/rv) and adds it to the PATH,
enabling later steps to invoke it by name (`rv`).

## FAQ

### What is the default version?

By default, this action installs the latest version of rv.

If you require the installed version in subsequent steps of your workflow, use the `rv-version`
output:

```yaml
- name: Install the default version of rv
  id: setup-rv
  uses: a2-ai/setup-rv@v1
- name: Print the installed version
  run: echo "Installed rv version is ${{ steps.setup-rv.outputs.rv-version }}"
```

### Do I have to run `actions/checkout` before or after `setup-rv`?

Some workflows need rv but do not need to access the repository content.

But **if** you need to access the repository content, you have run `actions/checkout` before running `setup-rv`.
Running `actions/checkout` after `setup-rv` **is not supported**.
