export const arrayFunctions = [          
    {
        name: "checkMainSymptomTooGeneric",
        description: "Checks whether the user's main symptom or condition is too generic.",
        parameters: {
            type: "object",
            properties: {
                symptom: {
                    type: "string",
                    description: "The main symptom or condition that the user is suffering, e.g. fatigue",
                }
            },
            required: ["symptom"],
        },
    },
    {
        name: "checkMainSymptom",
        description: "Checks whether the user's main symptom is a condition.",
        parameters: {
            type: "object",
            properties: {
                symptom: {
                    type: "string",
                    description: "The main symptom that the user is suffering, e.g. fatigue",
                }
            },
            required: ["symptom"],
        },
    },
    {
        name: "checkAsociatedSymptoms",
        description: "Checks whether the user's main condition has symptoms asociated in our database.",
        parameters: {
            type: "object",
            properties: {
                condition: {
                    type: "string",
                    description: "The main condition that the user is suffering.",
                }
            },
            required: ["condition"],
        }
    },
    {
        name: "checkExistingConditions",
        description: "Checks if the existing conditions are related to the user's main symptom.",
        parameters: {
            type: "object",
            properties: {
                existingConditions: {
                    type: "string",
                    description: "The user's existing conditions separate by commas.",
                }
            },
            required: ["existingConditions"],
        }
    },
]