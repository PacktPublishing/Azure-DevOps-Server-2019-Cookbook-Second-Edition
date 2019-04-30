import * as tl from "azure-pipelines-task-lib";
import * as trm from "azure-pipelines-task-lib/toolrunner";
import * as events from "events";
import * as path from "path";

export let envGitUsername = "GIT_USERNAME";
export let envGitPassword = "GIT_PASSWORD";

export interface IGitExecOptions {
    useGitExe: boolean;
    creds: boolean;
    cwd: string;
    debugOutput: boolean;
    env: { [key: string]: string };
    silent: boolean;
    outStream: NodeJS.WriteStream;
    errStream: NodeJS.WriteStream;
}

let _gitLocalPath = path.join(__dirname, process.platform, "libgit_host");
let _gitExePath: string;

export class GitWrapper extends events.EventEmitter {
    public username: string;
    public password: string;
    public gitInstalled: boolean;
    constructor() {
        super();
        tl.debug("Searching for git tool");
        _gitExePath = tl.which("git", false);
        this.gitInstalled = _gitExePath !== null;
    }

    public async remote(args: string[], options?: IGitExecOptions) {
        options = options || <IGitExecOptions>{};
        options.useGitExe = true;
        options.creds = true;
        return this.exec(["remote"].concat(args), options);
    }

    public async fetch(args: string[], options?: IGitExecOptions) {
        options = options || <IGitExecOptions>{};
        options.useGitExe = true;
        options.creds = true;
        return this.exec(["fetch"].concat(args), options);
    }

    public async checkout(ref: string, options?: IGitExecOptions) {
        options = options || <IGitExecOptions>{};
        options.useGitExe = true;
        options.creds = true;
        return this.exec(["checkout", ref], options);
    }

    public async clean(args: string[], options?: IGitExecOptions) {
        options = options || <IGitExecOptions>{};
        options.useGitExe = true;
        return this.exec(["clean"].concat(args), options);
    }

    public async reset(args: string[], options?: IGitExecOptions) {
        options = options || <IGitExecOptions>{};
        options.useGitExe = true;
        return this.exec(["reset"].concat(args), options);
    }

    public async submodule(args: string[], options?: IGitExecOptions) {
        options = options || <IGitExecOptions>{};
        options.useGitExe = true;
        options.creds = true;
        return this.exec(["submodule"].concat(args), options);
    }

    public async clone(repository: string, progress: boolean, folder: string, options?: IGitExecOptions) {
        options = options || <IGitExecOptions>{};
        options.useGitExe = true;
        options.creds = true;
        let args = ["clone", repository];

        if (progress) {
            args.push("--progress");
        }

        if (folder) {
            args.push(folder);
        }

        return this.exec(args, options);
    }

    public async exec(args: string[], options?: IGitExecOptions) {
        try {
            let gitPath = options.useGitExe ? _gitExePath : _gitLocalPath;

            if (!gitPath) {
                throw (new Error("git exe not found. Ensure its installed and in the path"));
            }

            let git = tl.tool(gitPath);
            let creds = `${this.username}:${this.password}`;
            let escapedCreds = `${encodeURIComponent(this.username)}:${encodeURIComponent(this.password)}`;
            git.on("debug", (message) => {
                if (options.debugOutput) {
                    let repl = message.replace(creds, "...");
                    repl = message.replace(escapedCreds, "...");
                    this.emit("stdout", "[debug]" + repl);
                }
            });

            git.on("stdout", (data) => {
                this.emit("stdout", data);
            });

            args.map((arg: string) => {
                git.arg(arg); // raw arg
            });

            options = options || <IGitExecOptions>{};
            let ops: trm.IExecOptions = {
                cwd: options.cwd || process.cwd(),
                env: options.env || process.env,
                silent: true,
                outStream: options.outStream || process.stdout,
                errStream: options.errStream || process.stderr,
                failOnStdErr: true,
                ignoreReturnCode: false,
                windowsVerbatimArguments: false
            };
            tl.debug(`Working directory for the command is: ${ops.cwd}`);
            return await git.execSync(ops);
        } catch (error) {
            tl.error(error);
            throw new Error("Unable to execute git command.");
        }
    }
}