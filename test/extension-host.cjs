const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
exports.run = async () => { const vscode = require('vscode'); const extension = vscode.extensions.getExtension('codech.codech-workbench'); assert.ok(extension, 'Codech extension is registered'); await extension.activate(); const commands = await vscode.commands.getCommands(true); for (const id of ['codech.open', 'codech.knowledge', 'codech.review', 'codech.worktrees', 'codech.graph', 'codech.newChat'])
    assert.ok(commands.includes(id), id); for (const id of ['codech.open', 'codech.knowledge', 'codech.review', 'codech.graph'])
    await vscode.commands.executeCommand(id); if (process.env.CODECH_TEST_REPORT)
    await fs.writeFile(process.env.CODECH_TEST_REPORT, JSON.stringify({ passed: true, host: vscode.version, commands: 6 })); };
