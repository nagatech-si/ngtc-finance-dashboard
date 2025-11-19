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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface Akun {
  _id?: string;
  nama: string;
  kode: string;
  subkategori_id: string;
  subkategori_nama?: string;
  input_by: string;
}

interface SubKategori {
  _id: string;
  sub_kategori: string;
  kategori: string;
  status_aktv?: boolean;
}

export default function Akun() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Akun>({
      nama: '',
      kode: '',
      subkategori_id: '', // tetap simpan id untuk dropdown
      input_by: '',
    });
    const { user } = useAppStore();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showReactivateDialog, setShowReactivateDialog] = useState(false);
    const [reactivateId, setReactivateId] = useState<string | null>(null);

    // Fetch sub categories
    const { data: subCategories = [] } = useQuery({
      queryKey: ['subkategori'],
      queryFn: async () => {
        const response = await axiosInstance.get('/master/subkategori');
        return response.data || [];
      },
    });

    // Fetch akun
    const { data = [], isLoading, error } = useQuery({
      queryKey: ['akun'],
      queryFn: async () => {
        const response = await axiosInstance.get('/master/akun');
        return response.data || [];
      },
    });

    // Create/Update mutation
    const saveMutation = useMutation({
      mutationFn: async (payload: any) => {
        if (editId) {
          return axiosInstance.put(`/master/akun/${editId}`, payload);
        }
        return axiosInstance.post('/master/akun', payload);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['akun'] });
        toast.success(editId ? 'Akun berhasil diupdate!' : 'Akun berhasil ditambahkan!');
        handleCloseModal();
      },
      onError: (error: any) => {
        // Custom re-activate logic
        if (error?.response?.data?.code === 'REACTIVATE' && error?.response?.data?.id) {
          setReactivateId(error.response.data.id);
          setShowReactivateDialog(true);
        } else {
          toast.error('Gagal menyimpan data. Silakan coba lagi.');
        }
      },
    });

    // Delete mutation
    const deleteMutation = useMutation({
      mutationFn: (id: string) => axiosInstance.delete(`/master/akun/${id}`, {
        data: { delete_by: user?.name || 'Unknown' },
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['akun'] });
        toast.success('Akun berhasil dihapus!');
        setShowDeleteDialog(false);
        setDeleteId(null);
      },
      onError: () => {
        toast.error('Gagal menghapus data. Silakan coba lagi.');
      },
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.subkategori_id) {
        toast.error('Sub Kategori wajib dipilih!');
        return;
      }
      if (!formData.nama) {
        toast.error('Nama Akun wajib diisi!');
        return;
      }
      // Kirim _id sub kategori ke backend
      const payload = {
        sub_kategori: formData.subkategori_id,
        akun: formData.nama,
        kode: formData.kode,
        input_by: user?.name || 'Unknown',
      };
      saveMutation.mutate(payload);
    };

    const handleEdit = (item: Akun) => {
      const subKategoriObj = subCategories.find(
        (sub) => sub.sub_kategori === item.sub_kategori
      );
      setEditId(item._id || null);
      setFormData({
        ...item,
        nama: item.nama || item.akun || '',
        subkategori_id: subKategoriObj ? subKategoriObj._id : '',
      });
      setModalOpen(true);
    };

    const handleDelete = async () => {
      if (deleteId) {
        deleteMutation.mutate(deleteId);
      }
    };

    const handleCloseModal = () => {
      setModalOpen(false);
      setEditId(null);
      setFormData({ nama: '', kode: '', subkategori_id: '', input_by: '' });
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Master Akun</h1>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Akun
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Daftar Akun</CardTitle>
            <CardDescription>Manajemen akun transaksi</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Sub Kategori</TableHead>
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
                      <TableCell>{item.akun || item.nama}</TableCell>
                      <TableCell>
                        {subCategories.find((sub) => sub._id === item.sub_kategori)?.sub_kategori || item.sub_kategori}
                      </TableCell>
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
                            onClick={() => {
                              setDeleteId(item._id || null);
                              setShowDeleteDialog(true);
                            }}
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
          title={editId ? 'Edit Akun' : 'Tambah Akun'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subkategori">Sub Kategori</Label>
              <Select
                value={formData.subkategori_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, subkategori_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih sub kategori" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories
                    .filter((sub_kategori) => sub_kategori.status_aktv !== false)
                    .map((sub_kategori) => (
                      <SelectItem key={sub_kategori._id} value={sub_kategori._id}>
                        {sub_kategori.sub_kategori} ({sub_kategori.kode})
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
              <Label htmlFor="nama">Nama Akun</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
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
        {/* Custom Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Hapus</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus data akun ini?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Batal</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Custom Reactivate Dialog */}
        <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Data sudah ada</DialogTitle>
              <DialogDescription>
                Data ini sudah ada, aktifkan kembali?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setShowReactivateDialog(false)}>Batal</Button>
              </DialogClose>
              <Button variant="default" onClick={async () => {
                if (reactivateId) {
                  await axiosInstance.put(`/master/akun/${reactivateId}`, {
                    status_aktv: true,
                    update_by: user?.name || 'Unknown',
                  });
                  await queryClient.invalidateQueries({ queryKey: ['akun'] });
                  setShowReactivateDialog(false);
                  handleCloseModal();
                  toast.success('Akun diaktifkan kembali!');
                }
              }}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
