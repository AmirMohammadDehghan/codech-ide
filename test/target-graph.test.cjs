const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
const {inferredSymbol,targetExcerpt,targetPrompt,boundedData}=require('../apps/workbench/dist/target.cjs');
const {ProjectGraph}=require('../apps/workbench/dist/project-graph.cjs');
const {Workspace}=require('../apps/workbench/dist/core.cjs');
test('Python and Markdown fallback locates enclosing section, and large excerpts stay near the cursor',()=>{
 const code='class Example:\n    def first(self):\n        return 1\n\n    def second(self):\n        return 2\n\ndef outside():\n    pass';
 assert.equal(inferredSymbol(code,'python',3).name,'first');assert.equal(inferredSymbol(code,'python',6).name,'second');assert.equal(inferredSymbol(code,'python',9).name,'outside');
 assert.equal(inferredSymbol('# One\ntext\n## Sub\nmore\n# Two','markdown',4).name,'Sub');
 const excerpt=targetExcerpt(Array.from({length:200},(_,i)=>`line${i+1}`).join('\n'),150,{name:'large',start:1,end:200});assert.ok(excerpt.excerpt.includes('line150'));assert.ok(excerpt.excerptStart>100);assert.ok(excerpt.truncated);assert.match(targetPrompt(),/No editor target/);
 const bounded=boundedData({text:'"'.repeat(10000),selection:'x'.repeat(10000)},1000);assert.ok(bounded.length<=1000);assert.ok(JSON.parse(bounded));
});
test('graph connects code and external vault and updates changed/deleted files',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'codech-graph-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));await fs.mkdir(path.join(root,'src'));await fs.mkdir(path.join(root,'vault'));
 await fs.writeFile(path.join(root,'src/a.ts'),"import {b} from './b';\nexport function hello(){}\n// [[Architecture]]");await fs.writeFile(path.join(root,'src/b.ts'),'export const b=1;');await fs.writeFile(path.join(root,'vault/Architecture.md'),'# Architecture\nA useful note');await fs.writeFile(path.join(root,'vault/.env'),'SECRET');
 const graph=new ProjectGraph();const sources=[{id:'project',root:path.join(root,'src')},{id:'vault',root:path.join(root,'vault')}];let result=await graph.scan(sources,true);assert.equal(result.nodes.length,3);assert.ok(result.edges.some(e=>e.source==='project:a.ts'&&e.target==='project:b.ts'));assert.ok(result.edges.some(e=>e.target==='vault:Architecture.md'));
 const context=await graph.context(sources,'explain this',{source:'project',path:'a.ts'});assert.match(context.text,/Architecture/);assert.doesNotMatch(context.text,/SECRET/);assert.ok(context.text.length<2800);
 await fs.writeFile(path.join(root,'src/b.ts'),'export function replacement() {}');await fs.unlink(path.join(root,'vault/Architecture.md'));result=await graph.scan(sources,true);assert.equal(result.nodes.length,2);assert.ok(result.nodes.find(n=>n.path==='b.ts').symbols.includes('replacement'));result=await graph.scan([],true);assert.equal(result.nodes.length,0);
});
test('Git indexing excludes ignored files while retaining sources',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'codech-index-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const ws=new Workspace(root);await ws.git(['init','-q']);await fs.writeFile(path.join(root,'.gitignore'),'private-notes.md\n');await fs.writeFile(path.join(root,'private-notes.md'),'excluded');await fs.writeFile(path.join(root,'main.py'),'pass');assert.ok((await ws.files()).includes('main.py'));assert.ok(!(await ws.files()).includes('private-notes.md'));
});
