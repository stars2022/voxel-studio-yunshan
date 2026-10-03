#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
project_dir="${VOXEL_PROJECT_DIR:-$PWD/projects}"
mkdir -p "$project_dir"
# Restore the captured document and undo history only on the first start.
# Never replace a later cloud autosave or recovery file.
if [[ ! -e "$project_dir/autosave.ysvox.json" && ! -e "$project_dir/recovery.ysvox.json" && -f projects/cloud-resume.ysvox.json ]]; then
  cp projects/cloud-resume.ysvox.json "$project_dir/autosave.ysvox.json"
fi
exec npm start
