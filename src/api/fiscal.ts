import axiosInstance from './axiosInstance';

export async function fetchFiscalYears() {
  const res = await axiosInstance.get('/fiscal/years');
  // backend may return { years: [...] } or an array directly
  return res.data?.years ?? res.data ?? [];
}

export async function fetchFiscalMonths(tahun: number | string) {
  const res = await axiosInstance.get(`/fiscal/months?tahun=${tahun}`);
  return res.data?.months ?? res.data ?? [];
}

export async function fetchActiveFiscalYear() {
  const res = await axiosInstance.get('/fiscal/active');
  return res.data?.activeYear ?? null;
}

export async function fetchSubscriberGrowth(tahun: number | string) {
  const res = await axiosInstance.get(`/dashboard/subscriber-growth/${tahun}`);
  return res.data?.data ?? res.data ?? [];
}

export async function fetchSubscriberCumulative(tahun: number | string) {
  const res = await axiosInstance.get(`/dashboard/subscriber-cumulative/${tahun}`);
  return res.data?.data ?? res.data ?? [];
}

export async function fetchSubscriberCombined(tahun: number | string) {
  const [growthRes, cumulativeRes] = await Promise.all([
    axiosInstance.get(`/dashboard/subscriber-growth/${tahun}`),
    axiosInstance.get(`/dashboard/subscriber-cumulative/${tahun}`)
  ]);

  const growthData = growthRes.data?.data ?? growthRes.data ?? [];
  const cumulativeData = cumulativeRes.data?.data ?? cumulativeRes.data ?? [];

  // Gabungkan data growth dan cumulative
  return growthData.map((growth: any, index: number) => ({
    ...growth,
    total: cumulativeData[index]?.total || 0
  }));
}

export async function fetchSubscriberByProgram(tahun?: number | string, bulan?: string) {
  const params = new URLSearchParams();
  if (tahun) params.append('tahun', tahun.toString());
  if (bulan) params.append('bulan', bulan);

  const res = await axiosInstance.get(`/dashboard/subscriber-by-program?${params.toString()}`);
  return res.data?.data ?? res.data ?? [];
}
