import { createContext } from "react";

export const ToastContext = createContext(null);

export const defaultToastApi = {
  success: () => {},
  error: () => {},
  info: () => {},
};
