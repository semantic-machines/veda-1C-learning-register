import baretest from 'baretest';
import assert from 'assert';
import {readdir} from 'fs/promises';
import status from './mockup-server.js';

const test = baretest('Tests');
const re = /^test.*\.js$/;

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async function () {
  while (!status.ready) {
    await timeout(1000);
  }
  const files = (await readdir('./test')).filter((f) => re.test(f));
  const modules = await Promise.all(files.map((file) => import('./' + file)));
  modules.forEach((module) => {
    const t = module.default;
    t({test, assert});
  });
  assert(await test.run());
})();
