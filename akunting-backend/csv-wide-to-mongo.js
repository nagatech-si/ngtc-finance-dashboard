const fs = require("fs");
const csv = require("csv-parser");
const { ObjectId } = require("bson");

const INPUT_CSV = "./finance.csv";
const OUTPUT_JSON = "./finance.mongo.json";

const BULAN_MAP = {
  DEC: "DEC - 23",
  JAN: "JAN - 24",
  FEB: "FEB - 24",
  MAR: "MAR - 24",
  APR: "APR - 24",
  MAY: "MAY - 24",
  JUN: "JUN - 24",
  JUL: "JUL - 24",
  AUG: "AUG - 24",
  SEP: "SEP - 24",
  OCT: "OCT - 24",
  NOV: "NOV - 24",
};

const results = [];

fs.createReadStream(INPUT_CSV)
  .pipe(
    csv({
      separator: ';', // Menggunakan semicolon sebagai delimiter
      mapHeaders: ({ header }) => header.trim().toUpperCase(),
    })
  )
  .on("data", (row) => {
    const kategori = row['KATEGORI'] || '';
    const subKategori = row['SUB KATEGORI'] || '';
    const akun = row['AKUN'] || '';

    let totalTahunan = 0;
    const dataBulanan = [];

    for (const [key, label] of Object.entries(BULAN_MAP)) {
      const raw = row[key] || "0";
      // Bersihkan nilai: tangani format akuntansi dengan tanda kurung untuk negatif
      let cleanedValue = String(raw).replace(/\s+/g, '');
      
      // Jika nilai dalam format (angka), itu negatif
      if (cleanedValue.startsWith('(') && cleanedValue.endsWith(')')) {
        cleanedValue = '-' + cleanedValue.slice(1, -1);
      }
      
      // Hapus karakter non-numeric kecuali minus
      cleanedValue = cleanedValue.replace(/[^0-9-]/g, '');
      
      const nilai = Number(cleanedValue) || 0;

      totalTahunan += nilai;

      dataBulanan.push({
        bulan: label,
        nilai,
        _id: {
          $oid: new ObjectId().toHexString(),
        },
      });
    }

    results.push({
      kategori: kategori.toUpperCase().trim(),
      sub_kategori: subKategori.toUpperCase().trim(),
      akun: akun.toUpperCase().trim(),
      data_bulanan: dataBulanan,
      total_tahunan: totalTahunan,
      input_by: "ROBBI",
      tahun_fiskal: "2024",
      created_at: {
        $date: new Date().toISOString(),
      },
    });
  })
  .on("end", () => {
    fs.writeFileSync(
      OUTPUT_JSON,
      JSON.stringify(results, null, 2)
    );

    console.log(`✅ Sukses: ${results.length} dokumen dibuat`);
    console.log(`📄 Output: ${OUTPUT_JSON}`);
  })
  .on("error", (error) => {
    console.error("❌ Error reading CSV:", error);
  });
