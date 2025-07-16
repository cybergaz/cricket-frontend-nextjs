"use client";

import type React from "react";
import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TradingBackground,
  PriceTicker,
} from "@/components/auth/trading-background";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, InfoIcon, LoaderCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatPhoneNumber,
  validatePassword,
  validatePhone,
} from "@/lib/helper";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { handleGoogleSuccess, login } from "@/lib/actions";
import { toast } from "sonner";
import { TooltipArrow } from "@radix-ui/react-tooltip";


const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;

type Mode = "login" | "signup" | "forgot";
type Step = "form" | "otp";

interface FormState {
  name: string;
  phone: string;
  email?: string;
  password: string;
  new_password?: string;
  referral_code?: string;
}

export default function AuthPage() {
  const referralCode = useSearchParams().get('referral')
  const modeParam = useSearchParams().get('mode')

  const [hasReferral, setHasReferral] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    password: "",
    new_password: "",
    referral_code: "",
  });
  const [otp, setOtp] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [info, setInfo] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // Check for token in cookies
    const checkToken = () => {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (token) {
        router.push("/home"); // navigate to home if token exists
      }
    };

    // Check for referral code
    if (referralCode) {
      setHasReferral(true)
      setForm({ ...form, referral_code: referralCode })
    }

    if (modeParam) {
      setMode(modeParam as Mode)
    }

    checkToken();
  }, [router]);


  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError("");
    setInfo("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneError = validatePhone(form.phone);
    if (phoneError) return setError(phoneError);

    if (!form.password) return setError("Password is required");

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(form.phone);
      const res = await login(formattedPhone, form.password); // assuming login() is already typed

      if (res.success) {
        setInfo("Login successful!");
        router.push("/home");
      } else {
        setError(res.message || "Login failed. Please check your credentials.");
      }
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const validReferral = () => {
    if (!form.referral_code) {
      toast.error("Enter Referral Code !")
    } else {
      if (!form.referral_code.startsWith("CRST-") || form.referral_code.length < 19) {
        toast.error("Unknown Referral Code !")
      } else {
        toast.success("Referral Code Added !")
      }
    }
  }
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneError = validatePhone(form.phone);
    if (phoneError) return setError(phoneError);

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(form.phone);
      const res = await fetch(`${BACKEND_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: formattedPhone,
          resetPassword: true,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep("otp");
        setInfo(data.message);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(form.phone);
      const res = await fetch(`${BACKEND_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: formattedPhone,
          new_password: form.new_password,
          otp,
        }),
      });

      if (res.status === 201) {
        setInfo("Password Reset successful! Please login.");
        setMode("login");
        setStep("form");
        setForm({ name: "", phone: form.phone, password: "" });
        setOtp("");
      } else if (res.status === 400) {
        setError("Invalid OTP. Please try again.");
      } else {
        const data = await res.json();
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneError = validatePhone(form.phone);
    if (phoneError) return setError(phoneError);

    const passwordError = validatePassword(form.password);
    if (passwordError) return setError(passwordError);

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(form.phone);
      const res = await fetch(`${BACKEND_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: formattedPhone }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep("otp");
        setInfo(data.message);
      } else if (res.status === 409 && data.message === "User already exists") {
        toast.success(
          "User already exists. Please login with your registered phone number."
        );
        setMode("login");
        setStep("form");
        setForm({ ...form, phone: form.phone });
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(form.phone);
      const res = await fetch(`${BACKEND_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          mobile: formattedPhone,
          email: form.email,
          password: form.password,
          otp,
        }),
      });

      if (res.status === 201) {
        setInfo("Signup successful! Please login.");
        setMode("login");
        setStep("form");
        setForm({
          name: "",
          phone: form.phone,
          password: "",
          new_password: "",
        });
        setOtp("");
      } else if (res.status === 400) {
        setError("Invalid OTP. Please try again.");
      } else {
        const data = await res.json();
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = () => setShowPassword((prev) => !prev);
  const toggleNewPassword = () => setShowNewPassword((prev) => !prev);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Trading background */}
      <TradingBackground />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center gap-2 animate-slide-down-lg">
          <Link href={"/"} className="" >
            <Image
              src={"/images/logo.png"}
              alt="Logo"
              width={150}
              height={100}
              className="rounded-full object-cover"
            />
          </Link>
          <p className="text-gray-400">Your cricket stock trading platform</p>
        </div>

        <div className="bg-gray-800 animate-scale-in-lg p-6 rounded-lg shadow-xl border border-gray-700">
          <div className="grid w-full grid-cols-2 mb-6 gap-5">
            <Button
              variant={mode === "login" ? "default" : "ghost"}
              onClick={() => {
                setMode("login");
                setStep("form");
                setError("");
                setInfo("");
              }}
              className={`w-full ${mode === "login"
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-gray-700 hover:bg-gray-600"
                } text-white`}
            >
              Login
            </Button>
            <Button
              variant={mode === "signup" ? "default" : "ghost"}
              onClick={() => {
                setMode("signup");
                setStep("form");
                setError("");
                setInfo("");
              }}
              className={`w-full ${mode === "signup"
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-gray-700 hover:bg-gray-600"
                } text-white`}
            >
              Sign Up
            </Button>
          </div>

          {mode === "login" && (
            <div className="animate-slide-right-sm">
              {error && (
                <div className="text-red-500 mb-5 px-5 py-1 bg-red-500/10 rounded-full animate-slide-right-sm">
                  {error}
                </div>
              )}

              {info && (
                <div className="text-green-400 mb-5 px-5 py-1 bg-green-400/10 rounded-full animate-slide-right-sm">
                  {info}
                </div>
              )}

              <form
                onSubmit={handleLogin}
                className="space-y-4 animate-slide-right-sm"
              >
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300">
                    Phone Number
                  </Label>
                  <div className="flex">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-[90px] bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="+91" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600 text-white">
                        <SelectItem value="+91">+91 🇮🇳</SelectItem>
                        {/* <SelectItem value="+1">+1 🇺🇸</SelectItem> */}
                        {/* <SelectItem value="+44">+44 🇬🇧</SelectItem> */}
                        {/* <SelectItem value="+61">+61 🇦🇺</SelectItem> */}
                        {/* <SelectItem value="+971">+971 🇦🇪</SelectItem> */}
                      </SelectContent>
                    </Select>
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="Enter Phone Number"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      className="flex-1 ml-2 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="relative space-y-2 mt-5">
                    <Label htmlFor="signup-password" className="text-gray-300">
                      Password
                    </Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={togglePassword}
                      className="absolute right-3 top-1/2 transform text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <span>Login</span>
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <Button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setStep("form");
                      setError("");
                      setInfo("");
                    }}
                    className="text-sm text-purple-400 hover:text-purple-300 cursor-pointer"
                  >
                    Forgot Password?
                  </Button>
                </div>
              </form>
            </div>
          )}

          {mode === "forgot" && step === "form" && (
            <form
              onSubmit={handleForgotPassword}
              className="mt-8 space-y-6 animate-slide-right-sm"
            >
              <div className="rounded-md space-y-4">
                <div>
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="Enter Phone Number"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <span>Request OTP</span>
                  )}
                </Button>
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setStep("form");
                    setError("");
                    setInfo("");
                  }}
                  className="text-sm text-purple-400 hover:text-purple-300 cursor-pointer"
                >
                  Back to Login
                </Button>
              </div>
            </form>
          )}

          {mode === "forgot" && step === "otp" && (
            <form
              onSubmit={handleResetPassVerifyOtp}
              className="mt-8 space-y-6 animate-slide-right"
            >
              <div className="rounded-md space-y-4">
                <div>
                  <Input
                    type="text"
                    name="otp"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value);
                      setError("");
                      setInfo("");
                    }}
                    required
                    className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                    maxLength={6}
                  />
                </div>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    name="new_password"
                    placeholder="Create New Password"
                    value={form.new_password}
                    onChange={handleChange}
                    required
                    className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={toggleNewPassword}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {loading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <span>Verify OTP & Reset Password</span>
                  )}
                </Button>
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setStep("form");
                    setError("");
                    setInfo("");
                  }}
                  className="text-sm text-purple-400 hover:text-purple-300 cursor-pointer"
                >
                  Back to Login
                </Button>
              </div>
            </form>
          )}

          {mode === "signup" && step === "form" && (
            <div className="animate-slide-left-sm">
              {error && (
                <div className="text-red-500 mb-5 pl-5 border-l-2 border-red-500 animate-slide-right-sm">
                  {error}
                </div>
              )}

              {info && (
                <div className="text-red-500 mb-5 pl-5 border-l-2 border-red-500 animate-slide-right-sm">
                  {info}
                </div>
              )}
              <form className="space-y-4" onSubmit={handleCreateAccount}>
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="text-gray-300">
                    Full name
                  </Label>
                  <Input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="text-gray-300">
                    Phone Number
                  </Label>
                  <div className="flex">
                    <Select defaultValue="+91">
                      <SelectTrigger className="w-[90px] bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="+91" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600 text-white">
                        <SelectItem value="+91">+91 🇮🇳</SelectItem>
                        {/* <SelectItem value="+1">+1 🇺🇸</SelectItem> */}
                        {/* <SelectItem value="+44">+44 🇬🇧</SelectItem> */}
                        {/* <SelectItem value="+61">+61 🇦🇺</SelectItem> */}
                        {/* <SelectItem value="+971">+971 🇦🇪</SelectItem> */}
                      </SelectContent>
                    </Select>
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      className="flex-1 ml-2 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-300">
                    Email (Optional)
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={toggleNewPassword}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showNewPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Referral Code Section */}
                <div className="space-y-2 pt-2 border-t border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has-referral"
                      checked={hasReferral}
                      onCheckedChange={(checked) =>
                        setHasReferral(checked as boolean)
                      }
                      className="data-[state=checked]:bg-purple-600"
                    />
                    <Label
                      htmlFor="has-referral"
                      className="text-gray-300 text-sm cursor-pointer"
                    >
                      I have a referral code
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className=" backdrop-blur-xs  rounded-full border-2 border-accent mb-3">
                          <p
                            className="p-2 font-bold text-accent"
                          >
                            Get ₹100 bonus credits when you sign up with a valid
                            referral code!
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {hasReferral && (
                    <div className="overflow-hidden animate-slide-down-sm">
                      <div className="space-y-2 pt-2">
                        <Label
                          htmlFor="referral-code"
                          className="text-gray-300"
                        >
                          Referral Code
                        </Label>
                        <div className="relative">
                          <Input
                            id="referral-code"
                            name="referral_code"
                            value={form.referral_code}
                            placeholder="Enter code (e.g. CRST-XXXXXXXX-XXX)"
                            className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                            onChange={handleChange}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            className="absolute right-0 top-0 h-full px-3 text-purple-400 hover:text-purple-300"
                            onClick={validReferral}
                          >
                            Verify
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <span> Create Account </span>
                  )}
                </Button>
              </form>
            </div>
          )}

          {mode === "signup" && step === "otp" && (
            <form
              onSubmit={handleVerifyOtp}
              className="mt-8 space-y-6 animate-slide-right"
            >
              <div className="rounded-md">
                <div>
                  <Input
                    type="text"
                    name="otp"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value);
                      setError("");
                      setInfo("");
                    }}
                    required
                    className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <span> Verify & Signup </span>
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-400">Or continue with</span>
            </div>
            <div className="mt-4 flex justify-center">
              <GoogleOAuthProvider clientId={CLIENT_ID!}>
                <Button className="flex justify-start cursor-pointer border-gray-700 p-2 rounded-lg text-xl items-center outline-2 outline-gray-500 text-gray-400">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error("Google Login Failed")}
                  />
                </Button>
              </GoogleOAuthProvider>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-gray-400 text-sm animate-slide-up-sm">
          By continuing, you agree to our
          <Link
            href="/terms-and-conditions"
            className="text-purple-500 hover:text-purple-400 mx-1"
          >
            Terms of Service
          </Link>
          and
          <Link
            href="/privacy-policy"
            className="text-purple-500 hover:text-purple-400 ml-1"
          >
            Privacy Policy
          </Link>
        </div>
      </div>

      {/* Price ticker at bottom */}
      <PriceTicker />
    </div>
  );
}
