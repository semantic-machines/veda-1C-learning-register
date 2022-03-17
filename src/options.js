import fs from 'fs';

let cfg;

try {
  cfg = fs.readFileSync('./conf/veda-1C.properties', 'utf-8');
} catch (err) {
  console.log(`config file './conf/veda-1C.properties' not found`);
}

try {
  cfg = fs.readFileSync('../conf/veda-1C.properties', 'utf-8');
} catch (err) {
  console.log(`config file '../conf/veda-1C.properties' not found`);
}

if (!cfg) {
  console.log('no config found, exit');
  process.exit(1);
}

let options = {};
cfg.replace(/^(?!\s*#\s*)(.*?)\s*=\s*(.*?)\s*$/gm, (_, k, v) => options[k] = v);

export default options;