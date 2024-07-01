#!/usr/bin/env bash

 ts-node src/qllm.ts ask "Write a 100-word story about a time traveler" --max-tokens 150  --provider anthropic --profile bedrock --region us-east-1 --model haiku