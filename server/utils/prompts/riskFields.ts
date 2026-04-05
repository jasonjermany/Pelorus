export function buildRiskFieldsPrompt(allChunksText: string): string {
  return `You are an expert insurance underwriting system designer.

Read the following carrier underwriting guidelines and identify the key data fields
that an underwriter would need to extract from any submission to evaluate a risk.

Return ONLY a JSON array of field names — no other text, no markdown, no backticks.
Each field name must be snake_case and concise. Return 12-20 fields maximum.
Focus on the most critical underwriting variables for this specific line of business.

Examples for commercial property: ["tiv", "roof_age", "construction_class", "sprinklers", "electrical", "year_built", "losses_5yr", "vacancy", "protection_class", "named_insured", "broker", "prior_carrier"]
Examples for cyber: ["annual_revenue", "employee_count", "mfa_enabled", "edr_solution", "prior_cyber_incidents", "data_types_stored", "backup_frequency", "named_insured", "broker", "prior_carrier"]
Examples for workers comp: ["annual_payroll", "employee_count", "experience_mod_rate", "primary_operations", "prior_losses_3yr", "safety_program", "named_insured", "broker", "prior_carrier"]

GUIDELINES:
${allChunksText.slice(0, 30000)}

Return ONLY the JSON array:`
}
