# Template Management System

A comprehensive template management system for reusable components in the Clinical Trial Table Metadata System. This system provides full lifecycle management for templates including creation, versioning, sharing, rating, and usage analytics.

## Overview

The Template Management System allows users to:

- **Create and Edit Templates**: Build reusable templates for various types of analysis components
- **Version Management**: Track changes with semantic versioning and history
- **Categorization**: Organize templates in hierarchical categories
- **Sharing and Collaboration**: Share templates with teams and organizations
- **Rating and Reviews**: Rate and review templates for quality assessment
- **Usage Analytics**: Track template usage and performance metrics
- **Search and Discovery**: Find templates through advanced filtering and search

## Architecture

### Backend Components

#### Models (`/backend/app/models/template.py`)

- **Template**: Core template model with content, metadata, and tracking
- **TemplateCategory**: Hierarchical category system for organization
- **TemplateVersion**: Version history with semantic versioning
- **TemplateUsage**: Usage tracking for analytics
- **TemplateRating**: Rating and review system
- **Team & Organization**: Multi-tenant support structures

#### CRUD Operations (`/backend/app/crud/template.py`)

- **CRUDTemplate**: Advanced template operations with filtering and access control
- **CRUDTemplateCategory**: Category tree management
- **CRUDTemplateVersion**: Version control operations
- **CRUDTemplateUsage**: Usage analytics and tracking
- **CRUDTemplateRating**: Rating aggregation and management

#### API Endpoints (`/backend/app/api/v1/endpoints/templates.py`)

- **Template CRUD**: Create, read, update, delete templates
- **Category Management**: Hierarchical category operations
- **Version Control**: Version creation and history
- **Usage Tracking**: Analytics and statistics
- **Rating System**: Rating and review endpoints
- **Sharing**: Template sharing and access control

#### Schemas (`/backend/app/schemas/template.py`)

- Input/output validation schemas for all template operations
- Filter and pagination schemas
- Response schemas for complex data structures

### Frontend Components

#### Main Components (`/frontend/src/components/TemplateManager/`)

- **TemplateManager.tsx**: Main interface with tabbed navigation
- **TemplateLibrary.tsx**: Browse and search templates with filtering
- **TemplateEditor.tsx**: Create and edit templates with rich form interface
- **TemplatePreview.tsx**: Preview templates before use
- **CategoryManager.tsx**: Manage template categories
- **VersionHistory.tsx**: View and manage template versions
- **TemplateSharing.tsx**: Share templates with teams
- **TemplateRating.tsx**: Rate and review templates

#### Services (`/frontend/src/services/templateService.ts`)

- Complete API client for all template operations
- Helper methods for common operations
- Type-safe request/response handling

#### Hooks (`/frontend/src/hooks/useTemplate.ts`)

- React hook for template state management
- Caching and real-time updates
- Error handling and loading states

#### Types (`/frontend/src/types/template.ts`)

- Complete TypeScript type definitions
- Enums for template types, status, and access levels
- Form and validation types

## Features

### 1. Template Types

The system supports multiple template types:

- **Analysis**: Complete analysis definitions with methods and results
- **Method**: Reusable analysis methods and operations
- **Output**: Output specifications and display configurations
- **Display**: Display sections and formatting templates
- **Where Clause**: Data filtering condition templates
- **Table Shell**: Table structure and layout templates
- **Visualization**: Chart and graph templates
- **Report Section**: Complete report section templates

### 2. Template Content Structure

Templates store:
- **Content**: The actual template data structure
- **Config**: Configuration options and settings
- **Parameters**: Parameterizable fields with metadata
- **Metadata**: Keywords, compliance info, therapeutic areas

### 3. Access Control

Three levels of access control:
- **Private**: Only creator can access
- **Team**: Team members can access
- **Organization**: Organization members can access  
- **Public**: Anyone can access

### 4. Version Management

- Semantic versioning (major.minor.patch)
- Change summaries and release notes
- Version comparison and restoration
- History tracking with creator attribution

### 5. Rating System

Multi-dimensional rating system:
- Overall rating (1-5 stars)
- Detailed ratings: Ease of use, Documentation, Flexibility, Performance
- Text reviews and comments
- Helpful/unhelpful voting

### 6. Usage Analytics

Comprehensive usage tracking:
- Total usage count and unique users
- Usage trends over time
- Performance metrics (execution time)
- Usage context and target tracking

### 7. Search and Discovery

