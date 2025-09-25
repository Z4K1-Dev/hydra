#!/bin/bash

# GLM Discussion Loader Script
# Usage: ./load-discussion.sh <discussion-name> [options]

set -e

DISCUSSION_NAME="$1"
DISCUSSION_DIR="discussions"
DISCUSSION_FILE="${DISCUSSION_DIR}/${DISCUSSION_NAME}.json"

# Check if discussion name is provided
if [ -z "$DISCUSSION_NAME" ]; then
    echo "❌ Error: Discussion name is required"
    echo "Usage: ./load-discussion.sh <discussion-name> [options]"
    echo "Options:"
    echo "  --full        Show full discussion"
    echo "  --summary     Show summary only"
    echo "  --last N      Show last N messages"
    echo "  --export      Export to markdown"
    echo "  --stats       Show statistics"
    echo ""
    echo "Example: ./load-discussion.sh hydra-architecture"
    echo "Example: ./load-discussion.sh hydra-architecture --last 5"
    exit 1
fi

# Check if discussion file exists
if [ ! -f "$DISCUSSION_FILE" ]; then
    echo "❌ Error: Discussion '$DISCUSSION_NAME' not found"
    echo "Available discussions:"
    if [ -d "$DISCUSSION_DIR" ]; then
        ls -1 "$DISCUSSION_DIR"/*.json 2>/dev/null | sed 's/.*\//  - /' | sed 's/\.json$//' || echo "  No discussions found"
    else
        echo "  No discussions found"
    fi
    exit 1
fi

# Load discussion data
DISCUSSION_DATA=$(cat "$DISCUSSION_FILE")

# Parse options
SHOW_FULL=false
SHOW_SUMMARY=false
SHOW_LAST=0
EXPORT_MD=false
SHOW_STATS=false

shift
while [[ $# -gt 0 ]]; do
    case $1 in
        --full)
            SHOW_FULL=true
            shift
            ;;
        --summary)
            SHOW_SUMMARY=true
            shift
            ;;
        --last)
            SHOW_LAST="$2"
            shift 2
            ;;
        --export)
            EXPORT_MD=true
            shift
            ;;
        --stats)
            SHOW_STATS=true
            shift
            ;;
        *)
            echo "❌ Unknown option: $1"
            exit 1
            ;;
    esac
done

# Get discussion metadata
NAME=$(echo "$DISCUSSION_DATA" | jq -r '.metadata.name // "Unknown"')
CREATED=$(echo "$DISCUSSION_DATA" | jq -r '.metadata.created // "Unknown"')
UPDATED=$(echo "$DISCUSSION_DATA" | jq -r '.metadata.updated // "Unknown"')
MESSAGE_COUNT=$(echo "$DISCUSSION_DATA" | jq '.messages | length')

# Show header
echo "📖 Discussion: $NAME"
echo "📅 Created: $CREATED"
echo "🔄 Updated: $UPDATED"
echo "💬 Messages: $MESSAGE_COUNT"
echo ""

# Show statistics if requested
if [ "$SHOW_STATS" = true ]; then
    echo "📊 Statistics:"
    echo "  Total messages: $MESSAGE_COUNT"
    echo "  User messages: $(echo "$DISCUSSION_DATA" | jq '[.messages[] | select(.role == "user")] | length')"
    echo "  Assistant messages: $(echo "$DISCUSSION_DATA" | jq '[.messages[] | select(.role == "assistant")] | length')"
    echo "  System messages: $(echo "$DISCUSSION_DATA" | jq '[.messages[] | select(.role == "system")] | length')"
    echo "  Tags: $(echo "$DISCUSSION_DATA" | jq -r '.metadata.tags | join(", ") // "None"')"
    echo ""
fi

# Export to markdown if requested
if [ "$EXPORT_MD" = true ]; then
    MD_FILE="${DISCUSSION_DIR}/${DISCUSSION_NAME}.md"
    echo "# Discussion: $NAME" > "$MD_FILE"
    echo "" >> "$MD_FILE"
    echo "**Created:** $CREATED  " >> "$MD_FILE"
    echo "**Updated:** $UPDATED  " >> "$MD_FILE"
    echo "**Messages:** $MESSAGE_COUNT  " >> "$MD_FILE"
    echo "" >> "$MD_FILE"
    echo "---" >> "$MD_FILE"
    echo "" >> "$MD_FILE"
    
    echo "$DISCUSSION_DATA" | jq -r '.messages[] | "## \(.timestamp // "Unknown") - \(.role // "unknown")" + "\n\n\(.content)\n\n"' >> "$MD_FILE"
    
    echo "✅ Exported to: $MD_FILE"
    exit 0
fi

# Show summary if requested
if [ "$SHOW_SUMMARY" = true ]; then
    echo "📝 Summary:"
    echo "$DISCUSSION_DATA" | jq -r '.messages[-3:][] | "• \(.timestamp): \(.content | .[0:100])..."'
    exit 0
fi

# Show last N messages if requested
if [ "$SHOW_LAST" -gt 0 ]; then
    echo "💬 Last $SHOW_LAST messages:"
    echo "$DISCUSSION_DATA" | jq -r ".messages[-$SHOW_LAST:][] | \"\n---\n📅 \(.timestamp // 'Unknown')\n👤 \(.role // 'unknown')\n\n\(.content)\""
    exit 0
fi

# Show full discussion by default
if [ "$SHOW_FULL" = true ] || [ "$SHOW_LAST" -eq 0 ]; then
    echo "💬 Full Discussion:"
    echo "$DISCUSSION_DATA" | jq -r '.messages[] | "\n---\n📅 \(.timestamp // "Unknown")\n👤 \(.role // "unknown")\n\n\(.content)"'
fi