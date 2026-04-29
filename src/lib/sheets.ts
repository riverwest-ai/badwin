import { google } from "googleapis";
import { cacheLife, cacheTag } from "next/cache";
import { Match, Member } from "./types";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });
}

async function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

// --- Members ---

export async function getMembers(): Promise<Member[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("members");

  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "members!A2:B",
  });
  const rows = res.data.values ?? [];
  return rows
    .filter((row) => row[0])
    .map((row) => ({ id: row[0], name: row[1] }));
}

export async function addMember(name: string): Promise<Member> {
  const sheets = await getSheets();
  const id = crypto.randomUUID();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "members!A:B",
    valueInputOption: "RAW",
    requestBody: { values: [[id, name]] },
  });
  return { id, name };
}

export async function deleteMember(id: string): Promise<void> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "members!A:B",
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((row) => row[0] === id);
  if (rowIndex === -1) return;

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `members!A${rowIndex + 1}:B${rowIndex + 1}`,
  });
}

// --- Matches ---

export async function getMatches(): Promise<Match[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("matches");

  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "matches!A2:I",
  });
  const rows = res.data.values ?? [];
  return rows
    .filter((row) => row[0])
    .map((row) => ({
      id: row[0],
      date: row[1],
      team1: [row[2], row[3]] as [string, string],
      team2: [row[4], row[5]] as [string, string],
      score1: Number(row[6]),
      score2: Number(row[7]),
      createdAt: row[8],
    }));
}

export async function addMatch(
  match: Omit<Match, "id" | "createdAt">
): Promise<Match> {
  const sheets = await getSheets();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "matches!A:I",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          id,
          match.date,
          match.team1[0],
          match.team1[1],
          match.team2[0],
          match.team2[1],
          match.score1,
          match.score2,
          createdAt,
        ],
      ],
    },
  });
  return { ...match, id, createdAt };
}

export async function updateMatch(
  match: Pick<Match, "id" | "date" | "team1" | "team2" | "score1" | "score2">
): Promise<void> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "matches!A:I",
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((row) => row[0] === match.id);
  if (rowIndex === -1) throw new Error("Match not found");

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `matches!B${rowIndex + 1}:H${rowIndex + 1}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        match.date,
        match.team1[0] ?? "",
        match.team1[1] ?? "",
        match.team2[0] ?? "",
        match.team2[1] ?? "",
        match.score1,
        match.score2,
      ]],
    },
  });
}

export async function deleteMatch(id: string): Promise<void> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "matches!A:I",
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((row) => row[0] === id);
  if (rowIndex === -1) return;

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `matches!A${rowIndex + 1}:I${rowIndex + 1}`,
  });
}

// --- LINE Users ---

export async function getLineUser(lineUserId: string): Promise<{ memberName: string } | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("line-users");

  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "line_users!A2:C",
  });
  const rows = res.data.values ?? [];
  const row = rows.find((r) => r[0] === lineUserId);
  if (!row) return null;
  return { memberName: row[1] };
}

export async function upsertLineUser(
  lineUserId: string,
  memberName: string,
  displayName: string
): Promise<void> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "line_users!A:C",
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((r) => r[0] === lineUserId);

  if (rowIndex === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "line_users!A:C",
      valueInputOption: "RAW",
      requestBody: { values: [[lineUserId, memberName, displayName]] },
    });
  } else {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `line_users!A${rowIndex + 1}:C${rowIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: { values: [[lineUserId, memberName, displayName]] },
    });
  }
}
