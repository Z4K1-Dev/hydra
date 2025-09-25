# GLM Discussion Templates

Berikut adalah template untuk berbagai jenis diskusi yang dapat Anda gunakan dengan script GLM.

## 📋 Template Struktur Dasar

### 1. Diskusi Teknis
```json
{
  "metadata": {
    "title": "Technical Implementation: [Nama Project]",
    "topic": "Software Development",
    "tags": ["technical", "implementation", "coding"],
    "priority": "high"
  },
  "context": {
    "background": "Diskusi tentang implementasi teknis untuk project tertentu",
    "objectives": [
      "Merancang arsitektur sistem",
      "Memilih teknologi yang tepat",
      "Membuat rencana implementasi"
    ]
  },
  "system_prompt": "You are a technical expert specializing in software architecture and implementation. Provide detailed, practical advice with code examples when appropriate."
}
```

### 2. Diskusi Desain
```json
{
  "metadata": {
    "title": "Design Discussion: [Nama Project]",
    "topic": "UI/UX Design",
    "tags": ["design", "ui", "ux", "user-experience"],
    "priority": "medium"
  },
  "context": {
    "background": "Diskusi tentang desain antarmuka pengguna dan pengalaman pengguna",
    "objectives": [
      "Merancang user flow",
      "Memilih desain pattern",
      "Membuat prototype"
    ]
  },
  "system_prompt": "You are a UI/UX design expert. Focus on user-centered design principles, accessibility, and modern design trends."
}
```

### 3. Diskusi Strategis
```json
{
  "metadata": {
    "title": "Strategic Planning: [Topik]",
    "topic": "Business Strategy",
    "tags": ["strategy", "planning", "business"],
    "priority": "high"
  },
  "context": {
    "background": "Diskusi strategis untuk pengambilan keputusan bisnis",
    "objectives": [
      "Menganalisis peluang pasar",
      "Membuat rencana strategis",
      "Menentukan KPI dan metrik"
    ]
  },
  "system_prompt": "You are a business strategy consultant. Provide data-driven insights and strategic recommendations."
}
```

### 4. Diskusi Pemecahan Masalah
```json
{
  "metadata": {
    "title": "Problem Solving: [Nama Masalah]",
    "topic": "Issue Resolution",
    "tags": ["problem-solving", "troubleshooting", "debugging"],
    "priority": "high"
  },
  "context": {
    "background": "Diskusi untuk memecahkan masalah teknis atau bisnis",
    "objectives": [
      "Mengidentifikasi root cause",
      "Mengeksplorasi solusi",
      "Membuat rencana aksi"
    ]
  },
  "system_prompt": "You are a problem-solving expert. Use systematic approaches like root cause analysis and provide actionable solutions."
}
```

### 5. Diskusi Pembelajaran
```json
{
  "metadata": {
    "title": "Learning Session: [Topik]",
    "topic": "Education & Training",
    "tags": ["learning", "tutorial", "education"],
    "priority": "medium"
  },
  "context": {
    "background": "Sesi pembelajaran tentang topik tertentu",
    "objectives": [
      "Memahami konsep dasar",
      "Mempelajari best practices",
      "Menerapkan pengetahuan"
    ]
  },
  "system_prompt": "You are an educational expert. Explain concepts clearly, provide examples, and ensure understanding through interactive discussion."
}
```

## 🚀 Cara Menggunakan Template

### 1. Membuat Diskusi Baru dari Template
```bash
# Salin template ke file baru
cp discussion-template.json discussions/my-discussion.json

# Edit file sesuai kebutuhan
nano discussions/my-discussion.json

# Atau gunakan script untuk membuat diskusi
./save-discussion.sh my-discussion "Initial discussion content"
```

### 2. Menggunakan Context Manager dengan Template
```bash
# Buat context baru
./context-manager.sh create

# Tambahkan system prompt khusus
./context-manager.sh add "System: You are a technical expert specializing in cloud architecture."

# Tambahkan konteks background
./context-manager.sh add "Context: We are building a microservices architecture using Kubernetes."
```

### 3. Template untuk Berbagai AI Roles

#### **Technical Architect**
```json
{
  "system_prompt": "You are a senior technical architect with 15+ years of experience. You specialize in distributed systems, microservices, and cloud-native applications. Provide detailed architectural recommendations with trade-offs, scalability considerations, and implementation guidance."
}
```

#### **Product Manager**
```json
{
  "system_prompt": "You are an experienced product manager. You focus on user needs, market analysis, and product strategy. Help prioritize features, define user stories, and create product roadmaps."
}
```

#### **Data Scientist**
```json
{
  "system_prompt": "You are a data scientist with expertise in machine learning, statistics, and data analysis. Provide insights on data-driven decision making, model selection, and analytical approaches."
}
```

#### **Security Expert**
```json
{
  "system_prompt": "You are a cybersecurity specialist. Focus on security best practices, threat modeling, and secure coding. Provide recommendations for protecting systems and data."
}
```

#### **DevOps Engineer**
```json
{
  "system_prompt": "You are a DevOps engineer specializing in CI/CD, infrastructure as code, and cloud operations. Provide guidance on automation, monitoring, and deployment strategies."
}
```

## 📝 Contoh Penggunaan Lengkap

### Scenario: Mendiskusikan Arsitektur Microservices
```bash
# 1. Buat diskusi baru
./save-discussion.sh microservices-architecture "Designing microservices for e-commerce platform"

# 2. Setup context dengan template technical architect
./context-manager.sh create
./context-manager.sh add "System: You are a senior technical architect specializing in microservices and cloud architecture."
./context-manager.sh add "Context: Building an e-commerce platform with 1M+ expected users, requiring high availability and scalability."

# 3. Tambahkan pertanyaan spesifik
./context-manager.sh add "Question: What are the key considerations for designing the order processing service?"

# 4. Lihat context
./context-manager.sh show

# 5. Export ke markdown untuk dokumentasi
./context-manager.sh export md
```

### Scenario: Brainstorming Produk Baru
```bash
# 1. Buat diskusi brainstorming
./save-discussion.sh product-brainstorm "New mobile app ideas for fitness industry"

# 2. Setup context dengan product manager role
./context-manager.sh create
./context-manager.sh add "System: You are an experienced product manager in the fitness and wellness industry."
./context-manager.sh add "Context: We want to create innovative mobile apps that help users maintain fitness routines."

# 3. Tambahkan prompt kreatif
./context-manager.sh add "Prompt: Generate 5 innovative mobile app ideas that combine AI with fitness tracking."

# 4. Simpan context untuk sesi berikutnya
./context-manager.sh save context-product-brainstorm.json
```

## 🎯 Tips untuk Diskusi Efektif

### 1. **Gunakan Metadata yang Jelas**
- Beri judul yang deskriptif
- Tambahkan tag yang relevan
- Set priority yang sesuai

### 2. **Setup Context dengan Baik**
- Definisikan role AI yang spesifik
- Berikan background information yang cukup
- Tetapkan objectives yang jelas

### 3. **Kelola Messages dengan Efisien**
- Gunakan format yang konsisten
- Tambahkan timestamp untuk setiap message
- Kompres context jika terlalu besar

### 4. **Dokumentasi Hasil**
- Export ke format yang sesuai
- Simpan summary dan action items
- Lacak decisions yang dibuat

### 5. **Maintain Discussion Flow**
- Gunakan struktur yang logis
- Pertahankan konteks antar sesi
- Review dan update secara berkala