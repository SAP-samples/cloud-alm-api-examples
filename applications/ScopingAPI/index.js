"use strict";
// ----------------------------------------------------------------------------
// For CONSOLE and SPAGHETTI CODE Lovers
// ----------------------------------------------------------------------------

import winston from 'winston';
import chalk from 'chalk';
import clear from 'clear';
import inquirer from 'inquirer';
import searchcheckbox from 'inquirer-search-checkbox';
import figlet from 'figlet';
import axios from 'axios';
import oauth from 'axios-oauth-client';
import tokenProvider from 'axios-token-interceptor';
import {
  performance,
  PerformanceObserver
} from 'perf_hooks';

// Credentials and URLs
import secret from './secret.js';

// Logger and Observer --------------------------------------------------------

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: './log/log.json',
    }),
  ],
});

const performanceObserver = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    logger.log({
      level: 'info',
      message: JSON.stringify(entry)
    });
  });
});

performanceObserver.observe({
  entryTypes: ['measure'],
  buffer: true
});

// Authenticate ---------------------------------------------------------------

let getClientCredentials = oauth.client(axios.create({
  baseURL: secret.authenticationUrl
}), {
  url: '/oauth/token',
  grant_type: 'client_credentials',
  client_id: secret.clientId,
  client_secret: secret.clientSecret
});

let instance = axios.create({
  baseURL: secret.apiBaseUrl
});

// We don't need to take care about authenticating furthermore; Interceptor ensures that we always have a valid Bearer
instance.interceptors.request.use(
  oauth.interceptor(tokenProvider, getClientCredentials)
);

// selectProject --------------------------------------------------------------

let selectProject = async () => {
  let url = '/api/calm-projects/v1/projects';
  let projects = undefined;

  try {
    performance.mark('get-projects-start');
    projects = await instance.get(url);
  } catch (error) {
    logger.log({
      level: 'error',
      message: error.message
    });
    console.log(chalk.red('Failed.'));
    process.exit(0);
  } finally {
    performance.mark('get-projects-end');
    performance.measure(url, 'get-projects-start', 'get-projects-end');
  }

  let projectChoices = {
    type: 'rawlist',
    name: 'project',
    message: 'What project?',
    choices: []
  };

  let _sortByName = (a, b) => {
    const value1 = a.name.toUpperCase();
    const value2 = b.name.toUpperCase();

    let comparison = 0;
    if (value1 > value2) {
      comparison = 1;
    } else if (value1 < value2) {
      comparison = -1;
    }
    return comparison;
  }

  projectChoices.choices = projects.data.map(project => {
    return {
      name: project.name,
      value: project.id
    }
  }).sort(_sortByName);

  let answer = await inquirer.prompt(projectChoices);
  projectActions(answer.project);
}

let projectActions = async (project) => {
  let projectChoices = {
    type: 'rawlist',
    name: 'action',
    message: 'What project?',
    choices: [{
        name: 'Select and manage an existing scopes',
        value: 'SELECTSCOPE'
      }, {
        name: 'Create new scope',
        value: 'NEWSCOPE'
      },
      new inquirer.Separator(),
      {
        name: 'Back',
        value: 'BACK'
      }
    ]
  };

  let answer = await inquirer.prompt(projectChoices);

  switch (answer.action) {
    case 'SELECTSCOPE':
      selectScope(project);
      break;
    case 'NEWSCOPE':
      newScope(project);
      break;
    case 'BACK':
    default:
      selectProject();
      break;
  }
}

// newScope -------------------------------------------------------------------

let newScope = async (project) => {
  let scopeData = [{
      type: 'input',
      name: 'scopeName',
      message: 'Scope name',
    },
    {
      type: 'editor',
      name: 'scopeDescription',
      message: 'Scope description',
    }
  ];

  let answers = await inquirer.prompt(scopeData);

  let url = '/api/calm-processmanagement/v1/scopes';

  try {
    performance.mark('post-scope-start');
    await instance.post(url, {
      'projectId': project,
      'name': answers.scopeName,
      'description': answers.scopeDescription
    });
  } catch (error) {
    logger.log({
      level: 'error',
      message: error.message
    });
    console.log(chalk.red('Failed.'));
  } finally {
    performance.mark('post-scope-end');
    performance.measure(url, 'post-scope-start', 'post-scope-end');
    projectActions(project);
  }
}

