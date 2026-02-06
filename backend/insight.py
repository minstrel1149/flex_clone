from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
import pandas as pd
import json
import os
import importlib.util

from services.insight.config import (
    PROPOSAL_GROUPS, 
    PROPOSAL_TITLES, 
    DIMENSION_CONFIG, 
    PROPOSAL_FILTER_FORMATS,
    BASE_DIMENSION_OPTIONS,
    PROPOSAL_DATA_FUNCTION_NAMES,
    FILTER_PLACEHOLDERS
)
from services.insight.loader import load_all_base_data
from services.insight import preparer

router = APIRouter(prefix="/api/insight", tags=["insight"])

# Global data bundle (cached in memory)
_data_bundle = None

def get_data_bundle():
    global _data_bundle
    if _data_bundle is None:
        _data_bundle = load_all_base_data()
    return _data_bundle

@router.get("/groups")
async def get_insight_groups():
    return {
        "groups": PROPOSAL_GROUPS,
        "titles": PROPOSAL_TITLES
    }

@router.get("/dimensions/{proposal_id}")
async def get_dimensions(proposal_id: str):
    format_type = PROPOSAL_FILTER_FORMATS.get(proposal_id, "FORMAT_A")
    
    if format_type == "FORMAT_C":
        options = ["개요", "전체"]
    elif format_type in ["FORMAT_A", "FORMAT_B"]:
        options = ["개요"] + BASE_DIMENSION_OPTIONS
    else: # A-b, B-b
        options = ["개요", "전체"] + BASE_DIMENSION_OPTIONS
        
    return {"options": options}

@router.get("/drilldown/{proposal_id}/{dimension}")
async def get_drilldown(proposal_id: str, dimension: str):
    if dimension == "개요":
        return {"options": ["전체"]}
    
    config = DIMENSION_CONFIG.get(dimension, {})
    if config.get("type") != "hierarchical":
        return {"options": ["전체"]}
    
    # For hierarchical, we need to get unique values from the top column
    top_col = config.get("top")
    
    # We use a generic data bundle to get categories
    # In a real app, we might want to use the specific proposal data
    # but for drilldown options list, the global snapshot is usually enough.
    snapshot = preparer._get_current_employee_snapshot()
    if top_col in snapshot.columns:
        unique_values = sorted(snapshot[top_col].dropna().unique().tolist())
        return {"options": ["전체"] + unique_values}
    
    return {"options": ["전체"]}

@router.get("/view/{proposal_id}")
async def get_view(
    proposal_id: str,
    dimension: str = "전체",
    drilldown: str = "전체"
):
    # 1. Get data preparation function
    func_name = PROPOSAL_DATA_FUNCTION_NAMES.get(proposal_id)
    if not func_name:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    prepare_func = getattr(preparer, func_name, None)
    if not prepare_func:
        raise HTTPException(status_code=500, detail=f"Preparation function {func_name} not found")
    
    # 2. Prepare data (using default global filters for now)
    try:
        data_result = prepare_func()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error preparing data: {str(e)}")
    
    # Handle different return structures from preparer functions
    if isinstance(data_result, dict) and "data_bundle" in data_result:
        actual_data_bundle = data_result["data_bundle"]
        order_map = data_result.get("order_map", {})
    elif isinstance(data_result, dict):
        actual_data_bundle = data_result
        order_map = data_result.get("order_map", preparer.order_map)
    else:
        actual_data_bundle = data_result
        order_map = preparer.order_map

    # 3. Load view module
    module_name = f"{proposal_id}_view"
    module_path = os.path.join("services", "insight", "views", f"{module_name}.py")
    
    if not os.path.exists(module_path):
        raise HTTPException(status_code=404, detail=f"View module {module_name} not found")
        
    spec = importlib.util.spec_from_file_location(module_name, module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    
    if not hasattr(module, "create_figure_and_df"):
        raise HTTPException(status_code=500, detail="View module missing create_figure_and_df")
    
    # 4. Execute view function
    try:
        view_result = module.create_figure_and_df(
            data_bundle=actual_data_bundle,
            dimension_ui_name=dimension,
            drilldown_selection=drilldown,
            dimension_config=DIMENSION_CONFIG,
            order_map=order_map
        )
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error executing view: {str(e)}")

    # 5. Format result
    if isinstance(view_result, dict) and view_result.get("type") == "tabs":
        # Already formatted (like our refactored basic_proposal_view)
        return view_result
    
    fig, df = view_result
    
    return {
        "type": "single",
        "fig": fig.to_dict() if fig else None,
        "df": df.to_dict(orient="records") if df is not None else None,
        "df_columns": df.columns.tolist() if df is not None else []
    }
