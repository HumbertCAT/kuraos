"""ServiceType CRUD endpoints for the Booking Engine."""

from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.base import get_db
from app.db.models import ServiceType, ServiceMode, FormTemplate
from app.api.deps import CurrentUser

router = APIRouter()


# ============ SCHEMAS ============


class ServiceTypeCreate(BaseModel):
    """Schema for creating a new service type."""

    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    kind: ServiceMode = ServiceMode.ONE_ON_ONE
    duration_minutes: int = Field(60, ge=15, le=10080)  # Max 7 days
    price: float = Field(0.0, ge=0)
    currency: str = Field("EUR", max_length=3)
    capacity: int = Field(1, ge=1, le=500)
    intake_form_id: Optional[uuid.UUID] = None
    schedule_id: Optional[uuid.UUID] = None
    requires_approval: bool = False


class ServiceTypeUpdate(BaseModel):
    """Schema for updating a service type."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    kind: Optional[ServiceMode] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=10080)  # Max 7 days
    price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    capacity: Optional[int] = Field(None, ge=1, le=500)
    intake_form_id: Optional[uuid.UUID] = None
    schedule_id: Optional[uuid.UUID] = None
    requires_approval: Optional[bool] = None
    is_active: Optional[bool] = None


class ServiceTypeResponse(BaseModel):
    """Schema for service type response."""

    id: uuid.UUID
    organization_id: uuid.UUID
    title: str
    description: Optional[str]
    kind: ServiceMode
    duration_minutes: int
    price: float
    currency: str
    capacity: int
    intake_form_id: Optional[uuid.UUID]
    schedule_id: Optional[uuid.UUID]
    requires_approval: bool
    is_active: bool

    # Nested form info (title only)
    intake_form_title: Optional[str] = None

    model_config = {"from_attributes": True}


class ServiceTypeListResponse(BaseModel):
    """Schema for paginated service type list."""

    services: list[ServiceTypeResponse]
    total: int
    page: int
    per_page: int


# ============ ENDPOINTS ============


@router.get("/", response_model=ServiceTypeListResponse, summary="List service types")
async def list_services(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    active_only: bool = Query(True, description="Filter to active services only"),
):
    """
    List all service types for the current user's organization.
    Supports pagination and active filtering.
    """
    query = select(ServiceType).where(
        ServiceType.organization_id == current_user.organization_id
    )

    if active_only:
        query = query.where(ServiceType.is_active == True)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    query = query.offset((page - 1) * per_page).limit(per_page)
    query = query.order_by(ServiceType.created_at.desc())

    result = await db.execute(query)
    services = result.scalars().all()

    # Build response with intake form titles
    response_services = []
    for service in services:
        service_dict = ServiceTypeResponse.model_validate(service)
        if service.intake_form_id:
            form_result = await db.execute(
                select(FormTemplate.title).where(
                    FormTemplate.id == service.intake_form_id
                )
            )
            form_title = form_result.scalar_one_or_none()
            service_dict.intake_form_title = form_title
        response_services.append(service_dict)

    return ServiceTypeListResponse(
        services=response_services,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post(
    "/",
    response_model=ServiceTypeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create service type",
)
async def create_service(
    service_data: ServiceTypeCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new service type in the current user's organization.
    """
    # Validate intake_form_id if provided
    if service_data.intake_form_id:
        form_result = await db.execute(
            select(FormTemplate).where(
                FormTemplate.id == service_data.intake_form_id,
                # Form must belong to same org or be a system template
                (FormTemplate.organization_id == current_user.organization_id)
                | (FormTemplate.organization_id.is_(None)),
            )
        )
        if not form_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid intake form ID",
            )

    service = ServiceType(
        **service_data.model_dump(),
        organization_id=current_user.organization_id,
    )
    db.add(service)
    await db.commit()
    await db.refresh(service)

    return ServiceTypeResponse.model_validate(service)


@router.get(
    "/{service_id}", response_model=ServiceTypeResponse, summary="Get service type"
)
async def get_service(
    service_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific service type by ID.
    Only returns services from the current user's organization.
    """
    result = await db.execute(
        select(ServiceType).where(
            ServiceType.id == service_id,
            ServiceType.organization_id == current_user.organization_id,
        )
    )
    service = result.scalar_one_or_none()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service type not found",
        )

    response = ServiceTypeResponse.model_validate(service)
    if service.intake_form_id:
        form_result = await db.execute(
            select(FormTemplate.title).where(FormTemplate.id == service.intake_form_id)
        )
        response.intake_form_title = form_result.scalar_one_or_none()

    return response


@router.put(
    "/{service_id}", response_model=ServiceTypeResponse, summary="Update service type"
)
async def update_service(
    service_id: uuid.UUID,
    service_data: ServiceTypeUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Update an existing service type.
    Only updates services from the current user's organization.
    """
    result = await db.execute(
        select(ServiceType).where(
            ServiceType.id == service_id,
            ServiceType.organization_id == current_user.organization_id,
        )
    )
    service = result.scalar_one_or_none()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service type not found",
        )

    # Validate intake_form_id if being updated
    update_data = service_data.model_dump(exclude_unset=True)
    if "intake_form_id" in update_data and update_data["intake_form_id"]:
        form_result = await db.execute(
            select(FormTemplate).where(
                FormTemplate.id == update_data["intake_form_id"],
                (FormTemplate.organization_id == current_user.organization_id)
                | (FormTemplate.organization_id.is_(None)),
            )
        )
        if not form_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid intake form ID",
            )

    for field, value in update_data.items():
        setattr(service, field, value)

    await db.commit()
    await db.refresh(service)

    return ServiceTypeResponse.model_validate(service)


@router.delete(
    "/{service_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete service type",
)
async def delete_service(
    service_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a service type.
    Only deletes services from the current user's organization.
    Note: Consider soft-delete (is_active=False) for services with existing bookings.
    """
    result = await db.execute(
        select(ServiceType).where(
            ServiceType.id == service_id,
            ServiceType.organization_id == current_user.organization_id,
        )
    )
    service = result.scalar_one_or_none()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service type not found",
        )

    # TODO: Check for existing bookings and warn/prevent deletion
    await db.delete(service)
    await db.commit()

    return None
