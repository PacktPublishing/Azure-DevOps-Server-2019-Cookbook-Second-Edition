/// <reference types="vss-web-extension-sdk" />
import { WorkItemFormService } from "TFS/WorkItemTracking/Services";
import * as TestClient from "TFS/TestManagement/RestClient";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import { JsonPatchDocument } from "VSS/WebApi/Contracts";
import { TestBaseHelper } from "TFS/TestManagement/Helper/Utils";
import * as SanitizeHtml from "sanitize-html";
import * as html from "html-parse-stringify";
import * as parser from "./GherkinParser";

export class GenerateTestCase {
    public async execute(actionContext) {
        try {
            content = "";
            let extInfo = VSS.getExtensionContext();
            let webContext = VSS.getWebContext();
            console.log("ExtensionContext", extInfo);
            console.log("webContext", webContext);

            let work = await WorkItemFormService.getService();
            let availableFields = await work.getFields();
            let values = await work.getFieldValues(["System.Id", "Microsoft.VSTS.Common.AcceptanceCriteria"]);

            console.log("availableFields", availableFields);
            console.log("values", values);
            let rawAcceptanceCriteria = values["Microsoft.VSTS.Common.AcceptanceCriteria"];
            console.log("Dirty", rawAcceptanceCriteria);
            let ast = html.parse(rawAcceptanceCriteria);
            console.log("ast", ast);
            getAcceptanceCriteria(ast);
            console.log("done", content);
            let sanitizedAcceptanceCriteria = SanitizeHtml(content, {
                allowedTags: [],
                allowedAttributes: []
            });
            console.log("Clean", sanitizedAcceptanceCriteria);
            let parsedResponse = parser.parseGherkin(sanitizedAcceptanceCriteria);

            console.log("parsedResponse", parsedResponse);

            let testClient = TestClient.getClient();
            let plans = await testClient.getPlans(webContext.project.id);
            console.log("plans", plans);

            let selectedPlan = plans[0];
            let suite = await testClient.getTestSuitesForPlan(webContext.project.id, selectedPlan.id);
            console.log("suite", suite);

            let helper = new TestBaseHelper();
            let testBaseHelper = helper.create();

            parsedResponse.forEach(feature => {
                feature.Scenarios.forEach(async scenario => {
                    let witDoc: JsonPatchDocument =
                        [
                            {
                                "op": "add",
                                "path": "/fields/System.Title",
                                "value": scenario.Text
                            },
                            {
                                "op": "add",
                                "path": "/fields/System.Description",
                                "from": null,
                                "value": feature.Desire
                            }
                        ];
                    scenario.Steps.forEach(step => {
                        let testStep = testBaseHelper.createTestStep();
                        testStep.setTitle(step);
                        testBaseHelper.actions.push(testStep);
                    });
                    witDoc = testBaseHelper.saveActions(witDoc);
                    let witClient = WitClient.getClient();
                    let workitem = await witClient.createWorkItem(witDoc, webContext.project.id, "Test Case", false, false, true);
                    alert(`Workitem ${workitem.id} is created`);
                    await testClient.addTestCasesToSuite(webContext.project.id, selectedPlan.id, suite[0].id, `${workitem.id}`);
                    console.log(workitem);

                });
            });
        }
        catch (err) {
            alert(err);
        }
    }
}
let content = "";
function getAcceptanceCriteria(ast) {
    ast.forEach(child => {
        if (child.children && child.children.length > 0) {
            return getAcceptanceCriteria(child.children);
        }
        else if (child.type === "text" && child.content) {
            return content += $.trim(child.content) + "\r\n";
        }
    });
}
VSS.register(VSS.getContribution().id, context => {
    let action = new GenerateTestCase();
    return action;
});
VSS.notifyLoadSucceeded();