export interface User {
    accountId: string;
    name: string;
    phone: string;
    password: string;
    balance: number;
}
export declare function getUsers(): Promise<User[]>;
export declare function getUserByPhone(phone: string): Promise<User | null>;
export declare function updateBalance(phone: string, amount: number, operation: 'add' | 'deduct'): Promise<{
    success: boolean;
    newBalance?: number;
    message: string;
}>;
export declare function appendToSheet(sheetName: string, headers: string[], row: (string | number)[]): Promise<boolean>;
export declare function getSheetData(sheetName: string): Promise<string[][]>;
export declare function updateCell(sheetName: string, row: number, col: number, value: string | number): Promise<boolean>;
//# sourceMappingURL=database.d.ts.map