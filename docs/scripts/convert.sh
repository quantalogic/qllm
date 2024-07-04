#!/usr/bin/env bash
pandoc ./docs/04_ux_article.md --lua-filter ./docs/scripts/mermaid-filter.lua -o ./docs/docx/04_ux_article.docx