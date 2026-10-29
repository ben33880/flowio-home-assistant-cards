import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const pkg=readJson('package.json'),version=process.env.RELEASE_VERSION,commit=process.env.RELEASE_SOURCE_SHA;
if(!version||version!==pkg.version)throw new Error('RELEASE_VERSION must match package.json');
if(!/^[0-9a-f]{40}$/.test(commit??''))throw new Error('RELEASE_SOURCE_SHA must be the exact source commit');
if(!fs.existsSync('package-lock.json'))throw new Error('Generate, review and commit package-lock.json first');
const lock=readJson('package-lock.json');
if(lock.packages?.['']?.version!==version)throw new Error('Lockfile root version does not match release');
const bundle='dist/flowio-home-assistant-cards.js',meta=readJson('dist/metafile.json');
if(!fs.statSync(bundle).size)throw new Error('Production bundle is empty');
const roots=new Set();
for(const input of Object.keys(meta.inputs)){const parts=input.split('/'),index=parts.lastIndexOf('node_modules');if(index<0)continue;roots.add(parts.slice(0,index+1+(parts[index+1].startsWith('@')?2:1)).join('/'));}
const packages=[],notices=[];
for(const root of [...roots].sort()){const manifest=readJson(path.join(root,'package.json')),files=fs.readdirSync(root,{withFileTypes:true}).filter(file=>file.isFile()&&/^(licen[sc]e|copying|notice)([._-].*)?$/i.test(file.name)).map(file=>file.name).sort();if(!files.length)throw new Error(`No license/notice file found for bundled package ${manifest.name}`);packages.push({name:manifest.name,version:manifest.version,license:manifest.license??null});notices.push(`${manifest.name} ${manifest.version}\n${files.map(file=>`${file}\n${fs.readFileSync(path.join(root,file),'utf8')}`).join('\n\n')}`);}
if(!packages.length)throw new Error('No bundled dependency inventory found');
const thirdParty=`Third-party notices for Flow.io Home Assistant Cards ${version}\nCopied from the installed packages included in the production build.\n\n${notices.join('\n\n--------------------\n\n')}\n`;
const license=fs.readFileSync('LICENSE','utf8');
fs.writeFileSync('dist/THIRD_PARTY_NOTICES.txt',thirdParty);
fs.copyFileSync('LICENSE','dist/LICENSE');
fs.copyFileSync('package-lock.json','dist/package-lock.json');
fs.copyFileSync(`docs/releases/v${version}.md`,'dist/RELEASE_NOTES.md');
const footer=`Flow.io Home Assistant Cards ${version}\nSource: ${commit}\n\n${license}\n\n${thirdParty}`.replaceAll('*/','* /');
fs.appendFileSync(bundle,`\n/*!\n${footer}\n*/\n`);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
fs.writeFileSync('dist/release-metadata.json',JSON.stringify({version,commit,node:process.version,builtAt:new Date().toISOString(),bundleSha256:hash(bundle),lockfileSha256:hash('package-lock.json'),packages,validation:{homeAssistantSmokeTest:process.env.HA_SMOKE_TESTED==='true'?'declared by workflow operator':'not declared',physicalInstallation:'not certified by this build'}},null,2)+'\n');
