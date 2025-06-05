# UI/UX Wireframes - Clinical Trial Table Metadata System

## Design System Foundation

### Color Palette
- **Primary**: #2563eb (Blue - action items, links)
- **Secondary**: #64748b (Slate - secondary text)
- **Success**: #059669 (Green - validation success)
- **Warning**: #d97706 (Orange - warnings)
- **Error**: #dc2626 (Red - errors, required fields)
- **Background**: #f8fafc (Light gray)
- **Surface**: #ffffff (White cards/panels)

### Typography
- **Headers**: Segoe UI, system-ui, sans-serif
- **Body**: Same as headers, 16px base
- **Code**: Monaco, Consolas, monospace

### Spacing
- **Base unit**: 8px
- **Small**: 8px, **Medium**: 16px, **Large**: 24px, **XLarge**: 32px

---

## 1. Dashboard Page

```
┌─────────────────────────────────────────────────────────────────────┐
│ [🏠 Logo] Clinical Trial Metadata System     [👤 User Menu] [⚙️ Settings] │
├─────────────────────────────────────────────────────────────────────┤
│ Dashboard | Studies | Analysis Builder | Output Designer | Methods   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Welcome back, John Doe                                             │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ Recent Studies  │  │ Quick Actions   │  │ Statistics      │    │
│  │                 │  │                 │  │                 │    │
│  │ • Study ABC123  │  │ [+ New Study]   │  │ 12 Active       │    │
│  │ • Study DEF456  │  │ [📁 Import]     │  │ 45 Analyses     │    │
│  │ • Study GHI789  │  │ [📋 Templates]  │  │ 28 Outputs      │    │
│  │                 │  │                 │  │                 │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Recent Activity                                             │   │
│  │ ┌─────────────────────────────────────────────────────────┐ │   │
│  │ │ 📊 Analysis ABC-01 created in Study ABC123             │ │   │
│  │ │ 📋 Output Table-01 updated in Study DEF456             │ │   │
│  │ │ ✅ Study GHI789 validation completed                   │ │   │
│  │ └─────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Study Overview Page

```
┌─────────────────────────────────────────────────────────────────────┐
│ [🏠 Logo] Clinical Trial Metadata System     [👤 User Menu] [⚙️ Settings] │
├─────────────────────────────────────────────────────────────────────┤
│ Dashboard | Studies | Analysis Builder | Output Designer | Methods   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 🔙 Back to Studies                                                  │
│                                                                     │
│ Study ABC123: Safety Analysis Study                                 │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Overview | Analyses | Outputs | Methods | List of Contents | ⚙️  │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │                                                                 │ │
│ │ Study Information                        Quick Actions          │ │
│ │ ┌─────────────────────┐                ┌─────────────────────┐  │ │
│ │ │ Study ID: ABC123    │                │ [+ Add Analysis]    │  │ │
│ │ │ Name: Safety Study  │                │ [+ Add Output]      │  │ │
│ │ │ Version: 1.0        │                │ [📋 Add Method]     │  │ │
│ │ │ Status: Active      │                │ [✅ Validate]       │  │ │
│ │ │ Created: 2024-01-15 │                │ [📤 Export]         │  │ │
│ │ └─────────────────────┘                └─────────────────────┘  │ │
│ │                                                                 │ │
│ │ Progress Summary                                                │ │
│ │ ┌─────────────────────────────────────────────────────────────┐ │ │
│ │ │ Analyses: 5/8 Complete   ████████░░░░ 62%                  │ │ │
│ │ │ Outputs:  3/5 Complete   ██████░░░░░░ 60%                  │ │ │
│ │ │ Validation: ⚠️ 2 warnings                                    │ │ │
│ │ └─────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Analysis Builder - Step 1 (Details)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [🏠 Logo] Clinical Trial Metadata System     [👤 User Menu] [⚙️ Settings] │
├─────────────────────────────────────────────────────────────────────┤
│ Analysis Builder - New Analysis                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Progress: ●━━━━━━ Step 1 of 6: Analysis Details                     │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Analysis Information                                            │ │
│ │                                                                 │ │
│ │ Analysis ID *                                                   │ │
│ │ ┌─────────────────────────────────────────┐                     │ │
│ │ │ AE-SUMMARY-01                           │                     │ │
│ │ └─────────────────────────────────────────┘                     │ │
│ │                                                                 │ │
│ │ Analysis Name *                                                 │ │
│ │ ┌─────────────────────────────────────────┐                     │ │
│ │ │ Adverse Events Summary Table            │                     │ │
│ │ └─────────────────────────────────────────┘                     │ │
│ │                                                                 │ │
│ │ Purpose                                                         │ │
│ │ ┌─────────────────────────────────────────┐                     │ │
│ │ │ PRIMARY OBJECTIVE ▼                     │                     │ │
│ │ └─────────────────────────────────────────┘                     │ │
│ │                                                                 │ │
│ │ Reason                                                          │ │
│ │ ┌─────────────────────────────────────────┐                     │ │
│ │ │ SPECIFIED IN SAP OR PROTOCOL ▼          │                     │ │
│ │ └─────────────────────────────────────────┘                     │ │
│ │                                                                 │ │
│ │ Description                                                     │ │
│ │ ┌─────────────────────────────────────────┐                     │ │
│ │ │ Summary of adverse events by system     │                     │ │
│ │ │ organ class and preferred term          │                     │ │
│ │ └─────────────────────────────────────────┘                     │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│                                    [Cancel] [← Previous] [Next →]   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Analysis Builder - Step 2 (Method Selection)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [🏠 Logo] Clinical Trial Metadata System     [👤 User Menu] [⚙️ Settings] │
├─────────────────────────────────────────────────────────────────────┤
│ Analysis Builder - AE-SUMMARY-01                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Progress: ●●━━━━━ Step 2 of 6: Method Selection                     │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Statistical Method                                              │ │
│ │                                                                 │ │
│ │ ┌─────────────────────────────────┐ ┌─────────────────────────┐ │ │
│ │ │ Method Library                  │ │ Selected Method         │ │ │
│ │ │                                 │ │                         │ │ │
│ │ │ 📂 Standard Methods             │ │ Descriptive Summary     │ │ │
│ │ │   • Descriptive Summary ✓       │ │                         │ │ │
│ │ │   • Count and Percentage        │ │ Operations:             │ │ │
│ │ │   • Time-to-Event              │ │ • Count (n)             │ │ │
│ │ │                                 │ │ • Percentage (%)        │ │ │
│ │ │ 📂 Custom Methods               │ │ • Sort by SOC, PT       │ │ │
│ │ │   • My Custom Method 1          │ │                         │ │ │
│ │ │   • Sponsor Method A            │ │ Result Pattern:         │ │ │
│ │ │                                 │ │ n (x.x%)               │ │ │
│ │ │ [+ Create New Method]           │ │                         │ │ │
│ │ └─────────────────────────────────┘ └─────────────────────────┘ │ │
│ │                                                                 │ │
│ │ Dataset & Variable                                              │ │
│ │ ┌─────────────────────────────────────────┐                     │ │
│ │ │ Dataset: ADAE ▼    Variable: AEDECOD ▼  │                     │ │
│ │ └─────────────────────────────────────────┘                     │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│                                    [Cancel] [← Previous] [Next →]   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Where Clause Builder

