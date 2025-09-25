# GLM Discussion Management Scripts

Dokumentasi lengkap untuk script-script manajemen diskusi GLM sementara menunggu CLI resmi selesai.

## 📋 Daftar Script

### 1. `save-discussion.sh` - Menyimpan Diskusi
**Fungsi:** Menyimpan pesan diskusi ke file JSON terstruktur.

**Usage:**
```bash
./save-discussion.sh <nama-diskusi> [konten]
```

**Contoh:**
```bash
# Simpan dengan konten langsung
./save-discussion.sh hydra-architecture "Designing microservices architecture"

# Simpan dengan input interaktif
./save-discussion.sh project-planning
# Kemudian ketik pesan dan tekan Ctrl+D
```

**Features:**
- ✅ Auto-create direktori `discussions/`
- ✅ Format JSON terstruktur
- ✅ Timestamp otomatis
- ✅ Metadata tracking
- ✅ Multiple messages per discussion

### 2. `load-discussion.sh` - Memuat Diskusi
**Fungsi:** Memuat dan menampilkan diskusi yang tersimpan.

**Usage:**
```bash
./load-discussion.sh <nama-diskusi> [opsi]
```

**Opsi:**
- `--full` - Tampilkan diskusi lengkap
- `--summary` - Tampilkan ringkasan saja
- `--last N` - Tampilkan N pesan terakhir
- `--export` - Export ke markdown
- `--stats` - Tampilkan statistik

**Contoh:**
```bash
# Tampilkan diskusi lengkap
./load-discussion.sh hydra-architecture --full

# Tampilkan 5 pesan terakhir
./load-discussion.sh project-planning --last 5

# Export ke markdown
./load-discussion.sh design-review --export

# Lihat statistik
./load-discussion.sh team-meeting --stats
```

**Features:**
- ✅ Multiple view options
- ✅ Export ke markdown
- ✅ Statistik diskusi
- ✅ Preview singkat
- ✅ Error handling

### 3. `context-manager.sh` - Manajemen Konteks
**Fungsi:** Mengelola konteks percakapan untuk AI.

**Usage:**
```bash
./context-manager.sh <aksi> [opsi]
```

**Aksi yang tersedia:**
- `create` - Buat konteks baru
- `load <file>` - Muat konteks dari file
- `save <file>` - Simpan konteks ke file
- `show` - Tampilkan konteks saat ini
- `clear` - Hapus konteks
- `add <pesan>` - Tambah pesan ke konteks
- `compress` - Kompres konteks
- `export <format>` - Export konteks
- `list` - Daftar konteks tersedia
- `stats` - Tampilkan statistik konteks

**Contoh:**
```bash
# Buat konteks baru
./context-manager.sh create

# Tambahkan pesan
./context-manager.sh add "Hello, I need help with microservices"

# Tampilkan konteks
./context-manager.sh show

# Kompres konteks jika terlalu besar
./context-manager.sh compress

# Export ke markdown
./context-manager.sh export md

# Lihat statistik
./context-manager.sh stats
```

**Features:**
- ✅ Context persistence
- ✅ Auto-compression
- ✅ Multiple export formats
- ✅ Token counting
- ✅ Message management

## 🚀 Workflow Penggunaan

### Workflow 1: Diskusi Teknis
```bash
# 1. Buat diskusi baru
./save-discussion.sh microservices-design "Designing microservices for e-commerce"

# 2. Setup context
./context-manager.sh create
./context-manager.sh add "System: You are a senior technical architect."
./context-manager.sh add "Context: Building scalable e-commerce platform."

# 3. Tambahkan pertanyaan
./context-manager.sh add "What are the key considerations for order service design?"

# 4. Simpan context untuk later use
./context-manager.sh save context-microservices.json

# 5. Export dokumentasi
./context-manager.sh export md
```

### Workflow 2: Brainstorming Produk
```bash
# 1. Mulai diskusi brainstorming
./save-discussion.sh product-ideas "Brainstorming new fitness app features"

# 2. Setup creative context
./context-manager.sh create
./context-manager.sh add "System: You are an innovative product designer."
./context-manager.sh add "Context: We want to create unique fitness app features."

# 3. Tambahkan prompt kreatif
./context-manager.sh add "Generate 5 innovative features using AI and IoT."

# 4. Review hasil
./context-manager.sh show

# 5. Simpan dan export
./context-manager.sh save context-product-brainstorm.json
./context-manager.sh export md
```

### Workflow 3: Problem Solving
```bash
# 1. Buat diskusi problem solving
./save-discussion.sh bug-investigation "Investigating memory leak in Node.js app"

# 2. Setup technical context
./context-manager.sh create
./context-manager.sh add "System: You are a senior Node.js developer."
./context-manager.sh add "Context: Memory leak in production Node.js application."

# 3. Tambahkan detail masalah
./context-manager.sh add "Issue: Memory usage increases by 1MB per request."
./context-manager.sh add "Environment: Node.js 18, Express, MongoDB."

# 4. Simpan investigasi
./context-manager.sh save context-debug-session.json

# 5. Export untuk dokumentasi
./context-manager.sh export txt
```

## 📁 Struktur File

