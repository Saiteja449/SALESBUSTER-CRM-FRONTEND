import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function WhatsAppRouteRedirect() {
  const { currentUser, organization } = useAuth();
  const location = useLocation();

  const defaultLine =
    currentUser?.defaultWhatsAppLine ||
    organization?.defaultWhatsAppLine ||
    1;

  return (
    <Navigate
      to={`/whatsapp/account-${defaultLine}${location.search}`}
      replace
      state={location.state}
    />
  );
}
