import { sheets, SPREADSHEET_ID, SHEETS } from './sheets.js';
import { cache } from './cache.js';

export interface User {
  accountId: string;
  name: string;
  phone: string;
  password: string;
  balance: number;
}

export async function getUsers(): Promise<User[]> {
  const cached = cache.get<User[]>('users');
  if (cached) return cached;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.ACCOUNTS}!A:F`,
    });

    const rows = response.data.values || [];
    const users: User[] = rows.slice(1).map((row) => ({
      accountId: row[1] || '',
      name: row[2] || '',
      phone: row[3] || '',
      password: row[4] || '',
      balance: parseInt(row[5]) || 0,
    }));

    cache.set('users', users);
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const users = await getUsers();
  return users.find((u) => u.phone === phone) || null;
}

export async function updateBalance(
  phone: string,
  amount: number,
  operation: 'add' | 'deduct'
): Promise<{ success: boolean; newBalance?: number; message: string }> {
  const users = await getUsers();
  const userIndex = users.findIndex((u) => u.phone === phone);

  if (userIndex === -1) {
    return { success: false, message: 'User not found' };
  }

  const user = users[userIndex];
  const currentBalance = user.balance;

  let newBalance: number;
  if (operation === 'add') {
    newBalance = currentBalance + amount;
  } else {
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
  } catch (error) {
    console.error('Error updating balance:', error);
    return { success: false, message: 'Failed to update balance' };
  }
}

export async function appendToSheet(
  sheetName: string,
  headers: string[],
  row: (string | number)[]
): Promise<boolean> {
  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    );

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
  } catch (error) {
    console.error(`Error appending to ${sheetName}:`, error);
    return false;
  }
}

export async function getSheetData(sheetName: string): Promise<string[][]> {
  const cached = cache.get<string[][]>(sheetName);
  if (cached) return cached;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    });

    const data = response.data.values || [];
    cache.set(sheetName, data);
    return data;
  } catch (error) {
    console.error(`Error fetching ${sheetName}:`, error);
    return [];
  }
}

export async function updateCell(
  sheetName: string,
  row: number,
  col: number,
  value: string | number
): Promise<boolean> {
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
  } catch (error) {
    console.error(`Error updating cell:`, error);
    return false;
  }
}