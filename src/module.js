import './polyfill.js';
import log from 'loglevel';
import QueueModule from 'veda-node-queue-consumer';
import sendTelegram from './sendTelegram.js';

import veda from 'veda/js/common/veda.js';
import IndividualModel from 'veda/js/common/individual_model.js';
import Backend from 'veda/js/browser/backend_browser.js';
import Connector from './connector.js';

const defaultTimeout = 60000;
const timeout = (ms = defaultTimeout) => new Promise((resolve) => setTimeout(resolve, ms));

export default class Module extends QueueModule {
  constructor (options) {
    super(options);
    this.counter = 0;
  }

  async beforeStart () {
    try {
      log.warn(new Date().toISOString(), `Authenticating user ${this.options.username}`);
      const ticket = await Backend.authenticate(this.options.username, this.options.password);
      log.warn(new Date().toISOString(), `User ${this.options.username} authenticated successfully`);
      veda.ticket = ticket.ticket;
      await veda.init(ticket.user_uri);
      setTimeout(this.beforeStart.bind(this), (ticket.end_time - Date.now()) * 0.9);
    } catch (error) {
      log.error(new Date().toISOString(), 'Before start error', error);

      if (this.options.errorStategy === 'fail') {
        sendTelegram('*Failed to start!!!*');
        throw error;
      }

      const retryMsg = `Will retry in ${(this.options.retryTimeout || defaultTimeout) / 1000} sec.`;
      log.error(new Date().toISOString(), retryMsg);
      sendTelegram('Failed to start.', retryMsg);
      await timeout(this.options.retryTimeout);
      return this.beforeStart();
    }
  }

  async process (el) {
    if (++this.counter % 10000 === 0) {
      log.warn(new Date().toISOString(), `${this.counter} queue elements processed`);
    }
    if (el.cmd === 'put') {
      try {
        const individual = new IndividualModel(el.new_state, false);
        if (
          individual.hasValue('rdf:type', 'mnd-s:SignUpForLesson') &&
          individual.hasValue('v-s:updateCounter') &&
          individual.get('v-s:updateCounter')[0] === 1
        ) {
          await Connector.exportSignUp(individual);
        }
      } catch (error) {
        log.error(new Date().toISOString(), `Error processing queue record: ${el.uri}, cmd: ${el.cmd}, ${error}`);

        if (this.options.errorStategy === 'fail') {
          sendTelegram(`Failed to process queue record: ${el.uri}`, '*Exit!!!*');
          throw error;
        }

        const retryMsg = `Will retry in ${(this.options.retryTimeout || defaultTimeout) / 1000} sec.`;
        log.error(new Date().toISOString(), retryMsg);
        sendTelegram(`Failed to process queue record: ${el.uri}`, retryMsg);
        await timeout(this.options.retryTimeout);
        await this.process(el);
      }
    }
  }
}
