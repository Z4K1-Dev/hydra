#!/bin/bash

# GLM Context Manager Script
# Usage: ./context-manager.sh <action> [options]

set -e

ACTION="$1"
CONTEXT_DIR="context"
CONTEXT_FILE="${CONTEXT_DIR}/current-context.json"

# Create context directory if it doesn't exist
mkdir -p "$CONTEXT_DIR"

show_help() {
    echo "🔧 GLM Context Manager"
    echo ""
    echo "Usage: ./context-manager.sh <action> [options]"
    echo ""
    echo "Actions:"
    echo "  create          Create new context"
    echo "  load <file>     Load context from file"
    echo "  save <file>     Save context to file"
    echo "  show            Show current context"
    echo "  clear           Clear current context"
    echo "  add <message>   Add message to context"
    echo "  compress        Compress context"
    echo "  export <format> Export context (json|md|txt)"
    echo "  list            List available contexts"
    echo "  stats           Show context statistics"
    echo ""
    echo "Examples:"
    echo "  ./context-manager.sh create"
    echo "  ./context-manager.sh add 'Hello, how are you?'"
    echo "  ./context-manager.sh show"
    echo "  ./context-manager.sh export md"
    echo "  ./context-manager.sh compress"
}

create_context() {
    if [ -f "$CONTEXT_FILE" ]; then
        echo "⚠️  Context file already exists. Use './context-manager.sh clear' to remove it first."
        return 1
    fi
    
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    cat > "$CONTEXT_FILE" << EOF
{
  "metadata": {
    "created": "$TIMESTAMP",
    "updated": "$TIMESTAMP",
    "total_tokens": 0,
    "compressed": false,
    "version": "1.0"
  },
  "messages": [],
  "system_prompt": "You are GLM, a helpful AI assistant. You are knowledgeable, friendly, and professional."
}
EOF
    
    echo "✅ New context created"
    echo "📁 File: $CONTEXT_FILE"
}

load_context() {
    local file="$1"
    if [ -z "$file" ]; then
        echo "❌ Error: File name is required"
        echo "Usage: ./context-manager.sh load <file>"
        return 1
    fi
    
    if [ ! -f "$file" ]; then
        echo "❌ Error: File '$file' not found"
        return 1
    fi
    
    cp "$file" "$CONTEXT_FILE"
    echo "✅ Context loaded from $file"
}

save_context() {
    local file="$1"
    if [ -z "$file" ]; then
        echo "❌ Error: File name is required"
        echo "Usage: ./context-manager.sh save <file>"
        return 1
    fi
    
    if [ ! -f "$CONTEXT_FILE" ]; then
        echo "❌ Error: No context to save"
        return 1
    fi
    
    cp "$CONTEXT_FILE" "$file"
    echo "✅ Context saved to $file"
}

show_context() {
    if [ ! -f "$CONTEXT_FILE" ]; then
        echo "❌ Error: No context found"
        echo "Use './context-manager.sh create' to create a new context"
        return 1
    fi
    
    echo "📋 Current Context:"
    echo "=================="
    
    # Show metadata
    local created=$(jq -r '.metadata.created // "Unknown"' "$CONTEXT_FILE")
    local updated=$(jq -r '.metadata.updated // "Unknown"' "$CONTEXT_FILE")
    local tokens=$(jq -r '.metadata.total_tokens // 0' "$CONTEXT_FILE")
    local compressed=$(jq -r '.metadata.compressed // false' "$CONTEXT_FILE")
    local message_count=$(jq '.messages | length' "$CONTEXT_FILE")
    
    echo "📅 Created: $created"
    echo "🔄 Updated: $updated"
    echo "🔤 Tokens: $tokens"
    echo "🗜️  Compressed: $compressed"
    echo "💬 Messages: $message_count"
    echo ""
    
    # Show system prompt
    echo "🤖 System Prompt:"
    jq -r '.system_prompt // "None"' "$CONTEXT_FILE" | fold -s -w 80
    echo ""
    
    # Show messages
    echo "💬 Messages:"
    jq -r '.messages[] | "📅 \(.timestamp // "Unknown") - 👤 \(.role // "unknown"):\n\(.content)\n"' "$CONTEXT_FILE" | head -50
}