// selectScope ----------------------------------------------------------------

let selectScope = async (project) => {
  let url = `/api/calm-processmanagement/v1/scopes?projectId=${project}`;
  let scopes = undefined;

  try {
    performance.mark('get-scopesByProject-start');
    scopes = await instance.get(url);
  } catch (error) {
    logger.log({
      level: 'error',
      message: error.message
    });
    console.log(chalk.red('Failed.'));
    projectActions(project)
  } finally {
    performance.mark('get-scopesByProject-end');
    performance.measure(url, 'get-scopesByProject-start', 'get-scopesByProject-end');
  }

  let scopeChoices = {
    type: 'rawlist',
    name: 'scope',
    message: 'What scope?',
    choices: []
  };

  let _sortByName = (a, b) => {
    const value1 = a.name.toUpperCase();
    const value2 = b.name.toUpperCase();

    let comparison = 0;
    if (value1 > value2) {
      comparison = 1;
    } else if (value1 < value2) {
      comparison = -1;
    }
    return comparison;
  }

  scopeChoices.choices = scopes.data.value.map(scope => {
    return {
      name: scope.name,
      value: scope.id
    }
  }).sort(_sortByName);

  scopeChoices.choices.push(new inquirer.Separator());
  scopeChoices.choices.push({
    name: 'Back',
    value: 'BACK'
  });

  let answer = await inquirer.prompt(scopeChoices);

  if (answer.scope === "'BACK") {
    projectActions(project);
  } else {
    scopeActions(project, answer.scope);
  }
}

// scopeActions ---------------------------------------------------------------

let scopeActions = async (project, scope) => {
  let scopeChoices = {
    type: 'rawlist',
    name: 'action',
    message: 'What do you want to do now?',
    choices: [{
        name: 'Change name / description',
        value: 'CHANGESCOPE'
      }, {
        name: 'Delete',
        value: 'DELETESCOPE'
      }, {
        name: 'List assigned Solution Scenarios',
        value: 'ASSINGED_SOLUTIONSCENARIOS'
      }, {
        name: 'Add new Solution Scenario',
        value: 'ADD_SOLUTIONSCENARIOS'
      }, {
        name: 'List scoped Solution Processes',
        value: 'LISTSOLUTIONPROCESSES'
      }, {
        name: 'Add Solution Processes',
        value: 'SCOPESOLUTIONPROCESSES'
      },
      new inquirer.Separator(),
      {
        name: 'Back',
        value: 'BACK'
      }
    ]
  };

  let answer = await inquirer.prompt(scopeChoices);

  switch (answer.action) {
    case 'CHANGESCOPE':
      changeScope(project, scope);
      break;
    case 'DELETESCOPE':
      deleteScope(project, scope);
      break;
    case 'ASSINGED_SOLUTIONSCENARIOS':
      listSolutionScenariosByScope(project, scope);
      break;
    case 'ADD_SOLUTIONSCENARIOS':
      addSolutionScenariosToScope(project, scope);
      break;
    case 'LISTSOLUTIONPROCESSES':
      listSolutionProcesses(project, scope);
      break;
    case 'SCOPESOLUTIONPROCESSES':
      scopeSolutionProcess(project, scope);
      break;
    default:
      selectScope(project);
      break;
  }
}

// deleteScope ----------------------------------------------------------------

let deleteScope = async (project, scope) => {
  let answer = await inquirer.prompt({
    type: 'confirm',
    name: 'delete',
    message: 'Are you sure?',
    default: false,
  });

  if (!!answer.delete) {
    let url = `/api/calm-processmanagement/v1/scopes/${scope}`;
    try {
      performance.mark(`delete-scope-start`);
      await instance.delete(url);
    } catch (error) {
      logger.log({
        level: 'error',
        message: error.message
      });
      console.log(chalk.red('Failed.'));
    } finally {
      performance.mark(`delete-scope-end`);
      performance.measure(url, `delete-scope-start`, `delete-scope-end`);
      projectActions(project);
    }
  } else {
    scopeActions(project, scope);
  }
}

