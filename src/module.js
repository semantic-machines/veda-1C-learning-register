import './polyfill.js';
import log from 'loglevel';
import QueueModule from 'veda-node-queue-consumer';

import veda from 'veda/js/common/veda.js';
import IndividualModel from 'veda/js/common/individual_model.js';
import Backend from 'veda/js/browser/backend_browser.js';
import Connector from './connector.js';

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
      setTimeout(this.beforeStart.bind(this), 60 * 1000);
    }
  }

  async process (el) {
    if (++this.counter % 10000 === 0) {
      log.warn(new Date().toISOString(), `${this.counter} queue elements processed`);
    }
    if (el.cmd === 'put') {
      try {
        const individual = new IndividualModel(el.new_state);
        if (
          !individual.hasValue('rdf:type', 'mnd-s:SignUpForLesson') ||
          individual.hasValue('v-s:lastEditor', 'cfg:VedaSystemAppointment') ||
          individual.hasValue('v-s:updateCounter') && individual.get('v-s:updateCounter')[0] > 1
        ) {
          return;
        }
        await Connector.exportSignUp(individual);
      } catch (error) {
        log.error(new Date().toISOString(), `Error processing queue record: ${el.uri}, cmd: ${el.cmd}, ${error.stack}`);
        throw error;
      }
    }
  }
}