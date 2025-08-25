import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  Mail,
  Phone,
  KeyRound,
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AnimatePresence, motion } from "framer-motion";

export default function Register() {
  const [, setLocation] = useLocation();
  const { open } = useLoginPrompt();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "", // local number without country code
    password: "",
    confirmPassword: "",
    role: "customer" as "customer" | "producer",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register, loginWithProvider } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [step, setStep] = useState<1 | 2>(1);
  const [capsLockPwd, setCapsLockPwd] = useState(false);
  const [capsLockConfirm, setCapsLockConfirm] = useState(false);
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
    // Basic validations
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Enter a valid email address";
    if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword)
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
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.role,
        fullPhone
      );
      setLocation("/");
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

  const handleRoleChange = (role: "customer" | "producer") => {
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

  // Load saved role preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nyambika.role");
      if (saved === "customer" || saved === "producer") {
        setFormData((prev) => ({ ...prev, role: saved }));
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-gray-950 dark:via-slate-950 dark:to-indigo-950/50 pt-20 relative overflow-hidden">
      {/* AI-Inspired Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 rounded-full blur-3xl"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-cyan-400/10 via-blue-400/10 to-indigo-400/10 rounded-full blur-3xl"
          animate={{
            y: [0, 15, 0],
            x: [0, -10, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {/* Animated particles */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${
              i % 2 === 0 ? 'bg-blue-400/30' : 'bg-purple-400/30'
            } blur-sm`}
            style={{
              left: `${20 + (i * 20)}%`,
              top: `${30 + (i * 15)}%`
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
      </div>
      
      <main className="max-w-md mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/20 dark:border-gray-700/30 shadow-2xl shadow-blue-500/10 dark:shadow-blue-400/5">
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
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl border border-blue-200/30 dark:border-blue-700/30 backdrop-blur-sm"
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
                  <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {formData.role === "customer" ? "🛍️ Customer" : "🏭 Producer"} Account
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
                  className="space-y-3 p-3 bg-gradient-to-r from-green-50/50 via-blue-50/50 to-purple-50/50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20 rounded-xl border border-green-200/30 dark:border-green-700/30 backdrop-blur-sm"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700 dark:text-gray-300">🚀 Setup Progress</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{progressPct}%</span>
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
                    value={formData.role}
                    onValueChange={(v) =>
                      handleRoleChange(v as "customer" | "producer")
                    }
                  >
                    <TabsList className="flex gap-2 rounded-lg bg-muted/40 p-1">
                      <TabsTrigger
                        value="customer"
                        className="px-5 py-2 text-sm bg-secondary data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-full transition-colors hover:bg-violet-500 hover:text-white"
                      >
                        Customer
                      </TabsTrigger>
                      <TabsTrigger
                        value="producer"
                        className="px-5 py-2 text-sm bg-secondary data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-full transition-colors hover:bg-violet-500 hover:text-white"
                      >
                        Producer
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
                          Continue as {formData.role === "customer" ? "Customer" : "Producer"}
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
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-5"
                  >
                    {/* Enhanced Form Inputs */}
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                    >
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" /> Full Name
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500" />
                        <div className="relative">
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter your full name"
                            required
                            className="h-10 pl-10 pr-4 bg-gradient-to-br from-white/90 via-blue-50/60 to-purple-50/40 dark:from-gray-900/90 dark:via-blue-950/60 dark:to-purple-950/40 border border-gray-200/50 dark:border-gray-700/50 rounded-xl backdrop-blur-xl focus:border-blue-400/70 dark:focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all duration-300 shadow-md shadow-blue-500/5 group-hover:shadow-blue-500/8 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-100 font-medium"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6, duration: 0.4 }}
                    >
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-purple-500" /> Email Address
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-blue-400/20 blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500" />
                        <div className="relative">
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email address"
                            required
                            className="h-10 pl-10 pr-4 bg-gradient-to-br from-white/90 via-purple-50/60 to-pink-50/40 dark:from-gray-900/90 dark:via-purple-950/60 dark:to-pink-950/40 border border-gray-200/50 dark:border-gray-700/50 rounded-xl backdrop-blur-xl focus:border-purple-400/70 dark:focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/15 transition-all duration-300 shadow-md shadow-purple-500/5 group-hover:shadow-purple-500/8 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-100 font-medium"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 pointer-events-none">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7, duration: 0.4 }}
                    >
                      <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-500" /> Phone Number
                      </Label>
                      <div className="flex gap-3 group">
                        <div className="relative">
                          <Select
                            value="+1"
                            onValueChange={(value) => {
                              // Handle country code change
                            }}
                          >
                            <SelectTrigger className="w-28 h-12 bg-gradient-to-r from-white/80 to-green-50/50 dark:from-gray-800/80 dark:to-green-900/20 border-2 border-gray-200/60 dark:border-gray-600/60 rounded-xl backdrop-blur-sm focus:border-green-400 dark:focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all duration-300 hover:border-green-300 dark:hover:border-green-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50">
                              <SelectItem value="+1">🇺🇸 +1</SelectItem>
                              <SelectItem value="+44">🇬🇧 +44</SelectItem>
                              <SelectItem value="+33">🇫🇷 +33</SelectItem>
                              <SelectItem value="+49">🇩🇪 +49</SelectItem>
                              <SelectItem value="+250">🇷🇼 +250</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="relative flex-1">
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-cyan-400/20 blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500" />
                          <div className="relative">
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="123-456-7890"
                              className="h-10 pl-10 pr-4 bg-gradient-to-br from-white/90 via-green-50/60 to-emerald-50/40 dark:from-gray-900/90 dark:via-green-950/60 dark:to-emerald-950/40 border border-gray-200/50 dark:border-gray-700/50 rounded-xl backdrop-blur-xl focus:border-green-400/70 dark:focus:border-green-500/70 focus:ring-2 focus:ring-green-500/15 transition-all duration-300 shadow-md shadow-green-500/5 group-hover:shadow-green-500/8 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-100 font-medium"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none">
                              <Phone className="h-4 w-4" />
                            </div>
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                    >
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-red-500" /> Password
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-400/20 via-orange-400/20 to-yellow-400/20 blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500" />
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Create a strong password"
                            required
                            className="h-10 pl-10 pr-11 bg-gradient-to-br from-white/90 via-red-50/60 to-orange-50/40 dark:from-gray-900/90 dark:via-red-950/60 dark:to-orange-950/40 border border-gray-200/50 dark:border-gray-700/50 rounded-xl backdrop-blur-xl focus:border-red-400/70 dark:focus:border-red-500/70 focus:ring-2 focus:ring-red-500/15 transition-all duration-300 shadow-md shadow-red-500/5 group-hover:shadow-red-500/8 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-100 font-medium"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none">
                            <Lock className="h-4 w-4" />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-gray-100/40 dark:hover:bg-gray-700/40 transition-colors duration-200"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                            )}
                          </Button>
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/5 via-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9, duration: 0.4 }}
                    >
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-orange-500" /> Confirm Password
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-400/20 via-amber-400/20 to-red-400/20 blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500" />
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm your password"
                            required
                            className="h-10 pl-10 pr-11 bg-gradient-to-br from-white/90 via-orange-50/60 to-amber-50/40 dark:from-gray-900/90 dark:via-orange-950/60 dark:to-amber-950/40 border border-gray-200/50 dark:border-gray-700/50 rounded-xl backdrop-blur-xl focus:border-orange-400/70 dark:focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/15 transition-all duration-300 shadow-md shadow-orange-500/5 group-hover:shadow-orange-500/8 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-100 font-medium"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none">
                            <KeyRound className="h-4 w-4" />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-gray-100/40 dark:hover:bg-gray-700/40 transition-colors duration-200"
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
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        </div>
                      </div>
                    </motion.div>

                    {/* Terms & conditions */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="terms"
                          checked={termsAccepted}
                          onCheckedChange={(v) => setTermsAccepted(Boolean(v))}
                        />
                        <Label htmlFor="terms" className="text-sm font-normal">
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

                    {formData.password &&
                      formData.confirmPassword &&
                      formData.password !== formData.confirmPassword && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Passwords do not match
                        </p>
                      )}

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        disabled={
                          isLoading ||
                          !formData.name ||
                          !formData.email ||
                          !formData.password ||
                          formData.password !== formData.confirmPassword ||
                          !termsAccepted
                        }
                        className="w-full text-white text-lg py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
                      >
                        {isLoading ? (
                          <>
                            <motion.div 
                              className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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

                    {/* Social sign-in */}
                    <div className="space-y-3">
                      <div className="relative text-center text-xs text-muted-foreground">
                        <span className="bg-background px-2 relative z-10">or sign up with</span>
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-border" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-10 border-gray-300 hover:bg-gray-50 transition-colors"
                          onClick={async () => {
                            setOauthLoading('google');
                            try {
                              await loginWithProvider('google');
                            } catch (error: any) {
                              toast({
                                title: "Sign-up failed",
                                description: error?.message || "Failed to sign up with Google",
                                variant: "destructive",
                              });
                            } finally {
                              setOauthLoading(null);
                            }
                          }}
                          disabled={oauthLoading !== null || isLoading}
                        >
                          {oauthLoading === 'google' ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          ) : (
                            <svg className="mr-2 h-3 w-3" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                          )}
                          {oauthLoading === 'google' ? 'Signing up...' : 'Google'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-10 border-gray-300 hover:bg-gray-50 transition-colors"
                          onClick={async () => {
                            setOauthLoading('facebook');
                            try {
                              await loginWithProvider('facebook');
                            } catch (error: any) {
                              toast({
                                title: "Sign-up failed",
                                description: error?.message || "Failed to sign up with Facebook",
                                variant: "destructive",
                              });
                            } finally {
                              setOauthLoading(null);
                            }
                          }}
                          disabled={oauthLoading !== null || isLoading}
                        >
                          {oauthLoading === 'facebook' ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          ) : (
                            <svg className="mr-2 h-3 w-3" fill="#1877F2" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          )}
                          {oauthLoading === 'facebook' ? 'Signing up...' : 'Facebook'}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-center">
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
            </form>
          </CardContent>
        </Card>
        </motion.div>
      </main>
    </div>
  );
}
