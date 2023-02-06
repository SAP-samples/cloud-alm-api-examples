'use strict';
/*******************************************************************************
 * Loader
 * Performs the API calls
 *******************************************************************************/
import secret from '../secret/secret.js';
import axios from 'axios';
import oauth from 'axios-oauth-client';
import tokenProvider from 'axios-token-interceptor';
import axiosThrottle from 'axios-request-throttle';

export default function Loader() {
  /******************************************************************************
   * AXIOS Authenticate and Throttle
   */

  axiosThrottle.use(axios, { requestsPerSecond: 100 });

  const getClientCredentials = oauth.clientCredentials(
    axios.create({
      baseURL: secret.authenticationUrl,
    }),
    '/oauth/token',
    secret.clientId,
    secret.clientSecret
  );

  const instance = axios.create({
    baseURL: secret.apiBaseUrl,
  });

  const cache = tokenProvider.tokenCache(
    () => getClientCredentials().then(response => response),
    { getMaxAge: (body) => body.expires_in * 1000 }
  );

  instance.interceptors.request.use(tokenProvider({
    getToken: cache,
    headerFormatter: (body) => 'Bearer ' + body.access_token,
  }));

  /******************************************************************************
   * Private functions
   */

  async function _getBusinessProcesses(top = 100, skip = 0) {
    const url = `/api/calm-processauthoring/v1/businessProcesses?$top=${top}&$skip=${skip}`;

    try {
      const businessProcesses = await instance.get(url);
      return businessProcesses['data']['value'];
    } catch (error) {
      throw new Error(error);
    }
  }

  async function _getBusinessProcessCount() {
    const url = '/api/calm-processauthoring/v1/businessProcesses/$count';

    try {
      const response = await instance.get(url);
      return response['data'];
    } catch (error) {
      throw new Error(error);
    }
  }

  async function _createBusinessProcess(name, description = '') {
    return new Promise(async (resolve, reject) => {
      const url = '/api/calm-processauthoring/v1/businessProcesses';

      if (!name)
        throw new Error({ code: '', message: 'BUSINESS_PROCESS_NAME_EMPTY' });

      const body = {
        name: name,
        description: description,
      };

      try {
        const response = await instance.post(url, body);
        resolve(response['data']);
      } catch (error) {
        reject(error);
      }
    });
  }

  async function _createSolutionProcess(body) {
    return new Promise(async (resolve, reject) => {
      const url = '/api/calm-processauthoring/v1/solutionProcesses';

      try {
        const response = await instance.post(url, body);
        let returnValue = response['data'];
        returnValue['location'] = response['headers']['location'];
        resolve(returnValue);
      } catch (error) {
        reject(error);
      }
    });
  }

  async function _createAccelerator(solutionProcess, body) {
    return new Promise(async (resolve, reject) => {
      const url = `/api/calm-processauthoring/v1/solutionProcesses/${solutionProcess}/assets`;

      try {
        const response = await instance.post(url, body);
        const returnValue = response['data'];
        returnValue['location'] = response['headers']['location'];
        resolve(returnValue);
      } catch (error) {
        reject(error);
      }
    });
  }

  function _calculateIterations(entries, limit) {
    let iterations = Math.floor(entries / limit);
    if (entries % limit > 0) iterations++;
    return iterations;
  }

  /******************************************************************************
   * Public functions
   */
  return {

    loadBusinessProcesses: async function (neededBusinessProcesses) {
      try {
        const top = 100;
        const businessProcessCount = await _getBusinessProcessCount();
        const iterations = _calculateIterations(businessProcessCount, top);

        const iterationResults = [];
        for (let i = 1; i <= iterations; i++) {
          iterationResults.push({ top: top, skip: (i - 1) * top });
        }

        const resultArraysPromise = iterationResults.map(
          async (businessProcesses) => {
            return _getBusinessProcesses(
              businessProcesses['top'],
              businessProcesses['skip']
            );
          }
        );
        const resultArrays = await Promise.all(resultArraysPromise);

        let existingBusinessProcesses = [];
        resultArrays.map((array) => {
          existingBusinessProcesses = existingBusinessProcesses.concat(array);
        });

        const businessProcesses = neededBusinessProcesses.map(
          (neededBusinessProcess) => {
            let matchingBusinessProcess = existingBusinessProcesses.find(
              (existingBusinessProcess) =>
                existingBusinessProcess['name'] === neededBusinessProcess
            );
            if (!matchingBusinessProcess)
              matchingBusinessProcess = neededBusinessProcess;
            return matchingBusinessProcess;
          }
        );

        const complementedPromise = businessProcesses
          .filter((businessProcess) => businessProcess['id'] === undefined)
          .map(async (businessProcess) => {
            let complementedBusinessProcess =
              await _createBusinessProcess(businessProcess);
            return complementedBusinessProcess;
          });

        const resultCreated = await Promise.all(complementedPromise);

        resultCreated.forEach((created) => {
          businessProcesses[businessProcesses.indexOf(created['name'])] =
            created;
        });
        return businessProcesses;
      } catch (error) {
        throw new Error(error);
      }
    },

    loadSolutionProcesses: async function (solutionProcesses) {
      const solutionProcessPromise = solutionProcesses.map(
        async (solutionProcess) => {
          try {
            const body = JSON.parse(JSON.stringify(solutionProcess));
            delete body['externalId'];
            const sp = await _createSolutionProcess(body);
            sp['externalId'] = solutionProcess['externalId'];
            return sp;
          } catch (error) {
            throw new Error(error);
          }
        }
      );
      return await Promise.all(solutionProcessPromise);
    },

    loadAccelerators: async function (accelerators) {
      const acceleratorPromise = accelerators.map(async (accelerator) => {
        try {
          const body = JSON.parse(JSON.stringify(accelerator));
          delete body['solutionProcess'];
          const asset = await _createAccelerator(
            accelerator['solutionProcess'],
            body
          );
          return asset;
        } catch (error) {
          throw new Error(error);
        }
      });
      return await Promise.all(acceleratorPromise);
    },

  };
}