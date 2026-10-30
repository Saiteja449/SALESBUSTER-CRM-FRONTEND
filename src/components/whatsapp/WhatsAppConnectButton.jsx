import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import WhatsAppPreScreenModal from "./WhatsAppPreScreenModal";
import WhatsAppSyncStatusModal from "./WhatsAppSyncStatusModal";
import { MessageSquare, RefreshCw, Smartphone, LogOut, CheckCircle2 } from "lucide-react";
import { API_ENDPOINTS, BACKEND_URL } from "../../utils/constants";

export default function WhatsAppConnectButton({
  onConnected,
  connectedAccount = null,
  onDisconnect,
}) {
  const [isPreScreenOpen, setIsPreScreenOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAccount, setActiveAccount] = useState(connectedAccount);

  const capturedWabaIdRef = useRef(null);
  const capturedPhoneIdRef = useRef(null);
  const capturedCodeRef = useRef(null);
  const hasOnboardedRef = useRef(false);

  const metaAppId = import.meta.env.VITE_META_APP_ID || "";
  const metaConfigId = import.meta.env.VITE_META_EMBEDDED_SIGNUP_CONFIG_ID || "";
  const metaGraphVersion = import.meta.env.VITE_META_GRAPH_API_VERSION || "v21.0";

  // 1. Initialize Facebook JS SDK v4
  useEffect(() => {
    if (!metaAppId || metaAppId === "public_meta_app_id") {
      return;
    }

    if (window.FB) {
      try {
        window.FB.init({
          appId: metaAppId,
          cookie: true,
          xfbml: false,
          version: metaGraphVersion,
        });
        setIsSdkLoaded(true);
      } catch (e) {
        console.error("[MetaSDK] Init error:", e);
      }
      return;
    }

    window.fbAsyncInit = function () {
      try {
        window.FB.init({
          appId: metaAppId,
          cookie: true,
          xfbml: false,
          version: metaGraphVersion,
        });
        setIsSdkLoaded(true);
        console.log("[MetaSDK] Facebook JS SDK initialized.");
      } catch (err) {
        console.error("[MetaSDK] Init error:", err);
      }
    };

    const existingScript = document.getElementById("facebook-jssdk");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [metaAppId, metaGraphVersion]);

  // 2. Complete Onboarding with Backend
  const completeOnboarding = useCallback(
    async (code, wabaId, phoneNumberId) => {
      if (!code) return;
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          `${BACKEND_URL}/api/whatsapp/coexistence/onboard`,
          { code, wabaId, phoneNumberId },
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (res.data?.success) {
          setIsPreScreenOpen(false);
          setActiveAccount(res.data.account);
          if (res.data?.account?.isOnBizApp) { setIsSyncModalOpen(true); }
          if (onConnected) onConnected(res.data.account);
        }
      } catch (err) {
        console.error("[CoexistenceOnboardError]", err);
        hasOnboardedRef.current = false;
        alert(
          err.response?.data?.message ||
            err.message ||
            "Failed to complete WhatsApp coexistence connection."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [onConnected]
  );

  const triggerOnboard = useCallback(
    async (code, wabaId, phoneNumberId) => {
      const finalCode = code || capturedCodeRef.current;
      const finalWabaId = wabaId || capturedWabaIdRef.current;
      const finalPhoneId = phoneNumberId || capturedPhoneIdRef.current;

      if (!finalCode || hasOnboardedRef.current) return;
      hasOnboardedRef.current = true;
      await completeOnboarding(finalCode, finalWabaId, finalPhoneId);
    },
    [completeOnboarding]
  );

  // 3. Window Message Listener (Embedded Signup Event Callback)
  useEffect(() => {
    const handleMessage = async (event) => {
      if (typeof event.origin === "string" && !event.origin.includes("facebook.com")) {
        return;
      }

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data?.type === "WA_EMBEDDED_SIGNUP") {
          console.log("[MetaSDK] WA_EMBEDDED_SIGNUP event:", data);
          const { waba_id, phone_number_id } = data.data || {};
          if (waba_id) capturedWabaIdRef.current = waba_id;
          if (phone_number_id) capturedPhoneIdRef.current = phone_number_id;

          const isFinish =
            !data.event ||
            String(data.event).toUpperCase().includes("FINISH") ||
            String(data.event).toUpperCase().includes("COMPLETE");

          if (isFinish && capturedCodeRef.current) {
            await triggerOnboard(capturedCodeRef.current, waba_id, phone_number_id);
          }
        }
      } catch (err) {
        // Ignore non-JSON postMessages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [triggerOnboard]);

  // 4. Launch Embedded Signup v4 Dialog (Coexistence mode)
  const launchEmbeddedSignup = useCallback(() => {
    setIsPreScreenOpen(false);

    if (!metaAppId || metaAppId === "public_meta_app_id" || !metaConfigId || metaConfigId === "public_config_id") {
      alert(
        "Meta App Configuration Missing:\n\nPlease add your VITE_META_APP_ID and VITE_META_EMBEDDED_SIGNUP_CONFIG_ID in your frontend .env file, then restart the frontend dev server."
      );
      return;
    }

    if (window.location.protocol === "http:" && window.location.hostname !== "localhost") {
      alert(
        "Meta Security Requirement:\n\nFacebook Login can only run on HTTPS or http://localhost (not 127.0.0.1 or an IP address).\n\nPlease open your app using http://localhost:5173 or an HTTPS URL."
      );
      return;
    }

    if (!window.FB || typeof window.FB.login !== "function") {
      alert("Facebook SDK is still loading or could not be initialized. Please refresh the page and try again.");
      return;
    }

    hasOnboardedRef.current = false;
    capturedWabaIdRef.current = null;
    capturedPhoneIdRef.current = null;
    capturedCodeRef.current = null;

    try {
      window.FB.login(
        (response) => {
          console.log("[MetaSDK] FB.login response:", response);
          if (response?.authResponse?.code) {
            const code = response.authResponse.code;
            capturedCodeRef.current = code;
            setTimeout(() => {
              triggerOnboard(code, capturedWabaIdRef.current, capturedPhoneIdRef.current);
            }, 350);
          }
        },
        {
          config_id: metaConfigId,
          response_type: "code",
          override_default_response_type: true,
          auth_type: "rerequest",
          extras: {
            setup: {},
          },
        }
      );
    } catch (fbErr) {
      console.error("[MetaSDK Login Error]", fbErr);
      alert("Could not open Meta Login popup. Please ensure popups are allowed in your browser.");
    }
  }, [metaAppId, metaConfigId, triggerOnboard]);

  // 5. Disconnect handler
  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect this official WhatsApp Business line?")) {
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BACKEND_URL}/api/whatsapp/coexistence/disconnect`,
        { phoneNumberId: activeAccount?.phoneNumberId },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      setActiveAccount(null);
      if (onDisconnect) onDisconnect();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to disconnect account.");
    } finally {
      setIsLoading(false);
    }
  };

  const isConnected =
    activeAccount?.status === "connected" ||
    activeAccount?.status === "syncing" ||
    connectedAccount?.status === "connected" ||
    connectedAccount?.status === "syncing";

  if (isConnected) {
    const displayPhone =
      activeAccount?.displayPhone || connectedAccount?.displayPhone || "Connected Line";

    return (
      <>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-medium transition cursor-pointer"
            title="View Coexistence Sync Details"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{displayPhone}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </button>
          <button
            onClick={handleDisconnect}
            disabled={isLoading}
            className="p-1.5 bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-xl text-xs transition cursor-pointer"
            title="Disconnect Line"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        <WhatsAppSyncStatusModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          account={activeAccount || connectedAccount}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={launchEmbeddedSignup}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-medium text-xs rounded-xl transition shadow-md shadow-emerald-950/20 cursor-pointer"
      >
        {isLoading ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Smartphone className="w-3.5 h-3.5" />
        )}
        Connect WhatsApp Business
      </button>

      <WhatsAppPreScreenModal
        isOpen={isPreScreenOpen}
        onClose={() => setIsPreScreenOpen(false)}
        onProceed={launchEmbeddedSignup}
      />

      <WhatsAppSyncStatusModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        account={activeAccount}
      />
    </>
  );
}