let changeScope = async (project, scope) => {
  let url = `/api/calm-processmanagement/v1/scopes/${scope}`;
  let myScope = undefined;

  try {
    performance.mark('get-scope-start');
    myScope = await instance.get(url);
  } catch (error) {
    logger.log({
      level: 'error',
      message: error.message
    });
    console.log(chalk.red('Failed.'));
    scopeActions(project, scope);
  } finally {
    performance.mark('get-scope-end');
    performance.measure(url, 'get-scope-start', 'get-scope-end');
  }

  let scopeData = [{
      type: 'input',
      name: 'scopeName',
      message: 'Scope name',
      default () {
        return myScope.data.name
      }
    },
    {
      type: 'editor',
      name: 'scopeDescription',
      message: 'Scope description',
      default () {
        return myScope.data.description
      }
    }
  ];

  let answer = await inquirer.prompt(scopeData);
  let patchUrl = `/api/calm-processmanagement/v1/scopes/${scope}`;

  try {
    performance.mark('patch-scope-start');
    await instance.patch(patchUrl, {
      'name': answer.scopeName,
      'description': answer.scopeDescription
    }, {
      headers: {
        'Content-Type': 'application/merge-patch+json'
      }
    });
  } catch (error) {
    logger.log({
      level: 'error',
      message: error.message
    });
    console.log(chalk.red('Failed.'));
  } finally {
    performance.mark('patch-scope-end');
    performance.measure(patchUrl, 'patch-scope-start', 'patch-scope-end');
    scopeActions(project, scope);
  }
}

// listSolutionScenariosByScope -----------------------------------------------

let listSolutionScenariosByScope = async (project, scope) => {
  let url = `/api/calm-processmanagement/v1/scopes/${scope}/solutionScenarioVersions`;
  let scenarios = undefined;

  try {
    performance.mark('get-SolutionScenarioVersionsForScope-start');
    scenarios = await instance.get(url);
  } catch (error) {
    logger.log({
      level: 'error',
      message: error.message
    });
    console.log(chalk.red('Failed.'));
    scopeActions(project, scope);
  } finally {
    performance.mark('get-SolutionScenarioVersionsForScope-end');
    performance.measure(url, 'get-SolutionScenarioVersionsForScope-start', 'get-SolutionScenarioVersionsForScope-end');
  }

  let _sortByName = (a, b) => {
    const value1 = a.Name.toUpperCase();
    const value2 = b.Name.toUpperCase();

    let comparison = 0;
    if (value1 > value2) {
      comparison = 1;
    } else if (value1 < value2) {
      comparison = -1;
    }
    return comparison;
  }

  let tableData = scenarios.data.value.map(scenario => {
    return {
      Name: scenario.name,
      Version: scenario.version,
      SolutionScenarioId: scenario.solutionScenarioId
    };
  }).sort(_sortByName);

  console.table(tableData);
  scopeActions(project, scope);
}

// addSolutionScenariosToScope ------------------------------------------------

