import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import axiosInstance from "@/api/axiosInstance";
import { useAppStore } from "@/store/useAppStore";

export default function TutupBuku() {
    const { setFiscalYear } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [tahun, setTahun] = useState("");

  const handleTutupBuku = async () => {
    if (!tahun) {
      toast.error("Tahun fiskal harus diisi!");
      return;
    }
    setLoading(true);
    try {
      console.debug('[TutupBuku] Attempting to close fiscal year:', tahun);
      const res = await axiosInstance.post("/fiscal/close", { fiscalYear: tahun });
      console.debug('[TutupBuku] /fiscal/close response:', res?.data);
      if (res.data.success) {
        toast.success(`Tutup buku berhasil! Data tahun ${tahun} dipindahkan.`);
        // Update fiscal year in global store
        setFiscalYear(Number(tahun) + 1);
        console.debug('[TutupBuku] setFiscalYear called with:', Number(tahun) + 1);
      } else {
        toast.error("Tutup buku gagal!");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Tutup buku gagal!");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Tutup Buku Tahun Fiskal</h2>
      <input
        type="text"
        className="border rounded px-3 py-2 w-full mb-4"
        placeholder="Masukkan tahun fiskal (misal: 2025)"
        value={tahun}
        onChange={e => setTahun(e.target.value)}
      />
      <Button onClick={handleTutupBuku} disabled={loading} className="w-full">
        {loading ? "Proses..." : "Tutup Buku"}
      </Button>
    </div>
  );
}
