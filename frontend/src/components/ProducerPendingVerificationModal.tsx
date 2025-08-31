"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/custom-ui/dialog";
import { Button } from "@/components/custom-ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  role: "producer" | "agent";
}

export default function ProducerPendingVerificationModal({
  open,
  role,
}: Props) {
  const { logout } = useAuth();
  const router = useRouter();
  const isProducer = role === "producer";

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        /* non-dismissible */
      }}
    >
      {open && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />}
      <DialogContent
        className="p-0 overflow-hidden border-0 shadow-2xl max-h-[95vh] rounded-2xl bg-white dark:bg-gray-900"
        hideClose
      >
        <div className="p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              {isProducer
                ? "Your producer account is pending verification"
                : "Your agent account is pending verification"}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {isProducer
                ? "You have successfully created your company. An administrator must verify your account before you can access producer features."
                : "An administrator must verify your agent account before you can access agent features and manage producers."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                Contact the platform admin to complete your verification.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                You will receive an email notification once verified.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                {isProducer
                  ? "Until then, producer-only pages are locked for your account."
                  : "Until then, agent-only pages are locked for your account."}
              </li>
            </ul>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              className="bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              Log out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
