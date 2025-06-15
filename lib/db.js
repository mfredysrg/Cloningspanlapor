import mysql from 'mysql2/promise';

// Fungsi untuk membuat koneksi dan menjalankan query
export async function query({ query, values = [] }) {
  // Membuat koneksi ke database menggunakan informasi dari file .env.local
  const dbconnection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    // Menjalankan query SQL
    const [results] = await dbconnection.execute(query, values);
    // Menutup koneksi setelah selesai
    dbconnection.end();
    return results;
  } catch (error) {
    // Jika terjadi error, tampilkan pesan error dan tutup koneksi
    console.error("Database query error:", error.message);
    dbconnection.end();
    // Melemparkan error agar bisa ditangani di tempat lain
    throw new Error('Gagal menjalankan query database.');
  }
}