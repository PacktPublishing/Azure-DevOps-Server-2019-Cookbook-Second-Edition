
export interface Feature {
    Text: string;
    Perspective: string;
    Desire: string;
    Reason: string;
    Scenarios?: Array<Scenario>;
}
export interface Scenario {
    Text: string;
    Steps: Array<string>;
}

let R_NEWLINE = /\r?\n/g;
let R_FEATURE = /^\s*Feature:(.*)$/;
let R_AS = /^\s*As (.*)$/;
let R_I_WANT = /^\s*I want (.*)$/;
let R_SO_THAT = /^\s*So that (.*)$/;
let R_IN_ORDER = /^\s*In order (.*)$/;
let R_SCENARIO = /^\s*Scenario:(.*)$/;
let R_GIVEN = /^\s*Given (.*)$/;
let R_WHEN = /^\s*When(.*)$/;
let R_THEN = /^\s*Then (.*)$/;
let R_AND = /^\s*And (.*)$/;
let R_BUT = /^\s*But (.*)$/;

export function parseGherkin(text: string) {
    let features: Array<Feature> = [];
    let lines = (text || "").toString().split(R_NEWLINE);
    let feature: Feature = {
        Text: "",
        Desire: "",
        Perspective: "",
        Reason: "",
        Scenarios: []
    };
    let scenario: Scenario = {
        Text: "",
        Steps: [],
    };
    features.push(feature);
    let previous: Array<string>;
    lines.forEach(function (line) {
        if (R_FEATURE.test(line)) {
            feature.Text = extract(line, R_FEATURE, 1);
        }
        else if (R_AS.test(line)) {
            feature.Perspective = extract(line, R_AS, 1);
        }
        else if (R_I_WANT.test(line)) {
            feature.Desire = extract(line, R_I_WANT, 1);
        }
        else if (R_SO_THAT.test(line)) {
            feature.Reason = extract(line, R_SO_THAT, 1);
        }
        else if (R_IN_ORDER.test(line)) {
            feature.Reason = extract(line, R_IN_ORDER, 1);
        }
        else if (R_SCENARIO.test(line)) {
            scenario.Text = extract(line, R_SCENARIO, 1);
            feature.Scenarios.push(scenario);
        }
        else if (R_GIVEN.test(line)) {
            previous = scenario.Steps;
            scenario.Steps.push(extract(line, R_GIVEN, 1));
        }
        else if (R_WHEN.test(line)) {
            previous = scenario.Steps;
            scenario.Steps.push(extract(line, R_WHEN, 1));
        }
        else if (R_THEN.test(line)) {
            previous = scenario.Steps;
            scenario.Steps.push(extract(line, R_THEN, 1));
        }
        else if (R_AND.test(line)) {
            previous = scenario.Steps;
            scenario.Steps.push(extract(line, R_AND, 1));
        }
        else if (R_BUT.test(line)) {
            previous = scenario.Steps;
            scenario.Steps.push(extract(line, R_BUT, 1));
        }
        else if (line.trim().length > 0) {
            throw new SyntaxError(line.trim());
        }
    });

    return features;
}

function extract(line, regex, index) {
    return line.match(regex)[index].trim();
}