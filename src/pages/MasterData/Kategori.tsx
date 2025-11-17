import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import axiosInstance from '@/api/axiosInstance';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface Kategori {
  _id?: string;
  kategori: string;
  kode: string;
  status_aktv?: boolean;
  input_date?: string;
  update_date?: string;
  delete_date?: string | null;
  input_by: string;
  update_by?: string | null;
  delete_by?: string | null;
}

export default function Kategori() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Kategori>({ kategori: '', kode: '', input_by: '' });
  const { user } = useAppStore();

  // Fetch kategori
  // Ambil semua data kategori (aktif dan non-aktif) untuk validasi input
  const { data: allKategoriList = [], isLoading } = useQuery<Kategori[]>({
    queryKey: ['kategori-all'],
    queryFn: async () => {
      const res = await axiosInstance.get('/master/kategori?all=true');
      return res.data || [];
    },
  });

  // Filter hanya yang aktif untuk ditampilkan di tabel
  const kategoriList = allKategoriList.filter((k) => k.status_aktv !== false);

  // Create / Update
  const saveMutation = useMutation({
    mutationFn: async (payload: Kategori) => {
      if (editId) {
        return axiosInstance.put(`/master/kategori/${editId}`, {
          ...payload,
          update_by: user?.name || 'Unknown',
        });
      }
      // Cek apakah data sudah ada dan non-aktif
      const existing = allKategoriList.find(
        (k) => k.kode === payload.kode || k.kategori.toLowerCase() === payload.kategori.toLowerCase()
      );
      if (existing && existing.status_aktv === false) {
        setReactivateId(existing._id);
        setShowReactivateDialog(true);
        return;
      }
      return axiosInstance.post('/master/kategori', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kategori'] });
      queryClient.invalidateQueries({ queryKey: ['kategori-all'] });
      toast.success(editId ? 'Kategori berhasil diupdate!' : 'Kategori berhasil ditambahkan!');
      handleCloseModal();
    },
    onError: () => toast.error('Gagal menyimpan kategori!'),
  });

  // Delete (soft delete)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/master/kategori/${id}`, {
      data: { delete_by: user?.name || 'Unknown' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kategori'] });
      queryClient.invalidateQueries({ queryKey: ['kategori-all'] });
      toast.success('Kategori berhasil dihapus!');
    },
    onError: (error: any) => {
      if (error?.response?.data?.message?.includes('Maaf, data ini sudah ada transaksi')) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Gagal menghapus kategori!');
      }
    },
  });
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [reactivateId, setReactivateId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, input_by: user?.name || 'Unknown' });
  };

  const handleEdit = (item: Kategori) => {
    setEditId(item._id || null);
    setFormData(item);
    setModalOpen(true);
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
    setFormData({ kategori: '', kode: '', input_by: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Master Kategori</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Kategori
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kategori</CardTitle>
          <CardDescription>Manajemen kategori transaksi</CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 px-4 py-2">Kode</TableHead>
                <TableHead className="w-64 px-4 py-2">Kategori</TableHead>
                <TableHead className="w-48 px-4 py-2">Input By</TableHead>
                <TableHead className="w-32 px-4 py-2 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : kategoriList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">Belum ada data</TableCell>
                </TableRow>
              ) : (
                kategoriList.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="w-20 px-4 py-2 font-medium">{item.kode}</TableCell>
                    <TableCell className="w-64 px-4 py-2 font-semibold">{item.kategori}</TableCell>
                    <TableCell className="w-48 px-4 py-2">{item.input_by}</TableCell>
                    <TableCell className="w-32 px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => item._id && handleDelete(item._id)}>
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

      <ModalForm open={modalOpen} onOpenChange={handleCloseModal} title={editId ? 'Edit Kategori' : 'Tambah Kategori'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="kode">Kode</Label>
            <Input id="kode" value={formData.kode} onChange={e => setFormData({...formData, kode: e.target.value})} required />
          </div>
          <div>
            <Label htmlFor="kategori">Kategori</Label>
            <Input id="kategori" value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} required />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button type="submit">{editId ? 'Update' : 'Simpan'}</Button>
          </div>
        </form>
      </ModalForm>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
                await axiosInstance.put(`/master/kategori/${reactivateId}`, {
                  status_aktv: true,
                  update_by: user?.name || 'Unknown',
                });
                await queryClient.invalidateQueries({ queryKey: ['kategori'] });
                await queryClient.invalidateQueries({ queryKey: ['kategori-all'] });
                setShowReactivateDialog(false);
                handleCloseModal();
                toast.success('Kategori diaktifkan kembali!');
              }
            }}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus kategori ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
