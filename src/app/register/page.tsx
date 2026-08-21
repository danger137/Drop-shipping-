"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, fileToDataUrl, type KycRequest } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PackageCheck, ArrowLeft, Upload, CheckCircle2, Store, Truck } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { submitKyc } = useStore();
  const [step, setStep] = useState(1); // 1=credentials, 2=kyc, 3=done
  const accountType = "reseller";

  // Form State
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idFront, setIdFront] = useState("");
  const [idBack, setIdBack] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [cnic, setCnic] = useState("");
  const [iban, setIban] = useState("");

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!email || !pass) return toast.error("Email and password are required.");
      if (pass.length < 6) return toast.error("Password must be at least 6 characters.");
      setStep(2);
    } else if (step === 2) {
      if (!name || !phone || !bankName || !accountName || !accountNumber) {
        return toast.error("Please fill in all KYC details.");
      }
      if (!idFront || !idBack) {
        return toast.error("Please upload both front and back of your ID card.");
      }
      const req: Omit<KycRequest, "id" | "status" | "date" | "reviewedBy" | "adminNote"> = {
        email, passwordHash: pass, name, phone, idFront, idBack, cnic,
        bankName, accountName, accountNumber, iban, accountType,
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
        setStep(3);
      } catch (error: any) {
        toast.error(error.message || "Failed to submit application", { id: toastId });
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const f = e.target.files?.[0];
    if (f) {
      try {
        const url = await fileToDataUrl(f);
        setter(url);
      } catch {
        toast.error("Failed to read image file.");
      }
    }
  };

  const stepTitles = ["Choose Account Type", "Create your reseller account", "Complete KYC Verification", "Application Submitted"];
  const stepSubs = [
    "Select how you want to use PakDropship",
    "Step 1 of 2: Setup your login credentials",
    "Step 2 of 2: We need to verify your identity",
    "Our team will review your application within 24 hours.",
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-background p-8 md:p-12 rounded-none border border-border shadow-xl">
        {/* Back to Home - inside card on all sizes */}
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-charcoal transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo.png" alt="PakDropship" className="h-14 w-14 object-contain" />
            <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">Pak<span className="text-primary">Dropship</span></h1>
          </div>
          <h2 className="mt-6 text-xl sm:text-2xl font-black text-charcoal">{stepTitles[step]}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{stepSubs[step]}</p>
        </div>

        {step === 3 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-24 w-24 text-emerald-500 mx-auto" />
            <h3 className="mt-6 text-xl font-bold text-charcoal">Verification Pending</h3>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Thank you for applying to PakDropship as a <strong>Reseller</strong>. Once your KYC is verified by our admin, your account will be activated.
            </p>
            <Button onClick={() => router.push("/login")} className="mt-8 rounded-none px-8 font-bold">
              Go to Login Page
            </Button>
          </div>
        ) : (
          <form onSubmit={handleNext} className="mt-8 space-y-6">
            {step === 1 && (
              <div className="space-y-5">
                <div className="p-3 bg-primary/5 border border-primary/20 text-sm font-semibold text-primary rounded-none">
                  Registering as: <span className="uppercase">Reseller</span>
                  <Link href="/registerv" className="ml-2 text-xs underline text-muted-foreground">Change to Vendor</Link>
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
              <Button type="submit" className="w-full h-12 rounded-none text-base font-bold">
                {step === 1 ? "Continue to Verification" : "Submit KYC Application"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
