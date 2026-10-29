import { registerPaymentStrategy } from './payment-strategy';
import { LibelulaPaymentStrategy } from './libelula-payment.strategy';

let registered = false;

export const registerBuiltinStrategies = (): void => {
  if (registered) return;
  registerPaymentStrategy('LIBELULA', new LibelulaPaymentStrategy());
  registered = true;
};
