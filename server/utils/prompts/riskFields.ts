export function buildRiskFieldsPrompt(allChunksText: string): string {
  return `You are an expert commercial insurance underwriting system designer with CPCU-level knowledge across all lines.

Read the carrier underwriting guidelines below. Identify every data field an underwriter would need to extract from a submission to evaluate a risk against these specific guidelines. Return fields in order of underwriting materiality (most critical first).

Return ONLY a JSON array of snake_case field name strings. No other text, no markdown, no backticks. Maximum 30 fields. Minimum 12 fields.

FIELD SELECTION RULES:
  Include every field that appears in a guideline threshold, hard stop condition, referral trigger, or rating factor for this carrier.
  Include universal fields present on every commercial submission regardless of line.
  Do NOT include fields the carrier's guidelines do not reference at all.
  Do NOT include duplicate fields or sub-fields that roll up to a parent field.

REFERENCE FIELD LIBRARIES BY LINE:

  PROPERTY (select applicable):
  tiv, tiv_per_location, year_built, construction_class, occupancy_class, roof_age, roof_type, roof_material, electrical_type, plumbing_type, hvac_type, sprinkler_type, sprinkler_coverage_pct, protection_class, distance_to_hydrant, distance_to_fire_station, flood_zone, bfe_vs_first_floor_elevation, vacancy_pct, co_insurance_pct, agreed_value, replacement_cost_adequacy, losses_5yr_count, losses_5yr_incurred, largest_single_loss, loss_cause_breakdown, prior_carrier, prior_carrier_reason_for_leaving, nfip_limit, excess_flood_limit, business_income_limit, bi_waiting_period, equipment_breakdown_included, ordinance_or_law_pct, named_insured, broker, policy_effective_date

  GENERAL LIABILITY (select applicable):
  gl_occurrence_limit, gl_aggregate_limit, products_completed_ops_limit, personal_advertising_injury_limit, operations_description, sic_code, annual_revenue, employee_count, subcontractor_pct_of_revenue, subcontractor_coi_requirements, ai_waiver_of_subrogation_required, xcu_exposure, liquor_sales_pct, professional_services_exposure, claims_made_vs_occurrence, retro_date, tail_coverage, losses_3yr_gl, largest_gl_claim, open_gl_reserves, prior_carrier_gl, named_insured, broker

  COMMERCIAL AUTO (select applicable):
  vehicle_count, fleet_composition, vehicle_types, avg_vehicle_age, radius_of_operations, primary_commodity_hauled, cargo_value_per_load, fmcsa_dot_number, fmcsa_safety_rating, csa_basic_scores, eld_compliance, da_program_in_place, driver_count, avg_driver_age, avg_driver_experience_yrs, mvr_status_summary, drivers_with_major_violations, ic_driver_vs_employee, hired_non_owned_exposure, auto_losses_3yr, largest_auto_claim, prior_carrier_auto, fleet_safety_program, telematics_in_use, named_insured, broker

  WORKERS COMPENSATION (select applicable):
  total_annual_payroll, payroll_by_classification, experience_mod_rate, experience_mod_trajectory, primary_operations, employee_count_by_class, avg_cost_per_claim_vs_benchmark, claim_cause_breakdown, repeat_injury_claimants, open_wc_reserves, return_to_work_program, safety_committee_in_place, osha_recordable_rate, osha_citations_3yr, losses_3yr_wc_count, losses_3yr_wc_incurred, largest_wc_claim, prior_carrier_wc, monopolistic_state_exposure, ncci_class_codes, named_insured, broker

  INLAND MARINE — TRANSIT (select applicable):
  annual_shipment_value, max_per_shipment_value, commodity_description, temperature_sensitive_cargo, high_value_item_sublimit, shipping_modes, carrier_vetting_process, international_exposure, bill_of_lading_terms, losses_3yr_transit, largest_transit_loss, prior_carrier_im, named_insured, broker

  INLAND MARINE — EQUIPMENT FLOATER (select applicable):
  total_scheduled_equipment_value, equipment_list_with_serials, avg_equipment_age, gps_immobilizer_installed, operator_qualifications, leased_equipment_pct, leased_equipment_loss_payees, jobsite_security_measures, losses_3yr_equipment, largest_equipment_loss, prior_carrier_im, named_insured, broker

  INLAND MARINE — BUILDERS RISK (select applicable):
  project_value, project_type, project_start_date, project_completion_date, gc_name, gc_license_number, gc_bonding_amount, gc_loss_history_3yr, key_subcontractors_with_cois, soft_costs_amount, delay_in_opening_limit, loss_of_rents_limit, phased_occupancy_plan, site_fire_protection_plan, surety_performance_bond, owner_supplied_materials_value, prior_carrier_br, named_insured, broker

  UMBRELLA / EXCESS (select applicable):
  requested_umbrella_limit, underlying_policy_schedule, underlying_gl_limit, underlying_auto_limit, underlying_wc_limit, underlying_employers_liability_limit, underlying_im_limit, excess_vs_true_umbrella, sir_retained_limit, drop_down_provisions, open_large_reserves_approaching_primary_limits, underlying_claims_trend, prior_carrier_umbrella, named_insured, broker

Return ONLY the JSON array of field names applicable to this carrier and submission type.

GUIDELINES:
${allChunksText.slice(0, 30000)}`
}
