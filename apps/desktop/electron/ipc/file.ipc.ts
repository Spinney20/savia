import { ipcMain, dialog } from 'electron';
import { writeFile } from 'fs/promises';

export function registerFileIpc(): void {
  ipcMain.handle('file:save-dialog', async (_event, data: ArrayBuffer, defaultName: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: [
        { name: 'PDF', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (canceled || !filePath) return null;

    await writeFile(filePath, Buffer.from(data));
    return filePath;
  });
}
