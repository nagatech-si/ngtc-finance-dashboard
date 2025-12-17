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
  daerah?: string;
  harga?: number;
  start: string; // YYYY-MM-DD
  bulan: number; // initial term months
  diskon?: number; // applied to first month
  diskon_percent?: number; // applied to first term
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
    let daerah = body.daerah;
    let harga = body.harga;

    if (body.subscriber_id) {
      const sub = await Subscriber.findById(body.subscriber_id);
      if (!sub) return res.status(400).json({ message: 'subscriber not found' });
      toko = sub.toko;
      program = sub.program;
      daerah = sub.daerah;
      harga = sub.biaya;
    }

    if (!toko || !program || !daerah || typeof harga !== 'number') {
      return res.status(400).json({ message: 'toko, program, daerah, harga are required (or provide subscriber_id)' });
    }
    const diskonFirst = body.diskon ?? 0;
    const diskonPercentFirst = typeof body.diskon_percent === 'number' ? Math.max(0, Math.min(100, body.diskon_percent)) : 0;
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
      const jumlah_harga = harga! * e.bulan;
      const item: IVpsDetailItem = {
        chain_id: chainId,
        toko: toko!,
        program: program!,
        daerah: daerah!,
        start: formatYMD(e.start),
        bulan: e.bulan,
        tempo: formatYMD(e.tempo),
        harga: harga!,
        jumlah_harga,
        diskon: e.diskon,
        diskon_percent: e === entries[0] ? (diskonPercentFirst || (jumlah_harga > 0 ? Math.round((diskonFirst / jumlah_harga) * 100) : 0)) : 0,
        total_harga: jumlah_harga - e.diskon,
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
    // Try to read existing aggregate doc
    const existing = await TTVps.findOne({ periode });

    // Always read details to verify correctness or compute fallback
    const detailsDoc = await TTVpsDetail.findOne({ periode });
    const hasDetails = !!(detailsDoc && detailsDoc.detail && detailsDoc.detail.length > 0);
    const computedEstimasi = hasDetails ? sum(detailsDoc!.detail.map((d: any) => d.total_harga || 0)) : 0;
    const computedRealisasi = hasDetails ? sum(detailsDoc!.detail.filter((d: any) => d.status === 'DONE').map((d: any) => d.total_harga || 0)) : 0;
    const computedOpen = computedEstimasi - computedRealisasi;
    const computedTotalToko = hasDetails ? detailsDoc!.detail.length : 0;

    // If aggregate exists and matches non-zero computed values, return it
    if (existing) {
      const needsUpdate = (
        existing.estimasi !== computedEstimasi ||
        existing.realisasi !== computedRealisasi ||
        existing.open !== computedOpen ||
        existing.total_toko !== computedTotalToko
      );
      if (needsUpdate && hasDetails) {
        // Update aggregate to reflect current details
        await TTVps.updateOne(
          { periode },
          {
            $set: {
              estimasi: computedEstimasi,
              realisasi: computedRealisasi,
              open: computedOpen,
              total_toko: computedTotalToko,
              update_date: new Date(),
              update_by: (req as any).user?.username || (req as any).user?._id || 'system',
            },
          }
        );
        const updated = await TTVps.findOne({ periode });
        return res.json(updated);
      }
      return res.json(existing);
    }

    // No aggregate doc: if details exist, upsert via helper then return computed
    if (hasDetails) {
      try {
        await recalcAggregateForPeriode(periode, (req as any).user);
      } catch (e) {
        console.warn('Failed to upsert aggregate for periode', periode, e);
      }
      const upserted = await TTVps.findOne({ periode });
      if (upserted) return res.json(upserted);
      return res.json({
        _id: undefined,
        periode,
        estimasi: computedEstimasi,
        realisasi: computedRealisasi,
        open: computedOpen,
        total_toko: computedTotalToko,
      });
    }

    // No details and no aggregate
    return res.json(null);
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
    const item = doc.detail.find((d: any) => String(d._id) === String(itemId));
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
    const { start, bulan, harga, diskon, status, diskon_percent } = req.body as Partial<{ start: string; bulan: number; harga: number; diskon: number; status: 'OPEN'|'DONE'; diskon_percent: number }>;
    const userTag = (req as any).user?.username || (req as any).user?._id || 'system';
    const doc = await TTVpsDetail.findOne({ periode });
    if (!doc) return res.status(404).json({ message: 'periode not found' });
    const item = doc.detail.find((d: any) => String(d._id) === String(itemId));
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
    const newDiskonPercent = (typeof diskon_percent === 'number' && diskon_percent >= 0) ? Math.min(100, diskon_percent) : item.diskon_percent || 0;
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
    // Entry sisa: selalu gunakan ukuran newBulan sampai START terakhir jatuh di <= akhir fiskal (Nov).
    // Jika tempo melewati akhir fiskal (mis. jadi Desember), itu diperbolehkan, dan tidak membuat START baru di periode berikutnya.
    let cursorStart = addDays(firstTempo, 1);
    while (cursorStart <= fiscalEndDate) {
      const tempo = calcTempo(cursorStart, newBulan);
      entries.push({ start: cursorStart, bulan: newBulan, tempo, diskon: 0 });
      const nextStart = addDays(tempo, 1);
      if (nextStart > fiscalEndDate) break; // stop, jangan membuat start di periode fiskal berikutnya
      cursorStart = nextStart;
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
      const jumlah = newHarga * e.bulan;
      const first = e.start.getTime() === startDateObj.getTime();
      const newItem: IVpsDetailItem = {
        chain_id: chainId,
        toko: item.toko,
        program: item.program,
        daerah: (item as any).daerah,
        start: formatYMD(e.start),
        bulan: e.bulan,
        tempo: formatYMD(e.tempo),
        harga: newHarga,
        jumlah_harga: jumlah,
        diskon: e.diskon,
        diskon_percent: first ? (typeof diskon_percent === 'number' ? Math.max(0, Math.min(100, diskon_percent)) : (jumlah > 0 ? Math.round((newDiskon / jumlah) * 100) : 0)) : 0,
        total_harga: jumlah - e.diskon,
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

export const getLastPeriod = async (req: Request, res: Response) => {
  try {
    const last = await TTVpsDetail.findOne({}, { periode: 1 }).sort({ periode: -1 }).lean();
    return res.json({ periode: last?.periode || null });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'internal error', error: err?.message });
  }
};

export const generateNextFiscal = async (req: Request, res: Response) => {
  try {
    // Determine last known period (YYYY-MM) and next fiscal label
    const lastDoc = await TTVpsDetail.findOne({}, { periode: 1 }).sort({ periode: -1 }).lean();
    if (!lastDoc?.periode) return res.status(400).json({ message: 'Tidak ada data periode terakhir' });
    const [lastYearStr, lastMonthStr] = lastDoc.periode.split('-');
    const lastYear = parseInt(lastYearStr, 10);
    const nextFiscalLabel = lastYear + 1; // Caption purpose

    // Collect all items for the last fiscal year range (Dec lastYear-1 to Nov lastYear)
    const rangeStart = `${lastYear - 1}-12`;
    const rangeEnd = `${lastYear}-11`;
    const fiscalDocs = await TTVpsDetail.find({ periode: { $gte: rangeStart, $lte: rangeEnd } }).lean();

    // Build map of toko -> latest item and infer initial term months from chain
    type Item = IVpsDetailItem & { _id: any };
    const tokoLatest: Record<string, { last: Item; chainItems: Item[] }> = {};
    for (const doc of fiscalDocs) {
      for (const it of (doc.detail as any as Item[])) {
        const key = it.toko;
        // Compare by tempo then start
        const currTempo = new Date(it.tempo + 'T00:00:00.000Z').getTime();
        const existing = tokoLatest[key]?.last;
        const existingTempo = existing ? new Date(existing.tempo + 'T00:00:00.000Z').getTime() : -Infinity;
        if (!existing || currTempo > existingTempo) {
          // collect items with same chain for months inference
          const chain = (it as any).chain_id;
          let chainItems: Item[] = [];
          if (chain) {
            chainItems = fiscalDocs.flatMap(d => (d.detail as any as Item[])).filter(ci => ci.chain_id === chain);
          } else {
            // fallback: items of same toko and program within fiscal year
            chainItems = fiscalDocs.flatMap(d => (d.detail as any as Item[])).filter(ci => ci.toko === it.toko && ci.program === it.program);
          }
          tokoLatest[key] = { last: it, chainItems };
        }
      }
    }

    // For each toko, generate next fiscal schedule based on last item properties
    const affectedPeriodes = new Set<string>();
    const userTag = (req as any).user?.username || (req as any).user?._id || 'system';
    for (const [toko, info] of Object.entries(tokoLatest)) {
      const last = info.last;
      const program = last.program;
      const daerah = (last as any).daerah || '';
      const harga = last.harga;
      // infer next fiscal segment size from the latest data in last period
      const initialMonths = last.bulan;
      const startDate = addDays(new Date(last.tempo + 'T00:00:00.000Z'), 1);

      // Build schedule: first term then monthly until fiscal end (Nov)
      const firstTempo = calcTempo(startDate, initialMonths);
      const endYear = startDate.getUTCMonth() === 11 ? startDate.getUTCFullYear() + 1 : startDate.getUTCFullYear();
      const fiscalEndDate = new Date(Date.UTC(endYear, 11, 0)); // last day of Nov

      const entries: { start: Date; bulan: number; tempo: Date; diskon: number }[] = [];
      // Term awal: gunakan initialMonths
      entries.push({ start: startDate, bulan: initialMonths, tempo: firstTempo, diskon: 0 });
      // Sisa: gunakan segmen ukuran initialMonths, hentikan bila start berikutnya melewati akhir fiskal
      let cursorStart = addDays(firstTempo, 1);
      while (cursorStart <= fiscalEndDate) {
        const tempo = calcTempo(cursorStart, initialMonths);
        entries.push({ start: cursorStart, bulan: initialMonths, tempo, diskon: 0 });
        const nextStart = addDays(tempo, 1);
        if (nextStart > fiscalEndDate) break;
        cursorStart = nextStart;
      }

      // Persist entries with a new chain_id
      const chainId = new mongoose.Types.ObjectId().toString();
      for (const e of entries) {
        const periode = toPeriod(e.start);
        affectedPeriodes.add(periode);
        const item: IVpsDetailItem = {
          chain_id: chainId,
          toko,
          program,
          daerah,
          start: formatYMD(e.start),
          bulan: e.bulan,
          tempo: formatYMD(e.tempo),
          harga,
          jumlah_harga: harga * e.bulan,
          diskon: 0,
          diskon_percent: 0,
          total_harga: harga * e.bulan,
          status: 'OPEN',
        };
        const now = new Date();
        await TTVpsDetail.updateOne(
          { periode },
          { $setOnInsert: { input_date: now, input_by: userTag }, $set: { update_date: now, update_by: userTag }, $push: { detail: item } },
          { upsert: true }
        );
      }
    }

    // Recalculate aggregates for affected periods
    for (const p of affectedPeriodes) {
      await recalcAggregateForPeriode(p, (req as any).user);
    }

    return res.json({ message: 'generated', nextFiscalLabel, affected: Array.from(affectedPeriodes).sort() });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'internal error', error: err?.message });
  }
};
