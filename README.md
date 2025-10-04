
# News CMS - Sistem Manajemen Artikel

Sebuah **Content Management System (CMS)** sederhana untuk mengelola artikel, pengguna, dan dashboard admin.  
Dibangun menggunakan **Node.js**, **Express**, **EJS**, dan **MySQL**, dengan autentikasi berbasis session.

---

## Fitur

### 🔐 Autentikasi & Role
- Login & Logout dengan session.
- Register pengguna (opsional).
- Role-based access:
  - **Superadmin**: Kelola semua pengguna & artikel.
  - **Admin**: Kelola artikel.
  - **Penulis**: Tambah & edit artikel sendiri.

### 📝 Kelola Artikel
- Tambah, edit, hapus artikel.
- Upload gambar, kategori, dan tag.
- Daftar artikel terbaru & populer.
- Statistik artikel dan kunjungan di dashboard.

### 👥 Kelola Pengguna (Superadmin)
- Tambah, edit, hapus pengguna.
- Ubah password & role pengguna.
- Lihat daftar pengguna dengan tanggal dibuat.

### 📊 Dashboard
- Statistik jumlah artikel, penulis, dan total kunjungan.
- Grafik kunjungan mingguan (dummy data, bisa diganti tabel visits).

### 🎨 UI Responsif
- Sidebar & navbar adaptif.
- Tombol aksi dengan ikon FontAwesome.
- Tampilkan menu berbeda sesuai status login.

---

## Instalasi

1. Clone repository:

```bash
git clone https://github.com/fajar33/KelolaOrganisasiExpress.git
cd KelolaOrganisasiExpress
````

2. Install dependencies:

```bash
npm install
```

3. Buat database MySQL:

```sql
CREATE DATABASE news_cms;
USE news_cms;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nama_lengkap VARCHAR(100),
  role ENUM('superadmin','admin','penulis') DEFAULT 'penulis',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  content TEXT NOT NULL,
  image VARCHAR(255),
  author VARCHAR(100),
  category VARCHAR(100),
  tags VARCHAR(255),
  slug VARCHAR(255),
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

4. Buat file `.env`:

```
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=news_cms
SESSION_SECRET=rahasia
PORT=3000
```

5. Jalankan server:

```bash
npm start
```

6. Akses di browser: `http://localhost:3000`

---

## Struktur Folder

```
projek-cms/
│
├─ controllers/      # Logic artikel & user
├─ middleware/       # Auth middleware
├─ routes/           # Route admin & publik
├─ public/           # CSS, JS, uploads
├─ views/            # Template EJS
├─ db.js             # Koneksi database
├─ app.js            # Entry point Express
├─ package.json
└─ README.md
```

---

## Dependencies

* [Express](https://expressjs.com/)
* [EJS](https://ejs.co/)
* [MySQL2](https://www.npmjs.com/package/mysql2)
* [Express-Session](https://www.npmjs.com/package/express-session)
* [Bcrypt](https://www.npmjs.com/package/bcrypt)
* [Multer](https://www.npmjs.com/package/multer)
* [Slugify](https://www.npmjs.com/package/slugify)
* [Chart.js](https://www.chartjs.org/)
* [FontAwesome](https://fontawesome.com/)

---

## Catatan

* Pastikan `SESSION_SECRET` di `.env` diganti string acak kuat.
* Grafik kunjungan di dashboard masih dummy, bisa dihubungkan ke tabel `visits`.
* Role-based access sudah diterapkan di middleware.

---

## Lisensi

MIT © Fajar33


