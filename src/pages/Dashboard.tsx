import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChartDonut } from '@/components/ChartDonut';
import axiosInstance from '@/api/axiosInstance';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ChartData {
  name: string;
  value: number;
}

interface SubKategoriData {
  subkategori: string;
  nilai: number;
  persentase: number;
}

export default function Dashboard() {
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', year],
    queryFn: async () => {
      const response = await axiosInstance.get(`/dashboard/rekap-aggregate?tahun=${year}`);
      return response.data;
    },
  });

  // Mapping backend response to chartData and tableData
  const rekapData = data?.data || [];
  // Chart: total per kategori
  const chartData = rekapData.map((item: any) => ({
    name: item.kategori,
    value: item.total_kategori,
    subs: item.subs || [],
  }));
  // Table: sub kategori breakdown
  const tableData = rekapData
    .flatMap((item: any) => item.subs.map((sub: any) => ({
      kategori: item.kategori,
      subkategori: sub.sub_kategori || sub.subKategori,
      nilai: sub.total,
      persentase: item.total_kategori ? (sub.total / item.total_kategori) * 100 : 0,
    })))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
          </SelectContent>
        </Select>
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
        rekapData.map((item: any, idx: number) => (
          <Card key={idx} className="mb-8">
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
        ))
      )}
    </div>
  );
}
