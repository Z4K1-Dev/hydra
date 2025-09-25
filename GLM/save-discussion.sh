#!/bin/bash

# GLM Discussion Saver Script
# Usage: ./save-discussion.sh <discussion-name> [content]

set -e

DISCUSSION_NAME="$1"
CONTENT="$2"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DISCUSSION_DIR="discussions"
DISCUSSION_FILE="${DISCUSSION_DIR}/${DISCUSSION_NAME}.json"

# Create discussions directory if it doesn't exist
mkdir -p "$DISCUSSION_DIR"

# Check if discussion name is provided
if [ -z "$DISCUSSION_NAME" ]; then
    echo "❌ Error: Discussion name is required"
    echo "Usage: ./save-discussion.sh <discussion-name> [content]"
    echo "Example: ./save-discussion.sh hydra-architecture"
    echo "Example: ./save-discussion.sh hydra-architecture 'New discussion content'"
    exit 1
fi

# Load existing discussion or create new one
if [ -f "$DISCUSSION_FILE" ]; then
    EXISTING_DATA=$(cat "$DISCUSSION_FILE")
else
    EXISTING_DATA='{"messages": [], "metadata": {"created": "'"$TIMESTAMP"'", "name": "'"$DISCUSSION_NAME"'", "tags": []}}'
fi

# If content is provided via argument, use it. Otherwise, read from stdin
if [ -n "$CONTENT" ]; then
    MESSAGE_CONTENT="$CONTENT"
else
    echo "📝 Enter your message (press Ctrl+D when done):"
    MESSAGE_CONTENT=$(cat)
fi

# Create new message entry
NEW_MESSAGE='{
    "role": "user",
    "content": "'"$MESSAGE_CONTENT"'",
    "timestamp": "'"$TIMESTAMP"'",
    "id": "'$(date +%s)'"
}'

# Add message to discussion
UPDATED_DATA=$(echo "$EXISTING_DATA" | jq --argjson new_msg "$NEW_MESSAGE" '.messages += [$new_msg] | .metadata.updated = "'"$TIMESTAMP"'"')

# Save updated discussion
echo "$UPDATED_DATA" > "$DISCUSSION_FILE"

echo "✅ Discussion saved: $DISCUSSION_NAME"
echo "📁 File: $DISCUSSION_FILE"
echo "📊 Messages: $(echo "$UPDATED_DATA" | jq '.messages | length')"
echo "⏰ Time: $TIMESTAMP"

# Show preview
echo ""
echo "📋 Preview:"
echo "$UPDATED_DATA" | jq -r '.messages[-1].content' | head -3
echo "..."