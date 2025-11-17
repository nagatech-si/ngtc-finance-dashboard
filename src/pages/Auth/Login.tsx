// akunting-frontend/src/pages/Auth/Login.tsx
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
import { LogIn } from "lucide-react";
import { base64URLToBuffer, bufferToBase64URL } from "@/utils/webauthn";
import { useAppStore } from "@/store/useAppStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [yubiLoading, setYubiLoading] = useState(false);
  const setUser = useAppStore((s) => s.setUser);

  // -------------------------
  // Normal Login (password)
  // -------------------------
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await axiosInstance.post("/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      const { token, user } = data;
      // Simpan token & user
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user_name", user.name);
      setUser({ name: user.name, email: user.email });
      toast.success("Login berhasil!");
      navigate("/dashboard");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Login gagal. Periksa email dan password Anda.";
      toast.error(message);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  // -------------------------
  // WebAuthn / YubiKey Login
  // -------------------------
  const handleYubiLogin = async () => {
    if (!email) {
      toast.error("Masukkan email/username terlebih dahulu");
      return;
    }

    setYubiLoading(true);

    try {
      // 1. Dapatkan challenge dari backend
      const challengeRes = await axiosInstance.post("/auth/login-challenge", {
        username: email,
      });

      const options = challengeRes.data;

      // Convert challenge dari base64url -> ArrayBuffer
      options.challenge = base64URLToBuffer(options.challenge);

      // Convert allowCredentials[].id
      if (options.allowCredentials) {
        options.allowCredentials = options.allowCredentials.map((cred: any) => ({
          ...cred,
          id: base64URLToBuffer(cred.id),
        }));
      }

      // 2. Browser request assertion dari YubiKey
      const assertion: any = await navigator.credentials.get({
        publicKey: { ...options },
      });

      const authResp: any = assertion.response;

      // 3. Convert buffers ke base64url untuk backend
      const credentialForServer = {
        id: assertion.id,
        rawId: bufferToBase64URL(assertion.rawId),
        type: assertion.type,
        response: {
          clientDataJSON: bufferToBase64URL(authResp.clientDataJSON),
          authenticatorData: bufferToBase64URL(authResp.authenticatorData),
          signature: bufferToBase64URL(authResp.signature),
          userHandle: authResp.userHandle
            ? bufferToBase64URL(authResp.userHandle)
            : null,
        },
      };

      // 4. Verify backend
      const verifyRes = await axiosInstance.post("/auth/login-verify", {
        credential: credentialForServer,
        username: email,
      });

      if (verifyRes.data.success) {
        // Simpan token & user (gunakan nama dari backend jika ada)
        localStorage.setItem("auth_token", "webauthn_dummy_token");
        const userName = verifyRes.data.user?.name || email;
        localStorage.setItem("user_name", userName);
        setUser({ name: userName, email });
        toast.success("Login YubiKey berhasil!");
        navigate("/dashboard");
      } else {
        toast.error("Login YubiKey gagal!");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Login YubiKey gagal");
    }

    setYubiLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <LogIn className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Masukkan email dan password Anda
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email / Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="email / username"
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
              />
            </div>

            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Loading..." : "Login"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={handleYubiLogin}
              disabled={yubiLoading}
            >
              {yubiLoading ? "Menghubungkan YubiKey..." : "Login dengan YubiKey / Security Key"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Belum punya akun?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Daftar di sini
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
