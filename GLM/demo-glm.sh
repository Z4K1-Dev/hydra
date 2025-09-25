#!/bin/bash

# GLM Demo Script - Demonstrasi penggunaan script-script GLM
# Usage: ./demo-glm.sh

echo "🚀 GLM Discussion Management Demo"
echo "================================="
echo ""

# Cek dependencies
echo "🔍 Checking dependencies..."
if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is not installed. Please install jq first."
    echo "   Ubuntu/Debian: sudo apt-get install jq"
    echo "   macOS: brew install jq"
    exit 1
fi
echo "✅ jq is installed"
echo ""

# Demo 1: Save Discussion
echo "📝 Demo 1: Saving Discussion"
echo "--------------------------"
echo "Creating a new discussion about 'hydra-architecture'..."
./save-discussion.sh hydra-architecture "Designing microservices architecture using Hydra framework"
echo ""

# Demo 2: Load Discussion
echo "📖 Demo 2: Loading Discussion"
echo "---------------------------"
echo "Loading the discussion we just created..."
./load-discussion.sh hydra-architecture --last 1
echo ""

# Demo 3: Context Manager
echo "🔧 Demo 3: Context Management"
echo "----------------------------"
echo "Creating new context..."
./context-manager.sh create
echo ""

echo "Adding system prompt..."
./context-manager.sh add "System: You are a senior technical architect specializing in microservices."
echo ""

echo "Adding background context..."
./context-manager.sh add "Context: We are building a microservices architecture using Hydra framework."
echo ""

echo "Adding user question..."
./context-manager.sh add "Question: What are the key benefits of using Hydra for microservices?"
echo ""

echo "Showing current context..."
./context-manager.sh show | head -20
echo ""

# Demo 4: Context Compression
echo "🗜️  Demo 4: Context Compression"
echo "-----------------------------"
echo "Adding more messages to demonstrate compression..."
for i in {1..5}; do
    ./context-manager.sh add "Additional message $i: This is a longer message to demonstrate context compression when the context becomes too large."
done

echo "Compressing context..."
./context-manager.sh compress
echo ""

# Demo 5: Export
echo "📤 Demo 5: Export Options"
echo "------------------------"
echo "Exporting context to markdown..."
./context-manager.sh export md
echo ""

# Demo 6: Statistics
echo "📊 Demo 6: Statistics"
echo "---------------------"
echo "Showing context statistics..."
./context-manager.sh stats
echo ""

echo "Showing discussion statistics..."
./load-discussion.sh hydra-architecture --stats
echo ""

# Demo 7: List Available
echo "📋 Demo 7: Listing Available"
echo "---------------------------"
echo "Listing available contexts..."
./context-manager.sh list
echo ""

echo "Listing discussions..."
ls -la discussions/ 2>/dev/null || echo "No discussions found"
echo ""

# Cleanup
echo "🧹 Demo 8: Cleanup"
echo "-------------------"
echo "Cleaning up demo files..."
rm -f context/current-context.json
rm -f discussions/hydra-architecture.json
rm -f context-export-*.md
rm -f context-export-*.json
rm -f context-export-*.txt
echo "✅ Demo files cleaned up"
echo ""

echo "🎉 Demo completed successfully!"
echo ""
echo "📚 Next steps:"
echo "1. Read the full documentation: SCRIPT_DOCUMENTATION.md"
echo "2. Check out the templates: DISCUSSION_TEMPLATES.md"
echo "3. Try the scripts with your own discussions"
echo "4. Integrate with your workflow"
echo ""
echo "🔧 Available scripts:"
echo "- save-discussion.sh    - Save discussions to JSON"
echo "- load-discussion.sh    - Load and view discussions"
echo "- context-manager.sh    - Manage conversation context"
echo ""
echo "📁 Created directories:"
echo "- discussions/          - Discussion files"
echo "- context/             - Context files"
echo ""
echo "Happy discussing! 🎯"