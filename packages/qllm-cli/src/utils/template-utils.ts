import { Template, TemplateManager } from "qllm-lib";
import axios from "axios";

export async function loadTemplate(source: string, type: "file" | "url" | "inline"): Promise<Template> {
  switch (type) {
    case "file":
      return Template.fromPath(source);
    case "url":
      return Template.fromUrl(source);
    case "inline":
      return Template.fromYaml(source);
    default:
      throw new Error(`Invalid template source type: ${type}`);
  }
}

export function parseVariables(variablesString?: string): Record<string, any> {
  if (!variablesString) return {};
  try {
    return JSON.parse(variablesString);
  } catch (error) {
    throw new Error("Invalid JSON format for variables");
  }
}