let addSolutionScenariosToScope = async (project, scope) => {
  let urlScv = '/api/calm-processmanagement/v1/solutionScenarioVersions';
  let solutionScenarios = undefined;

  try {
    performance.mark('get-allSolutionScenarioVersions-start');
    solutionScenarios = await instance.get(urlScv);

  } catch (error) {
    logger.log({
      level: 'error',
      message: error.message
    });
    console.log(chalk.red('Failed.'));
    scopeActions(project, scope);
  } finally {
    performance.mark('get-allSolutionScenarioVersions-end');
    performance.measure(urlScv, 'get-allSolutionScenarioVersions-start', 'get-allSolutionScenarioVersions-end');
  }

  let solutionScenarioChoices = {
    type: 'checkbox',
    name: 'solutionscenarios',
    message: 'What solution scenarios?',
    choices: []
  };

  let _sortByName = (a, b) => {
    const value1 = a.name.toUpperCase();
    const value2 = b.name.toUpperCase();

    let comparison = 0;
    if (value1 > value2) {
      comparison = 1;
    } else if (value1 < value2) {
      comparison = -1;
    }
    return comparison;
  }

  solutionScenarioChoices.choices = solutionScenarios.data.value.map(scenario => {
    return {
      name: `${scenario.name} (${scenario.version})`,
      value: {
        id: scenario.id,
        solutionScenarioId: scenario.solutionScenarioId,
        version: scenario.version,
        versionSequence: scenario.versionSequence
      }
    };
  }).sort(_sortByName);

  let urlSc = `/api/calm-processmanagement/v1/scopes/${scope}/solutionScenarioVersions`;
  let setSolutionScenarios = undefined;

  try {
    performance.mark('get-SolutionScenarioVersionForScope-start');
    setSolutionScenarios = await instance.get(urlSc);
  } catch (error) {
    logger.log({
      level: 'error',
      message: error.message
    });
    console.log(chalk.red('Failed.'));
    scopeActions(project, scope);
  } finally {
    performance.mark('get-SolutionScenarioVersionForScope-end');
    performance.measure(urlSc, 'get-SolutionScenarioVersionForScope-start', 'get-SolutionScenarioVersionForScope-end');
  }

  setSolutionScenarios.data.value.forEach(setScenario => {
    solutionScenarioChoices.choices.forEach(choice => {
      if (setScenario.solutionScenarioId == choice.value.solutionScenarioId) {
        choice.disabled = true;
      }
    });
  });

  let answer = await inquirer.prompt(solutionScenarioChoices);

  if (answer.solutionscenarios.length > 0) {
    let newScenarios = {
      'value': []
    };

    answer.solutionscenarios.forEach(scenario => {
      newScenarios.value.push({
        'id': scenario.id
      });
    });

    let url = `/api/calm-processmanagement/v1/scopes/${scope}/solutionScenarioVersions`;

    try {
      performance.mark('post-solutionScenarios-start');
      await instance.post(url, newScenarios);
    } catch (error) {
      logger.log({
        level: 'error',
        message: error.message
      });
      console.log(chalk.red('Failed.'));
    } finally {
      performance.mark('post-solutionScenarios-end');
      performance.measure(url, 'post-solutionScenarios-start', 'post-solutionScenarios-end');
      scopeActions(project, scope);
    }
  } else {
    console.log(chalk.green('Nothing to do.'));
    scopeActions(project, scope);
  }
}

// _fetchSolutionProcesses ----------------------------------------------------
/* 
  Larger bulk sizes seem less effective than smaller bulk sizes. This function fetches the overall count of Solution Processes and splits them into smaller calls (based on given bulk size).
  The individual calls are executed asynchronously and in parallel. After all calls returned, the function returns an array of result sets. 
*/
let _fetchSolutionProcesses = async (project, scope) => {
  let bulkSize = 50;
  let count;
  let iterations = 0;

  let countUrl = `/api/calm-processmanagement/v1/solutionProcesses/$count?projectId=${project}&scopeId=${scope}`;

  try {
    performance.mark('get-solutionProcesses-start-count');
    count = await instance.get(countUrl);
  } catch (error) {
    logger.log({
      level: 'error',
      message: error.message
    });
    console.log(chalk.red('Failed.'));
    scopeActions(project, scope);
  } finally {
    performance.mark('get-solutionProcesses-end-count');
    performance.measure(countUrl, 'get-solutionProcesses-start-count', 'get-solutionProcesses-end-count');
  }

  iterations = Math.floor(count.data / bulkSize);
  iterations = count.data % bulkSize > 0 ? iterations + 1 : iterations;

  let fetchUrls = [];
  for (let i = 0; i < iterations; i++) {
    let url = `/api/calm-processmanagement/v1/solutionProcesses?projectId=${project}&scopeId=${scope}&$top=${bulkSize}&$skip=${i * bulkSize}`;
    fetchUrls.push(url);
  }

  let fetch = fetchUrls.map(async url => {
    try {
      performance.mark('get-solutionProcesses-start');
      let response = await instance.get(url);
      return response.data.value;
    } catch (error) {
      logger.log({
        level: 'error',
        message: error.message
      });
      console.log('Failed.');
    } finally {
      performance.mark('get-solutionProcesses-end');
      performance.measure(url, 'get-solutionProcesses-start', 'get-solutionProcesses-end');
    }
  });

  let result = await Promise.all(fetch);
  let mergedResult = [];
  result.map(processes => {
    mergedResult = mergedResult.concat(processes);
  });
  return mergedResult;
}

// listSolutionProcesses ------------------------------------------------------

