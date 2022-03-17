import log from 'loglevel';
import Module from './module.js';
import options from './options.js';

log.setLevel(options.logLevel || 'warn');

const myModule = new Module(options);
myModule.run();