```
┌─────────────────────────────────────────────────────────────────────┐
│ [🏠 Logo] Clinical Trial Metadata System     [👤 User Menu] [⚙️ Settings] │
├─────────────────────────────────────────────────────────────────────┤
│ Where Clause Builder                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Build Condition                                                 │ │
│ │                                                                 │ │
│ │ ┌─ Simple Condition ●─┐  ┌─ Compound Expression ○─┐             │ │
│ │                                                                 │ │
│ │ Dataset                  Variable                 Comparator    │ │
│ │ ┌─────────────┐        ┌─────────────┐          ┌─────────────┐ │ │
│ │ │ ADAE ▼      │        │ SAFFL ▼     │          │ EQ ▼        │ │ │
│ │ └─────────────┘        └─────────────┘          └─────────────┘ │ │
│ │                                                                 │ │
│ │ Value(s)                                                        │ │
│ │ ┌─────────────────────────────────────────┐                     │ │
│ │ │ Y                                       │                     │ │
│ │ └─────────────────────────────────────────┘                     │ │
│ │                                                                 │ │
│ │ Preview: ADAE.SAFFL EQ "Y"                                      │ │
│ │                                                                 │ │
│ │ ┌─────────────────────────────────────────────────────────────┐ │ │
│ │ │ Existing Conditions                                         │ │ │
│ │ │                                                             │ │ │
│ │ │ 1. ADAE.SAFFL EQ "Y"                              [Edit][×] │ │ │
│ │ │ 2. ADAE.TRTP NE "PLACEBO"                         [Edit][×] │ │ │
│ │ │                                                             │ │ │
│ │ │ Combined: (ADAE.SAFFL EQ "Y") AND (ADAE.TRTP NE "PLACEBO") │ │ │
│ │ └─────────────────────────────────────────────────────────────┘ │ │
│ │                                                                 │ │
│ │ [+ Add Condition] [Test Query]                                  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│                                         [Cancel] [Apply Conditions] │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Table Designer

```
┌─────────────────────────────────────────────────────────────────────┐
│ [🏠 Logo] Clinical Trial Metadata System     [👤 User Menu] [⚙️ Settings] │
├─────────────────────────────────────────────────────────────────────┤
│ Output Designer - New Table                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Progress: ●●●━━━━ Step 3 of 6: Table Structure                      │
│                                                                     │
│ ┌────────────────────────┐ ┌─────────────────────────────────────┐   │
│ │ Components             │ │ Table Preview                       │   │
│ │                        │ │                                     │   │
│ │ 📋 Title Elements      │ │ ┌─────────────────────────────────┐ │   │
│ │ • Main Title           │ │ │ Table 14.2.1                   │ │   │
│ │ • Subtitle             │ │ │ Summary of Adverse Events       │ │   │
│ │ • Population           │ │ │ Safety Population               │ │   │
│ │                        │ │ ├─────────────────────────────────┤ │   │
│ │ 📊 Header Elements     │ │ │        │Placebo│Drug A│Drug B│  │ │   │
│ │ • Column Headers       │ │ │        │(N=50) │(N=48)│(N=52)│  │ │   │
│ │ • Spanning Headers     │ │ ├─────────────────────────────────┤ │   │
│ │                        │ │ │Any AE  │25(50%)│30(62%)│28(54%)│ │   │
│ │ 📝 Row Elements        │ │ │Serious │ 5(10%)│ 8(17%)│ 6(12%)│ │   │
│ │ • Category Rows        │ │ │        │       │       │       │ │   │
│ │ • Data Rows            │ │ │[+ Row] │[+ Row]│[+ Row]│[+ Row]│ │   │
│ │ • Summary Rows         │ │ └─────────────────────────────────┘ │   │
│ │                        │ │                                     │   │
│ │ 📄 Footer Elements     │ │ Properties Panel:                   │   │
│ │ • Footnotes            │ │ ┌─────────────────────────────────┐ │   │
│ │ • Abbreviations        │ │ │ Selected: "Any AE" Row          │ │   │
│ │                        │ │ │ Linked Analysis: AE-SUMMARY-01  │ │   │
│ │ [Drag to Canvas →]     │ │ │ Result Position: 1.1            │ │   │
│ └────────────────────────┘ │ │ Format: n (x.x%)                │ │   │
│                            │ └─────────────────────────────────┘ │   │
│                            └─────────────────────────────────────┘   │
│                                                                     │
│                                    [Cancel] [← Previous] [Next →]   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Validation Report

