import pandas as pd
import os

# 프로젝트 루트 경로 획득
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE_CSV_PATH = os.path.join(PROJECT_ROOT, "services", "csv_tables")

# 글로벌 캐시 변수
_cached_base_data = None

def load_csv(category, filename):
    # .csv 확장자가 없는 경우 추가
    if not filename.endswith(".csv"):
        filename = filename + ".csv"
        
    path = os.path.join(BASE_CSV_PATH, category, filename)
    if not os.path.exists(path):
        print(f"DEBUG: File not found: {path}")
        return pd.DataFrame()
    try:
        df = pd.read_csv(path, encoding='utf-8-sig')
    except:
        df = pd.read_csv(path)
    
    # 컬럼명 앞뒤 공백 및 BOM 제거
    df.columns = [col.strip() for col in df.columns]
    return df

def load_all_base_data():
    """
    csv_tables 폴더에서 직접 데이터를 로드합니다. (캐싱 적용)
    """
    global _cached_base_data
    if _cached_base_data is not None:
        return _cached_base_data

    base_data = {
        # HR Core
        "department_df": load_csv("HR_Core", "department"),
        "position_df": load_csv("HR_Core", "position"),
        "job_df": load_csv("HR_Core", "job"),
        "pjt_df": load_csv("HR_Core", "project"),
        "absence_df": load_csv("HR_Core", "absence"),
        "career_df": load_csv("HR_Core", "career"),
        "school_df": load_csv("HR_Core", "school"),
        "corp_branch_df": load_csv("HR_Core", "corporation_branch"),
        "region_df": load_csv("HR_Core", "region"),
        "emp_df": load_csv("HR_Core", "basic_info"),
        "department_info_df": load_csv("HR_Core", "department_info"),
        "position_info_df": load_csv("HR_Core", "position_info"),
        "job_info_df": load_csv("HR_Core", "job_info"),
        "pjt_info_df": load_csv("HR_Core", "pjt_info"),
        "absence_info_df": load_csv("HR_Core", "absence_info"),
        "career_info_df": load_csv("HR_Core", "career_info"),
        "school_info_df": load_csv("HR_Core", "school_info"),
        "corp_branch_info_df": load_csv("HR_Core", "corp_branch_info"),
        "region_info_df": load_csv("HR_Core", "region_info"),
        "contract_info_df": load_csv("HR_Core", "contract_info"),
        "salary_contract_info_df": load_csv("HR_Core", "salary_contract_info"),

        # Time Attendance
        "work_sys_df": load_csv("Time_Attendance", "working_system"),
        "work_type_df": load_csv("Time_Attendance", "working_type"),
        "work_info_df": load_csv("Time_Attendance", "working_info"),
        "detailed_work_info_df": load_csv("Time_Attendance", "detailed_working_info"),
        "daily_work_info_df": load_csv("Time_Attendance", "daily_working_info"),
        "leave_type_df": load_csv("Time_Attendance", "leave_type"),
        "detailed_leave_info_df": load_csv("Time_Attendance", "detailed_leave_info"),

        # Performance
        "evaluation_system_df": load_csv("Performance", "evaluation_system"),
        "evaluation_apply_df": load_csv("Performance", "evaluation_apply"),
        "evaluation_original_score_df": load_csv("Performance", "evaluation_original_score_info"),
        "evaluation_modified_score_df": load_csv("Performance", "evaluation_modified_score_info"),

        # Payroll
        "payroll_item_df": load_csv("Payroll", "payroll_item"),
        "detailed_monthly_payroll_df": load_csv("Payroll", "detailed_monthly_payroll_info"),
        "yearly_payroll_df": load_csv("Payroll", "yearly_payroll_info"),
    }
    
    # 날짜 컬럼들을 datetime 객체로 변환
    date_columns = [
        'IN_DATE', 'OUT_DATE', 'DEP_APP_START_DATE', 'DEP_APP_END_DATE',
        'GRADE_START_DATE', 'GRADE_END_DATE', 'JOB_APP_START_DATE', 'JOB_APP_END_DATE',
        'CONT_START_DATE', 'CONT_END_DATE', 'SAL_START_DATE', 'SAL_END_DATE',
        'REG_APP_START_DATE', 'REG_APP_END_DATE', 'DATE'
    ]
    
    for key in base_data:
        df = base_data[key]
        if df.empty: continue
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
                
    _cached_base_data = base_data
    return _cached_base_data
