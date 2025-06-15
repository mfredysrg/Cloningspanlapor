import { query } from '../../lib/db'; // Import fungsi query dari file db.js

// Handler utama untuk request ke /api/laporan
export default async function handler(req, res) {
  // Memeriksa apakah metode request adalah GET
  if (req.method === 'GET') {
    try {
      // Menjalankan query untuk mengambil semua data dari tabel laporan
      const laporan = await query({
        query: "SELECT * FROM laporan ORDER BY tanggal DESC",
        values: [],
      });

      // Mengirimkan data sebagai respons dengan status 200 (OK)
      res.status(200).json({ laporan: laporan });
    } catch (error) {
      // Jika terjadi error, kirimkan pesan error dengan status 500
      res.status(500).json({ error: error.message });
    }
  } else {
    // Jika metode bukan GET, kirimkan pesan error
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}