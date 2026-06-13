"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Lock,
  Mail,
  User,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  KeyRound,
  Activity
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Plan, 2: Account details, 3: Payment, 4: Success
  const [plan, setPlan] = useState<"Basic" | "Standard" | "Pro">("Standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [companyLegalName, setCompanyLegalName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");

  // Payment states
  const [cardNumber, setCardNumber] = useState("4111 •••• •••• 1111");
  const [cardExpiry, setCardExpiry] = useState("12/29");
  const [cardCVC, setCardCVC] = useState("321");

  const planPrices = {
    Basic: { price: 0, text: "Free Forever" },
    Standard: { price: 1749, text: "₹1,749 / month" },
    Pro: { price: 3750, text: "₹3,750 / month" },
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 2) {
      if (
        !companyName ||
        !companyLegalName ||
        !companyCode ||
        !adminEmail ||
        !adminPassword ||
        !adminFirstName ||
        !adminLastName
      ) {
        setError("Please fill out all organization and admin details.");
        return;
      }
      setError(null);
    }
    setStep(step + 1);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api/v1";

    try {
      const response = await fetch(`${API_BASE_URL}/saas/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          companyLegalName,
          companyCode: companyCode.trim().toLowerCase(),
          adminEmail,
          adminPassword,
          adminFirstName,
          adminLastName,
          planName: plan,
          paymentMethod: "CARD",
          amount: planPrices[plan].price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to onboard organization.");
      }

      setStep(4); // Success step
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradients for premium glassmorphism */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center z-10">
        <div className="flex justify-center items-center gap-2 mb-3">
          <Sparkles className="h-8 w-8 text-indigo-400 animate-pulse" />
          <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            PeopleOS
          </span>
        </div>
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Deploy Your Workspace
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Transform your company operations with multi-tenant cloud HRMS.
        </p>

        {/* Step progress bar */}
        <div className="mt-6 flex justify-center items-center gap-3">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-300 ${
                step >= s ? "w-10 bg-indigo-500" : "w-6 bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Select Plan */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white mb-4">Choose subscription plan</h3>
              <div className="grid gap-4">
                {(["Basic", "Standard", "Pro"] as const).map((tier) => (
                  <div
                    key={tier}
                    onClick={() => setPlan(tier)}
                    className={`p-5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      plan === tier
                        ? "border-indigo-500 bg-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                        : "border-slate-700 hover:border-slate-600 bg-slate-900/30"
                    }`}
                  >
                    <div>
                      <span className="block font-bold text-white text-base">{tier} Plan</span>
                      <span className="block text-xs text-slate-400 mt-1">
                        {tier === "Basic"
                          ? "Upto 5 users, web check-ins and core records."
                          : tier === "Standard"
                          ? "Upto 25 users, payroll runs, statutory filings and support."
                          : "Enterprise scale, custom limits, rewards and SaaS controls."}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-indigo-400 font-extrabold text-sm">
                        {planPrices[tier].text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg cursor-pointer"
              >
                Configure Workspace <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2: Account & Company details */}
          {step === 2 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              <h3 className="text-lg font-bold text-white mb-2">Organization Workspace Settings</h3>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. PeopleOS"
                      value={companyName}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        if (!companyCode) {
                          setCompanyCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Legal Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. PeopleOS Pvt Ltd"
                      value={companyLegalName}
                      onChange={(e) => setCompanyLegalName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Workspace Code (Domain Slug)</label>
                <div className="flex items-center">
                  <span className="bg-slate-700 px-3 py-2.5 rounded-l-lg border border-r-0 border-slate-700 text-xs font-semibold text-slate-300">
                    https://
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="skylinx"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                    className="flex-1 px-3 py-2.5 border border-slate-700 bg-slate-900 text-sm outline-none focus:border-indigo-500"
                  />
                  <span className="bg-slate-700 px-3 py-2.5 rounded-r-lg border border-l-0 border-slate-700 text-xs font-semibold text-slate-300">
                    .peopleos.com
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mt-6 mb-2">Platform Admin Credentials</h3>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">First Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Larry"
                    value={adminFirstName}
                    onChange={(e) => setAdminFirstName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Last Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Page"
                    value={adminLastName}
                    onChange={(e) => setAdminLastName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    required
                    type="email"
                    placeholder="admin@company.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 rounded-lg font-bold border border-slate-700 text-slate-300 hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg cursor-pointer"
                >
                  Proceed to Payment
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Simulated Checkout Payment */}
          {step === 3 && (
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Secure Checkout</h3>
                <p className="text-xs text-slate-400">
                  Pay dynamically to launch your workspace. Transactions are secured with end-to-end encryption.
                </p>
              </div>

              <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Selected Plan:</span>
                  <span className="font-bold text-white">{plan} Plan</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2.5">
                  <span className="text-slate-400">Amount Due:</span>
                  <span className="font-extrabold text-indigo-400">₹{planPrices[plan].price}</span>
                </div>
              </div>

              {planPrices[plan].price > 0 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Card Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        required
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Expiry</label>
                      <input
                        required
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">CVC</label>
                      <input
                        required
                        type="text"
                        value={cardCVC}
                        onChange={(e) => setCardCVC(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center font-bold">
                  No payment required for the Free Basic plan.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3 rounded-lg font-bold border border-slate-700 text-slate-300 hover:bg-slate-700/50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg disabled:opacity-50 cursor-pointer flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Activity className="h-4 w-4 animate-spin" /> Provisioning...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> Activate Workspace
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Success / Activation */}
          {step === 4 && (
            <div className="text-center space-y-6 py-4">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white">Workspace Provisioned!</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Your tenant workspace for <strong className="text-white">{companyName}</strong> is fully active.
                  We have configured your default admin credentials.
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 space-y-3 text-left text-sm max-w-sm mx-auto">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1.5"><Building className="h-4 w-4" /> Code</span>
                  <code className="text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">{companyCode}</code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1.5"><Mail className="h-4 w-4" /> Admin User</span>
                  <span className="font-semibold text-white">{adminEmail}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1.5"><KeyRound className="h-4 w-4" /> Credentials</span>
                  <span className="text-slate-300 font-medium">Bcrypt Encrypted</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => router.push("/login")}
                  className="w-full py-3 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg cursor-pointer"
                >
                  Log In to Console
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
