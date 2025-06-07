# Analysis Builder Components

This directory contains comprehensive components for building and managing clinical trial analyses in compliance with the ARS (Analysis Results Standard) model.

## Components Overview

### Main Components

- **AnalysisBuilder** - Main container component with step-by-step wizard
- **AnalysisForm** - Basic analysis information form
- **AnalysisSetSelector** - Population and dataset selection
- **GroupingSelector** - Analysis grouping configuration
- **ResultsSection** - Expected results definition
- **AnalysisPreview** - Preview and save functionality

### Where Clause Components

- **WhereClauseBuilder** - Main where clause builder
- **ConditionBuilder** - Simple condition builder
- **CompoundExpressionBuilder** - Complex logical expressions
- **VariableSelector** - Dataset and variable selection with CDISC suggestions

## Usage

### Basic Usage

```tsx
import { AnalysisBuilder } from './components/AnalysisBuilder'

function MyComponent() {
  return (
    <AnalysisBuilder
      reportingEventId="event-123"
      onSave={(analysis) => console.log('Saved:', analysis)}
    />
  )
}
```

### Editing Existing Analysis

```tsx
import { AnalysisBuilder } from './components/AnalysisBuilder'

function EditAnalysis() {
  return (
    <AnalysisBuilder
      reportingEventId="event-123"
      analysisId="analysis-456"
      onSave={(analysis) => console.log('Updated:', analysis)}
    />
  )
}
```

### Using Individual Components

```tsx
import { 
  AnalysisForm, 
  WhereClauseBuilder,
  VariableSelector 
} from './components/AnalysisBuilder'

function CustomAnalysisForm() {
  const [analysis, setAnalysis] = useState({})
  const [whereClause, setWhereClause] = useState()

  return (
    <div>
      <AnalysisForm
        analysis={analysis}
        onChange={setAnalysis}
        reportingEvent={reportingEvent}
      />
      
      <WhereClauseBuilder
        value={whereClause}
        onChange={setWhereClause}
        datasets={['ADSL', 'ADAE', 'ADVS']}
        title="Population Criteria"
      />
    </div>
  )
}
```

## Features

### Step-by-Step Wizard
- Guided creation process
- Validation at each step
- Progress tracking
- Navigation between steps

### Population and Data Selection
- Analysis set selection with condition preview
- Data subset selection
- Visual condition display
- Help text and examples

### Grouping Configuration
- Multiple grouping factors
- Ordering and priority
- Results-by-group options
- Drag and drop reordering

### Where Clause Builder
- Simple conditions (dataset.variable comparator value)
- Complex expressions with AND/OR/NOT logic
- Variable suggestions from CDISC standards
- Real-time condition preview

### Validation and Preview
- Real-time validation
- Comprehensive preview before saving
- Error handling and user feedback
- Mandatory field checking

## API Integration

The components use the `useAnalysis` hook and `analysisService` for:

- Fetching reporting event data
- Creating and updating analyses
- Validation
- Error handling

## Styling

All components use Ant Design components and follow the established design system:

- Consistent spacing and typography
- Proper loading states
- Error feedback
- Responsive design

## Data Flow

1. **Initialization**: Load reporting event and related data
2. **Step 1**: Basic analysis information
3. **Step 2**: Population and dataset selection
4. **Step 3**: Grouping configuration
5. **Step 4**: Expected results definition
6. **Preview**: Review all settings
7. **Save**: Create or update analysis

## Customization

Components accept various props for customization:

- Custom validation rules
- Different step configurations
- Custom save handlers
- Styling overrides

## Error Handling

- Network error handling
- Validation error display
- User-friendly error messages
- Graceful degradation when data is unavailable