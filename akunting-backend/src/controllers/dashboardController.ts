import { Request, Response } from 'express';
import Transaksi from '../models/Transaksi';
import Akun from '../models/Akun';

export const rekapAggregate = async (req: Request, res: Response) => {
  const tahun = Number(req.query.tahun) || new Date().getFullYear();
  // Cek apakah tahun sudah tutup buku (data ada di th_finance)
  const ThFinance = require('../models/ThFinance').default;
  const thFinanceCount = await ThFinance.countDocuments({ tahun_fiskal: tahun.toString() });
  let result = [];
  if (thFinanceCount > 0) {
    // Ambil data dari th_finance
    result = await ThFinance.aggregate([
      { $match: { tahun_fiskal: tahun.toString() } },
      { $unwind: '$data_bulanan' },
      {
        $group: {
          _id: {
            kategori: '$kategori',
            sub_kategori: '$sub_kategori',
            bulan: '$data_bulanan.bulan'
          },
          nilai_bulan: { $sum: '$data_bulanan.nilai' }
        }
      },
      {
        $group: {
          _id: {
            kategori: '$_id.kategori',
            sub_kategori: '$_id.sub_kategori'
          },
          data_bulanan: {
            $push: {
              bulan: '$_id.bulan',
              nilai: '$nilai_bulan'
            }
          },
          total_sub_kategori: { $sum: '$nilai_bulan' }
        }
      },
      {
        $group: {
          _id: '$_id.kategori',
          kategori: { $first: '$_id.kategori' },
          subs: {
            $push: {
              sub_kategori: '$_id.sub_kategori',
              total: '$total_sub_kategori'
            }
          },
          data_bulanan: { $push: '$data_bulanan' },
          total_kategori: { $sum: '$total_sub_kategori' }
        }
      },
      { $project: { kategori: 1, total_kategori: 1, subs: 1, data_bulanan: {
        $reduce: {
          input: '$data_bulanan',
          initialValue: [],
          in: { $concatArrays: ['$$value', '$$this'] }
        }
      } } }
    ]);
  } else {
    // Ambil data dari tt_finance
    result = await Transaksi.aggregate([
      { $unwind: '$data_bulanan' },
      {
        $match: {
          tahun_fiskal: tahun.toString()
        }
      },
      {
        $group: {
          _id: {
            kategori: '$kategori',
            sub_kategori: '$sub_kategori',
            bulan: '$data_bulanan.bulan'
          },
          nilai_bulan: { $sum: '$data_bulanan.nilai' }
        }
      },
      {
        $group: {
          _id: {
            kategori: '$_id.kategori',
            sub_kategori: '$_id.sub_kategori'
          },
          data_bulanan: {
            $push: {
              bulan: '$_id.bulan',
              nilai: '$nilai_bulan'
            }
          },
          total_sub_kategori: { $sum: '$nilai_bulan' }
        }
      },
      {
        $group: {
          _id: '$_id.kategori',
          kategori: { $first: '$_id.kategori' },
          subs: {
            $push: {
              sub_kategori: '$_id.sub_kategori',
              total: '$total_sub_kategori'
            }
          },
          data_bulanan: { $push: '$data_bulanan' },
          total_kategori: { $sum: '$total_sub_kategori' }
        }
      },
      { $project: { kategori: 1, total_kategori: 1, subs: 1, data_bulanan: {
        $reduce: {
          input: '$data_bulanan',
          initialValue: [],
          in: { $concatArrays: ['$$value', '$$this'] }
        }
      } } }
    ]);
  }
  res.json({ success: true, tahun, data: result });
};
