//Alaternative pattern for enums:
export const UserRole = {
    SUPER_ADMIN: 'super_admin',
    BRANCH_MANAGER: 'branch_manager',
    SALES_ASSISTANT: 'sales_assistant',
    WAREHOUSE: 'warehouse',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    branchId: string | null;
}