clear_context() {
    if [ -f "$CONTEXT_FILE" ]; then
        rm "$CONTEXT_FILE"
        echo "✅ Context cleared"
    else
        echo "⚠️  No context to clear"
    fi
}

add_message() {
    local message="$1"
    if [ -z "$message" ]; then
        echo "📝 Enter message (press Ctrl+D when done):"
        message=$(cat)
    fi
    
    if [ ! -f "$CONTEXT_FILE" ]; then
        create_context
    fi
    
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    TOKEN_COUNT=$(echo "$message" | wc -c)
    
    # Add message to context
    jq --arg timestamp "$TIMESTAMP" \
       --arg content "$message" \
       --arg role "user" \
       --argjson tokens "$TOKEN_COUNT" \
       '.messages += [{
         "timestamp": $timestamp,
         "content": $content,
         "role": $role,
         "tokens": $tokens
       }] | .metadata.updated = $timestamp | .metadata.total_tokens += $tokens' \
       "$CONTEXT_FILE" > "${CONTEXT_FILE}.tmp"
    
    mv "${CONTEXT_FILE}.tmp" "$CONTEXT_FILE"
    
    echo "✅ Message added to context"
    echo "📅 Time: $TIMESTAMP"
    echo "🔤 Tokens: $TOKEN_COUNT"
}

compress_context() {
    if [ ! -f "$CONTEXT_FILE" ]; then
        echo "❌ Error: No context to compress"
        return 1
    fi
    
    local current_tokens=$(jq -r '.metadata.total_tokens // 0' "$CONTEXT_FILE")
    local message_count=$(jq '.messages | length' "$CONTEXT_FILE")
    
    if [ "$current_tokens" -lt 1000 ]; then
        echo "ℹ️  Context is small ($current_tokens tokens), compression not needed"
        return 0
    fi
    
    echo "🗜️  Compressing context..."
    echo "📊 Current: $message_count messages, $current_tokens tokens"
    
    # Keep last 10 messages and create summary
    jq '
    {
        metadata: .metadata,
        system_prompt: .system_prompt,
        messages: (.messages[-10:] | .[]),
        summary: "Compressed context - original had \($message_count) messages"
    } | .metadata.compressed = true | .metadata.updated = "'$(date '+%Y-%m-%d %H:%M:%S')'"' \
    "$CONTEXT_FILE" > "${CONTEXT_FILE}.tmp"
    
    mv "${CONTEXT_FILE}.tmp" "$CONTEXT_FILE"
    
    local new_tokens=$(jq -r '.metadata.total_tokens // 0' "$CONTEXT_FILE")
    local new_message_count=$(jq '.messages | length' "$CONTEXT_FILE")
    
    echo "✅ Context compressed"
    echo "📊 New: $new_message_count messages, $new_tokens tokens"
    echo "💾 Saved: $((current_tokens - new_tokens)) tokens"
}

