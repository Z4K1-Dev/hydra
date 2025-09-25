# GLM Discussion Management - Solusi Sementara

> **Catatan:** Ini adalah solusi sementara sambil menunggu CLI resmi GLM selesai dikembangkan. Script-script ini menyediakan fungsionalitas dasar untuk mengelola diskusi dan konteks.

## 🚀 Quick Start

### Prerequisites
- Bash shell
- `jq` (JSON processor)
- Basic command line knowledge

### Installation
```bash
# Clone atau download script-script ini
# Pastikan semua script memiliki executable permission
chmod +x *.sh

# Install jq jika belum terinstall
# Ubuntu/Debian:
sudo apt-get install jq

# macOS:
brew install jq

# CentOS/RHEL:
sudo yum install jq
```

### Quick Demo
```bash
# Jalankan demo untuk melihat cara kerja
./demo-glm.sh
```

## 📋 Script Overview

### 1. `save-discussion.sh` - Menyimpan Diskusi
Simpan percakapan ke file JSON terstruktur.

```bash
# Simpan dengan konten langsung
./save-discussion.sh project-planning "Planning Q1 2024 roadmap"

# Simpan dengan input interaktif
./save-discussion.sh architecture-discussion
# Ketik pesan dan tekan Ctrl+D
```

### 2. `load-discussion.sh` - Memuat Diskusi
Tampilkan dan export diskusi yang tersimpan.

```bash
# Tampilkan diskusi lengkap
./load-discussion.sh project-planning --full

# Tampilkan 5 pesan terakhir
./load-discussion.sh architecture-discussion --last 5

# Export ke markdown
./load-discussion.sh project-planning --export

# Lihat statistik
./load-discussion.sh architecture-discussion --stats
```

### 3. `context-manager.sh` - Manajemen Konteks
Kelola konteks percakapan untuk AI dengan fitur lengkap.

```bash
# Buat konteks baru
./context-manager.sh create

# Tambahkan pesan
./context-manager.sh add "System: You are a technical expert."

# Tampilkan konteks
./context-manager.sh show

# Kompres konteks
./context-manager.sh compress

# Export ke berbagai format
./context-manager.sh export md
./context-manager.sh export json
./context-manager.sh export txt

# Lihat statistik
./context-manager.sh stats
```

## 🎯 Use Cases

### **1. Technical Documentation**
```bash
# Simpan diskusi teknis
./save-discussion.sh api-design "REST API design patterns"

# Setup context dengan role spesifik
./context-manager.sh create
./context-manager.sh add "System: You are a senior backend engineer."
./context-manager.sh add "Context: Designing REST API for e-commerce platform."

# Tambahkan pertanyaan teknis
./context-manager.sh add "What are the best practices for API versioning?"

# Export untuk dokumentasi
./context-manager.sh export md
```

### **2. Project Planning**
```bash
# Mulai diskusi perencanaan
./save-discussion.sh q1-planning "Q1 2024 project planning"

# Setup context project management
./context-manager.sh create
./context-manager.sh add "System: You are an experienced project manager."
./context-manager.sh add "Context: Planning Q1 2024 for development team."

# Tambahkan item perencanaan
./context-manager.sh add "What are the key milestones for Q1?"

# Simpan untuk tracking
./context-manager.sh save context-q1-planning.json
```

### **3. Learning & Education**
```bash
# Simpan sesi pembelajaran
./save-discussion.sh machine-learning "Learning ML basics"

# Setup educational context
./context-manager.sh create
./context-manager.sh add "System: You are a machine learning instructor."
./context-manager.sh add "Context: Introduction to machine learning for beginners."

# Tambahkan pertanyaan pembelajaran
./context-manager.sh add "Explain the difference between supervised and unsupervised learning."

# Review progress
./context-manager.sh show
```

### **4. Problem Solving**
```bash
# Simpan sesi problem solving
./save-discussion.sh bug-investigation "Memory leak investigation"

# Setup debugging context
./context-manager.sh create
./context-manager.sh add "System: You are a senior debugging expert."
./context-manager.sh add "Context: Investigating memory leak in Node.js application."

# Tambahkan detail masalah
./context-manager.sh add "Issue: Memory usage increases by 1MB per request."

# Simpan investigasi
./context-manager.sh save context-debug-session.json
```

## 📁 File Structure

```
GLM/
├── save-discussion.sh          # Save discussions
├── load-discussion.sh          # Load discussions
├── context-manager.sh          # Manage context
├── demo-glm.sh                 # Demo script
├── discussion-template.json     # Template struktur
├── DISCUSSION_TEMPLATES.md    # Template examples
├── SCRIPT_DOCUMENTATION.md    # Full documentation
├── discussions/                # Auto-created (discussion files)
│   ├── project-planning.json
│   └── architecture-discussion.json
└── context/                    # Auto-created (context files)
    ├── current-context.json
    └── saved-context.json
```

## 🎨 Templates

### Pre-defined Templates
Lihat `DISCUSSION_TEMPLATES.md` untuk template siap pakai:
- Technical Discussion
- Design Discussion
- Strategic Planning
- Problem Solving
- Learning Session

