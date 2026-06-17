#!/bin/bash
# Populates .reference with local read-only implementation checkouts.

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
REFERENCE_DIR="$ROOT_DIR/.reference"

mkdir -p "$REFERENCE_DIR"

repos=(
  "drizzle https://github.com/drizzle-team/drizzle-orm.git beta"
  "drizzle-zero https://github.com/rocicorp/drizzle-zero.git beta"
  "zero https://github.com/rocicorp/mono.git"
  "zero-docs https://github.com/rocicorp/zero-docs.git"
  "devcontainer-templates https://github.com/rocicorp/devcontainer-templates.git"
  "devcontainer-features https://github.com/rocicorp/devcontainer-features.git"
  "effect-smol https://github.com/Effect-TS/effect-smol.git"
  "better-auth https://github.com/better-auth/better-auth.git"
  "router https://github.com/TanStack/router.git"
  "circle https://github.com/ln-dev7/circle.git"
)

for repo in "${repos[@]}"; do
  read -r name url branch <<< "$repo"
  target="$REFERENCE_DIR/$name"

  if [ ! -e "$target" ]; then
    echo "Cloning $name"
    if [ -n "${branch:-}" ]; then
      git clone --depth 1 --branch "$branch" "$url" "$target"
    else
      git clone --depth 1 "$url" "$target"
    fi
    continue
  fi

  if [ ! -d "$target/.git" ]; then
    echo "Skipping $name: $target exists but is not a git checkout" >&2
    continue
  fi

  echo "Updating $name"
  if [ -n "$(git -C "$target" status --porcelain)" ]; then
    echo "Skipping $name: checkout has local changes" >&2
    continue
  fi

  if [ -n "${branch:-}" ]; then
    git -C "$target" fetch --depth 1 origin "$branch"
    git -C "$target" switch "$branch"
    git -C "$target" reset --hard "origin/$branch"
  else
    branch="$(git -C "$target" branch --show-current)"

    if [ -z "$branch" ]; then
      echo "Skipping $name: checkout is not on a branch" >&2
      continue
    fi

    git -C "$target" fetch --depth 1 origin "$branch"
    git -C "$target" reset --hard "origin/$branch"
  fi
done

echo "Reference repositories are ready in $REFERENCE_DIR"
