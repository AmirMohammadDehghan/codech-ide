const assert=require('node:assert/strict');const fs=require('node:fs/promises');const path=require('node:path');const http=require('node:http');
exports.run=async()=>{
 const vscode=require('vscode');const extension=vscode.extensions.getExtension('codech.codech-workbench');assert.ok(extension);const api=await extension.activate();
 const commands=await vscode.commands.getCommands(true);for(const id of ['codech.open','codech.knowledge','codech.review','codech.worktrees','codech.graph','codech.newChat','codech.focusInput','codech.browser','codech.inspect','codech.voice'])assert.ok(commands.includes(id),id);
 const root=vscode.workspace.workspaceFolders[0].uri.fsPath;const file=path.join(root,'codech-native-test.py');await fs.writeFile(file,'class Example:\n    def test(self):\n        return 1\n');
 try {
  const doc=await vscode.workspace.openTextDocument(file);const editor=await vscode.window.showTextDocument(doc);editor.selection=new vscode.Selection(2,8,2,16);
  await editor.edit(b=>b.replace(new vscode.Range(2,15,2,16),'99'));editor.selection=new vscode.Selection(2,8,2,17);
  let target=await api.captureTarget();assert.equal(target.path,'codech-native-test.py');assert.equal(target.symbol.name,'test');assert.equal(target.dirty,true);assert.match(target.selections[0].text,/99/);
  await vscode.commands.executeCommand('codech.focusInput');await new Promise(r=>setTimeout(r,300));assert.ok(api.composerCount()>0);target=await api.captureTarget();assert.equal(target.path,'codech-native-test.py');assert.match(target.excerpt,/99/);
  await api.showDiff('codech-native-test.py','def old():\n    return 1\n','def new():\n    return 2\n');await new Promise(r=>setTimeout(r,200));
  const right=vscode.window.visibleTextEditors.find(e=>e.document.uri.scheme==='codech-diff'&&e.document.uri.path.includes('/after/'));assert.ok(right);await vscode.window.showTextDocument(right.document);right.selection=new vscode.Selection(1,4,1,12);target=await api.captureTarget();assert.equal(target.side,'modified');assert.equal(target.path,'codech-native-test.py');assert.match(target.excerpt,/return 2/);
  if(process.env.CODECH_STANDALONE_TEST){
   assert.equal(vscode.env.appName,'Codech IDE');assert.ok(extension.extensionPath.includes('resources'));
   const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><title>Codech browser test</title><style>body{min-height:3000px}#test{margin-top:500px;color:rgb(10,20,30)}</style><h1>Browser fixture</h1><button id="test" data-codech-source="codech-native-test.py:2">Codech test</button>');});
   await new Promise(r=>server.listen(0,'127.0.0.1',r));
   try {
    await api.browser.open('http://127.0.0.1:'+server.address().port);await new Promise(r=>setTimeout(r,1200));assert.equal(await api.browser.evaluate('document.title'),'Codech browser test');await api.browser.inspect();await api.browser.evaluate("document.querySelector('#test').click()");await new Promise(r=>setTimeout(r,300));assert.equal(api.browser.context.element.id,'test');assert.equal(api.browser.context.element.styles.color,'rgb(10, 20, 30)');assert.equal(api.browser.context.element.sourceHint,'codech-native-test.py:2');
    await api.browser.scroll('down');await new Promise(r=>setTimeout(r,500));assert.ok(await api.browser.evaluate('scrollY')>0);await api.browser.scroll('element');await vscode.commands.executeCommand('codech.focusInput');assert.ok(api.composerCount()>0);
   } finally{await api.browser.disconnect();await new Promise(r=>server.close(r));}
   await vscode.workspace.getConfiguration('workbench').update('colorTheme','Codech Paper',vscode.ConfigurationTarget.Global);assert.equal(vscode.workspace.getConfiguration('workbench').get('colorTheme'),'Codech Paper');await vscode.workspace.getConfiguration('workbench').update('colorTheme','Codech Graphite',vscode.ConfigurationTarget.Global);
  }
  if(process.env.CODECH_TEST_REPORT)await fs.writeFile(process.env.CODECH_TEST_REPORT,JSON.stringify({passed:true,version:extension.packageJSON.version,appName:vscode.env.appName,editorTarget:true,unsavedSelection:true,diffTarget:true,persistentComposer:true,nativeBrowser:!!process.env.CODECH_STANDALONE_TEST,inspector:!!process.env.CODECH_STANDALONE_TEST,themeSwitch:true}));
 } finally {const d=vscode.workspace.textDocuments.find(d=>d.uri.fsPath===file);if(d?.isDirty){await vscode.window.showTextDocument(d);await vscode.commands.executeCommand('workbench.action.files.revert');}await fs.unlink(file).catch(()=>{});}
};
