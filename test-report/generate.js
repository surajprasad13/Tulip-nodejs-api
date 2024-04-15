const reporter = require('cucumber-html-reporter');

const options = {
    theme: 'bootstrap',
    jsonFile: 'test-report/cucumber_report.json',
    output: 'test-report/cucumber_report.html',
    reportSuiteAsScenarios: true,
    scenarioTimestamp: true,
    launchReport: true,
};

reporter.generate(options);