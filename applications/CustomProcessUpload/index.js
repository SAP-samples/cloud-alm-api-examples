'use strict';

/*******************************************************************************
 * index.js main program
 *******************************************************************************/
import UserInterface from './modules/UserInterface.js'
import Builder from './modules/Builder.js'
import CalmAdapter from './modules/CalmAdapter.js'
import { writeFileSync } from 'fs'
import loading from 'loading-indicator';

/******************************************************************************
 * Main program
 */

(async () => {

    const userInterface = new UserInterface()
    userInterface.welcomeScreen()
    const excelFile = await userInterface.getExcelFileDialog()

    const importer = loading.start('Importing...')
    const builder = new Builder()
    const excelContent = builder.readExcelContent(excelFile)

    try {
        builder.validateExcelContent(excelContent)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }

    const calmAdapter = new CalmAdapter(builder.getCustomerData(excelContent.customer))

    const businessProcesses = await calmAdapter.postBusinessProcesses(builder.getBusinessProcesses(excelContent.solutionProcesses))
    writeFileSync('./log/businessProcesses.json', JSON.stringify(businessProcesses), { encoding: 'utf8', flag: 'w' })

    const solutionProcesses = await calmAdapter.postSolutionProcesses(builder.getSolutionProcesses(excelContent.solutionProcesses, businessProcesses))
    writeFileSync('./log/solutionProcesses.json', JSON.stringify(solutionProcesses), { encoding: 'utf8', flag: 'w' })

    const accelerators = await calmAdapter.postAccelerators(builder.getAccelerators(excelContent.accelerators, solutionProcesses))
    writeFileSync('./log/accelerators.json', JSON.stringify(accelerators), { encoding: 'utf8', flag: 'w' })

    const svfDiagrams = await calmAdapter.postSolutionValueFlows(builder.getDiagrams(excelContent.diagrams, 'Solution Value Flow Diagram'), solutionProcesses)
    writeFileSync('./log/svfDiagrams.json', JSON.stringify(svfDiagrams), { encoding: 'utf8', flag: 'w' })

    const spfDiagrams = await calmAdapter.postSolutionProcessFlowDiagrams(builder.getDiagrams(excelContent.diagrams, 'Solution Process Flow Diagram'), await calmAdapter.findSolutionProcessFlowsBySolutionProcesses(solutionProcesses))
    writeFileSync('./log/spfDiagrams.json', JSON.stringify(spfDiagrams), { encoding: 'utf8', flag: 'w' })

    const activatedProcesses = await calmAdapter.activateSolutionProcesses(solutionProcesses)
    writeFileSync('./log/activation.json', JSON.stringify(activatedProcesses), { encoding: 'utf8', flag: 'w' })

    loading.stop(importer);
})()