### Direktori Otomatis
```
GLM/
├── discussions/           # Auto-created
│   ├── diskusi-1.json
│   ├── diskusi-2.json
│   └── diskusi-3.json
├── context/              # Auto-created
│   ├── current-context.json
│   └── saved-context.json
├── save-discussion.sh
├── load-discussion.sh
├── context-manager.sh
├── discussion-template.json
└── DISCUSSION_TEMPLATES.md
```

### Format File JSON
```json
{
  "metadata": {
    "created": "2024-01-15 10:30:00",
    "updated": "2024-01-15 11:45:00",
    "name": "diskusi-name",
    "tags": []
  },
  "messages": [
    {
      "role": "user",
      "content": "Message content",
      "timestamp": "2024-01-15 10:30:00",
      "id": "1641234567"
    }
  ]
}
```

## 🎯 Best Practices

### 1. **Penamaan File**
- Gunakan nama yang deskriptif: `microservices-architecture.json`
- Gunakan kebab-case: `project-planning.json`
- Hindari spasi dan karakter khusus

### 2. **Struktur Konteks**
- Mulai dengan system prompt yang jelas
- Tambahkan background information
- Gunakan role yang spesifik untuk setiap diskusi
- Kompres konteks jika terlalu besar

### 3. **Manajemen Diskusi**
- Gunakan tag untuk kategorisasi
- Simpan summary dan action items
- Export ke format yang sesuai untuk dokumentasi
- Backup diskusi penting

### 4. **Keamanan**
- Jangan simpan informasi sensitif
- Gunakan environment variables untuk API keys
- Batasi akses ke file diskusi
- Hapus konteks yang tidak diperlukan

## 🔧 Troubleshooting

### Common Issues

**Issue:** `Permission denied` saat menjalankan script
**Solution:** 
```bash
chmod +x *.sh
```

**Issue:** `Command not found: jq`
**Solution:** Install jq
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# CentOS/RHEL
sudo yum install jq
```

**Issue:** File discussion tidak ditemukan
**Solution:** Pastikan nama file benar dan file ada di direktori `discussions/`

**Issue:** Context tidak tersimpan
**Solution:** Pastikan direktori `context/` ada dan writable

### Debug Mode
Tambahkan `set -x` di awal script untuk debugging:
```bash
#!/bin/bash
set -x  # Debug mode
# ... rest of script
```

## 📚 Integrasi dengan Tools Lain

### 1. **Git Integration**
```bash
# Initialize git repo untuk diskusi
git init discussions-repo
cd discussions-repo

# Add semua diskusi
git add ../discussions/*.json
git commit -m "Add initial discussions"

# Track perubahan
git log --oneline
```

### 2. **Version Control untuk Konteks**
```bash
# Simpan versi konteks
./context-manager.sh save context-v1.json
./context-manager.sh save context-v2.json

# Bandingkan versi
diff context-v1.json context-v2.json
```

### 3. **Backup Automation**
```bash
# Backup script (backup-discussions.sh)
#!/bin/bash
tar -czf discussions-backup-$(date +%Y%m%d).tar.gz discussions/ context/
echo "Backup created: discussions-backup-$(date +%Y%m%d).tar.gz"
```

### 4. **Search Functionality**
```bash
# Search script (search-discussions.sh)
#!/bin/bash
grep -r "$1" discussions/ --include="*.json" -l
```

## 🚀 Advanced Usage

### 1. **Batch Processing**
```bash
# Process multiple discussions
for file in discussions/*.json; do
    echo "Processing: $file"
    ./load-discussion.sh "$(basename "$file" .json)" --stats
done
```

### 2. **Automation dengan Cron**
```bash
# Add to crontab untuk daily backup
0 2 * * * /path/to/GLM/backup-discussions.sh
```

### 3. **Custom Templates**
Buat template kustom di `templates/` directory:
```bash
mkdir templates
cp discussion-template.json templates/technical-discussion.json
# Edit template sesuai kebutuhan
```

## 📈 Monitoring dan Maintenance

### 1. **Disk Usage Monitoring**
```bash
# Check disk usage
du -sh discussions/ context/

# Large files check
find discussions/ -name "*.json" -size +1M
```

### 2. **Cleanup Script**
```bash
#!/bin/bash
# cleanup-old-discussions.sh
find discussions/ -name "*.json" -mtime +30 -delete
echo "Cleaned up discussions older than 30 days"
```

### 3. **Health Check**
```bash
#!/bin/bash
# health-check.sh
echo "=== GLM Discussion System Health Check ==="
echo "Discussions: $(ls discussions/*.json 2>/dev/null | wc -l)"
echo "Context files: $(ls context/*.json 2>/dev/null | wc -l)"
echo "Disk usage: $(du -sh discussions/ context/ | tail -1)"
echo "Last activity: $(ls -lt discussions/ | head -2 | tail -1)"
```

---

## 📞 Support

Jika Anda menemukan masalah atau memiliki pertanyaan:
1. Periksa dokumentasi ini
2. Coba jalankan script dengan debug mode
3. Periksa permission dan dependencies
4. Review file structure dan format

Script-script ini adalah solusi sementara sampai CLI resmi GLM selesai dikembangkan.