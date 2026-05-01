import { sheets, SPREADSHEET_ID, SHEETS } from './sheets.js';
import { cache } from './cache.js';
export async function getUsers() {
    const cached = cache.get('users');
    if (cached)
        return cached;
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEETS.ACCOUNTS}!A:F`,
        });
        const rows = response.data.values || [];
        const users = rows.slice(1).map((row) => ({
            accountId: row[1] || '',
            name: row[2] || '',
            phone: row[3] || '',
            password: row[4] || '',
            balance: parseInt(row[5]) || 0,
        }));
        cache.set('users', users);
        return users;
    }
    catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}
export async function getUserByPhone(phone) {
    const users = await getUsers();
    return users.find((u) => u.phone === phone) || null;
}
export async function updateBalance(phone, amount, operation) {
    const users = await getUsers();
    const userIndex = users.findIndex((u) => u.phone === phone);
    if (userIndex === -1) {
        return { success: false, message: 'User not found' };
    }
    const user = users[userIndex];
    const currentBalance = user.balance;
    let newBalance;
    if (operation === 'add') {
        newBalance = currentBalance + amount;
    }
    else {
        if (currentBalance < amount) {
            return { success: false, message: 'Insufficient balance' };
        }
        newBalance = currentBalance - amount;
    }
    try {
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEETS.ACCOUNTS}!F${userIndex + 2}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[newBalance]] },
        });
        cache.del('users');
        return { success: true, newBalance, message: 'Balance updated' };
    }
    catch (error) {
        console.error('Error updating balance:', error);
        return { success: false, message: 'Failed to update balance' };
    }
}
export async function appendToSheet(sheetName, headers, row) {
    try {
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });
        const sheet = spreadsheet.data.sheets?.find((s) => s.properties?.title === sheetName);
        if (!sheet) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: { title: sheetName },
                            },
                        },
                    ],
                },
            });
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${sheetName}!A1`,
                valueInputOption: 'RAW',
                requestBody: { values: [headers] },
            });
        }
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A:Z`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [row] },
        });
        cache.del(sheetName);
        return true;
    }
    catch (error) {
        console.error(`Error appending to ${sheetName}:`, error);
        return false;
    }
}
export async function getSheetData(sheetName) {
    const cached = cache.get(sheetName);
    if (cached)
        return cached;
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A:Z`,
        });
        const data = response.data.values || [];
        cache.set(sheetName, data);
        return data;
    }
    catch (error) {
        console.error(`Error fetching ${sheetName}:`, error);
        return [];
    }
}
export async function updateCell(sheetName, row, col, value) {
    try {
        const colLetter = String.fromCharCode(64 + col);
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!${colLetter}${row}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[value]] },
        });
        cache.del(sheetName);
        return true;
    }
    catch (error) {
        console.error(`Error updating cell:`, error);
        return false;
    }
}
//# sourceMappingURL=database.js.map