import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import { PaymentInitiateResponse } from "@/types/payment";
import * as Sentry from "@sentry/nextjs";

export const executePaymentFlow = (
  rawResponse: any, 
  orderId: string, 
  router: AppRouterInstance
) => {
  if (!rawResponse) {
    Sentry.captureMessage("Empty payment response from server", { level: "error", extra: { orderId } });
    toast.error("Invalid payment response from server");
    return;
  }

  let res: PaymentInitiateResponse = rawResponse;

  if (rawResponse.provider === "PAYU" && rawResponse.formPayload) {
    res = {
      provider: "PAYU",
      flow: "FORM",
      url: rawResponse.formPayload.actionUrl,
      params: { ...rawResponse.formPayload }
    };
    if (res.params) {
      delete res.params.actionUrl; 
    }
  }

  switch (res.flow) {
    case "REDIRECT":
      if (!res.url) {
        Sentry.captureException(new Error("Redirect URL missing from provider"), { extra: { res, orderId } });
        throw new Error("Redirect URL missing from provider");
      }
      toast.loading(`Redirecting to ${res.provider}...`);
      window.location.href = res.url;
      break;

    case "FORM":
      if (!res.url || !res.params) {
        Sentry.captureException(new Error("Form configuration missing"), { extra: { res, orderId } });
        throw new Error("Form configuration missing");
      }
      toast.loading(`Connecting to secure payment gateway...`);
      
      const form = document.createElement("form");
      form.method = res.method || "POST";
      form.action = res.url;
      form.target = "_self";

      Object.entries(res.params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const hiddenField = document.createElement("input");
          hiddenField.type = "hidden";
          hiddenField.name = key;
          hiddenField.value = String(value);
          form.appendChild(hiddenField);
        }
      });

      document.body.appendChild(form);
      setTimeout(() => form.submit(), 100);
      break;

    case "NONE":
      toast.success("Order placed successfully!");
      router.push(`/order-success/${orderId}`);
      break;

    default:
      if (res.url || rawResponse.checkoutUrl) {
         window.location.href = res.url || rawResponse.checkoutUrl;
      } else {
         Sentry.captureMessage("Unknown Payment Gateway Payload", { 
           level: "fatal", 
           extra: { rawResponse, orderId } 
         });
         console.error("Unknown payment flow:", res);
         toast.error("Payment routing failed. Please contact support.");
      }
  }
};