const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
exports.run = async () => { const vscode = require('vscode'); const extension = vscode.extensions.getExtension('codech.codech-workbench'); assert.ok(extension, 'Codech extension is registered'); await extension.activate(); const commands = await vscode.commands.getCommands(true); for (const id of ['codech.open', 'codech.knowledge', 'codech.review', 'codech.worktrees', 'codech.graph', 'codech.newChat'])
    assert.ok(commands.includes(id), id); for (const id of ['codech.open', 'codech.knowledge', 'codech.review', 'codech.graph'])
    await vscode.commands.executeCommand(id); if (process.env.CODECH_TEST_REPORT)
    await fs.writeFile(process.env.CODECH_TEST_REPORT, JSON.stringify({ passed: true, host: vscode.version, appName: vscode.env.appName, extensionPath: extension.extensionPath, commands: 6 }));
    if (process.env.CODECH_STANDALONE_TEST) {
        assert.equal(vscode.env.appName, 'Codech IDE');
        assert.ok(vscode.window.tabGroups.all.flatMap(group => group.tabs).some(tab => tab.label === 'Codech IDE'), 'Central chat is present');
        assert.ok(extension.extensionPath.includes('resources'), 'Workbench is loaded from the packaged runtime');
        assert.equal(vscode.workspace.getConfiguration('workbench').get('colorTheme'), 'Codech Graphite');
        assert.ok(commands.includes('codech.appearance'));
        await vscode.workspace.getConfiguration('workbench').update('colorTheme', 'Codech Paper', vscode.ConfigurationTarget.Global);
        assert.equal(vscode.workspace.getConfiguration('workbench').get('colorTheme'), 'Codech Paper');
        await vscode.workspace.getConfiguration('workbench').update('colorTheme', 'Codech Graphite', vscode.ConfigurationTarget.Global);
        const installed = vscode.extensions.getExtension('dracula-theme.theme-dracula');
        if (process.env.CODECH_EXPECT_DRACULA) assert.ok(installed, 'Third-party VSIX was installed in the standalone extension directory');
        await fs.writeFile(process.env.CODECH_TEST_REPORT, JSON.stringify({ passed: true, standalone: true, appName: vscode.env.appName, host: vscode.version, themeSwitch: true, thirdPartyTheme: !!installed, builtinWorkbench: extension.extensionPath.includes('resources'), extensionPath: extension.extensionPath }));
    }
};
