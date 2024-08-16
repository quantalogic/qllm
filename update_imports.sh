#!/bin/bash

function update_imports() {
    find . -type f \( -name "*.ts" -o -name "*.js" \) | while read file; do
        # Convert camelCase to snake_case in import statements
        sed -i 's/from "\(.*\/\)\([a-zA-Z]*\)\([A-Z][a-zA-Z]*\)/from "\1\2_\L\3/g' "$file"
        sed -i 's/from "\.\([a-zA-Z]*\)\([A-Z][a-zA-Z]*\)/from ".\1_\L\2/g' "$file"
        
        # Convert kebab-case to snake_case in import statements
        sed -i 's/from "\(.*\/\)\([a-z-]*\)/from "\1\L\2/g; s/-/_/g' "$file"
        
        echo "Updated imports in: $file"
    done
}

cd packages/qllm-cli
update_imports

cd ../qllm-core
update_imports