### Custom Templates
```bash
# Salin template dasar
cp discussion-template.json my-template.json

# Edit sesuai kebutuhan
nano my-template.json

# Gunakan template
./context-manager.sh create
# Tambahkan system prompt dari template
```

## 🔧 Advanced Features

### **Context Compression**
```bash
# Kompres konteks otomatis saat terlalu besar
./context-manager.sh compress

# Cek ukuran konteks
./context-manager.sh stats
```

### **Multiple Export Formats**
```bash
# Export ke berbagai format
./context-manager.sh export md    # Markdown
./context-manager.sh export json  # JSON
./context-manager.sh export txt   # Plain text
```

### **Batch Operations**
```bash
# Process multiple discussions
for file in discussions/*.json; do
    echo "Processing: $file"
    ./load-discussion.sh "$(basename "$file" .json)" --stats
done
```

## 🛠️ Integration dengan Workflow

### **Git Integration**
```bash
# Initialize git repo untuk diskusi
git init discussion-repo
cd discussion-repo

# Add discussions
git add ../discussions/*.json
git commit -m "Add initial discussions"

# Track changes
git log --oneline
```

### **Backup Automation**
```bash
# Buat backup script
cat > backup-discussions.sh << 'EOF'
#!/bin/bash
tar -czf discussions-backup-$(date +%Y%m%d).tar.gz discussions/ context/
echo "Backup created: discussions-backup-$(date +%Y%m%d).tar.gz"
EOF

chmod +x backup-discussions.sh

# Add to crontab untuk daily backup
echo "0 2 * * * /path/to/GLM/backup-discussions.sh" | crontab -
```

### **Search Functionality**
```bash
# Search script
cat > search-discussions.sh << 'EOF'
#!/bin/bash
if [ -z "$1" ]; then
    echo "Usage: ./search-discussions.sh <search-term>"
    exit 1
fi
echo "Searching for: $1"
grep -r "$1" discussions/ --include="*.json" -l | while read file; do
    echo "Found in: $file"
    ./load-discussion.sh "$(basename "$file" .json)" --last 3
done
EOF

chmod +x search-discussions.sh
```

## 🔍 Troubleshooting

### Common Issues

**Issue:** Permission denied
```bash
# Fix permissions
chmod +x *.sh
```

**Issue:** jq not found
```bash
# Install jq
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

**Issue:** File not found
```bash
# Check if directories exist
ls -la discussions/
ls -la context/

# Create directories if needed
mkdir -p discussions context
```

### Debug Mode
```bash
# Enable debug mode
set -x  # Add this at the beginning of any script
```

## 📈 Best Practices

### **1. File Organization**
- Gunakan nama file yang deskriptif
- Kelompokkan diskusi berdasarkan topik
- Gunakan tag untuk kategorisasi

### **2. Context Management**
- Mulai dengan system prompt yang jelas
- Kompres konteks secara berkala
- Simpan versi penting

### **3. Documentation**
- Export diskusi penting ke markdown
- Simpan summary dan action items
- Track decisions dan outcomes

### **4. Backup & Recovery**
- Backup diskusi secara berkala
- Gunakan version control
- Simpan multiple copies

## 🚀 Next Steps

### **Short Term**
1. Gunakan script-script ini untuk daily work
2. Eksplorasi berbagai template
3. Integrasikan dengan workflow Anda
4. Berikan feedback untuk improvement

### **Medium Term**
1. Tambahkan fitur tambahan sesuai kebutuhan
2. Buat template kustom untuk use case spesifik
3. Setup backup dan version control
4. Integrasikan dengan tools lain

### **Long Term**
1. Migrasi ke CLI resmi GLM saat tersedia
2. Export data dari script ke format CLI
3. Setup production workflow
4. Scale untuk team usage

## 📞 Support

### **Documentation**
- `SCRIPT_DOCUMENTATION.md` - Dokumentasi lengkap
- `DISCUSSION_TEMPLATES.md` - Template dan contoh
- `demo-glm.sh` - Demo interaktif

### **Getting Help**
1. Jalankan demo: `./demo-glm.sh`
2. Baca dokumentasi: `cat SCRIPT_DOCUMENTATION.md`
3. Cek troubleshooting section
4. Test dengan data sample

### **Contributing**
Jika Anda menemukan bug atau memiliki improvement:
1. Test dengan environment Anda
2. Document issue dengan jelas
3. Provide sample data jika perlu
4. Suggest improvement spesifik

---

## 🎯 Summary

Script-script ini menyediakan solusi sementara yang powerful untuk mengelola diskusi GLM:

✅ **Save discussions** dengan format terstruktur  
✅ **Load and view** discussions dengan berbagai opsi  
✅ **Manage context** dengan fitur lengkap  
✅ **Export** ke multiple formats  
✅ **Templates** untuk berbagai use cases  
✅ **Documentation** lengkap  
✅ **Demo** interaktif  

Gunakan script-script ini untuk:
- **Technical documentation**
- **Project planning**
- **Learning sessions**
- **Problem solving**
- **Team collaboration**

**Next Step:** Jalankan `./demo-glm.sh` untuk melihat cara kerja semua script!

---

*Created: January 2024*  
*Version: 1.0*  
*Status: Production Ready (Temporary Solution)*