# Where Clause Builder Components

This directory contains advanced where clause building functionality for the Clinical Trial Table Metadata System. The components provide a comprehensive set of tools for creating, validating, testing, and managing where clauses with CDISC dataset support.

## Components Overview

### AdvancedWhereClauseBuilder
The main component that provides a tabbed interface with all where clause functionality.

**Features:**
- Tabbed interface with Builder, Explorer, Validator, Library, and Tester
- Where clause creation, editing, and management
- Summary view with clause descriptions
- Export functionality (JSON, YAML, SAS, R)
- Template saving and application
- Integration with all other components

**Usage:**
```tsx
import { AdvancedWhereClauseBuilder } from './components/WhereClauseBuilder'

<AdvancedWhereClauseBuilder
  parentType="analysis_set"
  parentId="AS001"
  title="Analysis Set Where Clauses"
  onWhereClaused={(clauses) => console.log(clauses)}
/>
```

### DatasetVariableExplorer
Browse and explore CDISC datasets and their variables with metadata.

**Features:**
- Tree view of datasets and variables
- Search and filtering by domain, variable type
- Variable details with data types and sample values
- Integration with where clause builder
- CDISC metadata support

**Usage:**
```tsx
import { DatasetVariableExplorer } from './components/WhereClauseBuilder'

<DatasetVariableExplorer
  onVariableSelect={(dataset, variable) => {
    // Handle variable selection
  }}
  showDetails={true}
/>
```

### ConditionValidator
Real-time validation of where clause conditions with suggestions.

**Features:**
- Real-time validation with error and warning messages
- Quality scoring system
- Code generation for multiple languages (SAS, R, Python, SQL)
- Improvement suggestions
- Detailed validation breakdown

**Usage:**
```tsx
import { ConditionValidator } from './components/WhereClauseBuilder'

<ConditionValidator
  whereClause={selectedClause}
  onValidationChange={(result) => {
    console.log('Validation:', result)
  }}
  autoValidate={true}
/>
```

### WhereClauseLibrary
Save, organize, and reuse where clause templates.

**Features:**
- Template creation and management
- Tag-based organization
- Search and filtering
- Template application
- Import/export capabilities

**Usage:**
```tsx
import { WhereClauseLibrary } from './components/WhereClauseBuilder'

<WhereClauseLibrary
  onTemplateApply={async (template) => {
    // Apply template to create new where clause
  }}
  showActions={true}
/>
```

### ExpressionTester
Test where clause expressions against sample or custom data.

**Features:**
- Sample data generation based on CDISC standards
- Custom data input (JSON format)
- Test execution with match statistics
- Performance metrics
- Results export

**Usage:**
```tsx
import { ExpressionTester } from './components/WhereClauseBuilder'

<ExpressionTester
  whereClause={clauseToTest}
  onTestResult={(result) => {
    console.log('Test results:', result)
  }}
  showSampleData={true}
/>
```

## Supporting Services and Hooks

### whereClauseService
Provides API integration for all where clause operations.

**Key Methods:**
- `createWhereClause(data)` - Create new where clause
- `validateCondition(condition)` - Validate condition
- `getCDISCDatasets()` - Get CDISC dataset metadata
- `getTemplates()` - Get saved templates
- `testExpression(clause, data)` - Test expression

### useWhereClause Hook
Main hook for where clause management with CRUD operations.

**Returns:**
- `whereClauses` - Array of where clauses
- `createWhereClause` - Function to create new clause
- `updateCondition` - Function to update condition
- `deleteWhereClause` - Function to delete clause
- `loading` - Loading state
- `error` - Error state

### Additional Hooks
- `useWhereClauseValidation` - For condition validation
- `useWhereClauseTemplates` - For template management
- `useCDISCMetadata` - For dataset/variable metadata
- `useWhereClauseSearch` - For searching clauses
- `useWhereClauseExport` - For exporting clauses

## Utility Functions

### whereClauseUtils
Comprehensive utility functions for where clause operations.

