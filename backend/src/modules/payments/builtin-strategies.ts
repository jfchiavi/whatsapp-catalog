import { registerBillingStrategy, registerPaymentStrategy } from './payment-strategy';
import { LibelulaPaymentStrategy } from './libelula-payment.strategy';
import { FactElecBillingStrategy } from './factelec-billing.strategy';

let registered = false;

export const registerBuiltinStrategies = (): void => {
  if (registered) return;
  registerPaymentStrategy('LIBELULA', new LibelulaPaymentStrategy());
  registerBillingStrategy('FACTELEC', new FactElecBillingStrategy());
  registered = true;
};
