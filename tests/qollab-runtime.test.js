import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = (await readFile(new URL('../scripts/qollab-main.js', import.meta.url), 'utf8'))
  .replace("import * as verifier from 'quantum.verify';", '')
  .replace("import './game.js';", '');
const execute = new (Object.getPrototypeOf(async function(){}).constructor)('window','verifier','backend',source);

for (const fail of [false,true]) {
  test(`Qollab stays running until deferred verification ${fail?'fails':'returns'}`,async()=>{
    const window={};
    const backend={selected:true};
    let release,received,finished=false;
    const job=new Promise((resolve,reject)=>{release=()=>fail?reject(new Error('provider failure')):resolve('{"counts":{"00000000":1024},"shots":1024}');});
    const run=execute(window,{run:{callPromising:(...args)=>{received=args;return job;}}},backend).then(()=>{finished=true;});
    await Promise.resolve();
    assert.equal(finished,false,'board initialization must not finish the Qollab run');
    const verification=window.foldBackend([{gate:'h',target:0}],8);
    const outcome=fail?assert.rejects(verification,/provider failure/):verification;
    await Promise.resolve();
    assert.equal(finished,false,'run must remain active while backend job is pending');
    assert.deepEqual(received,[backend,'[{"gate":"h","target":0}]',1024,8]);
    release();
    const result=await outcome;
    await run;
    assert.equal(finished,true);
    if(!fail)assert.deepEqual(result,{counts:{'00000000':1024},shots:1024});
  });
}