export_context() {
    local format="$1"
    if [ -z "$format" ]; then
        format="json"
    fi
    
    if [ ! -f "$CONTEXT_FILE" ]; then
        echo "❌ Error: No context to export"
        return 1
    fi
    
    local output_file="context-export-$(date +%Y%m%d-%H%M%S).$format"
    
    case "$format" in
        json)
            cp "$CONTEXT_FILE" "$output_file"
            ;;
        md)
            echo "# GLM Context Export" > "$output_file"
            echo "" >> "$output_file"
            echo "**Exported:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$output_file"
            echo "**Format:** Markdown" >> "$output_file"
            echo "" >> "$output_file"
            echo "---" >> "$output_file"
            echo "" >> "$output_file"
            
            echo "## System Prompt" >> "$output_file"
            jq -r '.system_prompt // "None"' "$CONTEXT_FILE" >> "$output_file"
            echo "" >> "$output_file"
            
            echo "## Messages" >> "$output_file"
            jq -r '.messages[] | "### \(.timestamp // "Unknown") - \(.role // "unknown")\n\n\(.content)\n"' "$output_file" >> "$output_file"
            ;;
        txt)
            echo "GLM Context Export" > "$output_file"
            echo "Exported: $(date '+%Y-%m-%d %H:%M:%S')" >> "$output_file"
            echo "Format: Text" >> "$output_file"
            echo "" >> "$output_file"
            echo "=" | head -c 50 >> "$output_file"
            echo "" >> "$output_file"
            
            echo "System Prompt:" >> "$output_file"
            jq -r '.system_prompt // "None"' "$CONTEXT_FILE" >> "$output_file"
            echo "" >> "$output_file"
            
            echo "Messages:" >> "$output_file"
            jq -r '.messages[] | "\(.timestamp // "Unknown") - \(.role // "unknown"):\n\(.content)\n"' "$OUTPUT_FILE" >> "$output_file"
            ;;
        *)
            echo "❌ Error: Unsupported format '$format'"
            echo "Supported formats: json, md, txt"
            return 1
            ;;
    esac
    
    echo "✅ Context exported to $output_file"
}

list_contexts() {
    echo "📁 Available Contexts:"
    echo "===================="
    
    if [ -f "$CONTEXT_FILE" ]; then
        echo "📄 current-context.json (active)"
    fi
    
    if [ -d "$CONTEXT_DIR" ]; then
        find "$CONTEXT_DIR" -name "*.json" -not -name "current-context.json" | while read -r file; do
            local name=$(basename "$file")
            local size=$(wc -c < "$file")
            echo "📄 $name ($size bytes)"
        done
    fi
}

show_stats() {
    if [ ! -f "$CONTEXT_FILE" ]; then
        echo "❌ Error: No context found"
        return 1
    fi
    
    echo "📊 Context Statistics:"
    echo "====================="
    
    local created=$(jq -r '.metadata.created // "Unknown"' "$CONTEXT_FILE")
    local updated=$(jq -r '.metadata.updated // "Unknown"' "$CONTEXT_FILE")
    local tokens=$(jq -r '.metadata.total_tokens // 0' "$CONTEXT_FILE")
    local compressed=$(jq -r '.metadata.compressed // false' "$CONTEXT_FILE")
    local message_count=$(jq '.messages | length' "$CONTEXT_FILE")
    local user_messages=$(jq '[.messages[] | select(.role == "user")] | length' "$CONTEXT_FILE")
    local assistant_messages=$(jq '[.messages[] | select(.role == "assistant")] | length' "$CONTEXT_FILE")
    
    echo "📅 Created: $created"
    echo "🔄 Updated: $updated"
    echo "🔤 Total Tokens: $tokens"
    echo "🗜️  Compressed: $compressed"
    echo "💬 Total Messages: $message_count"
    echo "👤 User Messages: $user_messages"
    echo "🤖 Assistant Messages: $assistant_messages"
    echo ""
    
    if [ "$message_count" -gt 0 ]; then
        echo "📈 Average tokens per message: $((tokens / message_count))"
    fi
    
    if [ "$compressed" = "true" ]; then
        echo "💾 Context is compressed"
    fi
}

# Main logic
case "$ACTION" in
    create)
        create_context
        ;;
    load)
        load_context "$2"
        ;;
    save)
        save_context "$2"
        ;;
    show)
        show_context
        ;;
    clear)
        clear_context
        ;;
    add)
        add_message "$2"
        ;;
    compress)
        compress_context
        ;;
    export)
        export_context "$2"
        ;;
    list)
        list_contexts
        ;;
    stats)
        show_stats
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Error: Unknown action '$ACTION'"
        echo ""
        show_help
        exit 1
        ;;
esac