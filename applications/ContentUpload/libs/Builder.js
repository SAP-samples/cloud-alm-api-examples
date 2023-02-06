'use strict';
/*******************************************************************************
 * Builder Utility
 * Module to read / check Exel and transform data
 *******************************************************************************/
import reader from 'xlsx';
import loadsh from 'lodash';
import Path from 'path';
import CountryMaster from '../codelists/countries.js'

export default function Builder() {
    const requiredSolutionProcessesColumns = ['ID', 'Name', 'BusinessProcess', 'Description', 'Localization', 'Overwrite'];
    const requiredAcceleratorsColumns = ['SolutionProcessID', 'Name', 'Language', 'Host', 'Path', 'Overwrite'];
    /******************************************************************************
     * Private functions
     */

    function _hasRequriedColumns(obj, columns) {
        return columns.every(column => Object.keys(obj).includes(column));
    };

    function _hasDuplicates(arr, key) {
        const uniqueElements = new Set();
        arr.map(el => {
            uniqueElements.add(el[key]);
        });

        const duplicates = arr.filter(el => {
            if (uniqueElements.has(el[key])) {
                uniqueElements.delete(el[key]);
            } else {
                return el
            }
        });
        return duplicates;
    };

    function _isSubset(parentArray, parentKey, subsetArray, subsetKey) {
        const parentArraySet = new Set();
        parentArray.map(el => {
            parentArraySet.add(el[parentKey]);
        });

        const subsetArraySet = new Set();
        subsetArray.map(el => {
            subsetArraySet.add(el[subsetKey]);
        });

        return [...subsetArraySet].every((el) => {
            return [...parentArraySet].includes(el)
        });
    }

    function _hasValidCountries(arr, key) {
        const masterCountries = new Set();
        CountryMaster.map(element => {
            masterCountries.add(element['ID']);
        });

        const usedCountries = new Set();
        arr.map(element => {
            const extractedCountries = element[key].split(",").map(country => country.trim());
            extractedCountries.map(country => usedCountries.add(country));
        });

        return [...usedCountries].every((el) => {
            return [...masterCountries].includes(el)
        });
    }

    function _hasExactlyOneCountry(arr, key) {
        let result = true;
        arr.map(element => {
            const extractedCountries = element[key].split(",").map(country => country.trim());
            if (extractedCountries.length != 1) result = false;
        });
        return result;
    }

    /******************************************************************************
     * Public functions
     */

    return {
        extractExcelContent: function (file) {
            try {
                let result = new Object();
                const excel = reader.readFile(file);

                result['SolutionProcesses'] = reader.utils.sheet_to_json(
                    excel.Sheets['Solution Processes']
                );

                result['Accelerators'] = reader.utils.sheet_to_json(
                    excel.Sheets['Accelerators']
                );

                if (!result['SolutionProcesses'].length || !result['Accelerators'].length) {
                    throw new Error('Either (1) no Excel document or (2) Excel does not contain sheets named "Solution Processes" and/or "Accelerators" or empty');
                }

                if (result['SolutionProcesses'].length < 1) {
                    throw new Error('Could not find Solution Processes in the Excel sheet.');
                }

                if (!_hasRequriedColumns(result['SolutionProcesses'][0], requiredSolutionProcessesColumns)) {
                    throw new Error('Could not find one of the following columns "ID", "Name", "Business Process", "Description", "Localization", "Overwrite" in sheet "Solution Processes".');
                }

                if (!_hasRequriedColumns(result['Accelerators'][0], requiredAcceleratorsColumns)) {
                    throw new Error('Could not find one of the following columns "SolutionProcessID", "Name", "Language", "Host", "Path" in sheet "Accelerators".');
                }

                if (_hasDuplicates(result['SolutionProcesses'], 'ID').length > 0) {
                    throw new Error('Solution Processes has duplicates.');
                }

                if (!_isSubset(result['SolutionProcesses'], 'ID', result['Accelerators'], 'SolutionProcessID')) {
                    throw new Error('Accelerators reference not existing Solution Processes.');
                }

                if (!_hasValidCountries(result['SolutionProcesses'], 'Localization')) {
                    throw new Error('Solution Processes contains invalid Countries/Regions.');
                }

                if (!_hasValidCountries(result['Accelerators'], 'Language')) {
                    throw new Error('Accelerators contains invalid Languages.');
                }

                if (!_hasExactlyOneCountry(result['Accelerators'], 'Language')) {
                    throw new Error('Accelerators has malformed or too many languages. One Accelerator must have exactly one language.');
                }

                return result;
            } catch (error) {
                throw new Error(error);
            }
        },

        buildBusinessProcessList: function (rawSolutionProcesses) {
            try {
                const businessProcessSet = new Set();
                rawSolutionProcesses.map((solutionProcess) => {
                    businessProcessSet.add(solutionProcess['BusinessProcess']);
                });
                const businessProcessArray = [...businessProcessSet];
                if (businessProcessArray.length < 1) {
                    throw new Error('Could not find Business Processes in Excel.');
                } else {
                    return businessProcessArray
                }
            } catch (error) {
                throw new Error(error);
            }
        },

        buildSolutionProcessList: function (rawSolutionProcesses, businessProcesses) {
            const solutionProcesses = [];
            rawSolutionProcesses.map((solutionProcess) => {
                const description = solutionProcess['Description'].length >= 5000 ? solutionProcess['Description'].substring(0, 4999) : solutionProcess['Description'];
                const sp = {
                    name: `${solutionProcess['Name']} (${solutionProcess['ID']})`,
                    description: description,
                    businessProcess: businessProcesses.find((bp) => {
                        solutionProcess['BusinessProcess'] === bp['name'];
                        return bp;
                    }),
                    countries: solutionProcess['Localization'],
                    externalId: solutionProcess['ID'],
                };
                delete sp['businessProcess']['name'];
                delete sp['businessProcess']['description'];
                solutionProcesses.push(sp);
            });

            return solutionProcesses;
        },

        buildAcceleratorList: function (rawAccelerators, solutionProcessUploadResult) {
            const accelerators = [];

            const groupedByProcessId = loadsh.groupBy(rawAccelerators, 'SolutionProcessID');
            for (const process in groupedByProcessId) {
                const solutionProcess = solutionProcessUploadResult.find(
                    (sp) => process === sp['externalId']
                );

                const groupedByName = loadsh.groupBy(groupedByProcessId[process], 'Name');
                for (const name in groupedByName) {
                    const accelerator = {
                        name: name,
                        countryUrl: [],
                        solutionProcess: solutionProcess['id'],
                    };
                    groupedByName[name].map((link) => {
                        const url = {
                            url: Path.join(link['Host'], link['Path']),
                            country: link['Language']
                        }
                        accelerator['countryUrl'].push(url);
                    });
                    accelerators.push(accelerator);
                }
            }

            return accelerators;
        }
    }
}