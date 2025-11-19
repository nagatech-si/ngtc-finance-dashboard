export const createKategori = async (req: Request, res: Response) => {
  try {
    const { kategori, kode } = req.body;
    if (!kategori) return res.status(400).json({ message: 'kategori required' });

    let userId: string = req.body.input_by;
    if (!userId) {
      if (req.user && typeof req.user === 'object') {
        userId = (req.user as any).name || (req.user as any).username || (req.user as any)._id;
      } else if (typeof req.user === 'string') {
        userId = req.user;
      }
    }
    if (!userId) userId = 'system';
    const k = new Kategori({
      kategori,
      kode,
      input_date: new Date(),
      update_date: new Date(),
      delete_date: null,
      input_by: userId,
      update_by: null,
      delete_by: null,
    });

    await k.save();
    res.json(k);
  } catch (error) {
    console.error('❌ Error in createKategori:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Kategori, { IKategori } from '../models/Kategori';
import SubKategori, { ISubKategori } from '../models/SubKategori';
import Akun, { IAkun } from '../models/Akun';
import Transaksi from '../models/Transaksi';


// ==================== KATEGORI ====================

export const listKategori = async (req: Request, res: Response) => {
  try {
    let filter = {};
    if (!req.query.all) {
      filter = { status_aktv: true };
    };
    const list = await Kategori.find(filter).sort({ kategori: 1 });
    res.json(list);
  } catch (error) {
    console.error('❌ Error in listKategori:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ...existing code...

// ...existing code...

// ==================== SUBKATEGORI ====================
export const createSubKategori = async (req: Request, res: Response) => {
  try {
    const { sub_kategori, kode, kategori } = req.body;
    if (!sub_kategori || !kategori) return res.status(400).json({ message: 'sub_kategori & kategori required' });
    let userId: string = req.body.input_by;
    if (!userId) {
      if (req.user && typeof req.user === 'object') {
        userId = (req.user as any).name || (req.user as any).username || (req.user as any)._id;
      } else if (typeof req.user === 'string') {
        userId = req.user;
      }
    }
    if (!userId) userId = 'system';

    // Cek apakah sudah ada sub kategori dengan kode/nama sama
    const existing = await SubKategori.findOne({ sub_kategori, kode });
    if (existing) {
      if (existing.status_aktv === false) {
        // Reactivate
        existing.status_aktv = true;
        existing.update_date = new Date();
        existing.delete_date = null;
        existing.kategori = kategori;
        existing.input_by = userId;
        await existing.save();
        return res.json({ success: true, message: 'SubKategori diaktifkan kembali', data: existing });
      } else {
        // Sudah aktif, error duplicate
        // Kirim semua data subkategori (aktif & non-aktif) agar frontend bisa cari yang non-aktif
        const allData = await SubKategori.find({});
        return res.status(400).json({ code: 11000, message: 'SubKategori sudah ada', keyValue: { sub_kategori }, allData });
      }
    }

    // Jika belum ada, insert baru
    const s = new SubKategori({
      sub_kategori,
      kode,
      kategori,
      status_aktv: true,
      input_date: new Date(),
      update_date: new Date(),
      delete_date: null,
      input_by: userId,
      update_by: null,
      delete_by: null,
    });

    await s.save();
    res.json(s);
  } catch (error) {
    console.error('❌ Error in createSubKategori:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const listSubKategori = async (req: Request, res: Response) => {
  try {
    const { kategori } = req.query;
    const filter: any = {};
    if (kategori) {
      filter.kategori = kategori;
    }

    const list = await SubKategori.find({ ...filter, status_aktv: true }).sort({ sub_kategori: 1 });

    const formatted = list.map((s) => ({
      _id: s._id,
      sub_kategori: s.sub_kategori,
      kode: s.kode,
      kategori: s.kategori,
      input_date: s.input_date,
      update_date: s.update_date,
      delete_date: s.delete_date,
      input_by: s.input_by,
      update_by: s.update_by,
      delete_by: s.delete_by,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('❌ Error in listSubKategori:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


export const updateSubKategori = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sub_kategori, kode, kategori } = req.body;
    let userId: string = req.body.input_by;
    if (!userId) {
      if (req.user && typeof req.user === 'object') {
        userId = (req.user as any).name || (req.user as any).username || (req.user as any)._id;
      } else if (typeof req.user === 'string') {
        userId = req.user;
      }
    }
    if (!userId) userId = 'system';

    // Ambil sub_kategori lama
    const oldSubKategori = await SubKategori.findById(id);
    if (!oldSubKategori) return res.status(404).json({ message: 'SubKategori not found' });

    const s = await SubKategori.findByIdAndUpdate(
      id,
      { sub_kategori, kode, kategori, update_date: new Date(), update_by: userId, status_aktv: req.body.status_aktv ?? true },
      { new: true }
    );

    if (!s) return res.status(404).json({ message: 'SubKategori not found' });
    // Update relasi akun: ganti semua akun yang punya sub_kategori lama ke sub_kategori baru
    await Akun.updateMany({ sub_kategori: oldSubKategori.sub_kategori }, { sub_kategori });
    res.json(s);
  } catch (error) {
    console.error('❌ Error in updateSubKategori:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteSubKategori = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let userId: string = req.body.input_by;
    if (!userId) {
      if (req.user && typeof req.user === 'object') {
        userId = (req.user as any).name || (req.user as any).username || (req.user as any)._id;
      } else if (typeof req.user === 'string') {
        userId = req.user;
      }
    }
    if (!userId) userId = 'system';

    const subkategori = await SubKategori.findById(id);
    if (!subkategori) return res.status(404).json({ message: 'SubKategori not found' });
    // Cek apakah ada akun yang pakai sub kategori ini
    const akunUsed = await Akun.findOne({ sub_kategori: subkategori.sub_kategori });
    if (akunUsed) return res.status(400).json({ message: 'Maaf, data ini sudah ada transaksi/akun.' });
    subkategori.status_aktv = false;
    subkategori.delete_date = new Date();
    subkategori.delete_by = userId || 'system';
    await subkategori.save();
    res.json({ success: true, message: 'SubKategori non-aktif', data: subkategori });
  } catch (error) {
    console.error('❌ Error in deleteSubKategori:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ==================== AKUN ====================

export const listAkun = async (req: Request, res: Response) => {
  try {
    const { sub_kategori } = req.query;
    const filter: any = {};
    if (sub_kategori) {
      filter.sub_kategori = sub_kategori;
    }

    // Ambil data akun dan join sub kategori agar dapat _id
    const akunList = await Akun.find({ ...filter, status_aktv: true }).sort({ akun: 1 });
    // Cari sub kategori berdasarkan nama untuk dapatkan _id
    const subKategoriAll = await SubKategori.find({});
    const list = akunList.map((a) => {
      const subKategoriObj = subKategoriAll.find(
        (sub) => sub.sub_kategori === a.sub_kategori
      );
      return {
        ...a.toObject(),
        subkategori_id: subKategoriObj ? subKategoriObj._id : '',
      };
    });
    res.json(list);
  } catch (error) {
    console.error('❌ Error in listAkun:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createAkun = async (req: Request, res: Response) => {
  try {
    const { sub_kategori, akun, kode } = req.body;
    if (!sub_kategori || !akun) return res.status(400).json({ message: 'sub_kategori & akun required' });
    let userId: string = req.body.input_by;
    if (!userId) {
      if (req.user && typeof req.user === 'object') {
        userId = (req.user as any).name || (req.user as any).username || (req.user as any)._id;
      } else if (typeof req.user === 'string') {
        userId = req.user;
      }
    }
    if (!userId) userId = 'system';

    // sub_kategori dikirim sebagai _id, ambil semua relasi sub kategori
    let subKategoriNama = sub_kategori;
    let subKategoriId = null;
    let subKategoriKode = '';
    let kategoriNama = '';
    if (mongoose.Types.ObjectId.isValid(sub_kategori)) {
      const subKategoriDoc = await SubKategori.findById(sub_kategori);
      if (!subKategoriDoc) return res.status(400).json({ message: 'SubKategori tidak ditemukan' });
      subKategoriNama = subKategoriDoc.sub_kategori;
      subKategoriId = subKategoriDoc._id;
      subKategoriKode = subKategoriDoc.kode;
      kategoriNama = subKategoriDoc.kategori;
    }

    const a = new Akun({
      sub_kategori: subKategoriNama,
      sub_kategori_id: subKategoriId,
      sub_kategori_kode: subKategoriKode,
      kategori: kategoriNama,
      akun,
      kode,
      input_date: new Date(),
      update_date: new Date(),
      delete_date: null,
      input_by: userId,
      update_by: null,
      delete_by: null,
    });

    await a.save();
    res.json(a);
  } catch (error) {
    console.error('\u274c Error in createAkun:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateAkun = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sub_kategori, akun, kode } = req.body;
    let userId: string = req.body.input_by;
    if (!userId) {
      if (req.user && typeof req.user === 'object') {
        userId = (req.user as any).name || (req.user as any).username || (req.user as any)._id;
      } else if (typeof req.user === 'string') {
        userId = req.user;
      }
    }
    if (!userId) userId = 'system';

    // Ambil akun lama
    const oldAkun = await Akun.findById(id);
    if (!oldAkun) return res.status(404).json({ message: 'Akun not found' });

    // sub_kategori dikirim sebagai _id, ambil nama sub kategori
    let subKategoriNama = sub_kategori;
    if (mongoose.Types.ObjectId.isValid(sub_kategori)) {
      const subKategoriDoc = await SubKategori.findById(sub_kategori);
      if (!subKategoriDoc) return res.status(400).json({ message: 'SubKategori tidak ditemukan' });
      subKategoriNama = subKategoriDoc.sub_kategori;
    }

    const a = await Akun.findByIdAndUpdate(
      id,
      { sub_kategori: subKategoriNama, akun, kode, update_date: new Date(), update_by: userId, status_aktv: req.body.status_aktv ?? true },
      { new: true }
    );

    if (!a) return res.status(404).json({ message: 'Akun not found' });
    // Update relasi transaksi: ganti semua transaksi yang punya akun lama ke akun baru
    await Transaksi.updateMany({ akun: oldAkun._id }, { akun: a._id });
    res.json(a);
  } catch (error) {
    console.error('\u274c Error in updateAkun:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteAkun = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let userId: string = req.body.input_by;
    if (!userId) {
      if (req.user && typeof req.user === 'object') {
        userId = (req.user as any).name || (req.user as any).username || (req.user as any)._id;
      } else if (typeof req.user === 'string') {
        userId = req.user;
      }
    }
    if (!userId) userId = 'system';

    const akun = await Akun.findById(id);
    if (!akun) return res.status(404).json({ message: 'Akun not found' });
    // Cek apakah ada transaksi yang pakai akun ini
    const transaksiUsed = await Transaksi.findOne({ akun: akun._id });
    if (transaksiUsed) return res.status(400).json({ message: 'Maaf, data ini sudah ada transaksi.' });
    akun.status_aktv = false;
    akun.delete_date = new Date();
    akun.delete_by = userId || 'system';
    await akun.save();
    res.json({ success: true, message: 'Akun non-aktif', data: akun });
  } catch (error) {
    console.error('❌ Error in deleteAkun:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
