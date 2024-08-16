#!/bin/bash

function rename_to_snake_case() {
    find . -type f \( -name "*.ts" -o -name "*.js" \) | while read file; do
        directory=$(dirname "$file")
        filename=$(basename "$file")
        extension="${filename##*.}"
        filename="${filename%.*}"
        
        # Convert to snake_case
        new_filename=$(echo "$filename" | sed -r 's/([a-z0-9])([A-Z])/\1_\L\2/g; s/-/_/g' | tr '[:upper:]' '[:lower:]')
        
        if [ "$filename" != "$new_filename" ]; then
            mv "$file" "$directory/${new_filename}.${extension}"
            echo "Renamed: $file -> $directory/${new_filename}.${extension}"
        fi
    done
}

cd packages/qllm-cli
rename_to_snake_case

cd ../qllm-lib
rename_to_snake_case