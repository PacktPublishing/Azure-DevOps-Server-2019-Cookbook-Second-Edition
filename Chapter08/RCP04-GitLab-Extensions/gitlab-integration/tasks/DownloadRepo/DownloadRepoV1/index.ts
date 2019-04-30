import * as tl from "azure-pipelines-task-lib";
import * as url from "url";
import * as path from "path";
import { GitWrapper, IGitExecOptions } from "./gitwrapper";
import * as fse from "fs-extra";
import { GitApi } from "./gitapi";

async function main() {
    try {
        let _this = this;

        // get the task vars
        let connection = tl.getInput("connection", true);
        let endpointUrl = tl.getEndpointUrl(connection, false);
        let auth = tl.getEndpointAuthorization(connection, false);
        if (auth.scheme !== "Token") {
            throw new Error(`The authorization scheme ${auth.scheme} is not supported for GitLab endpoint`);
        }
        let token = auth.parameters["apitoken"];
        let username = tl.getEndpointDataParameter(connection, "username", false);
        let definition = tl.getInput("definition", true);
        let branch = tl.getInput("branch");
        let downloadPath = tl.getInput("downloadPath", false);
        let versionSelector = tl.getInput("versionSelector", true);
        let commitId = tl.getInput("version");
        let debugOutput = tl.getVariable("system.debug");
        debugOutput = debugOutput || "false";
        let isDebugOutput: boolean = debugOutput.toLowerCase() === "true";

        // print what is supplied by the user
        tl.debug(`endpoint: ${JSON.stringify(auth)}`);
        tl.debug(`definition: ${definition}`);
        tl.debug(`branch: ${branch}`);
        tl.debug(`downloadPath: ${downloadPath}`);
        tl.debug(`versionSelector: ${versionSelector}`);
        tl.debug(`commitId: ${commitId}`);
        tl.debug(`debugOutput: ${debugOutput}`);

        if (!downloadPath || downloadPath.length === 0) {
            downloadPath = tl.getVariable("System.DefaultWorkingDirectory");
        }

        console.info(`Cleaning ${downloadPath}`);
        CleanFolder(downloadPath);
        console.info("Done");

        tl.debug("Finding repository url");
        let gitApi = new GitApi();
        let repoUrl = await gitApi.getRepoUrl(endpointUrl, definition, token);
        console.info(`Repo Url: ${url.format(repoUrl)}`);

        commitId = commitId || "";
        if (commitId === "") {
            console.info("Identifying commit id");
            if (versionSelector === "latestDefaultBranch") {
                tl.debug("Finding commit for default branch");
                commitId = await gitApi.getLatestCommitIdFromBranch(endpointUrl, definition, token);
            }
            else if (versionSelector === "latestSpecificBranch") {
                tl.debug(`Finding commit for '${branch}' branch`);
                commitId = await gitApi.getLatestCommitIdFromBranch(definition, token, branch);
            }
        }
        console.info(`Commit id: ${commitId}`);

        repoUrl.auth = `${username}:${token}`;
        let formattedRepoUrl = url.format(repoUrl);

        console.info("Cloning repository...");
        let gitWrapper = new GitWrapper();
        gitWrapper.username = username;
        gitWrapper.password = token;

        let options: IGitExecOptions = {
            cwd: downloadPath,
            creds: true,
            debugOutput: isDebugOutput,
            useGitExe: true,
            env: process.env,
            errStream: process.stderr,
            outStream: process.stdout,
            silent: true
        };

        // Git clone
        await gitWrapper.clone(formattedRepoUrl, false, downloadPath, options);
        console.info("Done");

        if (versionSelector === "latestDefaultBranch") {
            console.info(`Checking out from default branch`);
            branch = branch || "";
        }
        else {
            console.info(`Checking out branch '${branch}'`);
        }
        // Checkout branch
        await gitWrapper.checkout(branch, options);
        console.info("Done");

        console.info(`Checking out commit '${commitId}'`);
        // Checkout commit
        await gitWrapper.checkout(commitId, options);

        console.info("Done");
        tl.setResult(tl.TaskResult.Succeeded, "");
    }
    catch (error) {
        console.error("Error occurred", error);
        tl.error(error);
        tl.setResult(tl.TaskResult.Failed, error);
    }
}

main()
    .then(() => console.info("All Done!"))
    .catch(reason => console.error(reason));

function CleanFolder(downloadPath: string) {

    // clear leading and trailing quotes for paths with spaces
    downloadPath = downloadPath.replace(/"/g, "");
    // remove trailing slash
    if (downloadPath.endsWith("\\") || downloadPath.endsWith("/")) {
        downloadPath = downloadPath.substr(0, downloadPath.length - 1);
    }

    downloadPath = path.normalize(downloadPath);

    let downloadPathStats: tl.FsStats;
    try {
        downloadPathStats = tl.stats(downloadPath);
    }
    catch (err) {
        if (err.code !== "ENOENT") {
            throw err;
        }
    }
    if (downloadPathStats) {
        if (downloadPathStats.isDirectory()) {
            // delete the child items
            fse.readdirSync(downloadPath)
                .forEach((item: string) => {
                    let itemPath = path.join(downloadPath, item);
                    tl.rmRF(itemPath);
                });
        }
        else {
            // downloadPath is not a directory. delete it.
            tl.rmRF(downloadPath);
        }
    }

    // FIX for Error: C:\Program Files\Git\cmd\git.exe failed. spawn C:\Program Files\Git\cmd\git.exe ENOENT
    if (!tl.exist(downloadPath)) {
        tl.debug(`Creating directory ${downloadPath}`);
        tl.mkdirP(downloadPath);
    }
    tl.debug("Cleaning complete");
}
