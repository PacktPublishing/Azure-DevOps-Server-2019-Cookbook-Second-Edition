/// <reference types="vss-web-extension-sdk" />
import * as ws from "TFS/WorkItemTracking/Services";
import * as WitExtensionContracts from "TFS/WorkItemTracking/ExtensionContracts";
import Dialogs = require("VSS/Controls/Dialogs");

const provider = () => {
    $("#clickme").click(function () {
        let dialog = Dialogs.show(Dialogs.ModalDialog, <Dialogs.IModalDialogOptions>{
            title: "My Dialog",
            contentText: `Hello`,
            buttons: {
                "OK": () => {
                    dialog.close();
                }
            }
        });
    });
    return {
        onLoaded: async (args: WitExtensionContracts.IWorkItemLoadedArgs) => {
            console.log("main page loaded");
        }
    };
};

VSS.register(VSS.getContribution().id, provider);
