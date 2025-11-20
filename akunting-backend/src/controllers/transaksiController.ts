// Edit data bulanan pada transaksi
export const editTransaksiBulanan = async (req: Request, res: Response) => {
  try {
    const { id, bulan } = req.params;
    const { nilai } = req.body;
    const doc = await Transaksi.findById(id);
    if (!doc) return res.status(404).json({ message: 'Transaksi not found' });
    const idx = doc.data_bulanan.findIndex((d: any) => d.bulan === bulan);
    if (idx === -1) return res.status(404).json({ message: 'Bulan not found' });
    doc.data_bulanan[idx].nilai = nilai;
    doc.total_tahunan = doc.data_bulanan.reduce((sum: number, d: any) => sum + d.nilai, 0);
    doc.updated_at = new Date();
    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Hapus data bulanan pada transaksi
export const deleteTransaksiBulanan = async (req: Request, res: Response) => {
  try {
    const { id, bulan } = req.params;
    const doc = await Transaksi.findById(id);
    if (!doc) return res.status(404).json({ message: 'Transaksi not found' });
    doc.data_bulanan = doc.data_bulanan.filter((d: any) => d.bulan !== bulan);
    doc.total_tahunan = doc.data_bulanan.reduce((sum: number, d: any) => sum + d.nilai, 0);
    doc.updated_at = new Date();
    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
import { Request, Response } from 'express';
import Transaksi from '../models/Transaksi';
import Akun from '../models/Akun';
import { fiscalMonthsForYear, periodeToTahunFiskal } from '../utils/fiscal';

export const createTransaksi = async (req: Request, res: Response) => {
  try {
    const { kategori, sub_kategori, akun, bulan, nilai, input_by, tahun_fiskal } = req.body;
    if (!kategori || !sub_kategori || !akun || !bulan || nilai === undefined) {
      return res.status(400).json({ message: 'kategori, sub_kategori, akun, bulan, nilai required' });
    }
    // Otomatis ambil tahun fiskal dari bulan jika tidak dikirim
    let tahunFiskal = tahun_fiskal;
    if (!tahunFiskal && bulan) {
      // Format bulan: "APR - 25" → bulan=APR, tahun=25
      const match = bulan.match(/([A-Z]+)\s*-\s*(\d{2,4})$/i);
      if (match) {
        const bulanStr = match[1].toUpperCase();
        let tahunNum = match[2].length === 2 ? 2000 + parseInt(match[2]) : parseInt(match[2]);
        // Map bulan ke angka
        const bulanMap: Record<string, number> = {
          JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
          JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
        };
        const bulanAngka = bulanMap[bulanStr] || 1;
        // Aturan fiskal: Desember (12) → tahun fiskal = tahun+1, Jan–Nov → tahun fiskal = tahun
        tahunFiskal = bulanAngka >= 12 ? (tahunNum + 1).toString() : tahunNum.toString();
      }
    }
    if (!tahunFiskal) {
      return res.status(400).json({ message: 'tahun_fiskal tidak ditemukan dari bulan' });
    }
    // Cari dokumen tt_finance hanya berdasarkan kategori, sub_kategori, akun, tahun_fiskal
    let doc = await Transaksi.findOne({ kategori, sub_kategori, akun, tahun_fiskal: tahunFiskal });
    if (!doc) {
      // Buat baru jika belum ada
      doc = new Transaksi({
        kategori,
        sub_kategori,
        akun,
        data_bulanan: [{ bulan, nilai }],
        total_tahunan: nilai,
        input_by,
        tahun_fiskal: tahunFiskal,
        created_at: new Date(),
        updated_at: new Date(),
      });
    } else {
      // Update data_bulanan jika sudah ada
      const idx = doc.data_bulanan.findIndex((d: any) => d.bulan === bulan);
      if (idx >= 0) {
        doc.data_bulanan[idx].nilai = nilai;
      } else {
        doc.data_bulanan.push({ bulan, nilai });
      }
      // Hitung total tahunan
      doc.total_tahunan = doc.data_bulanan.reduce((sum: number, d: any) => sum + d.nilai, 0);
      doc.updated_at = new Date();
      doc.tahun_fiskal = tahunFiskal;
    }
    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const listTransaksi = async (req: Request, res: Response) => {
  try {
    const { tahun, page = '1', limit = '10', flatten = '0' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const doFlatten = String(flatten) === '1' || String(flatten).toLowerCase() === 'true';
    const filter: any = {};
    // Transaksi documents store fiscal year in `tahun_fiskal`.
    if (tahun) filter.tahun_fiskal = tahun;

    if (doFlatten) {
      // Aggregate to return flattened data_bulanan rows with pagination
      const matchStage = Object.keys(filter).length ? [{ $match: filter }] : [];
      // Unwind and project useful fields
      const pipeline: any[] = [
        ...matchStage,
        { $unwind: '$data_bulanan' },
        {
          $project: {
            kategori: 1,
            sub_kategori: 1,
            akun: 1,
            input_by: 1,
            tahun_fiskal: 1,
            bulan: '$data_bulanan.bulan',
            nilai: '$data_bulanan.nilai',
            parentId: '$_id',
          },
        },
        { $sort: { akun: 1, sub_kategori: 1, bulan: 1 } },
        {
          $facet: {
            pagedResults: [
              { $skip: (pageNum - 1) * limitNum },
              { $limit: limitNum },
            ],
            totalCount: [
              { $count: 'count' }
            ]
          }
        }
      ];

      const aggRes = await Transaksi.aggregate(pipeline).allowDiskUse(true).exec();
      const paged = aggRes[0]?.pagedResults || [];
      const total = (aggRes[0]?.totalCount && aggRes[0].totalCount[0] && aggRes[0].totalCount[0].count) || 0;
      const totalPages = Math.ceil(total / limitNum) || 1;
      return res.json({ data: paged, total, page: pageNum, totalPages });
    }

    // Default: return paginated documents (grouped per transaksi)
    const total = await Transaksi.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum) || 1;
    const list = await Transaksi.find(filter)
      .sort({ akun: 1, sub_kategori: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    res.json({ data: list, total, page: pageNum, totalPages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateTransaksi = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { kategori, sub_kategori, akun, bulan, nilai, input_by, tahun_fiskal } = req.body;
    // Otomatis ambil tahun fiskal dari bulan jika tidak dikirim
    let tahunFiskal = tahun_fiskal;
    if (!tahunFiskal && bulan) {
      const match = bulan.match(/([A-Z]+)\s*-\s*(\d{2,4})$/i);
      if (match) {
        const bulanStr = match[1].toUpperCase();
        let tahunNum = match[2].length === 2 ? 2000 + parseInt(match[2]) : parseInt(match[2]);
        const bulanMap: Record<string, number> = {
          JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
          JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
        };
        const bulanAngka = bulanMap[bulanStr] || 1;
        tahunFiskal = bulanAngka >= 12 ? (tahunNum + 1).toString() : tahunNum.toString();
      }
    }
    const doc = await Transaksi.findById(id);
    if (!doc) return res.status(404).json({ message: 'Transaksi not found' });
    // Update field utama
    if (kategori) doc.kategori = kategori;
    if (sub_kategori) doc.sub_kategori = sub_kategori;
    if (akun) doc.akun = akun;
    if (input_by) doc.input_by = input_by;
    if (tahun_fiskal) doc.tahun_fiskal = tahun_fiskal;
    // Update data_bulanan
    if (bulan && nilai !== undefined) {
      const idx = doc.data_bulanan.findIndex((d: any) => d.bulan === bulan);
      if (idx >= 0) {
        doc.data_bulanan[idx].nilai = nilai;
      } else {
        doc.data_bulanan.push({ bulan, nilai });
      }
    }
    doc.total_tahunan = doc.data_bulanan.reduce((sum: number, d: any) => sum + d.nilai, 0);
    doc.updated_at = new Date();
    await doc.save();
    res.json(doc);
  } catch (error) {
    console.error('❌ Error in updateTransaksi:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteTransaksi = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Transaksi.findByIdAndDelete(id);
    console.log('✅ Transaksi deleted:', id);
    res.json({ success: true, message: 'Transaksi deleted' });
  } catch (error) {
    console.error('❌ Error in deleteTransaksi:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
