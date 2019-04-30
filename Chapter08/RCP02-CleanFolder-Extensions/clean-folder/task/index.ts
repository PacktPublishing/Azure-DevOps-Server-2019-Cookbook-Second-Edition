import * as tl from "azure-pipelines-task-lib";
import * as del from "del";

async function main() {
    try {
        let sourceDir = tl.getInput("rootDirectory", false) || tl.getVariable("System.DefaultWorkingDirectory");
        let globPattern = tl.getDelimitedInput("globPattern", "\n");

        console.info(`Deleting contents from '${sourceDir}'`);
        console.info(`Glob pattern:`);
        console.info(`${globPattern.join("\n")}`);

        let paths = del.sync(globPattern, {
            cwd: sourceDir,
            root: sourceDir
        });

        console.info(`Deleted content:`);
        console.info(`********************`);
        console.info(`${paths.join("\n")}`);
        console.info(`********************`);
        console.info("All Done");
    }
    catch (error) {
        console.error("Error occurred", error);
        tl.error(error);
        tl.setResult(tl.TaskResult.Failed, error);
    }
}

main()
    .then(() => { })
    .catch(reason => {
        console.error(reason);
    });