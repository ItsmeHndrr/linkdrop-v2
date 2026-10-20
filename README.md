# LinkDrop + TeraBox (backend-ready)

Paket ini mempertahankan tampilan LinkDrop, menyediakan pilihan **MP4** atau **MP3** setelah tombol Unduh ditekan, dan menambahkan endpoint backend untuk memproses media dari platform yang didukung. Tautan TeraBox tetap memakai resolver terpisah.

## Unduhan MP4 / MP3

Untuk unduhan media, server membutuhkan **Node.js 18+**, **yt-dlp versi terbaru**, dan **FFmpeg** (FFmpeg wajib untuk konversi MP3). Instal yt-dlp dan FFmpeg di mesin/container yang menjalankan server; paket ini tidak dapat memasang dependensi sistem secara otomatis. Contoh di Linux/Termux bisa berbeda menurut distribusi:

```sh
python -m pip install -U yt-dlp
# Pasang FFmpeg melalui package manager sistem, misalnya:
# Debian/Ubuntu: sudo apt-get install ffmpeg
# Termux: pkg install ffmpeg
```

Endpoint `POST /api/download` menerima `{"url":"https://...","format":"mp4"}` atau `"mp3"`. Saat pengguna menekan Unduh, halaman menampilkan dua pilihan format. Kecepatan dan keberhasilan tetap dipengaruhi oleh sumber, jaringan, batasan platform, dan kapasitas server; tidak ada cara menjamin nol error untuk semua tautan. Hanya unduh media yang kamu miliki atau diizinkan untuk disimpan. Endpoint dibatasi pada domain platform yang didukung dan membatasi ukuran media hingga 1 GB serta waktu proses.

## Penting tentang TeraBox

TeraBox tidak menyediakan satu metode ekstraksi anonim yang stabil untuk semua tautan berbagi. Karena itu, proyek ini **tidak mengarang tautan unduhan** dan tidak memasukkan layanan pihak ketiga yang tidak terverifikasi secara default. Agar unduhan benar-benar bekerja, kamu harus menyediakan endpoint resolver TeraBox yang kamu host/percaya dan mengonfigurasikan `TERABOX_RESOLVER_URL`. Resolver perlu menerima `?url=<share-url>` dan mengembalikan JSON berupa array file, atau `{ "files": [...] }`, dengan setiap file memiliki `name` dan salah satu field URL: `download_url`, `dlink`, `direct_link`, `url`, atau `downloadUrl`. URL unduhan harus HTTPS.

Endpoint resolver komunitas yang dipilih sendiri bisa berubah, tidak tersedia, atau memiliki syarat penggunaan/privasi sendiri. Jangan kirim kata sandi akun TeraBox ke resolver. Tautan berbagi yang dikunci password mungkin memerlukan password share yang benar; fitur ini tidak melewati login, CAPTCHA, atau akses privat.

## Menjalankan di Android (Termux) atau komputer

1. Pasang Node.js versi 18 atau lebih baru.
2. Masuk ke folder proyek.
3. Salin `.env.example` menjadi `.env` (atau ekspor variabel lingkungan di shell), lalu isi `TERABOX_RESOLVER_URL` dan `TERABOX_API_KEY` bila diperlukan.
4. Jalankan:

```sh
npm start
```

5. Buka `http://localhost:3000`.

Proyek ini memakai Node.js built-in saja, jadi tidak perlu `npm install`.

### Termux

```sh
pkg update
pkg install nodejs unzip
cd ~/linkdrop-terabox
# Atur endpoint resolver sebelum menjalankan, contoh:
export TERABOX_RESOLVER_URL='https://URL-RESOLVER-YANG-KAMU-PERCAYA/api'
# Jika diperlukan:
# export TERABOX_API_KEY='kunci-api-milikmu'
npm start
```

### Endpoint

- `GET /api/health` — status server dan konfigurasi resolver.
- `POST /api/download` — memproses media menjadi MP4 atau MP3 menggunakan yt-dlp/FFmpeg.
- `POST /api/terabox/resolve` — body JSON `{"url":"https://terabox.com/s/..."}`; mengembalikan daftar file yang bisa diunduh.

## Keamanan

- Hanya domain TeraBox yang dikenal diterima oleh endpoint resolver.
- Resolver eksternal harus memakai HTTPS.
- Body request dibatasi ukurannya.
- Gunakan hanya file yang kamu miliki atau diizinkan untuk disimpan.
- LinkDrop tidak meminta kredensial akun TeraBox.


## Deploy Render (gratis)
1. Unggah **isi folder proyek ini** ke repositori GitHub (jangan unggah ZIP sebagai satu file).
2. Di Render pilih **New → Web Service**, lalu hubungkan repositori.
3. Runtime: Node; Build Command: `npm install`; Start Command: `npm start`; pilih instance Free jika tersedia pada akun.
4. Server sudah membaca port dari `PORT` dan bind ke `0.0.0.0`.
5. Jangan set `TERABOX_RESOLVER_URL` sampai kamu punya endpoint resolver yang tepercaya dan cocok dengan format API yang dijelaskan pada kode.

Logo LinkDrop ada di `public/assets/linkdrop-logo.png`. Tampilan utama responsif untuk HP dan desktop. Fitur unduh platform selain tautan file langsung atau TeraBox resolver tidak dijanjikan aktif hanya karena tampil di daftar platform.


## Deploy ke Vercel

Proyek ini sudah ditambahkan konfigurasi Vercel dan API Functions di folder `api/`.

1. Ekstrak ZIP ini, lalu unggah **isi folder `linkdrop-terabox-vercel`** ke repository GitHub.
2. Di Vercel pilih **Add New → Project**, impor repository tersebut.
3. Biarkan Framework Preset sebagai **Other**. Build Command dapat dikosongkan; Output Directory juga biarkan default/kosong.
4. Deploy. Halaman statis berada di `public/`, sementara endpoint berjalan sebagai Vercel Functions.
5. Untuk fitur TeraBox, buka **Project → Settings → Environment Variables**, tambahkan `TERABOX_RESOLVER_URL` dan bila perlu `TERABOX_API_KEY`, lalu lakukan redeploy.

### Batasan penting Vercel

- `GET /api/health` berjalan sebagai Vercel Function.
- `POST /api/terabox/resolve` berjalan jika resolver HTTPS yang kompatibel telah dikonfigurasi.
- `POST /api/download` sengaja mengembalikan HTTP 501 dengan penjelasan. Fitur unduh/konversi dari banyak platform di kode asal memerlukan executable `yt-dlp` dan FFmpeg serta proses file besar; keduanya tidak tersedia otomatis di Vercel Functions. Agar fitur tersebut aktif, jalankan layanan media pada backend/container terpisah yang mendukung binary dan streaming, kemudian sambungkan frontend ke layanan itu.
- Deployment tidak dapat menjamin setiap tautan media berhasil; akses, format respons resolver, dan kebijakan platform sumber tetap berpengaruh.

Jangan masukkan API key ke file frontend atau commit `.env` ke GitHub.


## Perbaikan error `invalid_function_runtime` di Vercel

Konfigurasi `vercel.json` tidak lagi menetapkan `runtime: nodejs20.x` pada blok `functions`. Vercel akan mendeteksi runtime Node.js untuk file API di folder `api/` secara otomatis. Folder `public/` ditetapkan sebagai output frontend statis.

Saat mengimpor proyek, pastikan **Root Directory** adalah folder `linkdrop-terabox-vercel` (folder yang berisi `vercel.json`, `package.json`, `api/`, dan `public/`). Setelah mengunggah perubahan, lakukan redeploy.
