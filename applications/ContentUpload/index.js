'use strict';
/*******************************************************************************
 * index.js main program to start SAP Cloud ALM content upload
 *******************************************************************************/
import Loader from './libs/Loader.js';
import Builder from './libs/Builder.js';
import UserInterface from './libs/UserInterface.js'
import clear from 'clear';
import chalk from 'chalk';
import figlet from 'figlet';
import loading from 'loading-indicator';

/******************************************************************************
 * Main program
 */

(async () => {
    const loader = new Loader();
    const builder = new Builder();
    const ui = new UserInterface();

    clear();
    console.log();
    console.log(
        chalk.yellow(
            figlet.textSync('Custom Process API', {
                horizontalLayout: 'full',
            })
        )
    );
    console.log(
        chalk.yellow(' Upload customer / partner content to SAP Cloud ALM')
    );
    console.log();

    try {
        // Select import Excel
        const file = await ui.confirmImportFile();

        // Get the Excel Content
        const excelContent = builder.extractExcelContent(file);

        // Get the business process ids, if needed create missing bps
        loading.start('Loading Business Processes...');
        const businessProcesses = builder.buildBusinessProcessList(
            excelContent.SolutionProcesses
        );

        const businessProcessUploadResult = await loader.loadBusinessProcesses(
            businessProcesses
        );

        loading.stop();
        console.log(
            `${chalk.bold.green(
                businessProcessUploadResult.length
            )} Business Processes created/found.`
        );

        // Create the solution processes
        loading.start('Loading Solution Processes...');
        const solutionProcesses = builder.buildSolutionProcessList(
            excelContent.SolutionProcesses,
            businessProcessUploadResult
        );

        const solutionProcessUploadResult = await loader.loadSolutionProcesses(
            solutionProcesses
        );

        loading.stop();
        console.log(
            `${chalk.bold.green(
                solutionProcessUploadResult.length
            )} Solution Processes created/found.`
        );

        // Create corresponding assets
        loading.start('Loading Accelerators...');
        const accelerators = builder.buildAcceleratorList(
            excelContent.Accelerators,
            solutionProcessUploadResult
        );

        const acceleratorUploadResult = await loader.loadAccelerators(
            accelerators
        );

        loading.stop();
        console.log(
            `${chalk.bold.green(
                acceleratorUploadResult.length
            )} Accelerators created/found.`
        );
        console.log('Done.');

    } catch (error) {
        console.log(chalk.red.bold(error));
    } finally {
        process.exit();
    }

})();