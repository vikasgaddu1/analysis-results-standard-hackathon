# Quick Start Guide - Clinical Trial Table Metadata System

## Welcome! 🎉

This guide will help you get up and running with the Clinical Trial Table Metadata System in just a few minutes.

## Table of Contents
- [What You'll Learn](#what-youll-learn)
- [Prerequisites](#prerequisites)
- [Step 1: Account Setup](#step-1-account-setup)
- [Step 2: Create Your First Analysis](#step-2-create-your-first-analysis)
- [Step 3: Design a Table](#step-3-design-a-table)
- [Step 4: Export Your Work](#step-4-export-your-work)
- [Next Steps](#next-steps)

## What You'll Learn

In this 15-minute tutorial, you'll:
- Set up your user account and workspace
- Create a complete analysis specification
- Design a professional table layout
- Export your work for use in statistical programming

## Prerequisites

- Access to the Clinical Trial Table Metadata System
- Basic knowledge of clinical trials and statistical analysis
- A modern web browser (Chrome, Firefox, Safari, or Edge)

## Step 1: Account Setup

### 1.1 Log In or Register

1. Navigate to the application URL
2. If you're a new user, click **"Sign Up"**
   - Fill in your details
   - Choose a strong password
   - Verify your email address
3. If you have an account, click **"Log In"**
   - Enter your credentials

### 1.2 Complete Your Profile

1. Click on your name in the top-right corner
2. Select **"Profile Settings"**
3. Complete your profile information:
   - Full name
   - Organization
   - Role (Statistical Programmer, Biostatistician, etc.)
   - Contact information

### 1.3 Join or Create a Workspace

1. Go to **Dashboard**
2. Click **"Create New Project"** or join an existing one
3. Set up your project:
   - Project name: "Quick Start Demo"
   - Description: "Learning the system basics"
   - Choose privacy settings

## Step 2: Create Your First Analysis

### 2.1 Start the Analysis Builder

1. From the Dashboard, click **"Analysis Builder"**
2. Click **"Create New Analysis"**

### 2.2 Basic Information (Step 1 of 6)

Fill in the following details:
- **Analysis ID**: `DEMO_01`
- **Version**: `1.0`
- **Analysis Name**: `Demographics Summary - Age`
- **Description**: `Descriptive statistics for age by treatment group`
- **Reason**: Select `SPECIFIED` from dropdown
- **Purpose**: Select `PRIMARY_OUTCOME_MEASURE` from dropdown

Click **"Next"** to continue.

### 2.3 Analysis Set (Step 2 of 6)

1. Click **"Create New Analysis Set"**
2. Enter:
   - **ID**: `ITT_SET`
   - **Label**: `Intent-to-Treat Population`
   - **Level**: `1`
   - **Order**: `1`

Click **"Next"** to continue.

### 2.4 Where Clause (Step 3 of 6)

1. Click **"Create New Where Clause"**
2. Enter:
   - **ID**: `ITT_WHERE`
   - **Label**: `ITT Population Filter`
   - **Level**: `1`
   - **Order**: `1`

3. In the condition builder:
   - **Dataset**: `ADSL`
   - **Variable**: `ITTFL`
   - **Comparator**: `EQ` (equals)
   - **Value**: `Y`

4. Click **"Test Condition"** to validate
5. Click **"Save to Library"**

Click **"Next"** to continue.

### 2.5 Grouping (Step 4 of 6)

1. Click **"Add Grouping Factor"**
2. Enter:
   - **ID**: `TRT_GROUP`
   - **Label**: `Treatment Group`
   - **Grouping Variable**: `TRT01P`
   - **Grouping Dataset**: `ADSL`

3. Add groups:
   - Group 1: Label `Placebo`, Order `1`
   - Group 2: Label `Active Treatment`, Order `2`

Click **"Next"** to continue.

### 2.6 Method (Step 5 of 6)

1. Click **"Browse Method Library"**
2. Search for "mean" in the search box
3. Select **"Descriptive Statistics - Mean and SD"**
4. Review the method details
5. Click **"Use This Method"**

Click **"Next"** to continue.

### 2.7 Results (Step 6 of 6)

1. Review the analysis configuration
2. The system will show a preview of expected results
3. Verify all information is correct
4. Click **"Create Analysis"**

🎉 **Congratulations!** You've created your first analysis specification.

## Step 3: Design a Table

### 3.1 Open Table Designer

1. From the main navigation, click **"Table Designer"**
2. Click **"Create New Table"**

### 3.2 Basic Table Information

Enter the following:
- **Table ID**: `TBL_DEMO_01`
- **Version**: `1.0`
- **Table Name**: `Demographics Table - Age`
- **File Type**: Select `RTF`

### 3.3 Choose a Template

1. Click **"Browse Templates"**
2. Select **"Demographics Summary Table"**
3. Click **"Use Template"**

### 3.4 Customize the Table

1. **Table Title**: 
   - Change to "Table 1: Demographics - Age by Treatment Group"

2. **Column Headers**:
   - Column 1: "Statistic"
   - Column 2: "Placebo (N=XX)"
   - Column 3: "Active Treatment (N=XX)"
   - Column 4: "Total (N=XX)"

3. **Row Structure**:
   - Row 1: "n"
   - Row 2: "Mean (SD)"
   - Row 3: "Median"
   - Row 4: "Min, Max"

### 3.5 Apply Styling

1. Click **"Styling"** tab
2. Choose the **"Clinical Standard"** theme
3. Adjust:
   - Font: Times New Roman, 10pt
   - Borders: Light grid lines
   - Alignment: Center headers, left-align statistics

### 3.6 Preview and Save

1. Click **"Preview"** to see your table
2. Make any final adjustments
3. Click **"Save Table"**

## Step 4: Export Your Work

### 4.1 Select Items to Export

1. Go to **"Import/Export"** from the main navigation
2. Click **"Export"** tab
3. Select the items you created:
   - ☑️ Analysis: `DEMO_01`
   - ☑️ Table: `TBL_DEMO_01`
   - ☑️ Where Clause: `ITT_WHERE`

### 4.2 Choose Export Format

1. **Format**: Select `YAML` (recommended for readability)
2. **Options**:
   - ☑️ Include dependencies
   - ☑️ Include metadata
   - ☑️ Validate before export

### 4.3 Download Your Export

1. Click **"Generate Export"**
2. Wait for processing (usually under 30 seconds)
3. Click **"Download"** when ready
4. Save the file as `demo_analysis_export.yaml`

### 4.4 View Your Export

Open the downloaded file in a text editor to see your complete analysis specification in YAML format:

```yaml
reporting_events:
  - id: "DEMO_RE"
    name: "Demo Reporting Event"
    analyses:
      - id: "DEMO_01"
        name: "Demographics Summary - Age"
        description: "Descriptive statistics for age by treatment group"
        method_id: "MEAN_SD"
        where_clause_id: "ITT_WHERE"
        # ... complete specification
```

## Next Steps

🎯 **You're ready to explore more!** Here's what to try next:

### Immediate Next Steps (10-15 minutes each)

1. **Create More Analyses**
   - Try different statistical methods
   - Create analyses for other variables (SEX, RACE, WEIGHT)
   - Experiment with different grouping factors

2. **Explore Templates**
   - Browse the template library
   - Create your own custom template
   - Share templates with team members

3. **Advanced Where Clauses**
   - Create compound conditions (AND/OR logic)
   - Test conditions with sample data
   - Build a library of reusable conditions

### Intermediate Features (30-45 minutes each)

4. **Collaboration Features**
   - Invite team members to your project
   - Use version control to track changes
   - Review and approve changes

5. **Validation and Compliance**
   - Run comprehensive validation checks
   - Review compliance reports
   - Fix validation issues

6. **Import External Data**
   - Import Excel templates
   - Convert legacy analysis specifications
   - Bulk import multiple analyses

### Advanced Integration (1-2 hours)

7. **API Integration**
   - Connect with SAS/R/Python environments
   - Set up automated workflows
   - Build custom integrations

8. **Custom Methods**
   - Create organization-specific methods
   - Build parameterized code templates
   - Share methods across projects

## Getting Help

### Built-in Help
- Press **F1** anywhere in the application for context-sensitive help
- Look for the **"?"** icons next to form fields
- Check the **"Examples"** section in each module

### Documentation
- **User Guide**: Comprehensive feature documentation
- **API Documentation**: For developers and integrators
- **Video Tutorials**: Step-by-step walkthroughs

### Support
- **Knowledge Base**: Searchable articles and FAQs
- **Community Forum**: Connect with other users
- **Help Desk**: Submit support tickets
- **Training**: Live webinars and training sessions

### Quick Reference Card

Keep this handy reference nearby:

| Task | Location | Shortcut |
|------|----------|----------|
| Create Analysis | Analysis Builder | None |
| Create Table | Table Designer | None |
| Search | Top navigation | Ctrl+/ |
| Save Current Work | Anywhere | Ctrl+S |
| Help | Anywhere | F1 |
| Export | Import/Export | None |
| Validate | Any form | Auto |

## Common First-Time Questions

**Q: Can I undo changes?**
A: Yes! Use Ctrl+Z to undo, or check the version history for any item.

**Q: Where is my work saved?**
A: Everything is automatically saved to the cloud. You can also export local copies.

**Q: Can I work offline?**
A: The system requires internet connection, but you can export files to work offline.

**Q: How do I share my work?**
A: Use the collaboration features to share with team members, or export files to share externally.

**Q: Is my data secure?**
A: Yes, the system uses enterprise-grade security. No actual patient data should be entered.

**Q: Can I import my existing analyses?**
A: Yes, use the Import feature to bring in Excel, YAML, or JSON files.

---

**Congratulations! 🎉** You've completed the quick start guide and created your first complete analysis specification. You're now ready to explore the full power of the Clinical Trial Table Metadata System.

**Total time invested**: ~15 minutes  
**Skills gained**: Account setup, analysis creation, table design, export functionality  
**Next milestone**: Create 5 more analyses using different methods and templates

Happy analyzing! 📊