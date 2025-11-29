import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChartDonut } from '@/components/ChartDonut';
import { ChartBar } from '@/components/ChartBar';
import StackedBarKategori from '@/components/StackedBarKategori';
import LineChartKategori from '@/components/LineChartKategori';
import axiosInstance from '@/api/axiosInstance';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MONTH_OPTIONS = [
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'DEC', label: 'December' },
  { value: 'JAN', label: 'January' },
  { value: 'FEB', label: 'February' },
  { value: 'MAR', label: 'March' },
  { value: 'APR', label: 'April' },
  { value: 'MAY', label: 'May' },
  { value: 'JUN', label: 'June' },
  { value: 'JUL', label: 'July' },
  { value: 'AUG', label: 'August' },
  { value: 'SEP', label: 'September' },
  { value: 'OCT', label: 'October' },
  { value: 'NOV', label: 'November' },
];

export default function Dashboard() {
  const queryClient = useQueryClient();
  // Year state; start empty then set to latest fiscal year when list arrives
  const [year, setYear] = useState<string>('');
  const [month, setMonth] = useState<string>('ANNUAL');
  const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');
  const userSelectedYearRef = useRef(false);
  const handleYearChange = (val: string) => {
    userSelectedYearRef.current = true;
    setYear(val);
  };
  const handleMonthChange = (val: string) => {
    setMonth(val);
  };
  // Fetch fiscal years dari backend
  const { data: fiscalYearsData, isLoading: isYearsLoading } = useQuery({
    queryKey: ['fiscal-years'],
    queryFn: async () => {
      const res = await axiosInstance.get('/fiscal/years');
      return res.data.years || [];
    },
  });

  // Once fiscal years loaded, pick the latest (max) if user hasn't chosen yet
  useEffect(() => {
    if (!userSelectedYearRef.current && fiscalYearsData && fiscalYearsData.length > 0) {
      const latest = Math.max(...fiscalYearsData);
      if (year !== latest.toString()) setYear(latest.toString());
    }
  }, [fiscalYearsData, year]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', year, month],
    queryFn: async () => {
      const baseUrl = `/dashboard/rekap-aggregate?tahun=${year}`;
      const url = month === 'ANNUAL' ? baseUrl : `${baseUrl}&bulan=${month}`;
      const response = await axiosInstance.get(url);
      return response.data;
    },
    enabled: !!year,
  });

  // Mapping backend response to chartData dan tableData
  const rekapData = data?.data || [];
  const asetDanGajiData = data?.asetDanGaji || [];
  const biayaBiayaData = data?.biayaBiaya || [];
  const pertahunData = data?.pertahun || [];
  const asetDanGajiTahunanData = data?.asetDanGajiTahunan || [];
  const implementasiMarketingLainnyaTahunanData = data?.implementasiMarketingLainnyaTahunan || [];
  const biayaBiayaTahunanData = data?.biayaBiayaTahunan || [];
  const grossMarginTahunanData = data?.grossMarginTahunan || [];
  
  // Data untuk line chart kategori PEMBELIAN
  const pembelianData = pertahunData.find((item: any) => item.kategori === 'PEMBELIAN');
  const pembelianLineData = pembelianData ? pembelianData.data_bulanan
    .sort((a: any, b: any) => {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return months.indexOf(a.bulan) - months.indexOf(b.bulan);
    })
    .map((bulanData: any) => ({
      bulan: bulanData.bulan,
      nominal: bulanData.total
    })) : [];

  // Data untuk stacked bar aset dan gaji tahunan
  const asetDanGajiTahunanChartData = (() => {
    const bulanMap: { [bulan: string]: { ASET: number; GAJI: number } } = {};
    asetDanGajiTahunanData.forEach((group: any) => {
      group.data_bulanan.forEach((b: any) => {
        if (!bulanMap[b.bulan]) bulanMap[b.bulan] = { ASET: 0, GAJI: 0 };
        bulanMap[b.bulan][group.group] = b.total;
      });
    });
    return Object.keys(bulanMap).map(bulan => ({
      kategori: bulan,
      subs: [
        { name: "ASET", total: bulanMap[bulan].ASET },
        { name: "GAJI", total: bulanMap[bulan].GAJI }
      ]
    })).sort((a, b) => {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return months.indexOf(a.kategori) - months.indexOf(b.kategori);
    });
  })();

  // Data untuk stacked bar biaya lain tahunan
  const implementasiMarketingLainnyaTahunanChartData = (() => {
    const bulanMap: { [bulan: string]: { [key: string]: number } } = {};
    const subKategories: string[] = [];
    implementasiMarketingLainnyaTahunanData.forEach((item: any) => {
      if (!subKategories.includes(item.sub_kategori)) subKategories.push(item.sub_kategori);
      item.data_bulanan.forEach((b: any) => {
        if (!bulanMap[b.bulan]) bulanMap[b.bulan] = {};
        bulanMap[b.bulan][item.sub_kategori] = b.total;
      });
    });
    return Object.keys(bulanMap).map(bulan => ({
      kategori: bulan,
      subs: subKategories.map(sub => ({
        name: sub,
        total: bulanMap[bulan][sub] || 0
      }))
    })).sort((a, b) => {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return months.indexOf(a.kategori) - months.indexOf(b.kategori);
    });
  })();

  // Data untuk stacked bar biaya biaya tahunan
  const biayaBiayaTahunanChartData = (() => {
    const bulanMap: { [bulan: string]: { [key: string]: number } } = {};
    const subKategories: string[] = [];
    biayaBiayaTahunanData.forEach((item: any) => {
      if (!subKategories.includes(item.sub_kategori)) subKategories.push(item.sub_kategori);
      item.data_bulanan.forEach((b: any) => {
        if (!bulanMap[b.bulan]) bulanMap[b.bulan] = {};
        bulanMap[b.bulan][item.sub_kategori] = b.total;
      });
    });
    return Object.keys(bulanMap).map(bulan => ({
      kategori: bulan,
      subs: subKategories.map(sub => ({
        name: sub,
        total: bulanMap[bulan][sub] || 0
      }))
    })).sort((a, b) => {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return months.indexOf(a.kategori) - months.indexOf(b.kategori);
    });
  })();

  // Data untuk line chart gross margin tahunan
  const grossMarginTahunanLineData = grossMarginTahunanData
    .sort((a: any, b: any) => {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return months.indexOf(a.bulan) - months.indexOf(b.bulan);
    })
    .map((bulanData: any) => ({
      bulan: bulanData.bulan,
      nominal: bulanData.gross_margin
    }));
  // Data untuk stacked bar: kategori (x-axis) dengan sub kategori sebagai bar yang ditumpuk
  const stackedBarData = rekapData.map((item: any) => ({
    kategori: item.kategori,
    subs: (item.subs || []).map((s: any) => ({
      name: s.sub_kategori || s.subKategori,
      total: s.total,
    }))
  }));

  const toFixReal = (value: number) => {
    //for example 2.199835406 => 2.199
    return Math.floor(value * 1000) / 1000;
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `${toFixReal(value / 1000000000)}M`;
    } else if (value >= 1000000) {
      return `${toFixReal(value / 1000000)}jt`;
    } else if (value >= 1000) {
      return `${toFixReal(value / 1000)}rb`;
    } else {
      return value.toString();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      <div className="absolute top-0 right-0 -z-10">
        <div className="w-72 h-72 bg-gradient-to-bl from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl" />
      </div>
      <div className="absolute bottom-0 left-0 -z-10">
        <div className="w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Financial Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Monitor your financial performance and insights</p>
          </div>
          <div className="flex flex-col items-end space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <label className="text-sm font-medium text-gray-700 mb-1">Bulan</label>
                <Select value={month} onValueChange={handleMonthChange}>
                  <SelectTrigger className="w-40 h-12 bg-white/80 backdrop-blur-sm border-gray-300 hover:border-blue-500 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 shadow-lg">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-xl">
                    {MONTH_OPTIONS.map((monthOption) => (
                      <SelectItem key={monthOption.value} value={monthOption.value} className="hover:bg-blue-50 focus:bg-blue-50">
                        {monthOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col items-end">
                <label className="text-sm font-medium text-gray-700 mb-1">Tahun</label>
                <Select value={year} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-32 h-12 bg-white/80 backdrop-blur-sm border-gray-300 hover:border-blue-500 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 shadow-lg">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 overflow-y-auto bg-white/95 backdrop-blur-sm border-gray-200 shadow-xl">
                    {isYearsLoading ? (
                      <SelectItem value={year || 'loading'}>{year || 'Loading...'}</SelectItem>
                    ) : (
                      fiscalYearsData?.map((th: number) => (
                        <SelectItem key={th} value={th.toString()} className="hover:bg-blue-50 focus:bg-blue-50">{th}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <Card className="w-full max-w-md border-2 border-dashed border-blue-200 bg-white/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Loading dashboard data...</p>
              </CardContent>
            </Card>
          </div>
        ) : rekapData.length === 0 && asetDanGajiData.length === 0 && biayaBiayaData.length === 0 && pertahunData.length === 0 && pembelianLineData.length === 0 && asetDanGajiTahunanChartData.length === 0 && implementasiMarketingLainnyaTahunanChartData.length === 0 && biayaBiayaTahunanChartData.length === 0 && grossMarginTahunanLineData.length === 0 ? (
          <Card className="border-2 border-dashed border-blue-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600 text-center">Start adding transactions to see your financial insights</p>
            </CardContent>
          </Card>
        ) : (
          <>

            {/* Monthly trend chart per kategori */}
            {pertahunData.length > 0 && (
              <div className="mb-6">
                <Card className="border-2 border-dashed border-purple-200 bg-white/80 backdrop-blur-sm hover:border-purple-400 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-bold text-gray-900">Monthly Trends by Category</CardTitle>
                    <CardDescription className="text-gray-600 text-sm">
                      Monthly breakdown for each category in {year}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {pertahunData.map((kategoriData: any, idx: number) => (
                        <div key={idx} className="border-b border-gray-200 pb-4 last:border-b-0">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-base font-semibold text-gray-900">{kategoriData.kategori}</h3>
                            <span className="text-xs font-medium text-purple-600">
                              Total: {formatCurrency(kategoriData.total_tahunan)}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                            {kategoriData.data_bulanan
                              .sort((a: any, b: any) => {
                                const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                                return months.indexOf(a.bulan) - months.indexOf(b.bulan);
                              })
                              .map((bulanData: any, bulanIdx: number) => (
                                <div key={bulanIdx} className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-md p-2 text-center">
                                  <div className="text-xs font-medium text-purple-700 mb-1">{bulanData.bulan}</div>
                                  <div className="text-xs font-bold text-purple-900">{formatCurrency(bulanData.total)}</div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Line chart untuk kategori PEMBELIAN */}
            {pembelianLineData.length > 0 && (
              <div className="mb-8">
                <Card className="border-2 border-dashed border-green-200 bg-white/80 backdrop-blur-sm hover:border-green-400 transition-all duration-300">
                  <CardContent className='pt-6'>
                    <LineChartKategori 
                      data={pembelianLineData} 
                      title={`PEMBELIAN Monthly Trend - ${year}`}
                      description="Monthly purchasing trend throughout the year"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Stacked bar chart untuk Aset dan Gaji per bulan */}
            {asetDanGajiTahunanChartData.length > 0 && (
              <div className="mb-8">
                <Card className="border-2 border-dashed border-orange-200 bg-white/80 backdrop-blur-sm hover:border-orange-400 transition-all duration-300">
                  <CardContent className='pt-6'>
                    <StackedBarKategori
                      data={asetDanGajiTahunanChartData}
                      title="Aset dan Gaji Monthly Breakdown"
                      description="Monthly comparison of assets and salary expenses"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Stacked bar chart untuk Biaya Lain per bulan */}
            {implementasiMarketingLainnyaTahunanChartData.length > 0 && (
              <div className="mb-8">
                <Card className="border-2 border-dashed border-purple-200 bg-white/80 backdrop-blur-sm hover:border-purple-400 transition-all duration-300">
                  <CardContent className='pt-6'>
                    <StackedBarKategori
                      data={implementasiMarketingLainnyaTahunanChartData}
                      title="Implementasi, Marketing & Lainnya Monthly Breakdown"
                      description="Monthly breakdown of implementation, marketing, and other expenses"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Stacked bar chart untuk Biaya Biaya per bulan */}
            {biayaBiayaTahunanChartData.length > 0 && (
              <div className="mb-8">
                <Card className="border-2 border-dashed border-red-200 bg-white/80 backdrop-blur-sm hover:border-red-400 transition-all duration-300">
                  <CardContent className='pt-6'>
                    <StackedBarKategori
                      data={biayaBiayaTahunanChartData}
                      title="Biaya Biaya Monthly Breakdown"
                      description="Monthly breakdown of PPH21, VPS, RND, BPJS, and return sales expenses"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Line chart untuk Gross Margin per bulan */}
            {grossMarginTahunanLineData.length > 0 && (
              <div className="mb-8">
                <Card className="border-2 border-dashed border-teal-200 bg-white/80 backdrop-blur-sm hover:border-teal-400 transition-all duration-300">
                  <CardContent className='pt-6'>
                    <LineChartKategori 
                      data={grossMarginTahunanLineData} 
                      title={`Gross Margin Monthly Trend - ${year}`}
                      description="Monthly gross margin trend (Omzet - Biaya - Pembelian)"
                    />
                  </CardContent>
                </Card>
              </div>
            )}
             <div className="flex justify-center mb-4">
                        <div className="flex items-center gap-2 bg-gray-100/50 rounded-lg p-1">
                          <button
                            onClick={() => setChartType('donut')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                              chartType === 'donut'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Donut Chart
                          </button>
                          <button
                            onClick={() => setChartType('bar')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                              chartType === 'bar'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Bar Chart
                          </button>
                        </div>
                      </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {[...rekapData, ...asetDanGajiData, ...biayaBiayaData].filter((a) => a.kategori != "BIAYA").map((item: any, idx: number) => {
              const isBiaya = item.kategori === 'BIAYA';
              return (
                  <Card key={idx} className={`border-2 border-dashed border-blue-200 bg-white/80 backdrop-blur-sm hover:border-blue-400 transition-all duration-300 ${isBiaya ? 'lg:col-span-2' : ''}`}>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-2xl font-bold text-gray-900">{item.kategori}</CardTitle>
                      <CardDescription className="text-gray-600 text-sm">
                        Annual Total: <span className="font-semibold text-blue-600">{formatCurrency(item.total_kategori)}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                     
                      {chartType === 'donut' ? (
                        <ChartDonut
                          data={
                            (item.subs || []).map((sub: any) => ({
                              name: sub.sub_kategori || sub.subKategori,
                              value: sub.total,
                            }))
                          }
                          totalKategori={item.total_kategori}
                        />
                      ) : (
                        <ChartBar
                          data={
                            (item.subs || []).map((sub: any) => ({
                              name: sub.sub_kategori || sub.subKategori,
                              value: sub.total,
                            }))
                          }
                          totalKategori={item.total_kategori}
                        />
                      )}
                    </CardContent>
                  </Card>
              );
            })}
             </div>
          </>
        )}
      </div>
    </div>
  );
}
