import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import axiosInstance from '@/api/axiosInstance';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
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

const BULAN_FISKAL = [
  'DEC - 24',
  'JAN - 25',
  'FEB - 25',
  'MAR - 25',
  'APR - 25',
  'MAY - 25',
  'JUN - 25',
  'JUL - 25',
  'AUG - 25',
  'SEP - 25',
  'OCT - 25',
  'NOV - 25',
];

export default function Transaksi() {
      const [editModalOpen, setEditModalOpen] = useState(false);
      const [editData, setEditData] = useState<any>(null);

      // Handler edit transaksi (open modal)
      const handleEdit = (item, trx) => {
        setEditData({
          id: item._id,
          kategori: item.kategori,
          sub_kategori: item.sub_kategori,
          akun: item.akun,
          bulan: trx.bulan,
          nilai: trx.nilai,
          input_by: item.input_by,
        });
        setEditModalOpen(true);
      };

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

      // Handler hapus transaksi bulanan
      const handleDelete = async (item, trx) => {
        try {
          await axiosInstance.delete(`/transaksi/${item._id}/bulan/${trx.bulan}`);
          queryClient.invalidateQueries({ queryKey: ['transaksi'] });
          toast.success('Transaksi berhasil dihapus!');
        } catch {
          toast.error('Gagal menghapus transaksi.');
        }
      };
    // ...existing code...
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Transaksi>({
    kategori_id: '',
    subkategori_id: '',
    akun_id: '',
    bulan_fiskal: '',
    nilai: 0,
    input_by: '',
  });
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
  const filteredAccounts = formData.subkategori_id
    ? accounts.filter((acc) => {
        const selectedSubKategori = subCategories.find((sk) => sk._id === formData.subkategori_id)?.sub_kategori;
        return acc.sub_kategori === selectedSubKategori;
      })
    : [];

  // Fetch transaksi
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['transaksi'],
    queryFn: async () => {
      const response = await axiosInstance.get('/transaksi');
      return response.data || [];
    },
  });

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

  return (
    <div className="space-y-6">
      {/* Modal Edit Transaksi */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Edit Transaksi</h2>
            <div className="space-y-3">
              <Label>Kategori</Label>
              <Select
                value={editData.kategori}
                onValueChange={value => setEditData({ ...editData, kategori: value })}
              >
                <SelectTrigger>
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
              <Label>Sub Kategori</Label>
              <Select
                value={editData.sub_kategori}
                onValueChange={value => setEditData({ ...editData, sub_kategori: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih sub kategori" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((sub) => (
                    <SelectItem key={sub._id} value={sub.sub_kategori}>
                      {sub.sub_kategori}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Akun</Label>
              <Select
                value={editData.akun}
                onValueChange={value => setEditData({ ...editData, akun: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih akun" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc._id} value={acc.akun}>
                      {acc.akun}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Bulan Fiskal</Label>
              <Select
                value={editData.bulan}
                onValueChange={value => setEditData({ ...editData, bulan: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {BULAN_FISKAL.map((bulan) => (
                    <SelectItem key={bulan} value={bulan}>
                      {bulan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Nilai</Label>
              <Input
                type="number"
                value={editData.nilai}
                onChange={e => setEditData({ ...editData, nilai: parseFloat(e.target.value) })}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setEditModalOpen(false); setEditData(null); }}>Batal</Button>
              <Button onClick={handleEditSave}>Simpan</Button>
            </div>
          </div>
        </div>
      )}
      <h1 className="text-3xl font-bold text-foreground">Transaksi</h1>

      <Card>
        <CardHeader>
          <CardTitle>Input Transaksi</CardTitle>
          <CardDescription>Tambah transaksi baru</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kategori">Kategori</Label>
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
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="subkategori">Sub Kategori</Label>
                <Select
                  value={formData.subkategori_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, subkategori_id: value, akun_id: '' });
                  }}
                  disabled={!formData.kategori_id}
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="akun">Akun</Label>
                <Select
                  value={formData.akun_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, akun_id: value })
                  }
                  disabled={!formData.subkategori_id}
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="bulan">Bulan Fiskal</Label>
                <Select
                  value={formData.bulan_fiskal}
                  onValueChange={(value) =>
                    setFormData({ ...formData, bulan_fiskal: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {BULAN_FISKAL.map((bulan) => (
                      <SelectItem key={bulan} value={bulan}>
                        {bulan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nilai">Nilai Transaksi (Rp)</Label>
                <Input
                  id="nilai"
                  type="number"
                  value={formData.nilai || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, nilai: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Simpan Transaksi
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>History transaksi yang telah diinput</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bulan Fiskal</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Sub Kategori</TableHead>
                <TableHead>Akun</TableHead>
                <TableHead className="text-right">Nilai</TableHead>
                <TableHead>Input By</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada transaksi
                  </TableCell>
                </TableRow>
              ) : (
                data.flatMap((item) =>
                  item.data_bulanan.map((trx, idx) => (
                    <TableRow key={item._id + '-' + idx}>
                      <TableCell>{trx.bulan}</TableCell>
                      <TableCell>{item.kategori}</TableCell>
                      <TableCell>{item.sub_kategori}</TableCell>
                      <TableCell>{item.akun}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(trx.nilai)}
                      </TableCell>
                      <TableCell>{item.input_by}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(item, trx)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(item, trx)} className="ml-2">
                          Hapus
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