```
┌─────────────────────────────────────────────────────────────────────┐
│ [🏠 Logo] Clinical Trial Metadata System     [👤 User Menu] [⚙️ Settings] │
├─────────────────────────────────────────────────────────────────────┤
│ Validation Report - Study ABC123                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🔍 Validation Summary                                           │ │
│ │                                                                 │ │
│ │ Status: ⚠️ 2 Errors, 3 Warnings                                 │ │
│ │ Last Run: 2024-01-15 14:30:25                                  │ │
│ │ Duration: 0.8 seconds                                           │ │
│ │                                                                 │ │
│ │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │ │
│ │ │ ❌ Errors: 2    │ │ ⚠️ Warnings: 3  │ │ ✅ Passed: 45   │   │ │
│ │ └─────────────────┘ └─────────────────┘ └─────────────────┘   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Issues Found                                                    │ │
│ │                                                                 │ │
│ │ ❌ ERROR: Missing required analysis method                      │ │
│ │    Analysis: DEMO-01                                            │ │
│ │    Rule: Each analysis must have a defined method               │ │
│ │    [Fix Now] [View Analysis]                                    │ │
│ │                                                                 │ │
│ │ ❌ ERROR: Output has no linked analyses                         │ │
│ │    Output: TABLE-DEMO                                           │ │
│ │    Rule: Outputs must link to at least one analysis            │ │
│ │    [Fix Now] [View Output]                                      │ │
│ │                                                                 │ │
│ │ ⚠️ WARNING: Analysis set not documented                          │ │
│ │    Analysis: AE-SUMMARY-01                                      │ │
│ │    Rule: Analysis sets should have descriptions                 │ │
│ │    [Fix] [Ignore]                                               │ │
│ │                                                                 │ │
│ │ ⚠️ WARNING: Where clause may be inefficient                      │ │
│ │    Analysis: AE-SUMMARY-01                                      │ │
│ │    Suggestion: Consider using analysis set instead              │ │
│ │    [Review] [Ignore]                                            │ │
│ │                                                                 │ │
│ │ ⚠️ WARNING: Output title length exceeds recommendation           │ │
│ │    Output: TABLE-AE-SUMMARY                                     │ │
│ │    Current: 95 characters, Recommended: < 80                    │ │
│ │    [Fix] [Ignore]                                               │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ │ [🔄 Re-run Validation] [📄 Export Report] [❌ Fix All Errors]    │ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Method Library

```
┌─────────────────────────────────────────────────────────────────────┐
│ [🏠 Logo] Clinical Trial Metadata System     [👤 User Menu] [⚙️ Settings] │
├─────────────────────────────────────────────────────────────────────┤
│ Dashboard | Studies | Analysis Builder | Output Designer | Methods   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Method Library                               🔍 Search: [          ] │
│                                                                     │
│ ┌────────────────────────┐ ┌─────────────────────────────────────┐   │
│ │ Categories             │ │ Methods                             │   │
│ │                        │ │                                     │   │
│ │ 📂 All Methods (28)    │ │ ┌─────────────────────────────────┐ │   │
│ │ 📂 Standard (15)       │ │ │ 📊 Descriptive Summary          │ │   │
│ │   • Descriptive        │ │ │ Standard method for counts and  │ │   │
│ │   • Count/Percentage   │ │ │ percentages                     │ │   │
│ │   • Continuous         │ │ │ [View Details] [Use in Analysis] │ │   │
│ │   • Time-to-Event      │ │ └─────────────────────────────────┘ │   │
│ │                        │ │                                     │   │
│ │ 📂 Custom (8)          │ │ ┌─────────────────────────────────┐ │   │
│ │   • Safety Analyses    │ │ │ 📈 Count and Percentage         │ │   │
│ │   • Efficacy           │ │ │ Count with percentage and 95%   │ │   │
│ │   • Demographics       │ │ │ confidence interval             │ │   │
│ │                        │ │ │ [View Details] [Use in Analysis] │ │   │
│ │ 📂 Shared (5)          │ │ └─────────────────────────────────┘ │   │
│ │   • Organization       │ │                                     │   │
│ │   • FDA Templates      │ │ ┌─────────────────────────────────┐ │   │
│ │                        │ │ │ 📊 Kaplan-Meier Estimate       │ │   │
│ │ [+ Create Method]      │ │ │ Time-to-event analysis with     │ │   │
│ └────────────────────────┘ │ │ survival curves                 │ │   │
│                            │ │ [View Details] [Use in Analysis] │ │   │
│                            │ └─────────────────────────────────┘ │   │
│                            │                                     │   │
│                            │ [Previous] Page 1 of 3 [Next]      │   │
│                            └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Responsive Design Breakpoints

