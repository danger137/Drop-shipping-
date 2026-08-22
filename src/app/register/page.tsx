"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, fileToDataUrl, type KycRequest } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Upload, CheckCircle2, Store, Truck, KeyRound, Mail } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { submitKyc } = useStore();
  const [step, setStep] = useState(0); // 0=account type box, 1=credentials, 2=otp, 3=kyc, 4=done
  const [accountType, setAccountType] = useState<"reseller" | "vendor">("reseller");

  // Form State
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idFront, setIdFront] = useState("");
  const [idBack, setIdBack] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [cnic, setCnic] = useState("");
  const [iban, setIban] = useState("");

  // Vendor Specific Address State
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [returnAddress, setReturnAddress] = useState("");
  const [returnCity, setReturnCity] = useState("");

  // Vendor Stock Media
  const [stockVideo, setStockVideo] = useState("");
  const [stockImages, setStockImages] = useState<string[]>(["" , "", "", "", ""]);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!email || !pass) return toast.error("Email and password are required.");
      if (pass.length < 6) return toast.error("Password must be at least 6 characters.");
      
      setIsSendingOtp(true);
      const toastId = toast.loading("Sending verification code...");
      try {
        const { sendOtpAction } = await import("@/actions/otp");
        const res = await sendOtpAction(email);
        if (res?.error) {
          toast.error(res.error, { id: toastId });
          setIsSendingOtp(false);
          return;
        }
        if (res?.devOtp) setDevOtp(res.devOtp);
        toast.success(res?.message || "Verification code sent to your email!", { id: toastId });
        setIsSendingOtp(false);
        setStep(2);
      } catch (error: any) {
        toast.error(error.message || "Failed to send verification code.", { id: toastId });
        setIsSendingOtp(false);
      }
    } else if (step === 2) {
      if (!otpInput || otpInput.trim().length !== 6) {
        return toast.error("Please enter a valid 6-digit verification code.");
      }
      setIsVerifyingOtp(true);
      const toastId = toast.loading("Verifying code...");
      try {
        const { verifyOtpAction } = await import("@/actions/otp");
        const res = await verifyOtpAction(email, otpInput);
        if (res?.error) {
          toast.error(res.error, { id: toastId });
          setIsVerifyingOtp(false);
          return;
        }
        toast.success("Email verified successfully!", { id: toastId });
        setIsVerifyingOtp(false);
        setStep(3);
      } catch (error: any) {
        toast.error(error.message || "Failed to verify code.", { id: toastId });
        setIsVerifyingOtp(false);
      }
    } else if (step === 3) {
      if (!name || !phone || !bankName || !accountName || !accountNumber) {
        return toast.error("Please fill in all KYC details.");
      }
      if (accountType === "vendor" && (!pickupAddress || !returnAddress)) {
        return toast.error("Please provide both Warehouse address and Return address.");
      }
      if (!idFront || !idBack) {
        return toast.error("Please upload both front and back of your ID card.");
      }
      if (accountType === "vendor" && !stockVideo) {
        return toast.error("Please upload a stock video for your vendor profile.");
      }
      if (accountType === "vendor" && stockImages.filter(img => img).length < 5) {
        return toast.error("Please upload all 5 stock images for your vendor profile.");
      }
      const req: Omit<KycRequest, "id" | "status" | "date"> = {
        email, passwordHash: pass, name, phone, idFront, idBack, cnic,
        bankName, accountName, accountNumber, iban, accountType,
        pickupAddress, pickupCity, returnAddress, returnCity,
        pickupPhone: phone, returnPhone: phone,
        adminNote: null, reviewedBy: null,
        stockVideo: stockVideo || null,
        stockImages: stockImages.filter(img => img).length > 0 ? JSON.stringify(stockImages.filter(img => img)) : null,
      };
      
      const toastId = toast.loading("Submitting application...");
      try {
        const { submitKycAction } = await import("@/actions/kyc");
        const res = await submitKycAction(req);
        if (res?.error) {
          toast.error(res.error, { id: toastId });
          return;
        }
        toast.success("Application submitted successfully!", { id: toastId });
        setStep(4);
      } catch (error: any) {
        toast.error(error.message || "Failed to submit application", { id: toastId });
      }
    }
  };

  const handleResendOtp = async () => {
    setIsSendingOtp(true);
    const toastId = toast.loading("Resending code...");
    try {
      const { sendOtpAction } = await import("@/actions/otp");
      const res = await sendOtpAction(email);
      if (res?.error) {
        toast.error(res.error, { id: toastId });
        setIsSendingOtp(false);
        return;
      }
      if (res?.devOtp) setDevOtp(res.devOtp);
      toast.success("New verification code sent!", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const f = e.target.files?.[0];
    if (f) {
      try {
        const url = await fileToDataUrl(f);
        setter(url);
      } catch {
        toast.error("Failed to read file.");
      }
    }
  };

  const handleStockImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const f = e.target.files?.[0];
    if (f) {
      try {
        const url = await fileToDataUrl(f);
        if (stockImages.some((img, i) => i !== index && img === url)) {
          return toast.error("This image has already been uploaded. Please select a different image.");
        }
        setStockImages(prev => { const arr = [...prev]; arr[index] = url; return arr; });
      } catch {
        toast.error("Failed to read image file.");
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 50 * 1024 * 1024) return toast.error("Video file must be under 50MB.");
      try {
        const url = await fileToDataUrl(f);
        setStockVideo(url);
      } catch {
        toast.error("Failed to read video file.");
      }
    }
  };

  const stepTitles = [
    "Choose Account Type",
    accountType === "vendor" ? "Create your vendor account" : "Create your reseller account",
    "Verify Email Address",
    "Complete KYC Verification",
    "Application Submitted"
  ];
  const stepSubs = [
    "Select how you want to use PakDropship to get started",
    "Step 1 of 3: Setup your login credentials",
    "Step 2 of 3: Enter the 6-digit verification code sent to your email",
    "Step 3 of 3: We need to verify your identity",
    "Our team will review your application within 24 hours.",
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-background p-8 md:p-12 rounded-none border border-border shadow-xl">
        {/* Back navigation */}
        {step > 0 ? (
          <button 
            type="button" 
            onClick={() => setStep(step - 1)} 
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-charcoal transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> {step === 1 ? "Back to Account Type" : step === 2 ? "Back to Credentials" : "Back to Verification"}
          </button>
        ) : (
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-charcoal transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        )}

        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo.png" alt="PakDropship" className="h-14 w-14 object-contain" />
            <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">Pak<span className="text-primary">Dropship</span></h1>
          </div>
          <h2 className="mt-6 text-xl sm:text-2xl font-black text-charcoal">{stepTitles[step]}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{stepSubs[step]}</p>
        </div>

        {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <button
              type="button"
              onClick={() => {
                setAccountType("reseller");
                setStep(1);
              }}
              className="p-6 md:p-8 text-left border-2 border-border hover:border-primary bg-card hover:bg-primary/5 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="h-14 w-14 rounded-none bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Store className="h-8 w-8" />
                </div>
                <div className="inline-block px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-none mb-3">
                  Reseller Account
                </div>
                <h3 className="text-xl font-black text-charcoal group-hover:text-primary transition-colors">
                  Reseller
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Sell products online without keeping inventory. Earn profit margins on every order delivered across Pakistan.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                Register as Reseller &rarr;
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setAccountType("vendor");
                setStep(1);
              }}
              className="p-6 md:p-8 text-left border-2 border-border hover:border-primary bg-card hover:bg-primary/5 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="h-14 w-14 rounded-none bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Truck className="h-8 w-8" />
                </div>
                <div className="inline-block px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-none mb-3">
                  Vendor / Supplier
                </div>
                <h3 className="text-xl font-black text-charcoal group-hover:text-primary transition-colors">
                  Vendor
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  List your inventory, fulfill orders, and supply products directly to thousands of Pakistani resellers.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                Register as Vendor &rarr;
              </div>
            </button>
          </div>
        )}

        {step === 4 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-24 w-24 text-emerald-500 mx-auto" />
            <h3 className="mt-6 text-xl font-bold text-charcoal">Verification Pending</h3>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Thank you for applying to PakDropship as a <strong>{accountType === "vendor" ? "Vendor / Supplier" : "Reseller"}</strong>. Once your KYC is verified by our admin, your account will be activated.
            </p>
            <Button onClick={() => router.push("/login")} className="mt-8 rounded-none px-8 font-bold">
              Go to Login Page
            </Button>
          </div>
        ) : step > 0 && (
          <form onSubmit={handleNext} className="mt-8 space-y-6">
            {step === 1 && (
              <div className="space-y-5">
                <div className="p-3 bg-primary/5 border border-primary/20 text-sm font-semibold text-primary rounded-none flex items-center justify-between">
                  <span>Registering as: <strong className="uppercase">{accountType === "vendor" ? "Vendor / Supplier" : "Reseller"}</strong></span>
                  <button 
                    type="button" 
                    onClick={() => setStep(0)} 
                    className="text-xs underline text-muted-foreground hover:text-primary cursor-pointer"
                  >
                    Change Account Type
                  </button>
                </div>
                <div>
                  <Label>Email address</Label>
                  <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5 rounded-none h-11" placeholder="you@example.com" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" required value={pass} onChange={e => setPass(e.target.value)} className="mt-1.5 rounded-none h-11" placeholder="Create a secure password" />
                </div>
                <p className="text-center text-sm text-muted-foreground pt-4">
                  Already have an account? <Link href="/login" className="font-bold text-primary hover:underline">Sign in</Link>
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 rounded-none">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <Mail className="h-4 w-4 text-emerald-600" />
                    Verification Code Sent
                  </div>
                  We sent a 6-digit code to <strong>{email}</strong>. Please enter it below to verify your account.
                </div>

                <div>
                  <Label className="text-sm font-bold text-charcoal">
                    Enter 6-Digit OTP Code
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      type="text"
                      maxLength={6}
                      required
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      className="rounded-none h-14 text-center text-2xl font-mono tracking-[0.5em] border-2 border-border focus:border-primary font-bold"
                      placeholder="000000"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="underline hover:text-charcoal cursor-pointer"
                  >
                    Change Email ({email})
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSendingOtp}
                    className="underline font-bold text-primary hover:text-primary/80 disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingOtp ? "Resending..." : "Resend OTP Code"}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label>Full Name (as per ID)</Label>
                    <Input required value={name} onChange={e => setName(e.target.value)} className="mt-1.5 rounded-none h-11" />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input required value={phone} onChange={e => setPhone(e.target.value)} className="mt-1.5 rounded-none h-11" placeholder="03XX-XXXXXXX" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>CNIC / ID Card Number</Label>
                    <Input required value={cnic} onChange={e => setCnic(e.target.value)} className="mt-1.5 rounded-none h-11" placeholder="XXXXX-XXXXXXX-X" />
                  </div>
                </div>

                {accountType === "vendor" && (
                  <div className="p-5 border border-border bg-surface space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-charcoal">
                        Warehouse & Return Address Details
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Couriers will pick up items from your warehouse address and deliver returned/rejected orders to your return address.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-bold text-charcoal">
                          Warehouse / Pickup Address (For Courier Pickup) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          required={accountType === "vendor"}
                          value={pickupAddress}
                          onChange={e => setPickupAddress(e.target.value)}
                          className="mt-1.5 rounded-none h-11 w-full"
                          placeholder="Full Warehouse address (e.g. Plot #12, Industrial Area, Sector I-9)"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-charcoal">
                          Warehouse City <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          required={accountType === "vendor"}
                          value={pickupCity}
                          onChange={e => setPickupCity(e.target.value)}
                          className="mt-1.5 rounded-none h-11 w-full"
                          placeholder="e.g. Faisalabad"
                        />
                      </div>
                      <div className="pt-3 border-t border-border/60">
                        <Label className="text-xs font-bold text-charcoal">
                          Return / RTO Address (For Rejected / Returned Orders) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          required={accountType === "vendor"}
                          value={returnAddress}
                          onChange={e => setReturnAddress(e.target.value)}
                          className="mt-1.5 rounded-none h-11 w-full"
                          placeholder="Full Return address where rejected orders will be delivered back"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-charcoal">
                          Return City <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          required={accountType === "vendor"}
                          value={returnCity}
                          onChange={e => setReturnCity(e.target.value)}
                          className="mt-1.5 rounded-none h-11 w-full"
                          placeholder="e.g. Faisalabad"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {accountType === "vendor" && (
                  <div className="p-5 border border-border bg-surface space-y-5">
                    <div>
                      <h4 className="font-bold text-sm text-charcoal">Stock Media <span className="text-red-500">*</span></h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Upload 1 video and 5 images showcasing your stock/inventory. These are required for vendor verification.</p>
                    </div>

                    {/* Stock Video */}
                    <div>
                      <Label className="text-xs font-bold text-charcoal">
                        Stock Video (max 50MB) <span className="text-red-500">*</span>
                      </Label>
                      <label className="mt-1.5 flex flex-col items-center justify-center border-2 border-dashed border-border/60 bg-white h-36 cursor-pointer hover:border-primary transition-colors w-full">
                        {stockVideo ? (
                          <video src={stockVideo} className="h-full w-full object-contain p-1" controls />
                        ) : (
                          <div className="text-center">
                            <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                            <span className="text-xs text-muted-foreground mt-2 block font-medium">Upload Stock Video</span>
                            <span className="text-xs text-muted-foreground/60 mt-0.5 block">MP4, MOV, AVI (max 50MB)</span>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
                      </label>
                    </div>

                    {/* Stock Images */}
                    <div>
                      <Label className="text-xs font-bold text-charcoal">
                        Stock Images (5 required) <span className="text-red-500">*</span>
                      </Label>
                      <div className="mt-1.5 grid grid-cols-5 gap-2">
                        {[0,1,2,3,4].map(idx => (
                          <label key={idx} className="flex flex-col items-center justify-center border-2 border-dashed border-border/60 bg-white h-24 cursor-pointer hover:border-primary transition-colors relative">
                            {stockImages[idx] ? (
                              <img src={stockImages[idx]} className="h-full w-full object-cover p-0.5" />
                            ) : (
                              <div className="text-center">
                                <Upload className="h-4 w-4 mx-auto text-muted-foreground" />
                                <span className="text-xs text-muted-foreground mt-1 block">{idx + 1}</span>
                              </div>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleStockImageUpload(e, idx)} />
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {stockImages.filter(img => img).length}/5 uploaded
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-5 border border-border bg-surface">
                  <h4 className="font-bold text-sm text-charcoal mb-4">Identity Verification</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-xs">ID Card Front</Label>
                      <label className="mt-1.5 flex flex-col items-center justify-center border-2 border-dashed border-border/60 bg-white h-32 cursor-pointer hover:border-primary transition-colors">
                        {idFront ? <img src={idFront} className="h-full object-contain p-1" /> : (
                          <div className="text-center"><Upload className="h-5 w-5 mx-auto text-muted-foreground" /><span className="text-xs text-muted-foreground mt-2 block">Upload Front</span></div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, setIdFront)} />
                      </label>
                    </div>
                    <div>
                      <Label className="text-xs">ID Card Back</Label>
                      <label className="mt-1.5 flex flex-col items-center justify-center border-2 border-dashed border-border/60 bg-white h-32 cursor-pointer hover:border-primary transition-colors">
                        {idBack ? <img src={idBack} className="h-full object-contain p-1" /> : (
                          <div className="text-center"><Upload className="h-5 w-5 mx-auto text-muted-foreground" /><span className="text-xs text-muted-foreground mt-2 block">Upload Back</span></div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, setIdBack)} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-5 border border-border bg-surface">
                  <h4 className="font-bold text-sm text-charcoal mb-4">Bank Account Details (For Payouts)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-xs">Bank Name</Label>
                      <Input required value={bankName} onChange={e => setBankName(e.target.value)} className="mt-1.5 rounded-none" placeholder="e.g. Meezan Bank" />
                    </div>
                    <div>
                      <Label className="text-xs">Account Title</Label>
                      <Input required value={accountName} onChange={e => setAccountName(e.target.value)} className="mt-1.5 rounded-none" />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs">Account Number</Label>
                      <Input required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="mt-1.5 rounded-none" />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs">IBAN (Optional)</Label>
                      <Input value={iban} onChange={e => setIban(e.target.value)} className="mt-1.5 rounded-none" placeholder="PKXXXXXXXXXXXXXXXXXXXXXX" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Button type="submit" disabled={isSendingOtp || isVerifyingOtp} className="w-full h-12 rounded-none text-base font-bold cursor-pointer">
                {step === 1 
                  ? (isSendingOtp ? "Sending Verification Code..." : "Continue to Verification")
                  : step === 2 
                  ? (isVerifyingOtp ? "Verifying Code..." : "Verify & Continue") 
                  : "Submit KYC Application"
                }
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

