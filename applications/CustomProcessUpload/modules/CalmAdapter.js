'use strict'

/*******************************************************************************
 * CALM Adapter
 *******************************************************************************/
import axios from 'axios'
import oauth from 'axios-oauth-client'
import tokenProvider from 'axios-token-interceptor'
import axiosThrottle from 'axios-request-throttle'

export default function CalmAdapter(secret) {

  /******************************************************************************
   * AXIOS Authenticate and Throttle
   */

  axiosThrottle.use(axios, { requestsPerSecond: 100 })

  const getClientCredentials = oauth.clientCredentials(
    axios.create({
      baseURL: secret.authenticationUrl,
    }),
    '/oauth/token',
    secret.clientId,
    secret.clientSecret
  )

  const instance = axios.create({
    baseURL: secret.apiBaseUrl,
  })

  const cache = tokenProvider.tokenCache(
    () => getClientCredentials().then(response => response),
    { getMaxAge: body => body.expires_in * 1000 }
  )

  instance.interceptors.request.use(tokenProvider({
    getToken: cache,
    headerFormatter: body => 'Bearer ' + body.access_token,
  }))

  /******************************************************************************
   * Private functions
   */

  async function _getSolutionProcessFlows(top = 100, skip = 0) {
    const url = `/api/calm-processauthoring/v1/solutionProcessFlows?$top=${top}&$skip=${skip}`
    try {
      const businessProcesses = await instance.get(url)
      return businessProcesses.data.value
    } catch (error) {
      throw new Error(error)
    }
  }

  async function _getbusinessProcesses(top = 100, skip = 0) {
    const url = `/api/calm-processauthoring/v1/businessProcesses?$top=${top}&$skip=${skip}`
    try {
      const businessProcesses = await instance.get(url)
      return businessProcesses.data.value
    } catch (error) {
      throw new Error(error)
    }
  }


  async function _getBusinessProcessCount() {
    const url = '/api/calm-processauthoring/v1/businessProcesses/$count'
    try {
      const response = await instance.get(url)
      return response.data
    } catch (error) {
      throw new Error(error)
    }
  }

  async function _getSolutionProcessFlowCount() {
    const url = '/api/calm-processauthoring/v1/solutionProcessFlows/$count'
    try {
      const response = await instance.get(url)
      return response.data
    } catch (error) {
      throw new Error(error)
    }
  }

  async function _createBusinessProcess(name, description = '') {
    const url = '/api/calm-processauthoring/v1/businessProcesses'
    if (!name)
      throw new Error({ code: '', message: 'BUSINESS_PROCESS_NAME_EMPTY' })
    const body = {
      name: name,
      description: description,
    }

    try {
      const response = await instance.post(url, body)
      return response.data
    } catch (error) {
      throw new Error(error.data.error)
    }
  }

  async function _findSolutionProcessByExternalId(externalId) {
    const urlByExternalId = `/api/calm-processauthoring/v1/solutionProcesses?externalId=${externalId}`
    try {
      const responseExternalId = await instance.get(urlByExternalId)
      if (responseExternalId.data.value.length > 0) {
        return responseExternalId.data.value
      }
      else {
        return false
      }
    } catch (error) {
      throw new error
    }
  }

  async function _createSolutionProcess(body) {
    const url = '/api/calm-processauthoring/v1/solutionProcesses'
    try {
      const response = await instance.post(url, body)
      return response.data
    } catch (error) {
      throw new Error(error)
    }
  }

  async function _patchSolutionProcess(solutionProcessId, body) {
    const url = `/api/calm-processauthoring/v1/solutionProcesses/${solutionProcessId}`
    try {
      const solutionProcess = await instance.get(url)
      if (solutionProcess.data.status === 'ACTIVE') {
        const createDraftUrl = `/api/calm-processauthoring/v1/createDraftSolutionProcess/${solutionProcessId}`
        const createdDraft = await instance.post(createDraftUrl, {}, { headers: { 'if-match': solutionProcess.headers.etag } })
        const draftUrl = `/api/calm-processauthoring/v1/solutionProcesses/${createdDraft.data.id}`
        const solutionProcessAfterDraft = await instance.get(draftUrl)
        const patchUrl = `/api/calm-processauthoring/v1/solutionProcesses/${solutionProcessAfterDraft.data.id}`
        const response = await instance.patch(patchUrl, body, { headers: { 'if-match': solutionProcessAfterDraft.headers.etag } })
        return response.data
      } else {
        const response = await instance.patch(url, body, { headers: { 'if-match': solutionProcess.headers.etag } })
        return response.data
      }
    } catch (error) {
      throw new Error(error)
    }
  }

  async function _createAccelerator(solutionProcessId, body) {
    const url = `/api/calm-processauthoring/v1/solutionProcesses/${solutionProcessId}/assets`
    try {
      const response = await instance.post(url, body)
      return response.data
    } catch (error) {
      throw new Error(error)
    }
  }

  async function _patchSolutionProcessValueFlowDiagram(solutionProcessId, body) {
    const readUrl = `/api/calm-processauthoring/v1/solutionProcesses/${solutionProcessId}/solutionValueFlowDiagram`
    try {
      const svfd = await instance.get(readUrl)
      const patchUrl = `/api/calm-processauthoring/v1/solutionValueFlowDiagrams/${svfd.data.id}`
      const response = await instance.patch(patchUrl, body, { headers: { 'if-match': svfd.headers.etag } })
      return response.data
    } catch (error) {
      throw new Error(error)
    }
  }

  async function _createSolutionProcessFlowSVGDiagram(solutionProcessFlowId, body) {
    const url = `/api/calm-processauthoring/v1/solutionProcessFlows/${solutionProcessFlowId}/solutionProcessFlowDiagrams`
    try {
      const response = await instance.post(url, body)
      return response.data
    } catch (error) {
      throw new Error(error)
    }
  }

  async function _createSolutionProcessFlowBPMNDiagram(solutionProcessFlowId, body) {
    const url = `/api/calm-processauthoring/v1/solutionProcessFlows/${solutionProcessFlowId}/solutionProcessFlowDiagrams/bpmn`
    try {
      const response = await instance.post(url, body)
      return response.data
    } catch (error) {
      throw new Error(error)
    }
  }

  async function _activateSolutionProcess(solutionProcessId) {
    const readUrl = `/api/calm-processauthoring/v1/solutionProcesses/${solutionProcessId}`
    const postUrl = `/api/calm-processauthoring/v1/publishSolutionProcess/${solutionProcessId}`
    try {
      const preRead = await instance.get(readUrl)
      const response = await instance.post(postUrl, {}, { headers: { 'if-match': preRead.headers.etag } })
      return response.data
    } catch (error) {
      throw new Error(error)
    }
  }

  function _calculateIterations(entries, limit) {
    let iterations = Math.floor(entries / limit)
    if (entries % limit > 0) iterations++
    return iterations
  }

  /******************************************************************************
   * Public functions
   */
  return {

    postBusinessProcesses: async function (neededBusinessProcesses, top = 100) {
      try {
        const businessProcessCount = await _getBusinessProcessCount()
        const iterations = _calculateIterations(businessProcessCount, top)

        const iterationResults = []
        for (let i = 1; i <= iterations; i++) {
          iterationResults.push({ top: top, skip: (i - 1) * top })
        }

        const resultArraysPromise = iterationResults.map(businessProcesses => {
          return _getbusinessProcesses(businessProcesses['top'], businessProcesses['skip'])
        })
        const resultArraysResult = await Promise.all(resultArraysPromise)

        let existingBusinessProcesses = []
        resultArraysResult.map((array) => {
          existingBusinessProcesses = existingBusinessProcesses.concat(array)
        })

        const businessProcesses = neededBusinessProcesses.map(neededBusinessProcess => {
          let matchingBusinessProcess = existingBusinessProcesses.find(existingBusinessProcess => existingBusinessProcess.name === neededBusinessProcess)
          if (!matchingBusinessProcess) matchingBusinessProcess = neededBusinessProcess

          return matchingBusinessProcess
        })

        const complementedPromise = businessProcesses.filter((businessProcess) => businessProcess.id === undefined).map(async (businessProcess) => {
          let complementedBusinessProcess = await _createBusinessProcess(businessProcess)

          return complementedBusinessProcess
        })
        const complementedPromiseResult = await Promise.all(complementedPromise)

        complementedPromiseResult.map(created => {
          businessProcesses[businessProcesses.indexOf(created['name'])] = created
        })

        return businessProcesses
      } catch (error) {
        throw new Error(error)
      }
    },

    postSolutionProcesses: async function (solutionProcesses) {
      try {
        const solutionProcessesPromise = solutionProcesses.map(async solutionProcess => {
          const result = await _findSolutionProcessByExternalId(solutionProcess.externalId)
          if (!result) {
            solutionProcess._ACTION = 'CREATE'
          } else {
            if (result.length <= 2) {
              result.find(process => {
                if (process.status === 'DRAFT') {
                  solutionProcess.id = process.id
                  solutionProcess._ACTION = 'PATCH'
                }
                else {
                  solutionProcess.id = process.id
                  solutionProcess._ACTION = 'PATCH'
                }
              })
            } else {
              throw new error('External ID doesn\'t seem unique in your SAP Cloud ALM tenant.')
            }
          }
          return solutionProcess
        })
        const SolutionProcessesPromiseResult = await Promise.all(solutionProcessesPromise)

        const solutionProcessesCreate = SolutionProcessesPromiseResult.filter(solutionProcess => solutionProcess._ACTION === 'CREATE')
        const solutionProcessesCreatePromise = solutionProcessesCreate.map(solutionProcess => {
          delete solutionProcess._ACTION
          const result = _createSolutionProcess(solutionProcess)
          return result
        })
        const solutionProcessesCreatePromiseResult = await Promise.all(solutionProcessesCreatePromise)

        const solutionProcessesPatch = SolutionProcessesPromiseResult.filter(solutionProcess => solutionProcess._ACTION === 'PATCH')
        const solutionProcessesPatchPromise = solutionProcessesPatch.map(solutionProcess => {
          let body = JSON.parse(JSON.stringify(solutionProcess))
          delete body._ACTION
          delete body.id
          const result = _patchSolutionProcess(solutionProcess.id, body)
          return result
        })
        const solutionProcessesPatchPromiseResult = await Promise.all(solutionProcessesPatchPromise)

        const result = [...solutionProcessesCreatePromiseResult, ...solutionProcessesPatchPromiseResult]
        return result
      } catch (error) {
        throw new Error(error);
      }
    },

    postAccelerators: async function (accelerators) {
      const acceleratorPromise = accelerators.map(async accelerator => {
        try {
          const body = JSON.parse(JSON.stringify(accelerator))
          delete body.solutionProcess
          const asset = await _createAccelerator(accelerator.solutionProcess, body)
          return asset
        } catch (error) {
          throw new Error(error);
        }
      });
      const acceleratorPromiseResult = await Promise.all(acceleratorPromise)
      return acceleratorPromiseResult
    },

    findSolutionProcessFlowsBySolutionProcesses: async function (solutionProcesses, top = 100) {
      try {
        const solutionProcessFlowCount = await _getSolutionProcessFlowCount()
        const iterations = _calculateIterations(solutionProcessFlowCount, top)

        const iterationsArray = []
        for (let i = 1; i <= iterations; i++) {
          iterationsArray.push({ top: top, skip: (i - 1) * top })
        }

        const solutionProcessFlowPromise = iterationsArray.map(iteration => {
          return _getSolutionProcessFlows(iteration.top, iteration.skip)
        })

        const solutionProcessFlowPromiseResult = await Promise.all(solutionProcessFlowPromise)
        let mergedSolutionProcessFlows = []
        solutionProcessFlowPromiseResult.map(array => mergedSolutionProcessFlows.push(...array))

        solutionProcesses.map(solutionProcess => {
          mergedSolutionProcessFlows.find(solutionProcessFlow => {
            if (solutionProcess.id === solutionProcessFlow.solutionProcess.id) {
              solutionProcess.solutionProcessFlow = solutionProcessFlow
              return solutionProcess
            }
          })
        })
        return solutionProcesses
      } catch (error) {
        throw new Error(error);
      }
    },

    postSolutionValueFlows: async function (solutionValueFlowDiagrams, solutionProcesses) {
      try {
        const solutionValueFlowDiagramPromise = solutionValueFlowDiagrams.map(async diagram => {
          const solutionProcessFound = solutionProcesses.find(solutionProcess => solutionProcess.externalId === diagram.parentId)
          delete diagram.parentId
          const result = await _patchSolutionProcessValueFlowDiagram(solutionProcessFound.id, diagram)
          return result
        })
        const solutionValueFlowDiagramPromiseResult = Promise.all(solutionValueFlowDiagramPromise)
        return solutionValueFlowDiagramPromiseResult
      } catch (error) {
        throw new Error(error);
      }
    },

    postSolutionProcessFlowDiagrams: async function (solutionProcessFlowDiagrams, solutionProcessFlows) {
      const solutionProcessFlowDiagramsPromise = solutionProcessFlowDiagrams.map(async diagram => {
        const solutionProcess = solutionProcessFlows.find(solutionProcessFlow => diagram.parentId === solutionProcessFlow.externalId)
        delete diagram.parentId
        let solutionProcessFlowDiagram = null
        if(diagram.bpmn){
          delete diagram.svg
          solutionProcessFlowDiagram = await _createSolutionProcessFlowBPMNDiagram(solutionProcess.solutionProcessFlow.id, diagram)
        }else{
          delete diagram.bpmn
          solutionProcessFlowDiagram = await _createSolutionProcessFlowSVGDiagram(solutionProcess.solutionProcessFlow.id, diagram)
        }
        return solutionProcessFlowDiagram
      })
      const solutionProcessFlowDiagramsPromiseResult = Promise.all(solutionProcessFlowDiagramsPromise)
      return solutionProcessFlowDiagramsPromiseResult
    },

    activateSolutionProcesses: async function (solutionProcesses) {
      try {
        const solutionProcessesActivationPromise = solutionProcesses.map(async solutionProcess => {
          const activation = await _activateSolutionProcess(solutionProcess.id)
          return activation
        })
        const solutionProcessActivationPromiseResult = Promise.all(solutionProcessesActivationPromise)
        return solutionProcessActivationPromiseResult
      } catch (error) {
        throw new error
      }
    },
  } // return
}