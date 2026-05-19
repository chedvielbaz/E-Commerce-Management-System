import { useContext } from "react";
import { ToastContext, defaultToastApi } from "./toast-context";

export function useToast() {
  return useContext(ToastContext) ?? defaultToastApi;
}