let listSolutionProcesses = async (project, scope) => {
  let tableData = [];
  let solutionProcesses = undefined;

  performance.mark('listSolutionProcesses-fetchAll-start');
  solutionProcesses = await _fetchSolutionProcesses(project, scope);
  performance.mark('listSolutionProcesses-fetchAll-end');
  performance.measure('listSolutionProcesses-fetchAll', 'listSolutionProcesses-fetchAll-start', 'listSolutionProcesses-fetchAll-end');

  solutionProcesses.filter(solutionProcess => !!solutionProcess.isScoped).forEach(solutionProcess => {
    let processData = {
      Name: solutionProcess.solutionProcessVersionName,
      Status: solutionProcess.statusName,
      Country_Region: solutionProcess.countries
    };
    tableData.push(processData);
  });

  let _sortByName = (a, b) => {
    const value1 = a.Name.toUpperCase();
    const value2 = b.Name.toUpperCase();

    let comparison = 0;
    if (value1 > value2) {
      comparison = 1;
    } else if (value1 < value2) {
      comparison = -1;
    }
    return comparison;
  }

  tableData.sort(_sortByName)

  console.table(tableData);
  scopeActions(project, scope);
}

// scopeSolutionProcess -------------------------------------------------------

let scopeSolutionProcess = async (project, scope) => {
  let solutionProcesses = undefined;

  performance.mark('scopeSolutionProcesses-fetchAll-start');
  solutionProcesses = await _fetchSolutionProcesses(project, scope);
  performance.mark('scopeSolutionProcesses-fetchAll-end');
  performance.measure('scopeSolutionProcesses-fetchAll', 'scopeSolutionProcesses-fetchAll-start', 'scopeSolutionProcesses-fetchAll-end');

  let solutionProcessChoices = [];
  solutionProcesses.forEach(solutionProcess => {
    let choice = {
      name: `${solutionProcess.solutionProcessVersionName} (${solutionProcess.countries.toString()})`,
      checked: !!solutionProcess.isScoped,
      value: {
        scopeId: scope,
        solutionScenarioVersionId: solutionProcess.solutionScenarioVersionId,
        solutionProcessVersionId: solutionProcess.solutionProcessVersionId,
        // if you don't send status, it will set new process to 'DESIGN' and preserves the status for all other.
        // statusId: 'DESIGN',
        isScoped: true
      }
    };
    solutionProcessChoices.push(choice);
  });

  let _sortByName = (a, b) => {
    const value1 = a.name.toUpperCase();
    const value2 = b.name.toUpperCase();

    let comparison = 0;
    if (value1 > value2) {
      comparison = 1;
    } else if (value1 < value2) {
      comparison = -1;
    }
    return comparison;
  }
  solutionProcessChoices.sort(_sortByName);

  inquirer.registerPrompt('search-checkbox', searchcheckbox);

  let answer = await inquirer.prompt([{
    type: 'search-checkbox',
    message: 'Scope processes',
    name: 'processes',
    choices: solutionProcessChoices
  }]);

  let processScopeUpdates = {
    value: answer.processes
  };

  let patchUrl = '/api/calm-processmanagement/v1/solutionProcesses/scopeAssignments';
  // Recommended bulk size for optimal performance
  let bulkSize = 50;
  let bulks = [];
  let iterations = 0;

  iterations = Math.floor(processScopeUpdates.value.length / bulkSize);
  iterations = processScopeUpdates.value.length % bulkSize > 0 ? iterations + 1 : iterations;

  for (let i = 1; i <= iterations; i++) {
    let bulk = {
      value: processScopeUpdates.value.splice(0, bulkSize)
    };
    bulks.push(bulk);
  }

  let updates = bulks.map(async bulk => {
    try {
      performance.mark('patch-scopeAssignments-start');
      await instance.patch(patchUrl, bulk, {
        headers: {
          'Content-Type': 'application/merge-patch+json'
        }
      });
    } catch (error) {
      logger.log({
        level: 'error',
        message: error.message
      });
      console.log(chalk.red('Failed.'));
    } finally {
      performance.mark('patch-scopeAssignments-end');
      performance.measure(patchUrl, 'patch-scopeAssignments-start', 'patch-scopeAssignments-end');
    }
  });

  await Promise.all(updates);
  scopeActions(project, scope);
}

// MAIN -----------------------------------------------------------------------

let main = () => {
  clear();
  console.log();
  console.log(
    chalk.yellow(
      figlet.textSync('Scoping API', {
        horizontalLayout: 'full'
      })
    )
  );
  console.log();
  console.log(chalk.yellow(' for Console and Spaghetti Code Lovers.'));
  console.log();
  selectProject();
}

main();