import { mkdir, copyFile, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { build } from 'vite';
await mkdir('qollab-build/quantum', {recursive:true});
await build({configFile:false,build:{outDir:'qollab-build',emptyOutDir:false,minify:true,lib:{entry:'main.js',formats:['es'],fileName:()=> 'game.js'}}});
await copyFile('main.css','qollab-build/main.css');
await copyFile('quantum/verify.py','qollab-build/quantum/verify.py');
await copyFile('quantum/__init__.py','qollab-build/quantum/__init__.py');
await copyFile('LICENSE','qollab-build/LICENSE');
const projectPage = await readFile('submissions/QOLLAB-PROJECT.md', 'utf8');
await writeFile('qollab-build/README.md', projectPage.replaceAll('(../docs/', '(docs/'));
await mkdir('qollab-build/docs/assets', {recursive:true});
for (const name of ['QUANTUM.md','ARCHITECTURE.md','ATTRIBUTION.md','DEPLOYMENT.md']) {
  await copyFile(`docs/${name}`, `qollab-build/docs/${name}`);
}
await copyFile('docs/assets/fold-board.jpg','qollab-build/docs/assets/fold-board.jpg');
await writeFile('qollab-build/index.html','<div id="app"></div>\n');
await writeFile('qollab-build/main.js',`import * as verifier from 'quantum.verify';\nwindow.foldBackend = async (operations, qubits = 8) => {\n  const raw = await verifier.run.callPromising(backend, JSON.stringify(operations), 1024, qubits);\n  return JSON.parse(String(raw));\n};\nimport './game.js';\n`);
// Static imports execute before the assignment above. The app checks backend availability
// when the player opens the science panel, after initialization has completed.
await writeFile('qollab-build/requirements.txt','qiskit>=2.5.2,<3.0.0\n');
let fileCount=0;
async function check(dir) {for(const entry of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${entry.name}`;if(entry.isDirectory())await check(path);else {fileCount++;if((await stat(path)).size>2*1024*1024)throw new Error(`Qollab file too large: ${path}`);}}}
await check('qollab-build');
if (fileCount > 100) throw new Error(`Too many Qollab files: ${fileCount}`);
console.log('Qollab package ready in qollab-build/');
