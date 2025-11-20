import { Request, Response } from 'express';
import TTFinance from '../models/Transaksi';
import ThFinance from '../models/ThFinance';
import Transaksi from '../models/Transaksi';
import { fiscalMonthsForYear } from '../utils/fiscal';
// GET /fiscal/years
export const getFiscalYears = async (req: Request, res: Response) => {
  try {
    // Ambil tahun fiskal dari semua transaksi dan th_finance
    const tahunTransaksi = await Transaksi.distinct('tahun_fiskal');
    const tahunThFinance = await ThFinance.distinct('tahun_fiskal');
    const tahunList = Array.from(new Set([...tahunTransaksi, ...tahunThFinance]))
      .map(t => parseInt(t)).filter(t => !isNaN(t)).sort((a, b) => b - a);
    res.json({ success: true, years: tahunList });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// GET /fiscal/months?tahun=xxxx
export const getFiscalMonths = async (req: Request, res: Response) => {
  try {
    const tahun = Number(req.query.tahun) || new Date().getFullYear();
    const months = fiscalMonthsForYear(tahun);
    res.json({ success: true, months });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// POST /fiscal/close
export const closeFiscalYear = async (req: Request, res: Response) => {
  try {
    const { fiscalYear } = req.body;
    if (!fiscalYear) return res.status(400).json({ message: 'Fiscal year required' });

    // Ambil semua transaksi tahun berjalan
    const transaksi = await TTFinance.find({ tahun_fiskal: fiscalYear });
    if (!transaksi.length) return res.status(404).json({ message: 'Tidak ada transaksi tahun berjalan' });

    // Migrasi ke th_finance: gabung data bulanan dalam satu dokumen per akun/kategori/sub_kategori/tahun fiskal
    const migrated = [];
    for (const trx of transaksi) {
      const thFinance = new ThFinance({
        kategori: trx.kategori,
        sub_kategori: trx.sub_kategori,
        akun: trx.akun,
        data_bulanan: trx.data_bulanan,
        total_tahunan: trx.total_tahunan,
        input_by: trx.input_by,
        tahun_fiskal: trx.tahun_fiskal || fiscalYear,
        created_at: trx.created_at,
        updated_at: trx.updated_at,
      });
      await thFinance.save();
      migrated.push(thFinance);
    }

    // Hapus transaksi tahun berjalan dari tt_finance
    await TTFinance.deleteMany({ tahun_fiskal: fiscalYear });

    // TODO: Set fiscal tahun baru sebagai aktif (implementasi tergantung model fiscal)

    res.json({ success: true, migratedCount: migrated.length });
  } catch (error) {
    console.error('❌ Error in closeFiscalYear:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
