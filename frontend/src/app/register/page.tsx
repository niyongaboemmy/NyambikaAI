"use client";

import { useEffect, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Check,
  Loader2,
  ShoppingBag,
  Factory,
} from "lucide-react";
import { Button } from "../../components/custom-ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/custom-ui/card";
import { FormInput } from "../../components/custom-ui/form-input";
import { FormSelect } from "../../components/custom-ui/form-select";
import { Label } from "../../components/custom-ui/label";
import { useAuth } from "../../contexts/AuthContext";
import { useLoginPrompt } from "../../contexts/LoginPromptContext";
import { Checkbox } from "../../components/custom-ui/checkbox";
import { useToast } from "../../hooks/use-toast";
import {
  Tabs,
  TabsTrigger,
  TabsContent,
  TabsList,
} from "../../components/custom-ui/tabs";
import { Progress } from "../../components/custom-ui/progress";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/config/api";

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { open } = useLoginPrompt();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    role: "" as "customer" | "producer" | "agent" | "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [countryCode, setCountryCode] = useState("+250");
  const [isLoading, setIsLoading] = useState(false);
  const { register, loginWithProvider } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [step, setStep] = useState<1 | 2>(1);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [pwdReq, setPwdReq] = useState({
    minLength: false,
    upper: false,
    lower: false,
    digit: false,
    special: false,
  });
  const countryOptions = [
    { name: "Rwanda", code: "RW", dial: "+250" },
    { name: "Kenya", code: "KE", dial: "+254" },
    { name: "Uganda", code: "UG", dial: "+256" },
    { name: "Tanzania", code: "TZ", dial: "+255" },
    { name: "DR Congo", code: "CD", dial: "+243" },
    { name: "Burundi", code: "BI", dial: "+257" },
    { name: "South Africa", code: "ZA", dial: "+27" },
  ];
  const [dialCode, setDialCode] = useState<string>(countryOptions[0].dial);

  const evaluatePasswordStrength = (pwd: string) => {
    const req = {
      minLength: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      digit: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    };
    setPwdReq(req);
    const score = Object.values(req).reduce((acc, v) => acc + (v ? 1 : 0), 0);
    setPasswordStrength(score);
  };

  const isEmailValid = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const oauthToken = searchParams.get("oauthToken");
    // Basic validations
    const newErrors: Record<string, string> = {};
    // Role must be explicitly chosen in OAuth and normal modes
    if (!formData.role) newErrors.role = "Please choose an account type";
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Enter a valid email address";
    if (formData.password.length < 8)
      if (!oauthToken) newErrors.password = "Password must be at least 8 characters";
    if (!oauthToken && formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!termsAccepted)
      newErrors.terms = "You must accept the Terms to continue";
    const local = formData.phone.replace(/\D/g, "");
    if (!local) newErrors.phone = "Phone number is required";
    // Basic length sanity (national numbers usually 7-12 digits)
    if (local && (local.length < 7 || local.length > 12))
      newErrors.phone = "Enter a valid phone number";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast({
        title: "Please fix the highlighted fields",
        variant: "destructive",
      });
      // Focus first error field
      const order = [
        { key: "name", ref: nameRef },
        { key: "email", ref: emailRef },
        { key: "phone", ref: phoneRef },
        { key: "password", ref: passwordRef },
        { key: "confirmPassword", ref: confirmRef },
        { key: "terms", ref: termsRef },
      ] as const;
      const first = order.find((o) => newErrors[o.key]);
      if (first?.ref?.current) {
        first.ref.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        first.ref.current.focus();
      }
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = `${dialCode}${formData.phone.replace(/\D/g, "")}`;
      if (oauthToken) {
        // Finalize OAuth registration
        const resp = await apiClient.post("/api/auth/register-oauth", {
          oauthToken,
          role: formData.role,
          phone: fullPhone,
        });
        const { token } = resp.data || {};
        if (token && typeof window !== "undefined") {
          localStorage.setItem("auth_token", token);
        }
        router.push("/");
        setTimeout(() => {
          toast({ title: "Welcome!", description: "Account created successfully." });
        }, 0);
      } else {
        await register(
          formData.email,
          formData.password,
          formData.name,
          formData.role as "customer" | "producer" | "agent",
          fullPhone
        );
        router.push("/");
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (e.target.name === "password") {
      evaluatePasswordStrength(e.target.value);
    }
    // live validations
    const name = e.target.name;
    const val = e.target.value;
    setErrors((prev) => {
      const next = { ...prev };
      if (name === "name") {
        if (!val.trim()) next.name = "Full name is required";
        else delete next.name;
      }
      if (name === "email") {
        if (!isEmailValid(val)) next.email = "Enter a valid email address";
        else delete next.email;
      }
      if (name === "phone") {
        const local = val.replace(/\D/g, "");
        if (!local) next.phone = "Phone number is required";
        else if (local.length < 7 || local.length > 12)
          next.phone = "Enter a valid phone number";
        else delete next.phone;
      }
      if (name === "confirmPassword" || name === "password") {
        if (
          name === "password" &&
          formData.confirmPassword &&
          val !== formData.confirmPassword
        )
          next.confirmPassword = "Passwords do not match";
        else delete next.confirmPassword;
        if (name === "confirmPassword" && val !== formData.password)
          next.confirmPassword = "Passwords do not match";
      }
      return next;
    });
  };

  // Validate on blur for friendlier UX
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setErrors((prev) => {
      const next = { ...prev } as Record<string, string>;
      if (name === "name") {
        if (!value.trim()) next.name = "Full name is required";
      }
      if (name === "email") {
        if (!isEmailValid(value)) next.email = "Enter a valid email address";
      }
      if (name === "phone") {
        const local = value.replace(/\D/g, "");
        if (!local) next.phone = "Phone number is required";
        else if (local.length < 7 || local.length > 12)
          next.phone = "Enter a valid phone number";
      }
      if (name === "password") {
        if (value.length < 8)
          next.password = "Password must be at least 8 characters";
        if (formData.confirmPassword && value !== formData.confirmPassword)
          next.confirmPassword = "Passwords do not match";
      }
      if (name === "confirmPassword") {
        if (value !== formData.password)
          next.confirmPassword = "Passwords do not match";
      }
      return next;
    });
  };

  // Keyboard shortcuts: Enter to advance (Step 1), Esc to go back (Step 2)
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (step === 1 && e.key === "Enter") {
      e.preventDefault();
      setStep(2);
    }
    if (step === 2 && e.key === "Escape") {
      e.preventDefault();
      setStep(1);
    }
  };

  const handleRoleChange = (role: "customer" | "producer" | "agent") => {
    setFormData({
      ...formData,
      role,
    });
    try {
      localStorage.setItem("nyambika.role", role);
    } catch {}
  };

  // derived completion for progress
  const emailValid = isEmailValid(formData.email);
  const nameValid = !!formData.name.trim();
  const phoneDigits = formData.phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length >= 7 && phoneDigits.length <= 12;
  const pwdAllReq = Object.values(pwdReq).every(Boolean);
  const passwordsMatch =
    !!formData.password && formData.password === formData.confirmPassword;
  const stepsTotal = 6;
  const stepsDone = [
    nameValid,
    emailValid,
    phoneValid,
    pwdAllReq,
    passwordsMatch,
    termsAccepted,
  ].filter(Boolean).length;
  const progressPct = Math.round((stepsDone / stepsTotal) * 100);
  const fullPhonePreview = `${dialCode}${formData.phone.replace(/\D/g, "")}`;

  // Refs for error focus management
  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmRef = useRef<HTMLInputElement | null>(null);
  const termsRef = useRef<HTMLButtonElement | null>(null);

  // Focus first field on entering Step 2
  useEffect(() => {
    if (step === 2) {
      nameRef.current?.focus();
    }
  }, [step]);

  // Load saved role preference on mount; initialize OAuth mode if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nyambika.role");
      if (saved === "customer" || saved === "producer" || saved === "agent") {
        setFormData((prev) => ({ ...prev, role: saved as any }));
      }
    } catch {}
    try {
      const oauth = searchParams.get("oauth");
      const email = searchParams.get("email") || "";
      const name = searchParams.get("name") || "";
      const hasToken = !!searchParams.get("oauthToken");
      if (oauth && hasToken) {
        // Prefill and lock to Step 1 initially (role selection), then Step 2 to confirm details
        setFormData((prev) => ({ ...prev, email, name }));
      }
    } catch {}
  }, [searchParams]);

  return (
    <div className="relative overflow-hidden pt-10">
      {/* Modern AI-Inspired Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Neural network grid */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, rgba(99, 102, 241, 0.3) 2px, transparent 0),
                             radial-gradient(circle at 75px 75px, rgba(168, 85, 247, 0.3) 2px, transparent 0)`,
              backgroundSize: "100px 100px",
            }}
          />
        </div>

        {/* Floating AI nodes */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-4 h-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-lg shadow-blue-400/50"
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-3/4 right-1/4 w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full shadow-lg shadow-purple-400/50"
          animate={{
            y: [0, 25, 0],
            x: [0, -15, 0],
            scale: [1, 0.8, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/6 w-2 h-2 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full shadow-lg shadow-indigo-400/50"
          animate={{
            y: [0, -20, 0],
            x: [0, 30, 0],
            scale: [1, 1.4, 1],
            opacity: [0.5, 0.9, 0.5],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        {/* Connecting lines */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-px bg-gradient-to-r from-blue-400/40 to-transparent"
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scaleX: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 w-24 h-px bg-gradient-to-l from-purple-400/40 to-transparent rotate-45"
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scaleX: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
        />

        {/* Large ambient orbs */}
        <motion.div
          className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 0.9, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      <div className="relative z-10">
        <div className="min-h-screen flex items-start justify-start">
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="md:max-w-screen-md mx-auto backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/20 dark:border-gray-700/30 shadow-2xl shadow-blue-500/10 dark:shadow-blue-400/5">
                <CardHeader className="text-center relative">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
                      ✨ Join NyambikaAI
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Create your AI-powered fashion account
                    </p>
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleSubmit}
                    onKeyDown={handleFormKeyDown}
                    className="space-y-5"
                  >
                    {/* Enhanced Step indicator */}
                    <motion.div
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl border dark:border-none border-blue-200/30 dark:border-blue-700/30 backdrop-blur-sm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {step === 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setStep(1)}
                          className="bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm"
                        >
                          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                        </Button>
                      )}
                      <div className="flex-1">
                        <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                          {formData.role === "customer" ? (
                            <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Factory className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          )}
                          <span className="text-black dark:text-white">
                            {formData.role === "customer"
                              ? "Customer"
                              : "Producer"}{" "}
                            Account
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {step === 1
                            ? "Step 1 of 2: Choose your role"
                            : "Step 2 of 2: Complete your profile"}
                        </div>
                      </div>
                    </motion.div>
                    {/* Enhanced Progress (Step 2 only) */}
                    {step === 2 && (
                      <motion.div
                        className="space-y-3 p-3 bg-gradient-to-r from-green-50/50 via-blue-50/50 to-purple-50/50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20 rounded-xl border dark:border-none border-green-200/30 dark:border-green-700/30 backdrop-blur-sm"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            🚀 Setup Progress
                          </span>
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {progressPct}%
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={progressPct} className="h-2" />
                          <motion.div
                            className="absolute top-0 left-0 h-2 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </motion.div>
                    )}
                    {/* Account Type Tabs (simple) */}
                    {step === 1 && (
                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Account Type
                        </Label>
                        <Tabs
                          value={formData.role || undefined}
                          onValueChange={(v) =>
                            handleRoleChange(
                              v as "customer" | "producer" | "agent"
                            )
                          }
                        >
                          <TabsList className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-1">
                            <TabsTrigger
                              value="customer"
                              className="px-3 py-2 text-sm bg-secondary data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-full transition-colors hover:bg-violet-500 hover:text-white"
                            >
                              Customer
                            </TabsTrigger>
                            <TabsTrigger
                              value="producer"
                              className="px-3 py-2 text-sm bg-secondary data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-full transition-colors hover:bg-violet-500 hover:text-white"
                            >
                              Producer
                            </TabsTrigger>
                            <TabsTrigger
                              value="agent"
                              className="px-3 py-2 text-sm bg-secondary data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-full transition-colors hover:bg-violet-500 hover:text-white"
                            >
                              Agent
                            </TabsTrigger>
                          </TabsList>

                          {/* Benefits panels */}
                          <TabsContent value="customer" className="mt-3">
                            <div className="rounded-lg border bg-background/80 p-3 text-[12px]">
                              <div className="mb-2 font-medium">
                                Why choose Customer?
                              </div>
                              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                <li className="flex items-center gap-2 text-muted-foreground">
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />{" "}
                                  Personalized size guidance
                                </li>
                                <li className="flex items-center gap-2 text-muted-foreground">
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />{" "}
                                  AI virtual try-on
                                </li>
                                <li className="flex items-center gap-2 text-muted-foreground">
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />{" "}
                                  Secure Mobile Money checkout
                                </li>
                              </ul>
                            </div>
                          </TabsContent>
                          <TabsContent value="producer" className="mt-3">
                            <div className="rounded-lg border bg-background/80 p-3 text-[12px]">
                              <div className="mb-2 font-medium">
                                Why choose Producer?
                              </div>
                              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                <li className="flex items-center gap-2 text-muted-foreground">
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />{" "}
                                  Manage products and orders
                                </li>
                                <li className="flex items-center gap-2 text-muted-foreground">
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />{" "}
                                  Analytics & insights
                                </li>
                                <li className="flex items-center gap-2 text-muted-foreground">
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />{" "}
                                  Payouts to Mobile Money
                                </li>
                              </ul>
                            </div>
                          </TabsContent>
                          <TabsContent value="agent" className="mt-3">
                            <div className="rounded-lg border bg-background/80 p-3 text-[12px]">
                              <div className="mb-2 font-medium">
                                Why choose Agent?
                              </div>
                              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                <li className="flex items-center gap-2 text-muted-foreground">
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />{" "}
                                  Manage producer subscriptions
                                </li>
                                <li className="flex items-center gap-2 text-muted-foreground">
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />{" "}
                                  Earn 20% commission on payments
                                </li>
                                <li className="flex items-center gap-2 text-muted-foreground">
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />{" "}
                                  Mobile Money payment processing
                                </li>
                              </ul>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}

                    {/* Step switcher under tabs */}
                    <AnimatePresence mode="wait">
                      {step === 1 && (
                        <motion.div
                          key="step-1"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2"
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              type="button"
                              className="w-full text-white py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 relative overflow-hidden"
                              onClick={() => setStep(2)}
                            >
                              <span className="relative z-10 flex items-center justify-center gap-2">
                                <span>🚀</span>
                                Continue
                              </span>
                              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                            </Button>
                          </motion.div>
                          <p className="mt-2 text-center text-xs text-muted-foreground">
                            You can change this choice above at any time.
                          </p>
                        </motion.div>
                      )}

                      {step === 2 && (
                        <div className="">
                          <motion.div
                            key="step-2"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            {/* Enhanced Form Inputs */}
                            <motion.div
                              className="space-y-3"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5, duration: 0.4 }}
                            >
                              <FormInput
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter your full name"
                                required
                                label="Full Name"
                              />
                            </motion.div>

                            <motion.div
                              className="space-y-3"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6, duration: 0.4 }}
                            >
                              <FormInput
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter your email address"
                                required
                                label="Email Address"
                                disabled={!!searchParams.get("oauthToken")}
                              />
                            </motion.div>

                            <motion.div
                              className="space-y-3"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.7, duration: 0.4 }}
                            >
                              <div className="space-y-2 w-full">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Phone Number
                                </Label>
                                <div className="flex gap-3 w-full">
                                  <FormSelect
                                    value={countryCode}
                                    onChange={(e) =>
                                      setCountryCode(e.target.value)
                                    }
                                    options={[
                                      { value: "+250", label: "🇷🇼 +250" },
                                      { value: "+256", label: "🇺🇬 +256" },
                                      { value: "+254", label: "🇰🇪 +254" },
                                      { value: "+255", label: "🇹🇿 +255" },
                                      { value: "+257", label: "🇧🇮 +257" },
                                      { value: "+211", label: "🇸🇸 +211" },
                                    ]}
                                    className="w-32"
                                  />
                                  <FormInput
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="780 000 000"
                                    className="flex-1 w-full"
                                  />
                                </div>
                              </div>
                            </motion.div>
                            <div></div>

                            {searchParams.get("oauthToken") ? (
                              <motion.div
                                className="space-y-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8, duration: 0.4 }}
                              >
                                <div className="relative">
                                  <FormInput
                                    id="password"
                                    name="password"
                                    type="hidden"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Create a strong password"
                                    required
                                    label="Password"
                                    className="pr-11"
                                  />
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div
                                className="space-y-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8, duration: 0.4 }}
                              >
                                <div className="relative">
                                  <FormInput
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Create a strong password"
                                    required
                                    label="Password"
                                    className="pr-11"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-9 h-8 w-8 rounded-lg hover:bg-gray-100/40 dark:hover:bg-gray-700/40 transition-colors duration-200"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                    ) : (
                                      <Eye className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                    )}
                                  </Button>
                                </div>
                              </motion.div>
                            )}

                            {searchParams.get("oauthToken") ? (
                              <motion.div
                                className="space-y-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9, duration: 0.4 }}
                              >
                                <div className="relative">
                                  <FormInput
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="hidden"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Confirm your password"
                                    required
                                    label="Confirm Password"
                                    className="pr-11"
                                  />
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div
                                className="space-y-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9, duration: 0.4 }}
                              >
                                <div className="relative">
                                  <FormInput
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Confirm your password"
                                    required
                                    label="Confirm Password"
                                    className="pr-11"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-9 h-8 w-8 rounded-lg hover:bg-gray-100/40 dark:hover:bg-gray-700/40 transition-colors duration-200"
                                    onClick={() =>
                                      setShowConfirmPassword(!showConfirmPassword)
                                    }
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                    ) : (
                                      <Eye className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                    )}
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                            <div className="grid grid-cols-5 gap-2 text-[10px] text-muted-foreground mt-2">
                              <div className={`px-2 py-1 rounded-md border ${
                                pwdReq.minLength
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-muted/30"
                              }`}>
                                8+ chars
                              </div>
                              <div className={`px-2 py-1 rounded-md border ${
                                pwdReq.upper
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-muted/30"
                              }`}>
                                Uppercase
                              </div>
                              <div className={`px-2 py-1 rounded-md border ${
                                pwdReq.lower
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-muted/30"
                              }`}>
                                Lowercase
                              </div>
                              <div className={`px-2 py-1 rounded-md border ${
                                pwdReq.digit
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-muted/30"
                              }`}>
                                Number
                              </div>
                              <div className={`px-2 py-1 rounded-md border ${
                                pwdReq.special
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-muted/30"
                              }`}>
                                Special
                              </div>
                            </div>
                          </motion.div>
                          {formData.password &&
                            formData.confirmPassword &&
                            formData.password !== formData.confirmPassword && (
                              <p className="text-sm text-red-600 dark:text-red-400">
                                Passwords do not match
                              </p>
                            )}
                          {/* Terms & conditions */}
                          <div className="pt-5 w-full flex flex-col md:flex-row md:items-center md:justify-center gap-3 mb-3">
                            <div className="space-y-2 w-full">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  id="terms"
                                  checked={termsAccepted}
                                  onCheckedChange={(v) =>
                                    setTermsAccepted(Boolean(v))
                                  }
                                />
                                <Label
                                  htmlFor="terms"
                                  className="text-sm font-normal"
                                >
                                  I agree to the
                                  <button
                                    type="button"
                                    className="ml-1 underline text-primary"
                                    ref={termsRef}
                                  >
                                    Terms of Service
                                  </button>
                                  <span> and </span>
                                  <button
                                    type="button"
                                    className="underline text-primary"
                                  >
                                    Privacy Policy
                                  </button>
                                  .
                                </Label>
                              </div>
                              {errors.terms && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                  {errors.terms}
                                </p>
                              )}
                            </div>

                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full"
                            >
                              <Button
                                type="submit"
                                disabled={
                                  isLoading ||
                                  !formData.name ||
                                  !formData.email ||
                                  (searchParams.get("oauthToken")
                                    ? !formData.role
                                    : !formData.password ||
                                      formData.password !==
                                        formData.confirmPassword) ||
                                  !termsAccepted
                                }
                                className="w-full text-white text-lg py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
                              >
                                {isLoading ? (
                                  <>
                                    <motion.div
                                      className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                      animate={{ rotate: 360 }}
                                      transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        ease: "linear",
                                      }}
                                    />
                                    Creating your AI account...
                                  </>
                                ) : (
                                  <span className="relative z-10 flex items-center justify-center gap-2">
                                    <span>✨</span>
                                    Create AI Account
                                  </span>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                              </Button>
                            </motion.div>
                          </div>

                          {/* Social sign-in */}
                          <div className="space-y-4">
                            <div className="relative text-center text-sm text-gray-500 dark:text-gray-400">
                              <span className="bg-white dark:bg-gray-900 px-3 relative z-10">
                                or continue with
                              </span>
                              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gray-200 dark:bg-gray-700" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full h-11 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200 rounded-lg font-medium"
                                onClick={async () => {
                                  setOauthLoading("google");
                                  try {
                                    await loginWithProvider("google");
                                  } catch (error: any) {
                                    toast({
                                      title: "Sign-up failed",
                                      description:
                                        error?.message ||
                                        "Failed to sign up with Google",
                                      variant: "destructive",
                                    });
                                  } finally {
                                    setOauthLoading(null);
                                  }
                                }}
                                disabled={oauthLoading !== null || isLoading}
                              >
                                {oauthLoading === "google" ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <svg
                                    className="mr-2 h-4 w-4"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      fill="#4285F4"
                                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                      fill="#34A853"
                                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                      fill="#FBBC05"
                                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                      fill="#EA4335"
                                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                  </svg>
                                )}
                                <span className="text-sm">
                                  {oauthLoading === "google"
                                    ? "Signing up..."
                                    : "Google"}
                                </span>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full h-11 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200 rounded-lg font-medium"
                                onClick={async () => {
                                  setOauthLoading("facebook");
                                  try {
                                    await loginWithProvider("facebook");
                                  } catch (error: any) {
                                    toast({
                                      title: "Sign-up failed",
                                      description:
                                        error?.message ||
                                        "Failed to sign up with Facebook",
                                      variant: "destructive",
                                    });
                                  } finally {
                                    setOauthLoading(null);
                                  }
                                }}
                                disabled={oauthLoading !== null || isLoading}
                              >
                                {oauthLoading === "facebook" ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <svg
                                    className="mr-2 h-4 w-4"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      fill="currentColor"
                                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                                    />
                                  </svg>
                                )}
                                <span className="text-sm">
                                  {oauthLoading === "facebook"
                                    ? "Signing up..."
                                    : "Facebook"}
                                </span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </AnimatePresence>
                  </form>
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Already have an account?{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-primary"
                        onClick={() => open()}
                      >
                        Sign in here
                      </Button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
