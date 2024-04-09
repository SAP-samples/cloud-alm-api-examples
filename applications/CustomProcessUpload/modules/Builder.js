'use strict'

/*******************************************************************************
 * Builder Utility
 *******************************************************************************/

import { read, utils } from "xlsx";
import Path from 'path'
import { fileURLToPath } from 'url'
import loadsh from 'loadsh'
import CountryMaster from '../codelists/countries.js'
import { readFileSync } from 'node:fs'

export default function Builder() {
    const requiredColumnsCustomerSheet = ['Property', 'Value']
    const requiredRowsCustomerSheet = ['Customer', 'SAP Cloud ALM Tenant URL', 'SAP Cloud ALM Authorization URL', 'Client ID', 'Client Secret']
    const requiredColumnsDiagramSheet = ['Solution Process ID', 'Type', 'Diagram Name', 'SVG']
    const requiredColumnsSolutionProcessSheet = ['External ID', 'Name', 'Business Process', 'Description', 'Localization']
    const requiredColumnsAccelerators = ['Solution Process ID', 'Name', 'Language', 'Host', 'Path']

    function _hasRequriedColumns(obj, columns) {
        return columns.every(column => Object.keys(obj).includes(column))
    }

    /**
     * TODO: Implement Row check for customer
     */
    function _hasRequiredRows() { }

    function _hasDuplicates(arr, key) {
        const uniqueElements = new Set()
        arr.map(el => {
            uniqueElements.add(el[key])
        })
        const duplicates = arr.filter(el => {
            if (uniqueElements.has(el[key])) {
                uniqueElements.delete(el[key])
            } else {
                return el
            }
        })
        return duplicates
    }

    function _isSubset(parentArray, parentKey, subsetArray, subsetKey) {
        const parentArraySet = new Set()
        parentArray.map(el => {
            parentArraySet.add(el[parentKey])
        })
        const subsetArraySet = new Set()
        subsetArray.map(el => {
            subsetArraySet.add(el[subsetKey])
        })
        return [...subsetArraySet].every((el) => {
            return [...parentArraySet].includes(el)
        })
    }

    function _hasValidCountries(arr, key) {
        const masterCountries = new Set()
        CountryMaster.map(element => {
            masterCountries.add(element['ID'])
        })
        const usedCountries = new Set()
        arr.map(element => {
            const extractedCountries = element[key].split(",").map(country => country.trim())
            extractedCountries.map(country => usedCountries.add(country))
        })
        return [...usedCountries].every((el) => {
            return [...masterCountries].includes(el)
        })
    }

    function _hasExactlyOneCountry(arr, key) {
        let result = true
        arr.map(element => {
            const extractedCountries = element[key].split(",").map(country => country.trim())
            if (extractedCountries.length != 1) result = false
        })
        return result
    }

    return {
        readExcelContent: function (file) {
            const result = {}
            let excel = undefined
            try {
                const buf = readFileSync(file);
                excel = read(buf);
                result.customer = utils.sheet_to_json(excel.Sheets['Customer'])
                result.solutionProcesses = utils.sheet_to_json(excel.Sheets['Solution Processes'])
                result.diagrams = utils.sheet_to_json(excel.Sheets['Diagrams'])
                result.accelerators = utils.sheet_to_json(excel.Sheets['Accelerators'])
                return result
            } catch (error) {
                throw new Error(error.message)
            }
        },

        validateExcelContent: function (excelContent) {
            try {
                if (!excelContent.customer.length || !excelContent.solutionProcesses.length || !excelContent.diagrams.length || !excelContent.accelerators.length) {
                    throw new Error('Could not find needed sheets or content.')
                }

                if (excelContent.solutionProcesses.length < 1) {
                    throw new Error('Could not find any Solution Processes in the Excel sheet.')
                }

                if (!_hasRequriedColumns(excelContent.customer[0], requiredColumnsCustomerSheet)) {
                    throw new Error('Could not find needed columns in sheet "Customer".')
                }

                if (!_hasRequriedColumns(excelContent.solutionProcesses[0], requiredColumnsSolutionProcessSheet)) {
                    throw new Error('Could not find needed columns in sheet "Solution Processes".')
                }

                if (!_hasRequriedColumns(excelContent.diagrams[0], requiredColumnsDiagramSheet)) {
                    throw new Error('Could not find needed columns in sheet "Diagrams".')
                }

                if (!_hasRequriedColumns(excelContent.accelerators[0], requiredColumnsAccelerators)) {
                    throw new Error('Could not find needed columns in sheet "Accelerators".')
                }

                if (_hasDuplicates(excelContent.solutionProcesses, 'External ID').length > 0) {
                    throw new Error('Solution Processes has duplicates.')
                }

                if (!_isSubset(excelContent.solutionProcesses, 'External ID', excelContent.diagrams, 'Solution Process ID')) {
                    throw new Error('Diagrams reference non-existing Solution Processes.')
                }

                if (!_isSubset(excelContent.solutionProcesses, 'External ID', excelContent.accelerators, 'Solution Process ID')) {
                    throw new Error('Accelerators reference non-existing Solution Processes.')
                }

                if (!_hasValidCountries(excelContent.solutionProcesses, 'Localization')) {
                    throw new Error('Solution Processes contains invalid Countries/Regions.')
                }

                if (!_hasValidCountries(excelContent.accelerators, 'Language')) {
                    throw new Error('Accelerators contains invalid Languages.')
                }

                if (!_hasExactlyOneCountry(excelContent.accelerators, 'Language')) {
                    throw new Error('Accelerators has malformed or too many languages. One Accelerator must have exactly one language.')
                }

            } catch (error) {
                throw new Error(error)
            }
        },

        getCustomerData: function (rawCustomerData) {
            const customerData = {
                customer: '',
                baseURL: '',
                authorizationURL: '',
                clientId: '',
                clientSecret: ''
            }

            rawCustomerData.map(element => {
                switch (element.Property) {
                    case 'Customer':
                        customerData.customer = element.Value
                        break
                    case 'SAP Cloud ALM Tenant URL':
                        customerData.apiBaseUrl = element.Value
                        break
                    case 'SAP Cloud ALM Authorization URL':
                        customerData.authenticationUrl = element.Value
                        break
                    case 'Client ID':
                        customerData.clientId = element.Value
                        break
                    case 'Client Secret':
                        customerData.clientSecret = element.Value
                        break
                    default:
                        break
                }
            })
            return customerData
        },

        getBusinessProcesses: function (rawSolutionProcesses) {
            const businessProcessSet = new Set()
            rawSolutionProcesses.map(solutionProcess => {
                businessProcessSet.add(solutionProcess['Business Process'])
            })
            return [...businessProcessSet]
        },

        getSolutionProcesses: function (rawSolutionProcesses, businessProcesses) {
            const solutionProcesses = []
            rawSolutionProcesses.map(solutionProcess => {
                const description = solutionProcess['Description'].length >= 5000 ? solutionProcess['Description'].substring(0, 4999) : solutionProcess['Description']
                const sp = {
                    name: `${solutionProcess['Name']} (${solutionProcess['External ID']})`,
                    description: description,
                    businessProcess: businessProcesses.find(businessProcess => {
                        solutionProcess['Business Process'] === businessProcess['name']
                        return businessProcess
                    }),
                    countries: solutionProcess['Localization'],
                    externalId: solutionProcess['External ID'],
                }
                delete sp['businessProcess']['name']
                delete sp['businessProcess']['description']
                solutionProcesses.push(sp)
            })

            return solutionProcesses
        },

        getAccelerators: function (rawAccelerators, solutionProcesses) {
            const accelerators = []
            const groupedByProcessId = loadsh.groupBy(rawAccelerators, 'Solution Process ID')
            for (const process in groupedByProcessId) {
                const solutionProcessFound = solutionProcesses.find(solution_process => solution_process.externalId === process)
                const groupedByName = loadsh.groupBy(groupedByProcessId[process], 'Name')
                for (const name in groupedByName) {
                    const accelerator = {
                        name: name,
                        countryUrl: [],
                        solutionProcess: solutionProcessFound.id,
                    }
                    groupedByName[name].map((link) => {
                        const url = {
                            url: Path.join(link.Host, link.Path),
                            country: link.Language
                        }
                        accelerator.countryUrl.push(url)
                    })
                    accelerators.push(accelerator)
                }
            }
            return accelerators
        },

        getDiagrams: function (rawDiagrams, type) {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = Path.dirname(__filename);
            const result = []
            const diagrams = rawDiagrams.filter(diagram => diagram['Type'] === type)
            diagrams.map(diagram => {
                let svgData = null
                let bpmnData = null
                try {
                    if(diagram.BPMN){
                        bpmnData = readFileSync(Path.join(__dirname, diagram.BPMN), 'utf-8')
                    }
                    if(diagram.SVG){
                        svgData = readFileSync(Path.join(__dirname, diagram.SVG), 'utf-8')
                    }      
                    result.push({
                        parentId: diagram['Solution Process ID'],
                        name: diagram['Diagram Name'],
                        svg: svgData,
                        bpmn: bpmnData
                    })
                } catch (error) {
                    throw new Error(error)
                }
            })
            return result
        }
    } // return
}
