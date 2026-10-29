import {
  hasBillingStrategy,
  hasPaymentStrategy,
  registerBillingStrategy,
  registerPaymentStrategy,
} from './payment-strategy';
import { LibelulaPaymentStrategy } from './libelula-payment.strategy';
import { FactElecBillingStrategy } from './factelec-billing.strategy';

let registered = false;

// Idempotente y no pisa estrategias ya registradas (los tests registran fakes).
export const registerBuiltinStrategies = (): void => {
  if (registered) return;
  if (!hasPaymentStrategy('LIBELULA')) {
    registerPaymentStrategy('LIBELULA', new LibelulaPaymentStrategy());
  }
  if (!hasBillingStrategy('FACTELEC')) {
    registerBillingStrategy('FACTELEC', new FactElecBillingStrategy());
  }
  registered = true;
};
