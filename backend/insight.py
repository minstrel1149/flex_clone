from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
import json
import os
import importlib.util
import datetime

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

# 프로젝트 루트 경로 확보
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

# Global data bundle (cached in memory)
_data_bundle = None
# Global module cache
_cached_modules = {}

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
    try:
        snapshot = preparer._get_current_employee_snapshot()
        if top_col in snapshot.columns:
            unique_values = sorted(snapshot[top_col].dropna().unique().tolist())
            return {"options": ["전체"] + unique_values}
    except Exception as e:
        print(f"DEBUG: Error in get_drilldown: {e}")
    
    return {"options": ["전체"]}

@router.get("/view/{proposal_id}")
async def get_view(
    proposal_id: str,
    dimension: str = "전체",
    drilldown: str = "전체"
):
    print(f"DEBUG: get_view called for {proposal_id}, dimension={dimension}, drilldown={drilldown}")
    
    # 1. Get data preparation function
    func_name = PROPOSAL_DATA_FUNCTION_NAMES.get(proposal_id)
    if not func_name:
        print(f"DEBUG: Proposal {proposal_id} not found in config")
        raise HTTPException(status_code=404, detail=f"Proposal {proposal_id} not found in config")
    
    prepare_func = getattr(preparer, func_name, None)
    if not prepare_func:
        print(f"DEBUG: Preparation function {func_name} not found in preparer")
        raise HTTPException(status_code=500, detail=f"Preparation function {func_name} not found in preparer")
    
    # 2. Prepare data
    try:
        data_result = prepare_func()
        if data_result is None:
            data_result = {}
    except Exception as e:
        import traceback
        err_msg = f"Error in {func_name}: {str(e)}"
        print(f"DEBUG: {err_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=err_msg)

    # 데이터 결과에서 실제 번들과 순서 정보 추출
    if isinstance(data_result, dict):
        actual_data_bundle = data_result.get("data_bundle", data_result)
        order_map = data_result.get("order_map", preparer.order_map)
    else:
        actual_data_bundle = data_result
        order_map = preparer.order_map

    # 3. Load view module (with absolute path)
    global _cached_modules
    module_name = f"{proposal_id}_view"
    
    if module_name in _cached_modules:
        module = _cached_modules[module_name]
    else:
        module_path = os.path.join(PROJECT_ROOT, "services", "insight", "views", f"{module_name}.py")
        if not os.path.exists(module_path):
            raise HTTPException(status_code=404, detail=f"View module {module_name} not found")
            
        try:
            spec = importlib.util.spec_from_file_location(module_name, module_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            _cached_modules[module_name] = module
        except Exception as e:
            print(f"DEBUG: Error loading module {module_name}: {e}")
            raise HTTPException(status_code=500, detail=f"Error loading view module: {str(e)}")
    
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
        err_msg = f"Error in {module_name}.create_figure_and_df: {str(e)}"
        print(f"DEBUG: {err_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=err_msg)

    # 5. Format result (Safe Serialization)
    def json_safe(obj):
        """JSON 직렬화가 불가능한 타입들을 재귀적으로 처리"""
        if isinstance(obj, dict):
            return {k: json_safe(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [json_safe(i) for i in obj]
        elif isinstance(obj, pd.DataFrame):
            # DataFrame은 records 형태의 리스트로 변환 후 재귀 처리
            return json_safe(obj.replace({np.nan: None}).to_dict(orient="records"))
        elif isinstance(obj, pd.Series):
            return json_safe(obj.to_dict())
        elif isinstance(obj, (pd.Timestamp, datetime.datetime, datetime.date)):
            return obj.isoformat()
        elif isinstance(obj, pd.Period):
            return str(obj)
        elif isinstance(obj, np.ndarray):
            return json_safe(obj.tolist())
        elif isinstance(obj, (np.int64, np.int32)):
            return int(obj)
        elif isinstance(obj, (np.float64, np.float32)):
            return float(obj) if not np.isnan(obj) else None
        elif pd.isna(obj):
            return None
        return obj

    try:
        # 전체 결과를 안전한 타입으로 변환
        safe_result = json_safe(view_result)
        
        if isinstance(safe_result, dict) and safe_result.get("type") == "tabs":
            return safe_result
        
        # single 타입 처리
        fig, df = view_result # 원본에서 추출 (이미 json_safe 내에서 처리됨)
        return {
            "type": "single",
            "fig": json_safe(fig.to_dict()) if fig else None,
            "df": json_safe(df) if df is not None else None,
            "df_columns": df.columns.tolist() if df is not None else []
        }
    except Exception as e:
        import traceback
        print(f"DEBUG: Error formatting view_result: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"View result format error: {str(e)}")
