import { toast } from 'sonner';

// Single entry point for user notifications; hooks never import the toast library directly.
export const notifier = {
  success: (message: string) => { toast.success(message); },
  error: (message: string) => { toast.error(message); },
};
