# Backup Instructions

To create a backup of the project, run the following command:

```bash
tar --exclude=node_modules --exclude=*.tar.gz --exclude=*.log --exclude=.next --exclude=.git -czf backup-[backup-name].tar.gz .
```

Replace `[backup-name]` with a descriptive name for your backup.

## What's Excluded
- `node_modules` - Dependencies can be restored with `npm install`
- `*.tar.gz` - Previous backup files
- `*.log` - Log files
- `.next` - Next.js build artifacts
- `.git` - Git repository (can be cloned again)

## Usage Example
```bash
tar --exclude=node_modules --exclude=*.tar.gz --exclude=*.log --exclude=.next --exclude=.git -czf backup-initial-setup.tar.gz .
```