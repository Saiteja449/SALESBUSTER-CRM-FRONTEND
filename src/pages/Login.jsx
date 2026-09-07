import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import crmLogo from "../assets/images/CRM-LOGO.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both your email address and password.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res && res.success) {
        navigate("/dashboard");
      } else {
        setError(
          res?.message || "Invalid email or password. Please try again.",
        );
      }
    } catch (err) {
      setError("An error occurred connecting to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 max-w-xl mx-auto lg:max-w-none bg-white text-slate-900">
        <div className="mb-6 lg:mb-10">
          <img
            src={crmLogo}
            alt="Kranthi Elevators"
            className="h-9 sm:h-12 w-auto object-contain"
          />
        </div>

        {/* Center Form Section */}
        <div className="w-full max-w-md mx-auto my-auto py-6">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Log in to your Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Welcome back! Please enter your details to sign in:
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} noValidate className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g. admin@kranthielevators.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Log in</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center lg:text-left text-[11px] text-slate-400 pt-6">
          &copy; {new Date().getFullYear()} Kranthi Elevators. All rights
          reserved.
        </div>
      </div>

      {/* ================= RIGHT COLUMN: VISUAL BRAND SHOWCASE ================= */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0c7cfd] via-[#096fe3] to-[#0448a3] flex-col items-center justify-between p-12 xl:p-16 relative overflow-hidden text-white">
        {/* Subtle Ambient Rings */}
        <div className="absolute w-[600px] h-[600px] rounded-full border border-white/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute w-[440px] h-[440px] rounded-full bg-white/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none blur-xl"></div>

        {/* Top spacer */}
        <div></div>

        {/* Illustration & Connected Nodes Graphic */}
        <div className="w-full max-w-lg relative z-10 flex items-center justify-center">
          {/* Main Connected Graphic Container */}
          <div className="relative w-full h-[320px] flex items-center justify-center">
            {/* SVG Connecting Curved Conduit Lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 480 320"
              fill="none"
            >
              {/* Branch 1 to Top Node */}
              <path
                d="M 120 70 C 170 70, 180 160, 240 160"
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Branch 2 to Middle Node */}
              <path
                d="M 90 160 L 240 160"
                stroke="rgba(255, 255, 255, 0.55)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Branch 3 to Bottom Node */}
              <path
                d="M 120 250 C 170 250, 180 160, 240 160"
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Left Node 1: WhatsApp */}
            <div
              className="absolute left-8 top-8 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform"
              title="WhatsApp Live Sync"
            >
              <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-sm">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </div>
            </div>

            {/* Left Node 2: Phone Call */}
            <div
              className="absolute left-2 top-[134px] w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform"
              title="Call Management"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 3.9c0-.5-.4-.9-.9-.9H4c-.5 0-.9.4-.9.9 0 9.39 7.61 17 17 17 .5 0 .9-.4.9-.9v-3.6c0-.5-.4-.9-.9-.9z"/>
                </svg>
              </div>
            </div>

            {/* Left Node 3: Email */}
            <div
              className="absolute left-8 bottom-8 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform"
              title="Email Notifications"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-500 to-amber-500 flex items-center justify-center text-white shadow-sm">
                <svg
                  className="w-4 h-4 fill-none stroke-current"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
            </div>

            {/* Right: Floating Mockup Dashboard Card */}
            <div className="absolute right-0 w-[270px] bg-white rounded-2xl shadow-2xl p-4 text-slate-800 border border-white/40">
              {/* Browser Dots Header */}
              <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <div className="ml-auto w-24 h-2 bg-slate-100 rounded-full"></div>
              </div>

              {/* Lead Item 1 */}
              <div className="flex items-center gap-2.5 py-2.5 border-b border-slate-50">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                  SC
                </div>
                <div className="flex-1 min-w-0">
                  <div className="w-20 h-2 bg-slate-700 rounded-full mb-1"></div>
                  <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                </div>
                <div className="w-10 h-3 rounded-full bg-emerald-100"></div>
              </div>

              {/* Lead Item 2 */}
              <div className="flex items-center gap-2.5 py-2.5 border-b border-slate-50">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                  DM
                </div>
                <div className="flex-1 min-w-0">
                  <div className="w-24 h-2 bg-slate-700 rounded-full mb-1"></div>
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
                </div>
                <div className="w-10 h-3 rounded-full bg-blue-100"></div>
              </div>

              {/* Lead Item 3 */}
              <div className="flex items-center gap-2.5 pt-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                  ED
                </div>
                <div className="flex-1 min-w-0">
                  <div className="w-16 h-2 bg-slate-700 rounded-full mb-1"></div>
                  <div className="w-10 h-1.5 bg-slate-200 rounded-full"></div>
                </div>
                <div className="w-10 h-3 rounded-full bg-amber-100"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Headline Copy & Carousel Dots */}
        <div className="w-full text-center relative z-10 my-4">
          <h2 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight">
            Connect with every application.
          </h2>
          <p className="text-xs xl:text-sm text-white/80 max-w-sm mx-auto mt-2 leading-relaxed">
            Everything you need in an easily customizable dashboard.
          </p>

          {/* Carousel Indicator Dots */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            <span className="w-6 h-1.5 bg-white rounded-full transition-all"></span>
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full transition-all"></span>
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full transition-all"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
