import './polyfill.js';
import log from 'loglevel';
import options from './options.js';

class HTTPResponseError extends Error {
  constructor (response, ...args) {
    super(`HTTP Error Response: ${response.status} ${response.statusText}`, ...args);
    this.response = response;
  }
}

const checkResponse = (response) => {
  if (response.ok) {
    return response;
  } else {
    throw new HTTPResponseError(response);
  }
};

export default class Connector {
  static async exportSignUp (individual) {
    log.debug(new Date().toISOString(), 'Individual to export:', JSON.stringify(individual.properties));
    const lesson = individual.hasValue('mnd-s:hasLesson') && individual.get('mnd-s:hasLesson')[0].id.replace(/^(d:)(.*)$/, '$2');
    const participant = individual.hasValue('v-s:participant') && individual.get('v-s:participant')[0];

    if (!lesson || !participant) {
      log.warn(new Date().toISOString(), 'Nothing to export, lesson or participant is not defined', JSON.stringify(individual.properties));
      return;
    }

    const body = {
      'ПроведениеОбучения': lesson,
      'Пользователь': participant.id,
    };

    const params = {
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${options.oneUsername}:${options.onePassword}`, 'binary').toString('base64'),
      },
    };

    log.warn(new Date().toISOString(), 'Request params:', params);

    let response;

    try {
      response = await fetch(`${options.oneUrl}/eduupb/hs/mondiedu/education/entry`, params);
      log.warn(new Date().toISOString(), '1C response:', response);
    } catch (error) {
      log.error(new Date().toISOString(), 'Network error', error);
      throw error;
    }

    try {
      checkResponse(response);
      await Connector.#setAcceptedStatus(individual);
    } catch (error) {
      log.error(new Date().toISOString(), 'Error in 1C:', error);
      await Connector.#setRejectedStatus(individual, error);
    }
  }

  static async #setAcceptedStatus (individual) {
    try {
      individual.set('v-s:hasStatus', 'v-s:StatusAccepted');
      await individual.save(false);
      log.warn(new Date().toISOString(), 'Status set to v-s:StatusAccepted', individual.id);
    } catch (error) {
      log.error(new Date().toISOString(), 'Failed to set status v-s:StatusAccepted', individual.id, error);
      throw error;
    }
  }

  static async #setRejectedStatus (individual, err) {
    try {
      individual.set('v-s:hasStatus', 'v-s:StatusRejected');
      let responseBody;
//      try {
//        responseBody = await err.response.json();
//      } catch (error) {
        responseBody = await err.response.text();
//      }
      log.error(new Date().toISOString(), 'Error response:', responseBody.data?.['ТекстОшибки'] ?? responseBody);
      individual.set('v-s:errorMessage', responseBody.data?.['ТекстОшибки'] ?? responseBody);
      await individual.save(false);
      log.warn(new Date().toISOString(), 'Status set to v-s:StatusRejected', individual.id);
    } catch (error) {
      log.error(new Date().toISOString(), 'Failed to set status v-s:StatusRejected', individual.id, error);
      throw error;
    }
  }
}
