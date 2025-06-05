# User Flows - Clinical Trial Table Metadata System

## Primary User Personas

### Statistical Programmer (Primary User)
- Creates and manages analyses
- Designs table specifications
- Imports/exports metadata
- Validates ARS compliance

### Biostatistician (Primary User)
- Reviews analysis plans
- Defines statistical methods
- Validates analysis results
- Oversees study metadata

### Clinical Data Manager (Secondary User)
- Views analysis specifications
- Provides data context
- Reviews population definitions

## Core User Flows

### 1. Study Creation Flow

```
Login → Dashboard → Create New Study
↓
Study Details Form
├── Study ID (required)
├── Study Name (required) 
├── Description
├── Version
└── Template Selection (optional)
↓
Study Created → Study Overview
```

**Steps:**
1. User logs in with credentials
2. Lands on dashboard showing recent studies
3. Clicks "Create New Study" button
4. Fills out study details form
5. Optionally selects from template library (FDA STF, Common Safety)
6. Clicks "Create Study"
7. Redirected to study overview page

### 2. Analysis Creation Flow

```
Study Overview → Analysis Builder
↓
Analysis Details
├── Analysis ID (required)
├── Analysis Name (required)
├── Purpose/Reason
├── Method Selection
└── Dataset/Variable
↓
Population & Grouping
├── Analysis Set Selection
├── Data Subset Definition
└── Grouping Variables
↓
Where Clause Builder (if needed)
├── Simple Conditions
└── Compound Expressions
↓
Analysis Created → Analysis Tree View
```

**Steps:**
1. From study overview, click "Add Analysis"
2. Analysis builder opens with guided wizard
3. Fill analysis metadata (ID, name, purpose)
4. Select statistical method from library
5. Choose dataset and analysis variable
6. Define population (analysis set)
7. Add data subsets if needed
8. Configure grouping variables (treatment, demographics)
9. Build where clauses for complex filtering
10. Preview analysis specification
11. Save analysis

### 3. Table Design Flow

```
Study Overview → Output Designer
↓
Output Details
├── Output ID (required)
├── Output Name (required)
├── Type (Table/Figure/Listing)
└── Category Assignment
↓
Display Configuration
├── Title Sections
├── Header Layout
├── Row Structure
├── Column Mapping
└── Footer Sections
↓
Linked Analyses
├── Select Contributing Analyses
└── Result Positioning
↓
File Specifications
├── Output Formats (RTF/PDF/HTML)
└── File Locations
↓
Output Created → Output Library
```

**Steps:**
1. From study overview, click "Add Output"
2. Output designer opens with form wizard
3. Enter output metadata (ID, name, type)
4. Configure display sections (title, header, footer)
5. Design table structure with drag-drop
6. Link analyses to table cells/rows
7. Specify output file formats
8. Preview table shell
9. Save output specification

### 4. Import/Export Flow

```
Study Overview → Import/Export
↓
Import Option Selected
├── File Upload (YAML/JSON/Excel)
├── Format Validation
└── Preview Changes
↓
Mapping Review
├── Conflict Resolution
├── Missing Data Handling
└── Validation Warnings
↓
Import Confirmation → Updated Study
```

**Export Flow:**
```
Study Overview → Export
↓
Export Configuration
├── Format Selection (YAML/JSON/Excel)
├── Content Selection (Full/Partial)
└── Include Results Option
↓
File Generation → Download
```

### 5. Validation Flow

```
Study Overview → Validate
↓
Validation Running
├── ARS Compliance Check
├── Completeness Review
├── Traceability Verification
└── Custom Rule Evaluation
↓
Validation Report
├── Errors (must fix)
├── Warnings (recommendations)
└── Success Metrics
↓
Issue Resolution → Re-validation
```

### 6. Method Library Management Flow

```
Method Library → Browse/Search
↓
Method Selection
├── Standard Methods (built-in)
├── Custom Methods (user-created)
└── Shared Methods (organization)
↓
Method Details
├── Operations List
├── Result Patterns
├── Code Templates
└── Documentation
↓
Apply to Analysis / Edit Method
```

### 7. Where Clause Builder Flow

```
Analysis Builder → Add Where Clause
↓
Condition Type Selection
├── Simple Condition
└── Compound Expression
↓
Simple Condition Path:
├── Dataset Selection
├── Variable Selection  
├── Comparator (EQ/IN/GT/etc.)
├── Value Entry
└── Condition Preview
↓
Compound Expression Path:
├── Logical Operator (AND/OR/NOT)
├── Add Sub-conditions
├── Nested Logic Support
└── Expression Preview
↓
Validation & Save
```

## Navigation Patterns

### Primary Navigation (Top Level)
```
Dashboard | Studies | Analysis Builder | Output Designer | Method Library | Templates | Settings
```

### Study-Level Navigation (Tabs)
```
Overview | Analyses | Outputs | Methods | Lists of Contents | Validation | Export
```

### Analysis Builder Navigation (Steps)
```
1. Details → 2. Method → 3. Population → 4. Grouping → 5. Where Clauses → 6. Review
```

### Output Designer Navigation (Steps)
```
1. Details → 2. Display → 3. Structure → 4. Analyses → 5. Files → 6. Preview
```

## State Management

### Global State
- User authentication status
- Current study context
- User preferences
- Navigation history

### Page-Level State
- Form data (unsaved changes)
- Validation status
- Loading states
- Error messages

### Component State
- UI interactions (modals, dropdowns)
- Temporary selections
- Preview states

## Error Handling Flows

### Validation Errors
```
User Action → Validation → Error Detection
↓
Error Display
├── Inline Field Errors
├── Summary Error Panel
└── Suggested Corrections
↓
User Correction → Re-validation → Success
```

### Network Errors
```
API Call → Network Failure
↓
Error Recovery
├── Retry Logic (automatic)
├── Offline Mode (if applicable)
└── User Notification
↓
Manual Retry → Success/Failure
```

### Authorization Errors
```
Protected Action → Auth Check → Failure
↓
Redirect to Login → Re-authentication → Retry Action
```

## Responsive Design Considerations

### Desktop (Primary)
- Full feature set
- Multi-panel layouts
- Drag-and-drop interactions
- Keyboard shortcuts

### Tablet
- Simplified navigation
- Touch-optimized interactions
- Collapsible panels
- Essential features only

### Mobile (View Only)
- Read-only access
- Basic navigation
- Study overview
- Analysis summaries

## Accessibility Features

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode
- Focus indicators
- Alt text for images
- Semantic HTML structure

## Performance Considerations

### Loading Strategies
- Progressive loading for large studies
- Lazy loading for analysis trees
- Pagination for large lists
- Caching for frequently accessed data

### User Feedback
- Loading spinners
- Progress indicators
- Success/error notifications
- Auto-save indicators