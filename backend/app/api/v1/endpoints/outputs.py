"""
Output endpoints for Clinical Trial Table Metadata System
"""

from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import output as crud_output
from app.db.session import get_db
from app.models.ars import User
from app.schemas.ars import Output, OutputCreate, OutputUpdate

router = APIRouter()


@router.get("/", response_model=dict)
def read_outputs(
    db: Session = Depends(get_db),
    params: deps.OutputQueryParams = Depends(),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve outputs.
    """
    filters = params.to_filters()
    
    # If reporting_event_id is provided, check access
    if params.reporting_event_id:
        deps.check_reporting_event_access(
            params.reporting_event_id, current_user, db, "viewer"
        )
    
    outputs = crud_output.output.get_multi(
        db,
        skip=params.skip,
        limit=params.limit,
        filters=filters,
        search=params.search,
        sort_by=params.sort_by,
        sort_order=params.sort_order
    )
    
    total_count = crud_output.output.count(
        db, 
        filters=filters,
        search=params.search
    )
    
    return deps.create_response_with_pagination(
        data=outputs,
        total_count=total_count,
        skip=params.skip,
        limit=params.limit
    )


@router.post("/", response_model=Output)
def create_output(
    *,
    db: Session = Depends(get_db),
    output_in: OutputCreate,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Create new output.
    """
    # Check access to reporting event
    deps.check_reporting_event_access(
        output_in.reporting_event_id, current_user, db, "editor"
    )
    
    output = crud_output.output.create(db, obj_in=output_in)
    return output


@router.get("/{output_id}", response_model=Output)
def read_output(
    *,
    db: Session = Depends(get_db),
    output_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get output by ID.
    """
    output = crud_output.output.get_with_relationships(
        db, id=output_id
    )
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        output.reporting_event_id, current_user, db, "viewer"
    )
    
    return output


@router.put("/{output_id}", response_model=Output)
def update_output(
    *,
    db: Session = Depends(get_db),
    output_id: str,
    output_in: OutputUpdate,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Update an existing output.
    """
    output = crud_output.output.get(db, id=output_id)
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        output.reporting_event_id, current_user, db, "editor"
    )
    
    output = crud_output.output.update(
        db, db_obj=output, obj_in=output_in
    )
    return output


@router.delete("/{output_id}")
def delete_output(
    *,
    db: Session = Depends(get_db),
    output_id: str,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Delete an output.
    """
    output = crud_output.output.get(db, id=output_id)
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        output.reporting_event_id, current_user, db, "editor"
    )
    
    crud_output.output.remove(db, id=output_id)
    return {"message": "Output deleted successfully"}


@router.post("/{output_id}/clone")
def clone_output(
    *,
    db: Session = Depends(get_db),
    output_id: str,
    new_id: str,
    new_name: str,
    reporting_event_id: str,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Clone an output.
    """
    output = crud_output.output.get(db, id=output_id)
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    # Check access to source reporting event
    deps.check_reporting_event_access(
        output.reporting_event_id, current_user, db, "viewer"
    )
    
    # Check access to target reporting event
    deps.check_reporting_event_access(
        reporting_event_id, current_user, db, "editor"
    )
    
    # Check if new ID already exists
    existing = crud_output.output.get(db, id=new_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Output with this ID already exists"
        )
    
    try:
        cloned_output = crud_output.output.clone(
            db, 
            id=output_id,
            new_id=new_id,
            new_name=new_name,
            reporting_event_id=reporting_event_id
        )
        return {"message": "Output cloned successfully", "output": cloned_output}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/{output_id}/displays")
def add_output_display(
    *,
    db: Session = Depends(get_db),
    output_id: str,
    display_data: dict,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Add a display to an output.
    """
    output = crud_output.output.get(db, id=output_id)
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        output.reporting_event_id, current_user, db, "editor"
    )
    
    display = crud_output.output.add_display(
        db, output_id=output_id, display_data=display_data
    )
    
    return {"message": "Display added successfully", "display": display}


@router.delete("/{output_id}/displays/{display_id}")
def remove_output_display(
    *,
    db: Session = Depends(get_db),
    output_id: str,
    display_id: str,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Remove a display from an output.
    """
    output = crud_output.output.get(db, id=output_id)
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        output.reporting_event_id, current_user, db, "editor"
    )
    
    success = crud_output.output.remove_display(db, display_id=display_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Display not found"
        )
    
    return {"message": "Display removed successfully"}


@router.post("/{output_id}/code-parameters")
def add_code_parameter(
    *,
    db: Session = Depends(get_db),
    output_id: str,
    name: str,
    value: str,
    description: str = None,
    label: str = None,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Add a code parameter to an output.
    """
    output = crud_output.output.get(db, id=output_id)
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        output.reporting_event_id, current_user, db, "editor"
    )
    
    parameter = crud_output.output.add_code_parameter(
        db,
        output_id=output_id,
        name=name,
        value=value,
        description=description,
        label=label
    )
    
    return {"message": "Code parameter added successfully", "parameter": parameter}


@router.put("/{output_id}/code-parameters/{parameter_id}")
def update_code_parameter(
    *,
    db: Session = Depends(get_db),
    output_id: str,
    parameter_id: UUID,
    value: str,
    description: str = None,
    label: str = None,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Update a code parameter.
    """
    output = crud_output.output.get(db, id=output_id)
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        output.reporting_event_id, current_user, db, "editor"
    )
    
    parameter = crud_output.output.update_code_parameter(
        db,
        parameter_id=parameter_id,
        value=value,
        description=description,
        label=label
    )
    
    if not parameter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Code parameter not found"
        )
    
    return {"message": "Code parameter updated successfully", "parameter": parameter}


@router.delete("/{output_id}/code-parameters/{parameter_id}")
def remove_code_parameter(
    *,
    db: Session = Depends(get_db),
    output_id: str,
    parameter_id: UUID,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Remove a code parameter from an output.
    """
    output = crud_output.output.get(db, id=output_id)
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        output.reporting_event_id, current_user, db, "editor"
    )
    
    success = crud_output.output.remove_code_parameter(db, parameter_id=parameter_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Code parameter not found"
        )
    
    return {"message": "Code parameter removed successfully"}


@router.put("/{output_id}/programming-code")
def set_programming_code(
    *,
    db: Session = Depends(get_db),
    output_id: str,
    context: str,
    code: str = None,
    document_ref_id: str = None,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Set programming code for an output.
    """
    output = crud_output.output.get(db, id=output_id)
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        output.reporting_event_id, current_user, db, "editor"
    )
    
    programming_code = crud_output.output.set_programming_code(
        db,
        output_id=output_id,
        context=context,
        code=code,
        document_ref_id=document_ref_id
    )
    
    return {"message": "Programming code set successfully", "programming_code": programming_code}


@router.post("/{output_id}/file-specifications")
def add_file_specification(
    *,
    db: Session = Depends(get_db),
    output_id: str,
    name: str,
    file_type: str,
    label: str = None,
    location: str = None,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Add a file specification to an output.
    """
    output = crud_output.output.get(db, id=output_id)
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        output.reporting_event_id, current_user, db, "editor"
    )
    
    file_spec = crud_output.output.add_file_specification(
        db,
        output_id=output_id,
        name=name,
        file_type=file_type,
        label=label,
        location=location
    )
    
    return {"message": "File specification added successfully", "file_specification": file_spec}


@router.delete("/{output_id}/file-specifications/{file_spec_id}")
def remove_file_specification(
    *,
    db: Session = Depends(get_db),
    output_id: str,
    file_spec_id: UUID,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Remove a file specification from an output.
    """
    output = crud_output.output.get(db, id=output_id)
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        output.reporting_event_id, current_user, db, "editor"
    )
    
    success = crud_output.output.remove_file_specification(db, file_spec_id=file_spec_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File specification not found"
        )
    
    return {"message": "File specification removed successfully"}


@router.get("/{output_id}/statistics")
def get_output_statistics(
    *,
    db: Session = Depends(get_db),
    output_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get statistics for an output.
    """
    output = crud_output.output.get(db, id=output_id)
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        output.reporting_event_id, current_user, db, "viewer"
    )
    
    stats = crud_output.output.get_statistics(db, id=output_id)
    return {"statistics": stats}


@router.get("/search/text")
def search_outputs(
    *,
    db: Session = Depends(get_db),
    query: str,
    reporting_event_id: str = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Search outputs by text.
    """
    # If reporting_event_id is provided, check access
    if reporting_event_id:
        deps.check_reporting_event_access(
            reporting_event_id, current_user, db, "viewer"
        )
    
    outputs = crud_output.output.search(
        db,
        query=query,
        reporting_event_id=reporting_event_id,
        skip=skip,
        limit=limit
    )
    
    return {"outputs": outputs, "count": len(outputs), "query": query}