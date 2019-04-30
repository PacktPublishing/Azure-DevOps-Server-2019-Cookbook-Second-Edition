import * as axios from "axios";
import * as url from "url";

export class GitApi {

    public async getRepoUrl(endpointUrl: string, definition: string, token: string): Promise<url.UrlWithStringQuery> {

        let getSelectedRepoUrl = `${endpointUrl}/api/v4/projects/${definition}`;

        let response = await this.exec(getSelectedRepoUrl, token);

        if (response.status !== 200) {
            throw new Error("Unable to find the repository URL from GitLab");
        }
        let responseData = response.data;
        let repoUrl = url.parse(responseData.http_url_to_repo);
        return repoUrl;
    }

    public async getLatestCommitIdFromBranch(endpointUrl: string, definition: string, token: string, branch?: string): Promise<string> {
        let commitsFromDefaultBranchUrl = `${endpointUrl}/api/v4/projects/${definition}/repository/commits`;
        let commitsFromSpecifiBranchUrl = `${endpointUrl}/api/v4/projects/${definition}/repository/commits?ref_name=${branch}`;

        branch = branch || "";
        let commitId: string;
        let response: axios.AxiosResponse<any>;
        if (branch.trim() === "") {
            // get commits from default branch
            response = await this.exec(commitsFromDefaultBranchUrl, token);
            if (response.status !== 200) {
                throw new Error("Unable to get the Commit Id for default branch");
            }
        }
        else {
            // get commits for the given branch
            response = await this.exec(commitsFromSpecifiBranchUrl, token);
            if (response.status !== 200) {
                throw new Error("Unable to get the Commit Id for default branch");
            }
        }

        let responseData = response.data;
        if (responseData instanceof Array && responseData.length >= 0) {

            commitId = responseData[0].id;
        }
        return commitId;
    }

    private async exec(url: string, token: string): Promise<axios.AxiosResponse<any>> {
        let config: axios.AxiosRequestConfig = {
            headers: { "Private-Token": token },
            method: "get"
        };

        let response = await axios.default.get(url, config);

        return response;
    }
}