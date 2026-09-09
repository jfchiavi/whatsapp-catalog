import { SEED_IDS } from '@/mocks/data';

export const parseWhatsAppMessage = () => {
// Simulación simple
return {
    items: [
        {
            variantId: SEED_IDS.variantTshirtRedM,
            name: 'Remera Oversize',
            quantity: 1,
        },
    ],
    total: 8500,
    };
};
