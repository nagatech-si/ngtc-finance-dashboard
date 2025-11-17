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
    {
      $group: {
        _id: {
          kategori: '$kategori',
          sub_kategori: '$sub_kategori'
        },
        total: { $sum: '$data_bulanan.nilai' }
      }
    },
    {
      $group: {
        _id: '$_id.kategori',
        kategori: { $first: '$_id.kategori' },
        subs: {
          $push: {
            sub_kategori: '$_id.sub_kategori',
            total: '$total'
          }
        },
        total_kategori: { $sum: '$total' }
      }
    },
    { $project: { kategori: 1, total_kategori: 1, subs: 1 } }
  ];

  const result = await Transaksi.aggregate(pipeline);
  res.json({ success: true, tahun, data: result });
};
