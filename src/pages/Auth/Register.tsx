import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axiosInstance from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import {
  base64URLToBuffer,
  bufferToBase64URL,
} from "@/utils/webauthn";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [yubiLoading, setYubiLoading] = useState(false);

  // Normal Registration
  const registerMutation = useMutation({
    mutationFn: async (userData: {
      name: string;
      email: string;
      password: string;
    }) => {
      const response = await axiosInstance.post("/auth/register", userData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Registrasi berhasil! Silakan login.");
      navigate("/login");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Registrasi gagal. Silakan coba lagi."
      );
    },
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ name, email, password });
  };

  // -------------------------------------
  // WEBAUTHN / YUBIKEY REGISTRATION
  // -------------------------------------

  const handleYubiRegister = async () => {
    if (!name || !email || !password) {
      toast.error("Isi semua data terlebih dahulu");
      return;
    }

    setYubiLoading(true);

    try {
      // 1. Ask backend to create user & challenge
      const challengeRes = await axiosInstance.post("/auth/register-challenge", {
        username: email,
        name,
        password,
      });

      const options = challengeRes.data;

      // Convert challenge from base64url to ArrayBuffer
      options.challenge = base64URLToBuffer(options.challenge);

      // Convert user.id
      if (options.user && options.user.id) {
        options.user.id = base64URLToBuffer(options.user.id);
      }

      // Convert excludeCredentials[].id
      if (options.excludeCredentials) {
        options.excludeCredentials = options.excludeCredentials.map(
          (cred: any) => ({
            ...cred,
            id: base64URLToBuffer(cred.id),
          })
        );
      }

      // 2. Browser creates credential using YubiKey
      const credential: any = await navigator.credentials.create({
        publicKey: options,
      });

      const attResp: any = credential.response;

      // 3. Convert to base64url for backend
      const credentialForServer = {
        id: credential.id,
        rawId: bufferToBase64URL(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: bufferToBase64URL(attResp.clientDataJSON),
          attestationObject: bufferToBase64URL(attResp.attestationObject),
        },
      };

      // 4. Verify with backend
      const verifyRes = await axiosInstance.post("/auth/register-verify", {
        credential: credentialForServer,
        username: email,
      });

      if (verifyRes.data.success) {
        toast.success("Registrasi YubiKey berhasil! Silakan login.");
        navigate("/login");
      } else {
        toast.error("Registrasi YubiKey gagal.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Registrasi YubiKey gagal");
    }

    setYubiLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>

          <CardTitle className="text-2xl text-center">Daftar Akun</CardTitle>
          <CardDescription className="text-center">
            Buat akun baru untuk menggunakan sistem
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email / Username</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {/* Normal Registration */}
            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Loading..." : "Register"}
            </Button>

            {/* YubiKey Registration */}
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={handleYubiRegister}
              disabled={yubiLoading}
            >
              {yubiLoading
                ? "Mendaftarkan YubiKey..."
                : "Register dengan YubiKey / Security Key"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Sudah punya akun?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              Login di sini
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
