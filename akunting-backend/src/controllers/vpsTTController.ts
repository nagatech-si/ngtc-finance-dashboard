import { Request, Response } from 'express';
import TTVpsDetail, { ITTVpsDetail, IVpsDetailItem } from '../models/TTVpsDetail';
import TTVps from '../models/TTVps';
import Subscriber from '../models/Subscriber';
import { addDays, addMonths, calcTempo, enumerateMonthsInclusive, toPeriod, formatYMD } from '../utils/vpsPeriod';
import mongoose from 'mongoose';

type CreateScheduleBody = {
  subscriber_id?: string;
  toko?: string;
  program?: string;
  harga?: number;
  start: string; // YYYY-MM-DD
  bulan: number; // initial term months
  diskon?: number; // applied to first month
};

function sum(arr: number[]): number { return arr.reduce((a, b) => a + b, 0); }

async function recalcAggregateForPeriode(periode: string, user: any) {
  const doc = await TTVpsDetail.findOne({ periode });
  const details = doc?.detail ?? [];
  const estimasi = sum(details.map(d => d.total_harga));
  const realisasi = sum(details.filter(d => d.status === 'DONE').map(d => d.total_harga));
  const open = estimasi - realisasi;
  const total_toko = details.length;
  await TTVps.updateOne(
    { periode },
    {
      $set: {
        periode,
        estimasi,
        realisasi,
        open,
        total_toko,
        updated_at: new Date(),
        update_date: new Date(),
        update_by: user?.username || user?._id || 'system',
      },
      $setOnInsert: {
        input_date: new Date(),
        input_by: user?.username || user?._id || 'system',
      },
    },
    { upsert: true }
  );
}

function getFiscalEndMonth(start: Date): Date {
  const y = start.getUTCFullYear();
  const m = start.getUTCMonth(); // 0..11
  const endYear = m === 11 ? y + 1 : y; // if Dec, next year's Nov; else same year's Nov
  return new Date(Date.UTC(endYear, 10, 1)); // November 1st
}

function lastDayOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}

export const createSchedule = async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateScheduleBody;
    if (!body || !body.start || !body.bulan) {
      return res.status(400).json({ message: 'start and bulan are required' });
    }
    let toko = body.toko;
    let program = body.program;
    let harga = body.harga;

    if (body.subscriber_id) {
      const sub = await Subscriber.findById(body.subscriber_id);
      if (!sub) return res.status(400).json({ message: 'subscriber not found' });
      toko = sub.toko;
      program = sub.program;
      harga = sub.biaya;
    }

    if (!toko || !program || typeof harga !== 'number') {
      return res.status(400).json({ message: 'toko, program, harga are required (or provide subscriber_id)' });
    }
    const diskonFirst = body.diskon ?? 0;
    const startDate = new Date(body.start + 'T00:00:00.000Z');
    if (isNaN(startDate.getTime())) return res.status(400).json({ message: 'invalid start date' });

    const userTag = (req as any).user?.username || (req as any).user?._id || 'system';

    // Build schedule: first term uses "bulan" months, next terms are monthly until fiscal end (November)
    const firstTempo = calcTempo(startDate, body.bulan);
    const fiscalEndMonth = getFiscalEndMonth(startDate); // Nov 1st of fiscal end year
    const fiscalEndDate = lastDayOfMonth(new Date(Date.UTC(fiscalEndMonth.getUTCFullYear(), fiscalEndMonth.getUTCMonth(), 1)));

    const entries: { start: Date; bulan: number; tempo: Date; diskon: number }[] = [];

    // First term
    entries.push({ start: startDate, bulan: body.bulan, tempo: firstTempo, diskon: diskonFirst });

    // Continue monthly until fiscal end
    let cursorStart = addDays(firstTempo, 1);
    while (cursorStart <= fiscalEndDate) {
      const tempo = calcTempo(cursorStart, 1);
      entries.push({ start: cursorStart, bulan: 1, tempo, diskon: 0 });
      cursorStart = addDays(tempo, 1);
    }

    // Persist entries grouped by periode (YYYY-MM of start date)
    const affectedPeriodes = new Set<string>();
    const chainId = new mongoose.Types.ObjectId().toString();
    for (const e of entries) {
      const periode = toPeriod(e.start);
      affectedPeriodes.add(periode);
      const item: IVpsDetailItem = {
        chain_id: chainId,
        toko: toko!,
        program: program!,
        start: formatYMD(e.start),
        bulan: e.bulan,
        tempo: formatYMD(e.tempo),
        harga: harga!,
        jumlah_harga: harga! * e.bulan,
        diskon: e.diskon,
        total_harga: harga! * e.bulan - e.diskon,
        status: 'OPEN',
      };

      const now = new Date();
      const setOnInsert = {
        input_date: now,
        input_by: userTag,
      };
      await TTVpsDetail.updateOne(
        { periode },
        {
          $setOnInsert: setOnInsert,
          $set: { update_date: now, update_by: userTag },
          $push: { detail: item },
        },
        { upsert: true }
      );
    }

    // Recalculate aggregates
    for (const p of affectedPeriodes) {
      await recalcAggregateForPeriode(p, (req as any).user);
    }

    return res.json({ message: 'schedule created', months: entries.length });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'internal error', error: err?.message });
  }
};

