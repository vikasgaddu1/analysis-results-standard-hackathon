"""
CRUD operations for Output model
"""

from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func, or_

from app.crud.base import CRUDBase
from app.models.ars import (
    Output, Display, DisplaySection, DisplaySubSection, OutputProgrammingCode,
    OutputCodeParameter, OutputFileSpecification, AnalysisOutputCategory
)
from app.schemas.ars import OutputCreate, OutputUpdate


class CRUDOutput(CRUDBase[Output, OutputCreate, OutputUpdate]):
    """CRUD operations for Output model"""
    
    def get_with_relationships(self, db: Session, *, id: str) -> Optional[Output]:
        """
        Get output with all relationships loaded.
        
        Args:
            db: Database session
            id: Output ID
            
        Returns:
            Output with relationships or None
        """
        return db.query(Output).options(
            joinedload(Output.displays).joinedload(Display.display_sections),
            joinedload(Output.programming_code),
            joinedload(Output.code_parameters),
            joinedload(Output.file_specifications)
        ).filter(Output.id == id).first()

    def get_by_reporting_event(
        self, 
        db: Session, 
        *, 
        reporting_event_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Output]:
        """
        Get outputs for a specific reporting event.
        
        Args:
            db: Database session
            reporting_event_id: ReportingEvent ID
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of outputs
        """
        return db.query(Output).filter(
            Output.reporting_event_id == reporting_event_id
        ).offset(skip).limit(limit).all()

    def get_by_category(
        self, 
        db: Session, 
        *, 
        category_id: str,
        reporting_event_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Output]:
        """
        Get outputs with a specific category.
        
        Args:
            db: Database session
            category_id: Category ID
            reporting_event_id: Optional reporting event filter
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of outputs
        """
        query = db.query(Output).filter(
            Output.category_ids.contains([category_id])
        )
        
        if reporting_event_id:
            query = query.filter(Output.reporting_event_id == reporting_event_id)
        
        return query.offset(skip).limit(limit).all()

    def search(
        self, 
        db: Session, 
        *, 
        query: str,
        reporting_event_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Output]:
        """
        Search outputs by text.
        
        Args:
            db: Database session
            query: Search query
            reporting_event_id: Optional reporting event filter
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of matching outputs
        """
        search_filter = or_(
            Output.name.ilike(f"%{query}%"),
            Output.description.ilike(f"%{query}%"),
            Output.label.ilike(f"%{query}%"),
            Output.id.ilike(f"%{query}%")
        )
        
        db_query = db.query(Output).filter(search_filter)
        
        if reporting_event_id:
            db_query = db_query.filter(Output.reporting_event_id == reporting_event_id)
        
        return db_query.offset(skip).limit(limit).all()

    def add_display(
        self, 
        db: Session, 
        *, 
        output_id: str,
        display_data: Dict[str, Any]
    ) -> Display:
        """
        Add a display to an output.
        
        Args:
            db: Database session
            output_id: Output ID
            display_data: Display creation data
            
        Returns:
            Created display
        """
        display = Display(
            id=display_data['id'],
            output_id=output_id,
            name=display_data['name'],
            description=display_data.get('description'),
            label=display_data.get('label'),
            version=display_data.get('version'),
            display_title=display_data.get('display_title'),
            order_num=display_data['order_num']
        )
        
        db.add(display)
        db.flush()
        
        # Add display sections if provided
        if 'display_sections' in display_data:
            for section_data in display_data['display_sections']:
                section = DisplaySection(
                    display_id=display.id,
                    section_type=section_data['section_type'],
                    order_num=section_data['order_num']
                )
                db.add(section)
        
        db.commit()
        db.refresh(display)
        return display

    def remove_display(self, db: Session, *, display_id: str) -> bool:
        """
        Remove a display from an output.
        
        Args:
            db: Database session
            display_id: Display ID
            
        Returns:
            True if display was removed
        """
        display = db.query(Display).filter(Display.id == display_id).first()
        if display:
            db.delete(display)
            db.commit()
            return True
        return False

    def add_code_parameter(
        self, 
        db: Session, 
        *, 
        output_id: str,
        name: str,
        value: str,
        description: Optional[str] = None,
        label: Optional[str] = None
    ) -> OutputCodeParameter:
        """
        Add a code parameter to an output.
        
        Args:
            db: Database session
            output_id: Output ID
            name: Parameter name
            value: Parameter value
            description: Parameter description
            label: Parameter label
            
        Returns:
            Created code parameter
        """
        parameter = OutputCodeParameter(
            output_id=output_id,
            name=name,
            value=value,
            description=description,
            label=label
        )
        
        db.add(parameter)
        db.commit()
        db.refresh(parameter)
        return parameter

    def update_code_parameter(
        self, 
        db: Session, 
        *, 
        parameter_id: UUID,
        value: str,
        description: Optional[str] = None,
        label: Optional[str] = None
    ) -> Optional[OutputCodeParameter]:
        """
        Update a code parameter.
        
        Args:
            db: Database session
            parameter_id: Parameter ID
            value: New parameter value
            description: New parameter description
            label: New parameter label
            
        Returns:
            Updated parameter or None if not found
        """
        parameter = db.query(OutputCodeParameter).filter(
            OutputCodeParameter.id == parameter_id
        ).first()
        
        if parameter:
            parameter.value = value
            if description is not None:
                parameter.description = description
            if label is not None:
                parameter.label = label
            
            db.commit()
            db.refresh(parameter)
        
        return parameter

    def remove_code_parameter(self, db: Session, *, parameter_id: UUID) -> bool:
        """
        Remove a code parameter from an output.
        
        Args:
            db: Database session
            parameter_id: Parameter ID
            
        Returns:
            True if parameter was removed
        """
        parameter = db.query(OutputCodeParameter).filter(
            OutputCodeParameter.id == parameter_id
        ).first()
        
        if parameter:
            db.delete(parameter)
            db.commit()
            return True
        return False

    def set_programming_code(
        self, 
        db: Session, 
        *, 
        output_id: str,
        context: str,
        code: Optional[str] = None,
        document_ref_id: Optional[str] = None
    ) -> OutputProgrammingCode:
        """
        Set programming code for an output.
        
        Args:
            db: Database session
            output_id: Output ID
            context: Code context
            code: Programming code text
            document_ref_id: Reference document ID
            
        Returns:
            Created or updated programming code
        """
        # Check if programming code already exists
        existing_code = db.query(OutputProgrammingCode).filter(
            OutputProgrammingCode.output_id == output_id
        ).first()
        
        if existing_code:
            # Update existing
            existing_code.context = context
            existing_code.code = code
            existing_code.document_ref_id = document_ref_id
            db.commit()
            db.refresh(existing_code)
            return existing_code
        else:
            # Create new
            programming_code = OutputProgrammingCode(
                output_id=output_id,
                context=context,
                code=code,
                document_ref_id=document_ref_id
            )
            db.add(programming_code)
            db.commit()
            db.refresh(programming_code)
            return programming_code

    def add_file_specification(
        self, 
        db: Session, 
        *, 
        output_id: str,
        name: str,
        file_type: str,
        label: Optional[str] = None,
        location: Optional[str] = None
    ) -> OutputFileSpecification:
        """
        Add a file specification to an output.
        
        Args:
            db: Database session
            output_id: Output ID
            name: File name
            file_type: File type
            label: File label
            location: File location
            
        Returns:
            Created file specification
        """
        file_spec = OutputFileSpecification(
            output_id=output_id,
            name=name,
            file_type=file_type,
            label=label,
            location=location
        )
        
        db.add(file_spec)
        db.commit()
        db.refresh(file_spec)
        return file_spec

    def remove_file_specification(self, db: Session, *, file_spec_id: UUID) -> bool:
        """
        Remove a file specification from an output.
        
        Args:
            db: Database session
            file_spec_id: File specification ID
            
        Returns:
            True if file specification was removed
        """
        file_spec = db.query(OutputFileSpecification).filter(
            OutputFileSpecification.id == file_spec_id
        ).first()
        
        if file_spec:
            db.delete(file_spec)
            db.commit()
            return True
        return False

    def clone(
        self, 
        db: Session, 
        *, 
        id: str,
        new_id: str,
        new_name: str,
        reporting_event_id: str
    ) -> Output:
        """
        Clone an output to a new output.
        
        Args:
            db: Database session
            id: Source Output ID
            new_id: New Output ID
            new_name: New name
            reporting_event_id: Target reporting event ID
            
        Returns:
            Cloned output
        """
        source = self.get_with_relationships(db, id=id)
        if not source:
            raise ValueError(f"Output {id} not found")
        
        # Create new output
        new_output = Output(
            id=new_id,
            reporting_event_id=reporting_event_id,
            name=new_name,
            description=source.description,
            label=source.label,
            version=source.version,
            category_ids=source.category_ids.copy() if source.category_ids else None
        )
        
        db.add(new_output)
        db.flush()
        
        # Clone programming code
        if source.programming_code:
            new_code = OutputProgrammingCode(
                output_id=new_output.id,
                context=source.programming_code.context,
                code=source.programming_code.code,
                document_ref_id=source.programming_code.document_ref_id
            )
            db.add(new_code)
        
        # Clone code parameters
        for param in source.code_parameters:
            new_param = OutputCodeParameter(
                output_id=new_output.id,
                name=param.name,
                description=param.description,
                label=param.label,
                value=param.value
            )
            db.add(new_param)
        
        # Clone file specifications
        for file_spec in source.file_specifications:
            new_spec = OutputFileSpecification(
                output_id=new_output.id,
                name=file_spec.name,
                label=file_spec.label,
                file_type=file_spec.file_type,
                location=file_spec.location
            )
            db.add(new_spec)
        
        # Clone displays (simplified - full implementation would clone all nested structures)
        for display in source.displays:
            new_display = Display(
                id=f"{new_output.id}_{display.id}",
                output_id=new_output.id,
                name=display.name,
                description=display.description,
                label=display.label,
                version=display.version,
                display_title=display.display_title,
                order_num=display.order_num
            )
            db.add(new_display)
        
        db.commit()
        db.refresh(new_output)
        return new_output

    def get_statistics(self, db: Session, *, id: str) -> Dict[str, Any]:
        """
        Get statistics for an output.
        
        Args:
            db: Database session
            id: Output ID
            
        Returns:
            Dictionary with output statistics
        """
        stats = {}
        
        # Count displays
        stats['display_count'] = db.query(func.count(Display.id)).filter(
            Display.output_id == id
        ).scalar()
        
        # Count code parameters
        stats['parameter_count'] = db.query(func.count(OutputCodeParameter.id)).filter(
            OutputCodeParameter.output_id == id
        ).scalar()
        
        # Count file specifications
        stats['file_spec_count'] = db.query(func.count(OutputFileSpecification.id)).filter(
            OutputFileSpecification.output_id == id
        ).scalar()
        
        # Check if has programming code
        stats['has_programming_code'] = db.query(OutputProgrammingCode).filter(
            OutputProgrammingCode.output_id == id
        ).first() is not None
        
        return stats


output = CRUDOutput(Output)