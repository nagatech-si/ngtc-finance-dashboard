import axiosInstance from './axiosInstance';

export type TTVpsStatus = 'OPEN' | 'DONE';

export interface TTVpsDetailItemDTO {
  _id: string;
  ref_id?: string;
  toko: string;
  program: string;
  start: string; // YYYY-MM-DD
  bulan: number;
  tempo: string; // YYYY-MM-DD
  harga: number;
  jumlah_harga: number;
  diskon: number;
  total_harga: number;
  status: TTVpsStatus;
}

export interface TTVpsDetailsDocDTO {
  _id: string;
  periode: string; // YYYY-MM
  detail: TTVpsDetailItemDTO[];
}

export async function fetchDetailsByPeriode(periode: string): Promise<TTVpsDetailsDocDTO | null> {
  const { data } = await axiosInstance.get('/tt-vps/details', { params: { periode } });
  return data;
}

export async function fetchAggregatesByPeriode(periode: string) {
  const { data } = await axiosInstance.get('/tt-vps/aggregate', { params: { periode } });
  return data as { _id: string; periode: string; estimasi: number; realisasi: number; open: number; total_toko: number } | null;
}

export async function createSchedule(payload: { subscriber_id?: string; toko?: string; program?: string; harga?: number; start: string; bulan: number; diskon?: number; }) {
  const { data } = await axiosInstance.post('/tt-vps/schedule', payload);
  return data;
}

export async function updateItemStatus(params: { periode: string; itemId: string; status: TTVpsStatus }) {
  const { periode, itemId, status } = params;
  const { data } = await axiosInstance.patch(`/tt-vps/details/${encodeURIComponent(periode)}/item/${itemId}/status`, { status });
  return data;
}

export async function deleteItem(params: { periode: string; itemId: string }) {
  const { periode, itemId } = params;
  const { data } = await axiosInstance.delete(`/tt-vps/details/${encodeURIComponent(periode)}/item/${itemId}`);
  return data;
}

export interface VpsSubscriberOption {
  _id: string;
  toko: string;
  biaya: number;
}

export async function fetchAvailableSubscribers(): Promise<VpsSubscriberOption[]> {
  const { data } = await axiosInstance.get('/vps/available-subscribers');
  return data?.data || [];
}

export async function updateItem(params: { periode: string; itemId: string; start?: string; bulan?: number; harga?: number; diskon?: number; status?: TTVpsStatus }) {
  const { periode, itemId, ...body } = params;
  const { data } = await axiosInstance.patch(`/tt-vps/details/${encodeURIComponent(periode)}/item/${itemId}`, body);
  return data;
}
