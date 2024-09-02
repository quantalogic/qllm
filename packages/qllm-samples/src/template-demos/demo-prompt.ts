import path from "path";
import { runLLMTests } from "./demo-common-prompt";

const filePath = path.join(__dirname, "./prompts/create_story_no_var.yaml");

// Execute the LLM Tests
runLLMTests(filePath)
    .then(() => console.log("🎉 All LLM Tests executed successfully"))
    .catch((error) =>
        console.error("❌ Error during LLM tests execution:", error),
    );
