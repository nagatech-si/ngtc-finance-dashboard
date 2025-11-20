import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChartDonut } from '@/components/ChartDonut';
import LineChartKategori from '@/components/LineChartKategori';
import StackedBarKategori from '@/components/StackedBarKategori';
import axiosInstance from '@/api/axiosInstance';
import { fetchFiscalYears } from '@/api/fiscal';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function PublicDashboard() {
  // Start empty; will adopt latest fiscal year once loaded
  const [year, setYear] = useState<string>('');
  const userSelectedYearRef = useRef(false);
  const handleYearChange = (val: string) => {
    userSelectedYearRef.current = true;
    setYear(val);
  };

  // Fiscal years list for filter
  const { data: fiscalYearsData, isLoading: isYearsLoading } = useQuery({
    queryKey: ['fiscal-years'],
    queryFn: fetchFiscalYears,
  });

  // Auto-select latest fiscal year if user hasn't chosen
  useEffect(() => {
    if (!userSelectedYearRef.current && fiscalYearsData && fiscalYearsData.length > 0) {
      const latest = fiscalYearsData[0];
      if (year !== latest.toString()) setYear(latest.toString());
    }
  }, [fiscalYearsData, year]);

  // Dashboard data for selected year
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', year],
    queryFn: async () => {
      const response = await axiosInstance.get(`/dashboard/rekap-aggregate?tahun=${year}`);
      return response.data;
    },
    enabled: !!year,
  });

  const rekapData = data?.data || [];
  const stackedBarData = rekapData.map((item: any) => ({
    kategori: item.kategori,
    subs: (item.subs || []).map((s: any) => ({
      name: s.sub_kategori || s.subKategori,
      total: s.total,
    }))
  }));
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(value);
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="flex flex-col items-end">
          <Select value={year} onValueChange={handleYearChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent className="max-h-56 overflow-y-auto">
              {isYearsLoading ? (
                <SelectItem value={year || 'loading'}>{year || 'Memuat...'}</SelectItem>
              ) : (
                (fiscalYearsData || []).map((th: number) => (
                  <SelectItem key={th} value={th.toString()}>{th}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      {isLoading ? (
        <div className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : rekapData.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground">Belum ada data</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-8">
            <StackedBarKategori
              data={stackedBarData}
              title="Komposisi Sub Kategori per Kategori (Tahunan)"
            />
          </div>
          {rekapData.map((item: any, idx: number) => {
            const bulanOrder = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            const parseBulan = (bulanStr: string) => {
              const [bulan, tahun] = bulanStr.split('-').map(s => s.trim());
              return {
                bulan,
                tahun: parseInt(tahun.length === 2 ? '20' + tahun : tahun),
                order: bulanOrder.indexOf(bulan.toUpperCase()),
              };
            };
            const bulanData = (item.data_bulanan || [])
              .map((b: any) => ({
                bulan: b.bulan,
                nominal: b.nilai,
                ...parseBulan(b.bulan)
              }))
              .sort((a, b) => a.tahun === b.tahun ? a.order - b.order : a.tahun - b.tahun);
            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{item.kategori}</CardTitle>
                    <CardDescription>
                      Total Tahunan: {formatCurrency(item.total_kategori)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartDonut
                      data={
                        (item.subs || []).map((sub: any) => ({
                          name: sub.sub_kategori || sub.subKategori,
                          value: sub.total,
                        }))
                      }
                      totalKategori={item.total_kategori}
                    />
                    {item.subs && item.subs.length > 0 && (
                      <div className="mt-6">
                        <div className="font-bold mb-2">Breakdown Sub Kategori</div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Sub Kategori</TableHead>
                              <TableHead className="text-right">Nilai</TableHead>
                              <TableHead className="text-right">Persentase</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {item.subs.map((sub: any, subIdx: number) => (
                              <TableRow key={subIdx}>
                                <TableCell className="font-medium">{sub.sub_kategori || sub.subKategori}</TableCell>
                                <TableCell className="text-right">{formatCurrency(sub.total)}</TableCell>
                                <TableCell className="text-right">{item.total_kategori ? ((sub.total / item.total_kategori) * 100).toFixed(2) : '0.00'}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <LineChartKategori data={bulanData} title={item.kategori} />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
