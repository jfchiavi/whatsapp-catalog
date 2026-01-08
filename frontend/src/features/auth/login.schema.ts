import * as z from 'zod';

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(4),
});

export type FormData = z.infer<typeof schema>;

export { schema };