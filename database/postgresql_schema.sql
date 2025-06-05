-- Clinical Trial Table Metadata System - PostgreSQL Schema
-- Based on CDISC Analysis Results Standard (ARS) v1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER MANAGEMENT TABLES
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CORE ARS MODEL TABLES
-- ============================================

-- ReportingEvent: Main container for all analyses and outputs
CREATE TABLE reporting_events (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    label VARCHAR(255),
    version VARCHAR(50),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_locked BOOLEAN DEFAULT false,
    parent_id VARCHAR(255) REFERENCES reporting_events(id) -- For versioning
);

-- ReferenceDocument: External documents (SAP, protocols, etc.)
CREATE TABLE reference_documents (
    id VARCHAR(255) PRIMARY KEY,
    reporting_event_id VARCHAR(255) NOT NULL REFERENCES reporting_events(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    label VARCHAR(255),
    location TEXT NOT NULL
);

-- TerminologyExtension: Custom terminology definitions
CREATE TABLE terminology_extensions (
    id VARCHAR(255) PRIMARY KEY,
    reporting_event_id VARCHAR(255) NOT NULL REFERENCES reporting_events(id) ON DELETE CASCADE,
    enumeration VARCHAR(255) NOT NULL
);

CREATE TABLE sponsor_terms (
    id VARCHAR(255) PRIMARY KEY,
    terminology_extension_id VARCHAR(255) NOT NULL REFERENCES terminology_extensions(id) ON DELETE CASCADE,
    submission_value VARCHAR(255) NOT NULL,
    description TEXT
);

-- AnalysisSet: Population definitions (ITT, Safety, etc.)
CREATE TABLE analysis_sets (
    id VARCHAR(255) PRIMARY KEY,
    reporting_event_id VARCHAR(255) NOT NULL REFERENCES reporting_events(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    label VARCHAR(255),
    level INTEGER NOT NULL,
    order_num INTEGER NOT NULL
);

-- DataSubset: Data filtering rules
CREATE TABLE data_subsets (
    id VARCHAR(255) PRIMARY KEY,
    reporting_event_id VARCHAR(255) NOT NULL REFERENCES reporting_events(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    label VARCHAR(255),
    level INTEGER NOT NULL,
    order_num INTEGER NOT NULL
);

-- GroupingFactor: Base for analysis groupings
CREATE TABLE analysis_groupings (
    id VARCHAR(255) PRIMARY KEY,
    reporting_event_id VARCHAR(255) NOT NULL REFERENCES reporting_events(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    label VARCHAR(255),
    grouping_dataset VARCHAR(255),
    grouping_variable VARCHAR(255),
    data_driven BOOLEAN DEFAULT false
);

CREATE TABLE groups (
    id VARCHAR(255) PRIMARY KEY,
    grouping_id VARCHAR(255) NOT NULL REFERENCES analysis_groupings(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    label VARCHAR(255),
    level INTEGER NOT NULL,
    order_num INTEGER NOT NULL
);

-- WhereClause: Conditions for filtering
CREATE TABLE where_clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_type VARCHAR(50) NOT NULL, -- 'analysis_set', 'data_subset', 'group', 'compound_expression'
    parent_id VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL,
    order_num INTEGER NOT NULL,
    clause_type VARCHAR(50) NOT NULL CHECK (clause_type IN ('condition', 'compound_expression'))
);

CREATE TABLE where_clause_conditions (
    where_clause_id UUID PRIMARY KEY REFERENCES where_clauses(id) ON DELETE CASCADE,
    dataset VARCHAR(255) NOT NULL,
    variable VARCHAR(255) NOT NULL,
    comparator VARCHAR(10) NOT NULL CHECK (comparator IN ('EQ', 'NE', 'GT', 'LT', 'GE', 'LE', 'IN', 'NOTIN', 'CONTAINS')),
    value_array TEXT[] -- Array of values for IN/NOTIN comparisons
);

CREATE TABLE where_clause_compound_expressions (
    where_clause_id UUID PRIMARY KEY REFERENCES where_clauses(id) ON DELETE CASCADE,
    logical_operator VARCHAR(10) NOT NULL CHECK (logical_operator IN ('AND', 'OR', 'NOT'))
);

-- Method: Statistical methods
CREATE TABLE analysis_methods (
    id VARCHAR(255) PRIMARY KEY,
    reporting_event_id VARCHAR(255) NOT NULL REFERENCES reporting_events(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    label VARCHAR(255),
    code_template TEXT
);

CREATE TABLE method_document_refs (
    method_id VARCHAR(255) NOT NULL REFERENCES analysis_methods(id) ON DELETE CASCADE,
    reference_document_id VARCHAR(255) NOT NULL REFERENCES reference_documents(id) ON DELETE CASCADE,
    page_refs JSONB, -- Store page reference details as JSON
    PRIMARY KEY (method_id, reference_document_id)
);

CREATE TABLE operations (
    id VARCHAR(255) PRIMARY KEY,
    method_id VARCHAR(255) NOT NULL REFERENCES analysis_methods(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    label VARCHAR(255),
    order_num INTEGER NOT NULL,
    result_pattern VARCHAR(255)
);

CREATE TABLE operation_relationships (
    id VARCHAR(255) PRIMARY KEY,
    operation_id VARCHAR(255) NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
    referenced_operation_role VARCHAR(50) NOT NULL,
    referenced_operation_id VARCHAR(255) NOT NULL REFERENCES operations(id),
    description TEXT
);

-- Analysis: Individual analyses
CREATE TABLE analyses (
    id VARCHAR(255) PRIMARY KEY,
    reporting_event_id VARCHAR(255) NOT NULL REFERENCES reporting_events(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    label VARCHAR(255),
    version VARCHAR(50),
    reason VARCHAR(255),
    purpose VARCHAR(255),
    method_id VARCHAR(255) REFERENCES analysis_methods(id),
    analysis_set_id VARCHAR(255) REFERENCES analysis_sets(id),
    dataset VARCHAR(255),
    variable VARCHAR(255),
    category_ids TEXT[] -- Array of category IDs
);

CREATE TABLE analysis_document_refs (
    analysis_id VARCHAR(255) NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    reference_document_id VARCHAR(255) NOT NULL REFERENCES reference_documents(id) ON DELETE CASCADE,
    page_refs JSONB,
    PRIMARY KEY (analysis_id, reference_document_id)
);

CREATE TABLE analysis_data_subsets (
    analysis_id VARCHAR(255) NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    data_subset_id VARCHAR(255) NOT NULL REFERENCES data_subsets(id),
    PRIMARY KEY (analysis_id, data_subset_id)
);

CREATE TABLE ordered_groupings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id VARCHAR(255) NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    grouping_id VARCHAR(255) NOT NULL REFERENCES analysis_groupings(id),
    order_num INTEGER NOT NULL,
    results_by_group BOOLEAN DEFAULT false
);

CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id VARCHAR(255) NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    operation_id VARCHAR(255) NOT NULL REFERENCES operations(id),
    raw_value VARCHAR(255),
    formatted_value VARCHAR(255)
);

CREATE TABLE result_groups (
    result_id UUID NOT NULL REFERENCES analysis_results(id) ON DELETE CASCADE,
    grouping_id VARCHAR(255) NOT NULL,
    group_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (result_id, grouping_id, group_id)
);

-- Output: Tables, figures, and listings
CREATE TABLE outputs (
    id VARCHAR(255) PRIMARY KEY,
    reporting_event_id VARCHAR(255) NOT NULL REFERENCES reporting_events(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    label VARCHAR(255),
    version VARCHAR(50),
    category_ids TEXT[]
);

CREATE TABLE output_document_refs (
    output_id VARCHAR(255) NOT NULL REFERENCES outputs(id) ON DELETE CASCADE,
    reference_document_id VARCHAR(255) NOT NULL REFERENCES reference_documents(id) ON DELETE CASCADE,
    page_refs JSONB,
    PRIMARY KEY (output_id, reference_document_id)
);

CREATE TABLE output_programming_code (
    output_id VARCHAR(255) PRIMARY KEY REFERENCES outputs(id) ON DELETE CASCADE,
    context VARCHAR(255) NOT NULL,
    code TEXT,
    document_ref_id VARCHAR(255) REFERENCES reference_documents(id)
);

CREATE TABLE output_code_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    output_id VARCHAR(255) NOT NULL REFERENCES outputs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    label VARCHAR(255),
    value TEXT NOT NULL
);

-- Display: Visual representation of outputs
CREATE TABLE displays (
    id VARCHAR(255) PRIMARY KEY,
    output_id VARCHAR(255) NOT NULL REFERENCES outputs(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    label VARCHAR(255),
    version VARCHAR(50),
    display_title TEXT,
    order_num INTEGER NOT NULL
);

CREATE TABLE global_display_sections (
    id VARCHAR(255) PRIMARY KEY,
    reporting_event_id VARCHAR(255) NOT NULL REFERENCES reporting_events(id) ON DELETE CASCADE,
    section_type VARCHAR(50) NOT NULL,
    section_label VARCHAR(255)
);

CREATE TABLE display_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_id VARCHAR(255) NOT NULL REFERENCES displays(id) ON DELETE CASCADE,
    section_type VARCHAR(50) NOT NULL,
    order_num INTEGER NOT NULL
);

CREATE TABLE display_sub_sections (
    id VARCHAR(255) PRIMARY KEY,
    text TEXT NOT NULL
);

CREATE TABLE ordered_display_sub_sections (
    display_section_id UUID NOT NULL REFERENCES display_sections(id) ON DELETE CASCADE,
    sub_section_id VARCHAR(255) REFERENCES display_sub_sections(id),
    global_sub_section_id VARCHAR(255) REFERENCES global_display_sections(id),
    order_num INTEGER NOT NULL,
    CHECK ((sub_section_id IS NOT NULL AND global_sub_section_id IS NULL) OR 
           (sub_section_id IS NULL AND global_sub_section_id IS NOT NULL))
);

-- FileSpecification: Output file details
CREATE TABLE output_file_specifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    output_id VARCHAR(255) NOT NULL REFERENCES outputs(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    label VARCHAR(255),
    file_type VARCHAR(50) NOT NULL,
    location TEXT
);

-- ListOfContents: Hierarchical organization
CREATE TABLE lists_of_contents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporting_event_id VARCHAR(255) NOT NULL REFERENCES reporting_events(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    label VARCHAR(255),
    is_main BOOLEAN DEFAULT false
);

CREATE TABLE list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID REFERENCES lists_of_contents(id) ON DELETE CASCADE,
    parent_item_id UUID REFERENCES list_items(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    label VARCHAR(255),
    level INTEGER NOT NULL,
    order_num INTEGER NOT NULL,
    analysis_id VARCHAR(255) REFERENCES analyses(id),
    output_id VARCHAR(255) REFERENCES outputs(id),
    CHECK ((analysis_id IS NOT NULL AND output_id IS NULL) OR 
           (analysis_id IS NULL AND output_id IS NOT NULL) OR
           (analysis_id IS NULL AND output_id IS NULL)) -- For sublists
);

-- AnalysisOutputCategorization: Category management
CREATE TABLE analysis_output_categorizations (
    id VARCHAR(255) PRIMARY KEY,
    reporting_event_id VARCHAR(255) NOT NULL REFERENCES reporting_events(id) ON DELETE CASCADE,
    label VARCHAR(255)
);

CREATE TABLE analysis_output_categories (
    id VARCHAR(255) PRIMARY KEY,
    categorization_id VARCHAR(255) NOT NULL REFERENCES analysis_output_categorizations(id) ON DELETE CASCADE,
    label VARCHAR(255)
);

CREATE TABLE category_sub_categorizations (
    category_id VARCHAR(255) NOT NULL REFERENCES analysis_output_categories(id) ON DELETE CASCADE,
    sub_categorization_id VARCHAR(255) NOT NULL REFERENCES analysis_output_categorizations(id),
    PRIMARY KEY (category_id, sub_categorization_id)
);

-- ============================================
-- AUDIT AND VERSION CONTROL
-- ============================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_reporting_events_created_by ON reporting_events(created_by);
CREATE INDEX idx_where_clauses_parent ON where_clauses(parent_type, parent_id);
CREATE INDEX idx_analyses_reporting_event ON analyses(reporting_event_id);
CREATE INDEX idx_outputs_reporting_event ON outputs(reporting_event_id);
CREATE INDEX idx_list_items_hierarchy ON list_items(list_id, parent_item_id, level, order_num);
CREATE INDEX idx_audit_log_lookup ON audit_log(table_name, record_id, timestamp);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reporting_events_updated_at
    BEFORE UPDATE ON reporting_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Audit logging function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
        VALUES (current_setting('app.current_user_id', true)::UUID, 'INSERT', TG_TABLE_NAME, NEW.id::TEXT, to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
        VALUES (current_setting('app.current_user_id', true)::UUID, 'UPDATE', TG_TABLE_NAME, NEW.id::TEXT, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, old_values)
        VALUES (current_setting('app.current_user_id', true)::UUID, 'DELETE', TG_TABLE_NAME, OLD.id::TEXT, to_jsonb(OLD));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add audit triggers to main tables
CREATE TRIGGER audit_reporting_events AFTER INSERT OR UPDATE OR DELETE ON reporting_events
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_analyses AFTER INSERT OR UPDATE OR DELETE ON analyses
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_outputs AFTER INSERT OR UPDATE OR DELETE ON outputs
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();