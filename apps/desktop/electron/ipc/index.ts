import { registerAuthIpc } from './auth.ipc';
import { registerFileIpc } from './file.ipc';
import { registerUpdateIpc } from './update.ipc';

export function registerIpcHandlers(): void {
  registerAuthIpc();
  registerFileIpc();
  registerUpdateIpc();
}
