import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  Mail,
  Phone,
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  Check,
  AlertTriangle,
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 pt-10">
      <main className="max-w-md mx-auto px-4 py-12 md:py-16">
        <Card className="floating-card">
          <CardHeader className="text-center relative">
            <CardTitle className="text-3xl gradient-text mb-2">
              Join NyambikaAI
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Create your account to start shopping or selling
            </p>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              onKeyDown={handleFormKeyDown}
              className="space-y-5"
            >
              {/* Step indicator + Back (for Step 2) */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {step === 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                    className="bg-secondary"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                  </Button>
                )}
                <div>
                  <div className="text-lg font-bold text-blue-700">
                    {formData.role === "customer" ? "Customer" : "Producer"}{" "}
                    Account
                  </div>
                  <div>
                    {step === 1
                      ? "Step 1 of 2: Choose account type"
                      : "Step 2 of 2: Account details"}
                  </div>
                </div>
              </div>
              {/* Progress (Step 2 only) */}
              {step === 2 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Setup progress</span>
                    <span>{progressPct}%</span>
                  </div>
                  <Progress value={progressPct} />
                </div>
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
                    <Button
                      type="button"
                      className="w-full text-white py-3 bg-gradient-to-r from-rose-500 via-fuchsia-500 to-indigo-600 hover:from-rose-600 hover:via-fuchsia-600 hover:to-indigo-700"
                      onClick={() => setStep(2)}
                    >
                      Continue as{" "}
                      {formData.role === "customer" ? "Customer" : "Producer"}
                    </Button>
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
                    className="flex flex-col gap-2"
                  >
                    <div className="space-y-5">
                      <Label htmlFor="name">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          placeholder="Your full name"
                          className="pl-10 glassmorphism border-0"
                          autoComplete="name"
                          aria-invalid={Boolean(errors.name)}
                          aria-describedby={
                            errors.name ? "name-error" : undefined
                          }
                          ref={nameRef}
                          required
                        />
                        {nameValid && (
                          <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-emerald-600" />
                        )}
                      </div>
                      {errors.name && (
                        <p
                          id="name-error"
                          className="text-sm text-red-600 dark:text-red-400"
                        >
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          placeholder="your@email.com"
                          className="pl-10 glassmorphism border-0"
                          autoComplete="email"
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={
                            errors.email ? "email-error" : undefined
                          }
                          ref={emailRef}
                          required
                        />
                        {emailValid && (
                          <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-emerald-600" />
                        )}
                      </div>
                      {errors.email && (
                        <p
                          id="email-error"
                          className="text-sm text-red-600 dark:text-red-400"
                        >
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone Number (with country code)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Select value={dialCode} onValueChange={setDialCode}>
                          <SelectTrigger className="w-36 glassmorphism border-0">
                            <SelectValue placeholder="Country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((c) => (
                              <SelectItem
                                key={c.code}
                                value={c.dial}
                              >{`${c.name} (${c.dial})`}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            inputMode="numeric"
                            value={formData.phone}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            placeholder="7XX XXX XXX"
                            className="pl-10 glassmorphism border-0"
                            autoComplete="tel-national"
                            aria-invalid={Boolean(errors.phone)}
                            aria-describedby={
                              errors.phone ? "phone-error" : "phone-hint"
                            }
                            ref={phoneRef}
                          />
                          {phoneValid && (
                            <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                      </div>
                      {errors.phone ? (
                        <p
                          id="phone-error"
                          className="text-sm text-red-600 dark:text-red-400"
                        >
                          {errors.phone}
                        </p>
                      ) : (
                        <p
                          id="phone-hint"
                          className="text-xs text-muted-foreground"
                        >
                          Full number: {fullPhonePreview}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          onKeyDown={(e) =>
                            setCapsLockPwd(
                              (
                                e as React.KeyboardEvent<HTMLInputElement>
                              ).getModifierState("CapsLock")
                            )
                          }
                          onKeyUp={(e) =>
                            setCapsLockPwd(
                              (
                                e as React.KeyboardEvent<HTMLInputElement>
                              ).getModifierState("CapsLock")
                            )
                          }
                          placeholder="Create a password"
                          className="pl-10 pr-10 glassmorphism border-0"
                          ref={passwordRef}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {errors.password}
                        </p>
                      )}
                      {capsLockPwd && (
                        <p className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" /> Caps Lock is
                          on
                        </p>
                      )}
                      {/* Password strength meter */}
                      {formData.password && (
                        <div className="space-y-1">
                          <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded">
                            <div
                              className={`h-2 rounded transition-all ${
                                passwordStrength <= 2
                                  ? "bg-red-500 w-1/4"
                                  : passwordStrength === 3
                                  ? "bg-yellow-500 w-1/2"
                                  : passwordStrength === 4
                                  ? "bg-blue-500 w-3/4"
                                  : "bg-green-500 w-full"
                              }`}
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            {passwordStrength <= 2
                              ? "Weak"
                              : passwordStrength === 3
                              ? "Fair"
                              : passwordStrength === 4
                              ? "Good"
                              : "Strong"}{" "}
                            password
                          </p>
                          {/* Password checklist */}
                          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                            <li
                              className={`flex items-center gap-1 ${
                                pwdReq.minLength
                                  ? "text-emerald-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <Check className="h-3 w-3" /> 8+ characters
                            </li>
                            <li
                              className={`flex items-center gap-1 ${
                                pwdReq.digit
                                  ? "text-emerald-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <Check className="h-3 w-3" /> 1 number
                            </li>
                            <li
                              className={`flex items-center gap-1 ${
                                pwdReq.upper
                                  ? "text-emerald-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <Check className="h-3 w-3" /> Uppercase
                            </li>
                            <li
                              className={`flex items-center gap-1 ${
                                pwdReq.lower
                                  ? "text-emerald-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <Check className="h-3 w-3" /> Lowercase
                            </li>
                            <li
                              className={`flex items-center gap-1 ${
                                pwdReq.special
                                  ? "text-emerald-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <Check className="h-3 w-3" /> Symbol
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm Password *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          onKeyDown={(e) =>
                            setCapsLockConfirm(
                              (
                                e as React.KeyboardEvent<HTMLInputElement>
                              ).getModifierState("CapsLock")
                            )
                          }
                          onKeyUp={(e) =>
                            setCapsLockConfirm(
                              (
                                e as React.KeyboardEvent<HTMLInputElement>
                              ).getModifierState("CapsLock")
                            )
                          }
                          placeholder="Confirm your password"
                          className="pl-10 pr-10 glassmorphism border-0"
                          ref={confirmRef}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {errors.confirmPassword}
                        </p>
                      )}
                      {capsLockConfirm && (
                        <p className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" /> Caps Lock is
                          on
                        </p>
                      )}
                    </div>
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
                      className="w-full text-white text-lg py-3 bg-gradient-to-r from-rose-500 via-fuchsia-500 to-indigo-600 hover:from-rose-600 hover:via-fuchsia-600 hover:to-indigo-700 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Creating account...
                        </>
                      ) : (
                        "Create account"
                      )}
                    </Button>

                    {/* Social sign-in */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => loginWithProvider("google")}
                      >
                        <span className="mr-2 rounded-sm bg-red-500 h-2.5 w-2.5" />{" "}
                        Google
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => loginWithProvider("facebook")}
                      >
                        <span className="mr-2 rounded-sm bg-blue-600 h-2.5 w-2.5" />{" "}
                        Facebook
                      </Button>
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
      </main>
    </div>
  );
}
