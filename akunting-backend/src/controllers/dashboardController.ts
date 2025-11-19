import { Request, Response } from 'express';
import Transaksi from '../models/Transaksi';
import Akun from '../models/Akun';

export const rekapAggregate = async (req: Request, res: Response) => {
  const tahun = Number(req.query.tahun) || new Date().getFullYear();
  // Unwind data_bulanan, filter tahun, group by kategori & sub_kategori
  const pipeline = [
    { $unwind: '$data_bulanan' },
    {
      $match: {
        $expr: {
          $eq: [ { $year: '$created_at' }, tahun ]
        }
      }
    },
    // Group per kategori, sub_kategori, bulan
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
    // Group per kategori, sub_kategori
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
    // Group per kategori
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
  ];

  const result = await Transaksi.aggregate(pipeline);
  res.json({ success: true, tahun, data: result });
};
