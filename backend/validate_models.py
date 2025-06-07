#!/usr/bin/env python3
"""
Validation script for ARS database models and schemas.
Run this script to verify that all models and schemas are properly defined.
"""

import sys
import traceback
from typing import List, Any

def test_imports() -> List[str]:
    """Test that all models and schemas can be imported."""
    results = []
    
    try:
        from app.models import *
        results.append("✓ Models imported successfully")
        
        # Check that key models are available
        key_models = [
            'User', 'ReportingEvent', 'Analysis', 'Output', 'AnalysisSet', 
            'DataSubset', 'AnalysisGrouping', 'Group', 'WhereClause',
            'AnalysisMethod', 'Operation'
        ]
        
        for model_name in key_models:
            if model_name in globals():
                results.append(f"  ✓ {model_name} model available")
            else:
                results.append(f"  ✗ {model_name} model missing")
                
    except Exception as e:
        results.append(f"✗ Model import error: {e}")
        traceback.print_exc()
    
    try:
        from app.schemas import *
        results.append("✓ Schemas imported successfully")
        
        # Check that key schemas are available
        key_schemas = [
            'User', 'UserCreate', 'ReportingEvent', 'ReportingEventCreate',
            'Analysis', 'AnalysisCreate', 'Output', 'OutputCreate'
        ]
        
        for schema_name in key_schemas:
            if schema_name in globals():
                results.append(f"  ✓ {schema_name} schema available")
            else:
                results.append(f"  ✗ {schema_name} schema missing")
                
    except Exception as e:
        results.append(f"✗ Schema import error: {e}")
        traceback.print_exc()
    
    return results

def test_model_relationships() -> List[str]:
    """Test that model relationships are properly defined."""
    results = []
    
    try:
        from app.models.ars import ReportingEvent, Analysis, User
        
        # Check ReportingEvent relationships
        re_relationships = [
            'created_by_user', 'reference_documents', 'terminology_extensions',
            'analysis_sets', 'data_subsets', 'analysis_groupings', 'methods',
            'analyses', 'outputs', 'global_display_sections', 'lists_of_contents',
            'categorizations'
        ]
        
        for rel in re_relationships:
            if hasattr(ReportingEvent, rel):
                results.append(f"  ✓ ReportingEvent.{rel} relationship defined")
            else:
                results.append(f"  ✗ ReportingEvent.{rel} relationship missing")
        
        # Check Analysis relationships
        analysis_relationships = [
            'reporting_event', 'method', 'analysis_set', 'ordered_groupings',
            'results', 'list_items'
        ]
        
        for rel in analysis_relationships:
            if hasattr(Analysis, rel):
                results.append(f"  ✓ Analysis.{rel} relationship defined")
            else:
                results.append(f"  ✗ Analysis.{rel} relationship missing")
                
        results.append("✓ Model relationships validation completed")
        
    except Exception as e:
        results.append(f"✗ Model relationships error: {e}")
        traceback.print_exc()
    
    return results

def test_schema_validation() -> List[str]:
    """Test that schema validation works correctly."""
    results = []
    
    try:
        from app.schemas.ars import UserCreate, ReportingEventCreate
        
        # Test UserCreate schema
        user_data = {
            "email": "test@example.com",
            "full_name": "Test User",
            "role": "editor",
            "password": "testpassword123"
        }
        
        user_schema = UserCreate(**user_data)
        results.append("  ✓ UserCreate schema validation works")
        
        # Test ReportingEventCreate schema
        re_data = {
            "id": "test-re-001",
            "name": "Test Reporting Event",
            "description": "A test reporting event"
        }
        
        re_schema = ReportingEventCreate(**re_data)
        results.append("  ✓ ReportingEventCreate schema validation works")
        
        results.append("✓ Schema validation tests passed")
        
    except Exception as e:
        results.append(f"✗ Schema validation error: {e}")
        traceback.print_exc()
    
    return results

def main():
    """Run all validation tests."""
    print("=== ARS Models and Schemas Validation ===\n")
    
    all_results = []
    
    print("1. Testing imports...")
    import_results = test_imports()
    all_results.extend(import_results)
    for result in import_results:
        print(result)
    
    print("\n2. Testing model relationships...")
    relationship_results = test_model_relationships()
    all_results.extend(relationship_results)
    for result in relationship_results:
        print(result)
    
    print("\n3. Testing schema validation...")
    schema_results = test_schema_validation()
    all_results.extend(schema_results)
    for result in schema_results:
        print(result)
    
    # Summary
    success_count = len([r for r in all_results if r.startswith("✓")])
    error_count = len([r for r in all_results if r.startswith("✗")])
    
    print(f"\n=== Summary ===")
    print(f"✓ Successful checks: {success_count}")
    print(f"✗ Failed checks: {error_count}")
    
    if error_count == 0:
        print("\n🎉 All validations passed! The ARS models and schemas are properly configured.")
        return 0
    else:
        print(f"\n❌ {error_count} validation(s) failed. Please check the output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())