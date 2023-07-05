'use strict'

/*******************************************************************************
 * User Interface Module
 *******************************************************************************/
import clear from 'clear'
import chalk from 'chalk'
import figlet from 'figlet'
import inquirer from 'inquirer'
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt'

export default function UserInterface() {

    return {
        welcomeScreen: function() {
            clear()
            console.log()
            console.log(
                chalk.yellow(
                    figlet.textSync('Process Upload', {
                        horizontalLayout: 'full',
                    })
                )
            )
            console.log(
                chalk.yellow(' Upload Excel to SAP Cloud ALM')
            )
            console.log()        
        },

        getExcelFileDialog: async function () {
            inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection)
            let confirmed = false
            let file = undefined
        
            do {
                const answer = await inquirer.prompt([
                    {
                        type: 'file-tree-selection',
                        root: './input',
                        name: 'file',
                    },
                ])
        
                const confirmation = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirmed',
                        message: `Are you sure you want to import this file? ${answer['file']}`,
                        default: false,
                    },
                ])
        
                if (confirmation['confirmed']) {
                    confirmed = true
                    file = answer['file']
                }
            } while (!confirmed)
            return file
        }
    }
}