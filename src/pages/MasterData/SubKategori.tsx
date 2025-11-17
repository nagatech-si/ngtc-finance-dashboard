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
import { ModalForm } from '@/components/ModalForm';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface SubKategori {
  _id?: string;
  sub_kategori: string;
  kode: string;
  kategori: string; // ObjectId
  kategori_nama?: string;
  input_date?: string;
  update_date?: string;
  delete_date?: string | null;
  input_by: string;
  update_by?: string | null;
  delete_by?: string | null;
}

interface Kategori {
  _id: string;
  kategori: string;
}

export default function SubKategori() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SubKategori>({
    sub_kategori: '',
    kode: '',
    kategori: '',
    input_by: '',
  });
  const { user } = useAppStore();

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['kategori'],
    queryFn: async () => {
      const response = await axiosInstance.get('/master/kategori');
      return response.data || [];
    },
  });

  // Fetch subkategori
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['subkategori'],
    queryFn: async () => {
      const response = await axiosInstance.get('/master/subkategori');
      return response.data || [];
    },
  });

  // Create/Update mutation
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [reactivateId, setReactivateId] = useState<string | null>(null);
  const saveMutation = useMutation({
    mutationFn: async (payload: SubKategori) => {
      if (editId) {
        return axiosInstance.put(`/master/subkategori/${editId}`, {
          ...payload,
          update_by: user?.name || 'Unknown',
        });
      }
      // Cek apakah data sudah ada dan non-aktif
      const existing = data.find(
        (s) => s.kode === payload.kode || s.sub_kategori.toLowerCase() === payload.sub_kategori.toLowerCase()
      );
      if (existing && existing.status_aktv === false) {
        setReactivateId(existing._id);
        setShowReactivateDialog(true);
        return;
      }
      return axiosInstance.post('/master/subkategori', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subkategori'] });
      toast.success(editId ? 'Sub Kategori berhasil diupdate!' : 'Sub Kategori berhasil ditambahkan!');
      handleCloseModal();
    },
    onError: (error: any, payload: SubKategori) => {
      // Cek error dari backend (duplicate key, code 11000)
      if (error?.response?.data?.code === 11000) {
        // Cari data non-aktif dari backend response jika ada
        const allData = Array.isArray(error?.response?.data?.allData)
          ? error.response.data.allData
          : data;
        const existing = allData.find(
          (s: any) =>
            s.kode === payload.kode ||
            s.sub_kategori?.toLowerCase() === payload.sub_kategori?.toLowerCase()
        );
        if (existing && existing.status_aktv === false) {
          setReactivateId(existing._id);
          setShowReactivateDialog(true);
          return;
        }
        toast.error('Data sudah ada!');
        return;
      }
      toast.error('Gagal menyimpan data. Silakan coba lagi.');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/master/subkategori/${id}`, {
      data: { delete_by: user?.name || 'Unknown' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subkategori'] });
      toast.success('Sub Kategori berhasil dihapus!');
    },
    onError: (error: any) => {
      if (error?.response?.data?.message?.includes('Maaf, data ini sudah ada transaksi')) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Gagal menghapus sub kategori!');
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, input_by: user?.name || 'Unknown' };
    saveMutation.mutate(payload);
  };

  const handleEdit = (item: SubKategori) => {
    setEditId(item._id || null);
    setFormData(item);
    setModalOpen(true);
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // ...existing code...

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditId(null);
    setFormData({ sub_kategori: '', kode: '', kategori: '', input_by: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Master Sub Kategori</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Sub Kategori
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Sub Kategori</CardTitle>
          <CardDescription>Manajemen sub kategori transaksi</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Sub Kategori</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Input By</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Belum ada data
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">{item.kode}</TableCell>
                    <TableCell>{item.sub_kategori}</TableCell>
                    <TableCell>{item.kategori}</TableCell>
                    <TableCell>{item.input_by}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => item._id && handleDelete(item._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ModalForm
        open={modalOpen}
        onOpenChange={handleCloseModal}
        title={editId ? 'Edit Sub Kategori' : 'Tambah Sub Kategori'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kategori">Kategori</Label>
            <Select
              value={formData.kategori}
              onValueChange={(value) =>
                setFormData({ ...formData, kategori: value })
              }
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="kode">Kode</Label>
            <Input
              id="kode"
              value={formData.kode}
              onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub_kategori">Nama Sub Kategori</Label>
            <Input
              id="sub_kategori"
              value={formData.sub_kategori}
              onChange={(e) => setFormData({ ...formData, sub_kategori: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button type="submit">{editId ? 'Update' : 'Simpan'}</Button>
          </div>
        </form>
      </ModalForm>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus sub kategori ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Data sudah ada</AlertDialogTitle>
            <AlertDialogDescription>
              Data ini sudah ada, aktvkan kembali?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowReactivateDialog(false)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (reactivateId) {
                await axiosInstance.put(`/master/subkategori/${reactivateId}`, {
                  status_aktv: true,
                  update_by: user?.name || 'Unknown',
                });
                await queryClient.invalidateQueries({ queryKey: ['subkategori'] });
                setShowReactivateDialog(false);
                handleCloseModal();
                toast.success('Sub Kategori diaktifkan kembali!');
              }
            }}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
