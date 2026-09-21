import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'qpc-v4-tajweed-15-lines.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function initQuranDb() {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const dbPath = FileSystem.documentDirectory + 'SQLite/' + DB_NAME;

    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    if (!fileInfo.exists) {
      await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite', { intermediates: true }).catch(() => {});
      const asset = await Asset.fromModule(require('../../assets/fonts/qpc-v4-tajweed-15-lines.db')).downloadAsync();
      await FileSystem.copyAsync({
        from: asset.localUri!,
        to: dbPath,
      });
    }
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
    initPromise = null;
    return dbInstance;
  })();

  return initPromise;
}

export interface MushafPageLayout {
  page_number: number;
  line_number: number;
  line_type: string;
  is_centered: number;
  first_word_id: number | null;
  last_word_id: number | null;
  surah_number: number | null;
}

export async function getMushafPageLayout(pageNumber: number): Promise<MushafPageLayout[]> {
  const db = await initQuranDb();
  const lines = db.getAllSync<MushafPageLayout>(
    `SELECT * FROM pages WHERE page_number = ? ORDER BY line_number ASC`,
    [pageNumber]
  );
  return lines;
}