Advanced search capabilities:
- Full-text search across name, description, keywords
- Filter by type, status, category, rating
- Sort by relevance, popularity, rating, date
- Quick access to popular and recent templates

## Usage Examples

### Creating a Template

```typescript
import { useTemplate } from '../../hooks/useTemplate';
import { TemplateType, TemplateStatus } from '../../types/template';

const { createTemplate } = useTemplate();

const newTemplate = await createTemplate({
  name: "Standard Demographics Table",
  description: "Standard demographics summary table template",
  type: TemplateType.ANALYSIS,
  content: {
    analysisDefinition: {
      // Analysis structure
    },
    parameters: {
      // Configurable parameters
    }
  },
  status: TemplateStatus.PUBLISHED,
  keywords: ["demographics", "summary", "table"],
  therapeuticAreas: ["General"]
});
```

### Using the Template Manager

```typescript
import { TemplateManager } from '../../components/TemplateManager';

function MyComponent() {
  return (
    <TemplateManager
      defaultType={TemplateType.ANALYSIS}
      onTemplateSelect={(template) => {
        // Handle template selection
        console.log('Selected template:', template);
      }}
    />
  );
}
```

### Searching Templates

```typescript
const { searchTemplates, filterTemplates } = useTemplate();

// Search by query
const results = await searchTemplates("demographics", {
  type: TemplateType.ANALYSIS,
  status: TemplateStatus.PUBLISHED,
  minRating: 4.0
});

// Apply filters
const filtered = filterTemplates({
  therapeuticAreas: ["Oncology"],
  regulatoryCompliance: ["FDA"]
});
```

## Database Schema

### Key Tables

- `templates`: Main template storage
- `template_categories`: Hierarchical category system  
- `template_versions`: Version history
- `template_usages`: Usage tracking
- `template_ratings`: Rating and review system
- `template_tags`: Template keyword tags
- `template_team_access`: Team-based access control

### Indexes

- Full-text search indexes on name, description
- Composite indexes for filtering performance
- GIN indexes for array fields (keywords, compliance)

## API Endpoints

### Template Operations
- `GET /api/v1/templates` - List templates with filtering
- `POST /api/v1/templates` - Create template
- `GET /api/v1/templates/{id}` - Get template
- `PUT /api/v1/templates/{id}` - Update template
- `DELETE /api/v1/templates/{id}` - Delete template
- `POST /api/v1/templates/{id}/clone` - Clone template

### Category Operations
- `GET /api/v1/templates/categories` - List categories
- `GET /api/v1/templates/categories/tree` - Category tree
- `POST /api/v1/templates/categories` - Create category
- `PUT /api/v1/templates/categories/{id}` - Update category

### Version Operations
- `POST /api/v1/templates/{id}/versions` - Create version
- `GET /api/v1/templates/{id}/versions` - List versions
- `GET /api/v1/templates/versions/{id}` - Get version

### Analytics Operations
- `POST /api/v1/templates/{id}/usage` - Track usage
- `GET /api/v1/templates/{id}/usage/stats` - Usage statistics

### Rating Operations
- `POST /api/v1/templates/{id}/ratings` - Rate template
- `GET /api/v1/templates/{id}/ratings` - List ratings
- `GET /api/v1/templates/{id}/ratings/summary` - Rating summary

## Security Considerations

- JWT-based authentication for all operations
- Role-based access control (admin, editor, viewer)
- Template-level access control (private, team, org, public)
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- Cross-site scripting (XSS) prevention

## Performance Optimizations

- Database indexes for fast querying
- Client-side caching with React hooks
- Pagination for large result sets
- Lazy loading of template content
- Debounced search queries
- Optimistic updates for better UX

## Future Enhancements

1. **AI-Powered Recommendations**: Suggest templates based on usage patterns
2. **Template Marketplace**: Public marketplace for sharing templates
3. **Automated Testing**: Template validation and testing framework
4. **Integration APIs**: Connect with external template systems
5. **Advanced Analytics**: Machine learning insights on template usage
6. **Collaborative Editing**: Real-time collaborative template editing
7. **Template Workflows**: Approval workflows for template publishing
8. **Backup and Restore**: Template backup and disaster recovery

## Contributing

1. Follow the existing code style and patterns
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure backward compatibility for schema changes
5. Add migration scripts for database updates

## License

This template management system is part of the Clinical Trial Table Metadata System and follows the same licensing terms.