export const getDetailsByPeriode = async (req: Request, res: Response) => {
  try {
    const { periode } = req.query as { periode?: string };
    if (!periode) return res.status(400).json({ message: 'periode is required' });
    const doc = await TTVpsDetail.findOne({ periode });
    return res.json(doc || null);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'internal error', error: err?.message });
  }
};

export const getAggregateByPeriode = async (req: Request, res: Response) => {
  try {
    const { periode } = req.query as { periode?: string };
    if (!periode) return res.status(400).json({ message: 'periode is required' });
    const doc = await TTVps.findOne({ periode });
    return res.json(doc || null);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'internal error', error: err?.message });
  }
};

export const updateItemStatus = async (req: Request, res: Response) => {
  try {
    const { periode, itemId } = req.params as { periode: string; itemId: string };
    const { status } = req.body as { status: 'OPEN' | 'DONE' };
    if (!['OPEN', 'DONE'].includes(status)) return res.status(400).json({ message: 'invalid status' });
    const userTag = (req as any).user?.username || (req as any).user?._id || 'system';

    const doc = await TTVpsDetail.findOne({ periode });
    if (!doc) return res.status(404).json({ message: 'periode not found' });
    const item = doc.detail.id(itemId);
    if (!item) return res.status(404).json({ message: 'item not found' });
    item.status = status;
    doc.update_date = new Date();
    (doc as any).update_by = userTag;
    await doc.save();

    await recalcAggregateForPeriode(periode, (req as any).user);
    return res.json({ message: 'status updated' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'internal error', error: err?.message });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const { periode, itemId } = req.params as { periode: string; itemId: string };
    const userTag = (req as any).user?.username || (req as any).user?._id || 'system';
    const doc = await TTVpsDetail.findOne({ periode });
    if (!doc) return res.status(404).json({ message: 'periode not found' });
    const before = doc.detail.length;
    doc.detail = doc.detail.filter((d: any) => String(d._id) !== String(itemId));
    if (doc.detail.length === before) return res.status(404).json({ message: 'item not found' });
    doc.update_date = new Date();
    (doc as any).update_by = userTag;
    await doc.save();

    await recalcAggregateForPeriode(periode, (req as any).user);
    return res.json({ message: 'item deleted' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'internal error', error: err?.message });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const { periode, itemId } = req.params as { periode: string; itemId: string };
    const { start, bulan, harga, diskon, status } = req.body as Partial<{ start: string; bulan: number; harga: number; diskon: number; status: 'OPEN'|'DONE' }>;
    const userTag = (req as any).user?.username || (req as any).user?._id || 'system';
    const doc = await TTVpsDetail.findOne({ periode });
    if (!doc) return res.status(404).json({ message: 'periode not found' });
    const item = doc.detail.id(itemId) as any;
    if (!item) return res.status(404).json({ message: 'item not found' });

    // Validasi start (jika diubah) tetap dalam periode
    let newStart = typeof start === 'string' && start ? start : (item.start as string);
    if (newStart) {
      const ym = newStart.slice(0,7);
      if (ym !== periode) return res.status(400).json({ message: 'start harus tetap di periode yang sama' });
    }

    const newBulan = (typeof bulan === 'number' && bulan > 0) ? bulan : item.bulan;
    const newHarga = (typeof harga === 'number' && harga >= 0) ? harga : item.harga;
    const newDiskon = (typeof diskon === 'number' && diskon >= 0) ? diskon : item.diskon;
    const newStatus = status && (status === 'OPEN' || status === 'DONE') ? status : item.status;

    // Pastikan chain_id ada
    const chainId: string = item.chain_id || new mongoose.Types.ObjectId().toString();
    item.chain_id = chainId;

    // Hapus entry lama pada periode saat ini (hindari duplikasi saat insert baru)
    doc.detail = (doc.detail as any).filter((d: any) => String(d._id) !== String(itemId));
    doc.update_date = new Date();
    (doc as any).update_by = userTag;
    await doc.save();

    // Bangun ulang jadwal dari periode ini s/d akhir fiskal (Nov)
    const startDateObj = new Date(newStart + 'T00:00:00.000Z');
    const firstTempo = calcTempo(startDateObj, newBulan);
    const endYear = startDateObj.getUTCMonth() === 11 ? startDateObj.getUTCFullYear() + 1 : startDateObj.getUTCFullYear();
    const fiscalEndDate = new Date(Date.UTC(endYear, 11, 0)); // last day of Nov

    const entries: { start: Date; bulan: number; tempo: Date; diskon: number }[] = [];
    // Entry pertama: sesuai input bulan baru
    entries.push({ start: startDateObj, bulan: newBulan, tempo: firstTempo, diskon: newDiskon });
    // Entry sisa: gabungkan menjadi SATU entry sampai akhir fiskal (Nov) jika masih ada sisa bulan
    const cursorStart = addDays(firstTempo, 1);
    if (cursorStart <= fiscalEndDate) {
      const startIdx = cursorStart.getUTCFullYear() * 12 + cursorStart.getUTCMonth();
      const endIdx = fiscalEndDate.getUTCFullYear() * 12 + 10; // November (10)
      const remMonths = endIdx - startIdx + 1;
      if (remMonths > 0) {
        const tempo = calcTempo(cursorStart, remMonths);
        entries.push({ start: cursorStart, bulan: remMonths, tempo, diskon: 0 });
      }
    }

    // Hapus item lama chain_id pada SEMUA periode dari periode edit sampai akhir fiskal
    const affected = new Set<string>();
    const fromDate = new Date(periode + '-01T00:00:00.000Z');
    const monthsRange = enumerateMonthsInclusive(fromDate, fiscalEndDate);
    for (const p of monthsRange) {
      affected.add(p);
      const pullCond: any = { $or: [{ chain_id: chainId }] };
      if (item.ref_id) pullCond.$or.push({ ref_id: item.ref_id });
      await TTVpsDetail.updateOne(
        { periode: p },
        { $pull: { detail: pullCond }, $set: { update_date: new Date(), update_by: userTag } },
        { upsert: true }
      );
    }

    // Tambahkan item baru untuk tiap periode dari hasil rebuild
    for (const e of entries) {
      const p = toPeriod(e.start);
      const now = new Date();
      const newItem: IVpsDetailItem = {
        chain_id: chainId,
        toko: item.toko,
        program: item.program,
        start: formatYMD(e.start),
        bulan: e.bulan,
        tempo: formatYMD(e.tempo),
        harga: newHarga,
        jumlah_harga: newHarga * e.bulan,
        diskon: e.diskon,
        total_harga: newHarga * e.bulan - e.diskon,
        status: newStatus,
        ref_id: item.ref_id,
      };
      await TTVpsDetail.updateOne(
        { periode: p },
        { $setOnInsert: { input_date: now, input_by: userTag }, $set: { update_date: now, update_by: userTag }, $push: { detail: newItem } },
        { upsert: true }
      );
    }

    // Recalc agregat utk semua periode terdampak
    for (const p of affected) {
      await recalcAggregateForPeriode(p, (req as any).user);
    }

    return res.json({ message: 'item chain updated', affected: Array.from(affected) });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'internal error', error: err?.message });
  }
};
