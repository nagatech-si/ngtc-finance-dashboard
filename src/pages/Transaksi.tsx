import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import axiosInstance from '@/api/axiosInstance';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus } from 'lucide-react';
import { log } from 'console';

interface Transaksi {
  _id?: string;
  kategori_id: string;
  kategori_nama?: string;
  subkategori_id: string;
  subkategori_nama?: string;
  akun_id: string;
  akun_nama?: string;
  bulan_fiskal: string;
  nilai: number;
  input_by: string;
  keterangan?: string;
  created_at?: string;
}


interface Option {
  _id: string;
  nama: string;
}

// Bulan fiskal dinamis dari backend
const currentYear = new Date().getFullYear();

export default function Transaksi() {
  // Tahun fiskal global dari store
  const { fiscalYear } = useAppStore();
  // Fetch fiscal months dari backend
  const {
    data: fiscalMonthsData,
    isLoading: isMonthsLoading,
    refetch: refetchFiscalMonths
  } = useQuery({
    queryKey: ['fiscal-months', fiscalYear],
    queryFn: async () => {
      const res = await axiosInstance.get(`/fiscal/months?tahun=${fiscalYear}`);
      return res.data.months || [];
    },
  });

  // Refresh fiscal months setiap tahun fiskal berubah
  useEffect(() => {
    refetchFiscalMonths();
  }, [fiscalYear, refetchFiscalMonths]);
  // Reset bulan fiskal di form ketika tahun fiskal berubah agar tidak memegang nilai lama
  useEffect(() => {
    setFormData(prev => ({ ...prev, bulan_fiskal: '' }));
  }, [fiscalYear]);
      const [editModalOpen, setEditModalOpen] = useState(false);
      const [editData, setEditData] = useState<any>(null);
      const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
      const [deleteData, setDeleteData] = useState<any>(null);

      // Handler edit transaksi (open modal) for flattened row
      const handleEdit = (row: any) => {
        // Ensure bulan fiskal matches exactly with fiscalMonthsData
        const matchedBulan = fiscalMonthsData?.find((bulan: string) => bulan === row.bulan) || row.bulan;

        const formattedValue = formatNumberInput(row.nilai.toString());
        setEditFormattedNilai(formattedValue);

        setEditData({
          id: row.parentId || row._id,
          kategori: row.kategori,
          sub_kategori: row.sub_kategori,
          akun: row.akun,
          bulan: matchedBulan,
          nilai: row.nilai,
          input_by: row.input_by,
        });
        setEditModalOpen(true);
      };

      // Reset bulan fiskal in edit modal when tahun fiskal changes
      useEffect(() => {
        if (editModalOpen) {
          setEditData((prev) => prev ? { ...prev, bulan: '' } : prev);
        }
      }, [fiscalYear, editModalOpen]);

      // Handler simpan edit
      const handleEditSave = async () => {
        try {
          await axiosInstance.put(`/transaksi/${editData.id}`, editData);
          setEditModalOpen(false);
          setEditData(null);
          queryClient.invalidateQueries({ queryKey: ['transaksi'] });
          toast.success('Transaksi berhasil diupdate!');
        } catch {
          toast.error('Gagal update transaksi.');
        }
      };

      // Handler hapus transaksi bulanan - open confirmation dialog
      const handleDelete = (row: any) => {
        setDeleteData(row);
        setDeleteDialogOpen(true);
      };

      // Handler konfirmasi hapus
      const handleConfirmDelete = async () => {
        if (!deleteData) return;

        try {
          const parentId = deleteData.parentId || deleteData._id;
          await axiosInstance.delete(`/transaksi/${parentId}/bulan/${deleteData.bulan}`);
          queryClient.invalidateQueries({ queryKey: ['transaksi'] });
          toast.success('Transaksi berhasil dihapus!');
          setDeleteDialogOpen(false);
          setDeleteData(null);
        } catch {
          toast.error('Gagal menghapus transaksi.');
        }
      };
        // ...existing code...
      const queryClient = useQueryClient();
      const [page, setPage] = useState<number>(1);
      const [pageSize, setPageSize] = useState<number>(10);
  const [formData, setFormData] = useState<Transaksi>({
    kategori_id: '',
    subkategori_id: '',
    akun_id: '',
    bulan_fiskal: '',
    nilai: 0,
    input_by: '',
  });

  // Formatted input values for display
  const [formattedNilai, setFormattedNilai] = useState('');
  const [editFormattedNilai, setEditFormattedNilai] = useState('');

  // Persist selected bulan per fiscal year in localStorage so refresh keeps selection
  const selectedMonthKey = `transaksi_selected_bulan_${fiscalYear}`;

  // When fiscalMonthsData loads, pick a sensible default (stored selection or first month)
  useEffect(() => {
    if (!fiscalMonthsData || fiscalMonthsData.length === 0) return;
    const stored = localStorage.getItem(selectedMonthKey);
    // Normalize comparison to avoid issues with spacing/formatting
    const monthsNormalized = fiscalMonthsData.map((m: string) => (m || '').trim());
    if (stored) {
      const storedNorm = stored.trim();
      const matchIndex = monthsNormalized.findIndex((m: string) => m === storedNorm);
      if (matchIndex !== -1) {
        const matched = fiscalMonthsData[matchIndex];
        setFormData(prev => ({ ...prev, bulan_fiskal: matched }));
        return;
      }
    }
    // Prefer current month (formatted as e.g. 'MAR - 25') if present, otherwise default to first
    const now = new Date();
    const monthShorts = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const prefer = `${monthShorts[now.getMonth()]} - ${now.getFullYear().toString().slice(-2)}`;
    const preferIndex = monthsNormalized.findIndex((m: string) => m === prefer);
    const defaultMonth = preferIndex !== -1 ? fiscalMonthsData[preferIndex] : fiscalMonthsData[0];
    setFormData(prev => ({ ...prev, bulan_fiskal: defaultMonth }));
    localStorage.setItem(selectedMonthKey, defaultMonth);
  }, [fiscalMonthsData, selectedMonthKey]);

  // Save user's selection when bulan_fiskal changes
  useEffect(() => {
    if (formData.bulan_fiskal) {
      localStorage.setItem(selectedMonthKey, formData.bulan_fiskal);
    }
  }, [formData.bulan_fiskal, selectedMonthKey]);
  // ...existing code...
  const { user } = useAppStore();

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['kategori'],
    queryFn: async () => {
      const response = await axiosInstance.get('/master/kategori');
      return response.data || [];
    },
  });

  // Fetch all subcategories (no filter)
  const { data: subCategories = [] } = useQuery({
    queryKey: ['subkategori'],
    queryFn: async () => {
      const response = await axiosInstance.get('/master/subkategori');
      return response.data || [];
    },
  });

  // Fetch all akun (no filter)
  const { data: accounts = [] } = useQuery({
    queryKey: ['akun'],
    queryFn: async () => {
      const response = await axiosInstance.get('/master/akun');
      return response.data || [];
    },
  });

  // Filter sub kategori sesuai kategori yang dipilih (backend: kategori = nama)
  const filteredSubCategories = formData.kategori_id
    ? subCategories.filter((sub) => {
        const selectedKategori = categories.find((cat) => cat._id === formData.kategori_id)?.kategori;
        return sub.kategori === selectedKategori;
      })
    : [];

  // Filter akun sesuai sub kategori yang dipilih (backend: sub_kategori = nama)
  const filteredAccounts = formData.subkategori_id && formData.kategori_id
    ? accounts.filter((acc) => {
        const selectedSubKategori = subCategories.find((sk) => sk._id === formData.subkategori_id);
        const selectedKategori = categories.find((cat) => cat._id === formData.kategori_id)?.kategori;
        return (
          acc.sub_kategori === selectedSubKategori?.sub_kategori &&
          acc.kategori === selectedKategori &&
          acc.sub_kategori_kode === selectedSubKategori?.kode
        );
      })
    : [];

  // Filter untuk edit modal
  const editFilteredSubCategories = editData?.kategori
    ? subCategories.filter((sub) => sub.kategori === editData.kategori)
    : [];

  const editFilteredAccounts = editData?.sub_kategori && editData?.kategori
    ? accounts.filter((acc) => {
        const selectedSubKategori = subCategories.find((sk) => sk.sub_kategori === editData.sub_kategori);
        return (
          acc.sub_kategori === editData.sub_kategori &&
          acc.kategori === editData.kategori &&
          acc.sub_kategori_kode === selectedSubKategori?.kode
        );
      })
    : [];

  // Fetch transaksi (paginated, flattened rows)
  const { data: transaksiResp, isLoading, error } = useQuery({
    queryKey: ['transaksi', page, pageSize, fiscalYear],
    queryFn: async () => {
      const tahunParam = fiscalYear ? `&tahun=${encodeURIComponent(String(fiscalYear))}` : '';
      const response = await axiosInstance.get(`/transaksi?flatten=1&page=${page}&limit=${pageSize}${tahunParam}`);
      return response.data;
    },
  });

  const transaksiList = (transaksiResp as any)?.data || [];
  const totalPages = (transaksiResp as any)?.totalPages || 1;
  // Reset to first page if pageSize changes
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  // Create transaksi mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return axiosInstance.post('/transaksi', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaksi'] });
      toast.success('Transaksi berhasil ditambahkan!');
      setFormData({
        kategori_id: '',
        subkategori_id: '',
        akun_id: '',
        bulan_fiskal: '',
        nilai: 0,
        input_by: '',
      });
      setFormattedNilai('');
    },
    onError: () => {
      toast.error('Gagal menyimpan transaksi. Silakan coba lagi.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Ambil nama sub_kategori dan akun dari master data
    const akunObj = accounts.find((a) => a._id === formData.akun_id);
    const subKategoriObj = subCategories.find((sk) => sk._id === formData.subkategori_id);
    // Ambil tahun dari bulan_fiskal
    const kategoriObj = categories.find((k) => k._id === formData.kategori_id);
    const payload = {
      kategori: kategoriObj?.kategori || '',
      sub_kategori: subKategoriObj?.sub_kategori || '',
      akun: akunObj?.akun || '',
      bulan: formData.bulan_fiskal,
      nilai: formData.nilai,
      input_by: user?.name || 'Unknown',
    };
    createMutation.mutate(payload);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(value);
  };

  // Format number for input display (Indonesian format: 100.000)
  const formatNumberInput = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^\d]/g, '');
    // Format with dots as thousand separators
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Parse formatted input back to number
  const parseFormattedInput = (value: string) => {
    return parseFloat(value.replace(/\./g, '')) || 0;
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Transaksi
            </h1>
            <p className="text-gray-600 mt-2">Kelola transaksi dengan mudah dan efisien</p>
          </div>
        </div>

        {/* Form Input Transaksi */}
        <div className="bg-white/50 rounded-lg overflow-hidden border-2 border-dashed border-blue-200 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              Input Transaksi
            </h2>
            <p className="text-gray-600">Tambah transaksi baru</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="kategori" className="text-sm font-semibold text-gray-700">Kategori</Label>
                <Select
                  value={formData.kategori_id}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      kategori_id: value,
                      subkategori_id: '',
                      akun_id: '',
                    });
                  }}
                >
                  <SelectTrigger className="border-2 border-gray-200 transition-all duration-200">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.kategori}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subkategori" className="text-sm font-semibold text-gray-700">Sub Kategori</Label>
                <Select
                  value={formData.subkategori_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, subkategori_id: value, akun_id: '' });
                  }}
                  disabled={!formData.kategori_id}
                >
                  <SelectTrigger className="border-2 border-gray-200 transition-all duration-200">
                    <SelectValue placeholder="Pilih sub kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubCategories.map((sub_kategori) => (
                      <SelectItem key={sub_kategori._id} value={sub_kategori._id}>
                        {sub_kategori.sub_kategori}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="akun" className="text-sm font-semibold text-gray-700">Akun</Label>
                <Select
                  value={formData.akun_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, akun_id: value })
                  }
                  disabled={!formData.subkategori_id}
                >
                  <SelectTrigger className="border-2 border-gray-200 transition-all duration-200">
                    <SelectValue placeholder="Pilih akun" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAccounts.map((acc) => (
                      <SelectItem key={acc._id} value={acc._id}>
                        {acc.akun}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bulan" className="text-sm font-semibold text-gray-700">Bulan Fiskal</Label>
                <Select
                  value={formData.bulan_fiskal}
                  onValueChange={(value) =>
                    setFormData({ ...formData, bulan_fiskal: value })
                  }
                >
                  <SelectTrigger className="border-2 border-gray-200 transition-all duration-200">
                    <SelectValue placeholder="Pilih bulan" />
                  </SelectTrigger>
                  <SelectContent className="h-60 overflow-y-auto">
                    {fiscalMonthsData?.filter((bulan: string) => !!bulan && bulan.trim() !== "")
                        .map((bulan: string) => {
                          console.log(bulan);
                          
                          return (
                          <SelectItem key={bulan} value={bulan}>{bulan}</SelectItem>
                        )
                        })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nilai" className="text-sm font-semibold text-gray-700">Nilai Transaksi (Rp)</Label>
                <Input
                  id="nilai"
                  type="text"
                  value={formattedNilai}
                  onChange={(e) => {
                    const formatted = formatNumberInput(e.target.value);
                    const numericValue = parseFormattedInput(formatted);
                    setFormattedNilai(formatted);
                    setFormData({ ...formData, nilai: numericValue });
                  }}
                  placeholder="0"
                  className="border-2 border-gray-200 transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                <Plus className="w-5 h-5 mr-2" />
                Simpan Transaksi
              </Button>
            </div>
          </form>
        </div>

        {/* Daftar Transaksi */}
        <div className="bg-white/50 rounded-lg overflow-hidden border-2 border-dashed border-blue-200">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-50 hover:to-indigo-50 border-b border-blue-200/50">
                <TableHead className="w-24 px-6 py-4 font-semibold text-gray-900">Bulan Fiskal</TableHead>
                <TableHead className="w-32 px-6 py-4 font-semibold text-gray-900">Kategori</TableHead>
                <TableHead className="w-40 px-6 py-4 font-semibold text-gray-900">Sub Kategori</TableHead>
                <TableHead className="w-40 px-6 py-4 font-semibold text-gray-900">Akun</TableHead>
                <TableHead className="w-32 px-6 py-4 font-semibold text-gray-900 text-right">Nilai</TableHead>
                <TableHead className="w-24 px-6 py-4 font-semibold text-gray-900">Input By</TableHead>
                <TableHead className="w-32 px-6 py-4 text-right font-semibold text-gray-900">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-gray-600 font-medium">Memuat data transaksi...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : transaksiList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-medium">Belum ada data transaksi</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transaksiList.map((row: any, idx: number) => (
                  <TableRow key={(row.parentId || row._id) + '-' + idx} className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100/50">
                    <TableCell className="w-24 px-6 py-4 font-semibold text-gray-900">{row.bulan}</TableCell>
                    <TableCell className="w-32 px-6 py-4 font-medium text-gray-900">{row.kategori}</TableCell>
                    <TableCell className="w-40 px-6 py-4 text-gray-700">{row.sub_kategori}</TableCell>
                    <TableCell className="w-40 px-6 py-4 text-gray-700">{row.akun}</TableCell>
                    <TableCell className="w-32 px-6 py-4 text-gray-700 text-right font-medium">
                      {formatCurrency(row.nilai)}
                    </TableCell>
                    <TableCell className="w-24 px-6 py-4 text-gray-700">{row.input_by}</TableCell>
                    <TableCell className="w-32 px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(row)}
                          className="border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(row)}
                          className="border-red-300 hover:bg-red-50 hover:border-red-400 text-red-600 hover:text-red-700 transition-all duration-200"
                        >
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between p-6 border-t border-gray-100/50">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 font-medium">Per halaman</div>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-24 border-2 border-gray-200 transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-600 font-medium">Halaman {page} dari {totalPages}</div>

            <div>
              <Pagination>
                <PaginationContent>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page <= 1 ? 'opacity-50 pointer-events-none' : ''}
                  />
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={page >= totalPages ? 'opacity-50 pointer-events-none' : ''}
                  />
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editModalOpen && editData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      Edit Transaksi
                    </h3>
                    <p className="text-gray-600 mt-1">Ubah data transaksi</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-kategori" className="text-sm font-semibold text-gray-700">Kategori</Label>
                      <Select
                        value={editData.kategori}
                        onValueChange={(value) => setEditData({ ...editData, kategori: value, sub_kategori: '', akun: '' })}
                      >
                        <SelectTrigger className="border-2 border-gray-200 transition-all duration-200">
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat._id} value={cat.kategori}>
                              {cat.kategori}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-subkategori" className="text-sm font-semibold text-gray-700">Sub Kategori</Label>
                      <Select
                        value={editData.sub_kategori}
                        onValueChange={(value) => setEditData({ ...editData, sub_kategori: value, akun: '' })}
                        disabled={!editData.kategori}
                      >
                        <SelectTrigger className="border-2 border-gray-200 transition-all duration-200">
                          <SelectValue placeholder="Pilih sub kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {editFilteredSubCategories.map((sub) => (
                            <SelectItem key={sub._id} value={sub.sub_kategori}>
                              {sub.sub_kategori}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-akun" className="text-sm font-semibold text-gray-700">Akun</Label>
                      <Select
                        value={editData.akun}
                        onValueChange={(value) => setEditData({ ...editData, akun: value })}
                        disabled={!editData.sub_kategori}
                      >
                        <SelectTrigger className="border-2 border-gray-200 transition-all duration-200">
                          <SelectValue placeholder="Pilih akun" />
                        </SelectTrigger>
                        <SelectContent>
                          {editFilteredAccounts.map((acc) => (
                            <SelectItem key={acc._id} value={acc.akun}>
                              {acc.akun}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-bulan" className="text-sm font-semibold text-gray-700">Bulan Fiskal</Label>
                      <Select
                        value={editData.bulan}
                        onValueChange={(value) => setEditData({ ...editData, bulan: value })}
                      >
                        <SelectTrigger className="border-2 border-gray-200 transition-all duration-200">
                          <SelectValue placeholder="Pilih bulan" />
                        </SelectTrigger>
                        <SelectContent className="h-60 overflow-y-auto">
                          {fiscalMonthsData?.filter((bulan: string) => !!bulan && bulan.trim() !== "")
                              .map((bulan: string) => {
                                return (
                                <SelectItem key={bulan} value={bulan}>{bulan}</SelectItem>
                              )
                              })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="edit-nilai" className="text-sm font-semibold text-gray-700">Nilai Transaksi (Rp)</Label>
                      <Input
                        id="edit-nilai"
                        type="text"
                        value={editFormattedNilai}
                        onChange={(e) => {
                          const formatted = formatNumberInput(e.target.value);
                          const numericValue = parseFormattedInput(formatted);
                          setEditFormattedNilai(formatted);
                          setEditData({ ...editData, nilai: numericValue });
                        }}
                        placeholder="0"
                        className="border-2 border-gray-200 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100/50">
                    <Button
                      variant="outline"
                      onClick={() => setEditModalOpen(false)}
                      className="border-gray-300 hover:bg-gray-50 transition-all duration-200"
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={handleEditSave}
                      className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      Simpan Perubahan
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && deleteData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-red-900 to-red-600 bg-clip-text text-transparent">
                      Konfirmasi Hapus
                    </h3>
                    <p className="text-gray-600 mt-1">Apakah Anda yakin ingin menghapus transaksi ini?</p>
                  </div>
                </div>

                <div className="bg-red-50/50 rounded-lg p-4 mb-6 border border-red-200/50">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Bulan Fiskal:</span>
                      <span className="text-gray-900">{deleteData.bulan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Kategori:</span>
                      <span className="text-gray-900">{deleteData.kategori}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Sub Kategori:</span>
                      <span className="text-gray-900">{deleteData.sub_kategori}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Akun:</span>
                      <span className="text-gray-900">{deleteData.akun}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Nilai:</span>
                      <span className="text-gray-900 font-semibold">{formatCurrency(deleteData.nilai)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteDialogOpen(false);
                      setDeleteData(null);
                    }}
                    className="border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleConfirmDelete}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    Hapus Transaksi
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