### Desktop (1200px+)
- Full sidebar navigation
- Multi-column layouts
- All features accessible
- Drag-and-drop enabled

### Tablet (768px - 1199px)
- Collapsible sidebar
- Stacked layouts
- Touch-optimized controls
- Essential features only

### Mobile (< 768px)
- Bottom navigation
- Single column
- Read-only views
- Simplified interface

---

## Component Library Specifications

### Buttons
```
Primary:   [Action Button]     - Blue background, white text
Secondary: [Action Button]     - White background, blue border
Success:   [Action Button]     - Green background, white text
Danger:    [Action Button]     - Red background, white text
```

### Form Controls
```
Text Input:    ┌─────────────────────────┐
               │ Placeholder text        │
               └─────────────────────────┘

Dropdown:      ┌─────────────────────────┐
               │ Selected Option ▼       │
               └─────────────────────────┘

Checkbox:      ☑️ Checked option
               ☐ Unchecked option

Radio:         ● Selected option
               ○ Unselected option
```

### Navigation
```
Breadcrumb:    Home > Studies > ABC123 > Analysis Builder

Tabs:          ┌─ Active Tab ─┐ ┌─ Inactive ─┐ ┌─ Inactive ─┐

Progress:      ●●●○○○ Step 3 of 6: Method Selection
```

### Status Indicators
```
Success: ✅ Validation passed
Warning: ⚠️ 2 warnings found  
Error:   ❌ 3 errors found
Info:    ℹ️ Additional information
Loading: 🔄 Processing...
```

This wireframe specification provides the visual foundation for implementing the Clinical Trial Table Metadata System based on the comprehensive user flows already documented.