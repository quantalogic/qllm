#!/bin/bash

# Set your AWS region
AWS_REGION="us-east-1"

# Set the model ID for Claude 3 Sonnet
MODEL_ID="anthropic.claude-3-haiku-20240307-v1:0"

# Create a JSON payload for the request
PAYLOAD=$(cat <<EOF
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 512,
  "temperature": 0.5,
  "messages": [
    {
      "role": "user",
      "content": "Explain the concept of quantum computing in simple terms."
    }
  ]
}
EOF
)

# Make the API call using AWS CLI
aws bedrock-runtime invoke-model \
  --region $AWS_REGION \
  --model-id $MODEL_ID \
  --body "$(echo -n "$PAYLOAD" | base64)" \
  --content-type "application/json" \
  --profile bedrock \
  output.json