**Key Functions:**
- `getWhereClauseDescription(clause)` - Human-readable description
- `validateCondition(condition)` - Client-side validation
- `convertToLanguage(clause, lang)` - Code generation
- `generateCodeSnippets(clauses)` - Multi-language code
- `parseInputValues(input)` - Parse user input
- `suggestImprovements(clause)` - Performance suggestions

## Integration Examples

### Basic Integration
```tsx
import { AdvancedWhereClauseBuilder } from './components/WhereClauseBuilder'

function AnalysisSetEditor({ analysisSetId }) {
  const handleWhereClauseChange = (clauses) => {
    // Update analysis set with new where clauses
    updateAnalysisSet(analysisSetId, { whereClauses: clauses })
  }

  return (
    <AdvancedWhereClauseBuilder
      parentType="analysis_set"
      parentId={analysisSetId}
      onWhereClaused={handleWhereClauseChange}
    />
  )
}
```

### Custom Integration
```tsx
import { 
  DatasetVariableExplorer, 
  ConditionValidator, 
  WhereClauseLibrary 
} from './components/WhereClauseBuilder'

function CustomWhereClauseBuilder() {
  const [selectedDataset, setSelectedDataset] = useState('')
  const [selectedVariable, setSelectedVariable] = useState('')
  const [currentClause, setCurrentClause] = useState(null)

  return (
    <Row gutter={16}>
      <Col span={8}>
        <DatasetVariableExplorer
          onVariableSelect={(dataset, variable) => {
            setSelectedDataset(dataset)
            setSelectedVariable(variable)
          }}
          compact
        />
      </Col>
      <Col span={8}>
        <ConditionValidator
          whereClause={currentClause}
          autoValidate
        />
      </Col>
      <Col span={8}>
        <WhereClauseLibrary
          onTemplateApply={(template) => {
            setCurrentClause(template)
          }}
          compact
        />
      </Col>
    </Row>
  )
}
```

## Advanced Features

### Code Generation
Automatically generate where clause code in multiple programming languages:
- **SAS**: `where SEX = "M" and AGE >= 18;`
- **R**: `data[data$SEX == "M" & data$AGE >= 18, ]`
- **Python**: `data[(data['SEX'] == 'M') & (data['AGE'] >= 18)]`
- **SQL**: `WHERE SEX = 'M' AND AGE >= 18`

### Validation Engine
Real-time validation with:
- Syntax checking
- Data type validation
- Performance optimization suggestions
- CDISC compliance checking
- Best practice recommendations

### Template System
Reusable templates with:
- Tag-based organization
- Search functionality
- Import/export capabilities
- Version control
- Team sharing

### Testing Framework
Comprehensive testing with:
- Sample data generation
- Custom data support
- Performance metrics
- Match rate analysis
- Results export

## Best Practices

### Performance
- Use exact matches (EQ/IN) when possible
- Avoid complex expressions for large datasets
- Test expressions with representative data
- Monitor execution times

### Maintainability
- Use descriptive template names
- Add meaningful tags to templates
- Document complex expressions
- Regular validation of existing clauses

### CDISC Compliance
- Follow CDISC variable naming conventions
- Use standard domain abbreviations
- Validate against CDISC metadata
- Test with realistic SDTM data

### User Experience
- Provide clear error messages
- Use auto-completion where possible
- Show validation feedback immediately
- Offer suggestions for improvements

## Troubleshooting

### Common Issues
1. **Validation Errors**: Check dataset and variable names against CDISC standards
2. **Performance Issues**: Simplify complex expressions or use indexed variables
3. **Template Not Found**: Verify template ID and check library permissions
4. **Test Failures**: Ensure test data format matches expected structure

### Debug Mode
Enable debug logging:
```tsx
<AdvancedWhereClauseBuilder
  parentType="analysis_set"
  parentId="AS001"
  // Add debug prop when available
/>
```

## Future Enhancements

### Planned Features
- Visual query builder with drag-and-drop
- Advanced expression editor with syntax highlighting
- Integration with external CDISC metadata services
- Collaborative editing and comments
- Performance profiling and optimization
- Machine learning-based suggestions

### API Extensions
- Batch operations for multiple clauses
- Advanced search with fuzzy matching
- Template versioning and change tracking
- Usage analytics and reporting
- Integration with external validation services