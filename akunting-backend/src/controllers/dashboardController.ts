import { Request, Response } from 'express';

export const rekapAggregate = async (req: Request, res: Response) => {
  const tahun = String(req.query.tahun || new Date().getFullYear());
  const filterBulan = req.query.bulan ? String(req.query.bulan).toUpperCase() : null;

  // Model
  const ThFinance = require('../models/ThFinance').default;
  const Transaksi = require('../models/Transaksi').default;
  const Subscriber = require('../models/Subscriber').default;

  // Cek apakah sudah tutup buku
  const thFinanceCount = await ThFinance.countDocuments({ tahun_fiskal: tahun });

  // Pilih collection
  const Collection = thFinanceCount > 0 ? ThFinance : Transaksi;
  const order = ["DEC", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV"];

function sortDataBulanan(arr: any) {
  return arr.map((item : any) => {
    item.data_bulanan = item.data_bulanan.sort((a : any, b: any) => {
      const bulanA = a.bulan.substring(0, 3); // contoh: "DEC"
      const bulanB = b.bulan.substring(0, 3);

      return order.indexOf(bulanA) - order.indexOf(bulanB);
    });
    return item;
  });
}

function sortDataGross(arr: any) {
  return arr.sort((a: any, b: any) => {
    const bulanA = a.bulan.substring(0, 3);
    const bulanB = b.bulan.substring(0, 3);
    return order.indexOf(bulanA) - order.indexOf(bulanB);
  });
}
  // ===========================
  // DYNAMIC PIPELINE
  // ===========================

  const pipeline: any[] = [
    { $match: { tahun_fiskal: tahun } },
    { $unwind: '$data_bulanan' },
  ];

  // ➤ Tambahkan filter bulan hanya jika query bulan ada
  if (filterBulan) {
    pipeline.push({
      $match: {
        "data_bulanan.bulan": {
          $regex: filterBulan,
          $options: "i"
        }
      }
    });
  }

  pipeline.push(
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
                total_kategori: { $sum: '$total_sub_kategori' }
      }
    },
    {
      $project: {
        kategori: 1,
        total_kategori: 1,
        subs: 1,
      }
    }
  );

  const pipelineAsetDanGaji: any[] = [
    { $match: { tahun_fiskal: tahun } },
    { $unwind: '$data_bulanan' },
  ];

  // ➤ Tambahkan filter bulan hanya jika query bulan ada
  if (filterBulan) {
    pipelineAsetDanGaji.push({
      $match: {
        "data_bulanan.bulan": {
          $regex: filterBulan,
          $options: "i"
        }
      }
    });
  }

  pipelineAsetDanGaji.push(
    {
      $match: {
        kategori: "BIAYA",
        sub_kategori: { $in: ["ASET", "ASET INVESTASI", "CICILAN GEDUNG", "CICILAN KENDARAAN", "GAJI"] }
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
        total_kategori: { $sum: '$total_sub_kategori' }
      }
    },
    {
      $project: {
        kategori: "ASET DAN GAJI",
        total_kategori: 1,
        subs: 1,
      }
    }
  );

  const pipelineBiayaBiaya: any[] = [
    { $match: { tahun_fiskal: tahun } },
    { $unwind: '$data_bulanan' },
  ];

  // ➤ Tambahkan filter bulan hanya jika query bulan ada
  if (filterBulan) {
    pipelineBiayaBiaya.push({
      $match: {
        "data_bulanan.bulan": {
          $regex: filterBulan,
          $options: "i"
        }
      }
    });
  }

  pipelineBiayaBiaya.push(
    {
      $match: {
        kategori: "BIAYA",
        sub_kategori: { $in: ["PPH21", "VPS", "RND", "BPJS", "RETUR PENJUALAN"] }
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
        total_kategori: { $sum: '$total_sub_kategori' }
      }
    },
    {
      $project: {
        kategori: "BIAYA BIAYA",
        total_kategori: 1,
        subs: 1,
      }
    }
  );

  const pipelinePertahun: any[] = [
    { $match: { tahun_fiskal: tahun } },
    { $unwind: '$data_bulanan' },
    {
      $group: {
        _id: {
          kategori: '$kategori',
          bulan: '$data_bulanan.bulan'
        },
        total_bulan: { $sum: '$data_bulanan.nilai' }
      }
    },
    {
      $group: {
        _id: '$_id.kategori',
        kategori: { $first: '$_id.kategori' },
        data_bulanan: {
          $push: {
            bulan: '$_id.bulan',
            total: '$total_bulan'
          }
        },
        total_tahunan: { $sum: '$total_bulan' }
      }
    },
    {
      $project: {
        kategori: 1,
        data_bulanan: 1,
        total_tahunan: 1
      }
    },
    {
      $sort: { kategori: 1 }
    }
  ];

  const pipelineAsetDanGajiTahunan: any[] = [
    { $match: { tahun_fiskal: tahun } },
    {
      $match: {
        kategori: "BIAYA",
        sub_kategori: { $in: ["ASET", "ASET INVESTASI", "CICILAN GEDUNG", "CICILAN KENDARAAN", "GAJI"] }
      }
    },
    {
      $addFields: {
        group: {
          $cond: {
            if: { $eq: ["$sub_kategori", "GAJI"] },
            then: "GAJI",
            else: "ASET"
          }
        }
      }
    },
    { $unwind: '$data_bulanan' },
  ];

  // ➤ Tambahkan filter bulan hanya jika query bulan ada
  if (filterBulan) {
    pipelineAsetDanGajiTahunan.push({
      $match: {
        "data_bulanan.bulan": {
          $regex: filterBulan,
          $options: "i"
        }
      }
    });
  }

  pipelineAsetDanGajiTahunan.push(
    {
      $group: {
        _id: {
          group: '$group',
          bulan: '$data_bulanan.bulan'
        },
        total_bulan: { $sum: '$data_bulanan.nilai' }
      }
    },
    {
      $group: {
        _id: '$_id.group',
        group: { $first: '$_id.group' },
        data_bulanan: {
          $push: {
            bulan: '$_id.bulan',
            total: '$total_bulan'
          }
        },
        total_tahunan: { $sum: '$total_bulan' }
      }
    },
    {
      $project: {
        group: 1,
        data_bulanan: 1,
        total_tahunan: 1
      }
    },
    {
      $sort: { group: 1 }
    }
  );

  const pipelineImplementasiMarketingLainnyaTahunan: any[] = [
    { $match: { tahun_fiskal: tahun } },
    {
      $match: {
        kategori: "BIAYA",
        sub_kategori: { $in: ["IMPLEMENTASI", "MARKETING", "LAIN LAIN"] }
      }
    },
    { $unwind: '$data_bulanan' },
  ];

  // ➤ Tambahkan filter bulan hanya jika query bulan ada
  if (filterBulan) {
    pipelineImplementasiMarketingLainnyaTahunan.push({
      $match: {
        "data_bulanan.bulan": {
          $regex: filterBulan,
          $options: "i"
        }
      }
    });
  }

  pipelineImplementasiMarketingLainnyaTahunan.push(
    {
      $group: {
        _id: {
          sub_kategori: '$sub_kategori',
          bulan: '$data_bulanan.bulan'
        },
        total_bulan: { $sum: '$data_bulanan.nilai' }
      }
    },
    {
      $group: {
        _id: '$_id.sub_kategori',
        sub_kategori: { $first: '$_id.sub_kategori' },
        data_bulanan: {
          $push: {
            bulan: '$_id.bulan',
            total: '$total_bulan'
          }
        },
        total_tahunan: { $sum: '$total_bulan' }
      }
    },
    {
      $project: {
        sub_kategori: 1,
        data_bulanan: 1,
        total_tahunan: 1
      }
    },
    {
      $sort: { sub_kategori: 1 }
    }
  );

  const pipelineBiayaBiayaTahunan: any[] = [
    { $match: { tahun_fiskal: tahun } },
    {
      $match: {
        kategori: "BIAYA",
        sub_kategori: { $in: ["PPH21", "VPS", "RND", "BPJS", "RETUR PENJUALAN"] }
      }
    },
    { $unwind: '$data_bulanan' },
  ];

  // ➤ Tambahkan filter bulan hanya jika query bulan ada
  if (filterBulan) {
    pipelineBiayaBiayaTahunan.push({
      $match: {
        "data_bulanan.bulan": {
          $regex: filterBulan,
          $options: "i"
        }
      }
    });
  }

  pipelineBiayaBiayaTahunan.push(
    {
      $group: {
        _id: {
          sub_kategori: '$sub_kategori',
          bulan: '$data_bulanan.bulan'
        },
        total_bulan: { $sum: '$data_bulanan.nilai' }
      }
    },
    {
      $group: {
        _id: '$_id.sub_kategori',
        sub_kategori: { $first: '$_id.sub_kategori' },
        data_bulanan: {
          $push: {
            bulan: '$_id.bulan',
            total: '$total_bulan'
          }
        },
        total_tahunan: { $sum: '$total_bulan' }
      }
    },
    {
      $project: {
        sub_kategori: 1,
        data_bulanan: 1,
        total_tahunan: 1
      }
    },
    {
      $sort: { sub_kategori: 1 }
    }
  );

  const pipelineGrossMarginTahunan: any[] = [
    { $match: { tahun_fiskal: tahun } },
    {
      $match: {
        kategori: { $in: ["PENDAPATAN", "BIAYA", "PEMBELIAN"] }
      }
    },
    { $unwind: '$data_bulanan' },
  ];

  // ➤ Tambahkan filter bulan hanya jika query bulan ada
  if (filterBulan) {
    pipelineGrossMarginTahunan.push({
      $match: {
        "data_bulanan.bulan": {
          $regex: filterBulan,
          $options: "i"
        }
      }
    });
  }

  pipelineGrossMarginTahunan.push(
    {
      $group: {
        _id: {
          kategori: '$kategori',
          bulan: '$data_bulanan.bulan'
        },
        total_bulan: { $sum: '$data_bulanan.nilai' }
      }
    },
    {
      $group: {
        _id: '$_id.bulan',
        bulan: { $first: '$_id.bulan' },
        totals: {
          $push: {
            kategori: '$_id.kategori',
            total: '$total_bulan'
          }
        }
      }
    },
    {
      $project: {
        bulan: 1,
        omzet: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$totals',
                    cond: { $eq: ['$$this.kategori', 'PENDAPATAN'] }
                  }
                },
                0
              ]
            },
            { total: 0 }
          ]
        },
        biaya: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$totals',
                    cond: { $eq: ['$$this.kategori', 'BIAYA'] }
                  }
                },
                0
              ]
            },
            { total: 0 }
          ]
        },
        pembelian: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$totals',
                    cond: { $eq: ['$$this.kategori', 'PEMBELIAN'] }
                  }
                },
                0
              ]
            },
            { total: 0 }
          ]
        }
      }
    },
    {
      $project: {
        bulan: 1,
        gross_margin: {
          $subtract: [
            { $subtract: ['$omzet.total', '$biaya.total'] },
            '$pembelian.total'
          ]
        }
      }
    },
    {
      $sort: {
        bulan: 1
      }
    }
  );

  // ===========================
  // RUN PIPELINE
  // ===========================

  const result = await Collection.aggregate(pipeline);
  const resultAsetDanGaji = await Collection.aggregate(pipelineAsetDanGaji);
  const resultBiayaBiaya = await Collection.aggregate(pipelineBiayaBiaya);
  let resultPertahun = await Collection.aggregate(pipelinePertahun);
  const resultAsetDanGajiTahunan = await Collection.aggregate(pipelineAsetDanGajiTahunan);
  const resultImplementasiMarketingLainnyaTahunan = await Collection.aggregate(pipelineImplementasiMarketingLainnyaTahunan);
  const resultBiayaBiayaTahunan = await Collection.aggregate(pipelineBiayaBiayaTahunan);
  const resultGrossMarginTahunan = await Collection.aggregate(pipelineGrossMarginTahunan);
  
  res.json({
    success: true,
    tahun,
    bulan: filterBulan || null,
    data: result,
    asetDanGaji: resultAsetDanGaji,
    biayaBiaya: resultBiayaBiaya,
    pertahun: sortDataBulanan(resultPertahun),
    asetDanGajiTahunan: sortDataBulanan(resultAsetDanGajiTahunan),
    implementasiMarketingLainnyaTahunan: sortDataBulanan(resultImplementasiMarketingLainnyaTahunan),
    biayaBiayaTahunan: sortDataBulanan(resultBiayaBiayaTahunan),
    grossMarginTahunan: sortDataGross(resultGrossMarginTahunan),
  });
};
