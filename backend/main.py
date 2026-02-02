from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import sys

app = FastAPI()

# CORS 설정
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def load_csv(category, filename):
    path = os.path.join("services", "csv_tables", category, filename)
    if not os.path.exists(path): return None
    try:
        return pd.read_csv(path, encoding='utf-8-sig').fillna("")
    except:
        return pd.read_csv(path).fillna("")

# helpers/utils.py 로직을 내재화하여 계층 구조 해결
def get_hierarchy_mapping(master_df, id_col, up_id_col, level_col, name_col, target_level=1):
    if master_df is None: return {}
    df_indexed = master_df.set_index(id_col)
    p_map = master_df.set_index(id_col)[up_id_col].to_dict()
    name_map = master_df.set_index(id_col)[name_col].to_dict()
    
    mapping = {}
    for item_id in df_indexed.index:
        try:
            curr_id = item_id
            level = df_indexed.loc[curr_id, level_col]
            depth = 0
            # target_level을 찾을 때까지 위로 올라감
            while level > target_level and depth < 10:
                parent_id = p_map.get(curr_id)
                if pd.isna(parent_id) or parent_id == "" or parent_id not in df_indexed.index:
                    break
                curr_id = parent_id
                level = df_indexed.loc[curr_id, level_col]
                depth += 1
            if level <= target_level:
                mapping[item_id] = name_map.get(curr_id)
        except: continue
    return mapping

@app.get("/api/employees")
def get_employees(limit: int = 500):
    try:
        # 1. 메인 데이터
        df = load_csv("HR_Core", "basic_info.csv").drop_duplicates('EMP_ID')

        # 2. 부서 조인 (최신 발령 기준)
        dept_info = load_csv("HR_Core", "department_info.csv")
        dept_master = load_csv("HR_Core", "department.csv")
        if dept_info is not None and dept_master is not None:
            dept_info = dept_info.sort_values('DEP_APP_START_DATE').drop_duplicates('EMP_ID', keep='last')
            div_map = get_hierarchy_mapping(dept_master, 'DEP_ID', 'UP_DEP_ID', 'DEP_LEVEL', 'DEP_NAME', 2)
            df = pd.merge(df, dept_info[['EMP_ID', 'DEP_ID']], on="EMP_ID", how="left")
            df = pd.merge(df, dept_master[['DEP_ID', 'DEP_NAME']], on="DEP_ID", how="left")
            df['DIVISION_NAME'] = df['DEP_ID'].map(div_map)

        # 3. 직위 조인
        pos_info = load_csv("HR_Core", "position_info.csv")
        pos_master = load_csv("HR_Core", "position.csv")
        if pos_info is not None and pos_master is not None:
            pos_info = pos_info.sort_values('POSITION_START_DATE').drop_duplicates('EMP_ID', keep='last')
            df = pd.merge(df, pos_info[['EMP_ID', 'POSITION_ID']], on="EMP_ID", how="left")
            df = pd.merge(df, pos_master[['POSITION_ID', 'POSITION_NAME']], on="POSITION_ID", how="left")

        # 4. 직무 조인 (Level 1 그룹명 포함)
        job_info = load_csv("HR_Core", "job_info.csv")
        job_master = load_csv("HR_Core", "job.csv")
        if job_info is not None and job_master is not None:
            job_info = job_info.sort_values('JOB_APP_START_DATE').drop_duplicates('EMP_ID', keep='last')
            job_group_map = get_hierarchy_mapping(job_master, 'JOB_ID', 'UP_JOB_ID', 'JOB_LEVEL', 'JOB_NAME', 1)
            df = pd.merge(df, job_info[['EMP_ID', 'JOB_ID']], on="EMP_ID", how="left")
            df = pd.merge(df, job_master[['JOB_ID', 'JOB_NAME']], on="JOB_ID", how="left")
            df['JOB_GROUP_NAME'] = df['JOB_ID'].map(job_group_map)

        df = df.fillna("").rename(columns={'DEP_NAME': 'DEPT_NAME'}).drop_duplicates('EMP_ID')
        return df.head(limit).to_dict(orient="records")
    except Exception as e:
        print(f"Error: {e}")
        return []

@app.get("/api/filter-options")
def get_filter_options():
    dept_master = load_csv("HR_Core", "department.csv")
    job_master = load_csv("HR_Core", "job.csv")
    divisions = sorted(dept_master[dept_master['DEP_LEVEL'] <= 2]['DEP_NAME'].unique().tolist()) if dept_master is not None else []
    job_groups = sorted(job_master[job_master['JOB_LEVEL'] == 1]['JOB_NAME'].unique().tolist()) if job_master is not None else []
    return {"divisions": divisions, "jobs": job_groups, "statuses": ["Y", "N"]}

@app.get("/api/dashboard/{emp_id}")
def get_dashboard_data(emp_id: str):
    try:
        basic_df = load_csv("HR_Core", "basic_info.csv")
        user = basic_df[basic_df['EMP_ID'] == emp_id].to_dict(orient="records")
        if not user: return {}
        
        # 홈 화면이 다시 나오도록 필드들 복구
        work_df = load_csv("Time_Attendance", "daily_working_info.csv")
        recent_work = work_df[work_df['EMP_ID'] == emp_id].sort_values('DATE', ascending=False).head(5).to_dict(orient="records") if work_df is not None else []
        
        leave_df = load_csv("Time_Attendance", "detailed_leave_info.csv")
        recent_leave = leave_df[leave_df['EMP_ID'] == emp_id].sort_values('DATE', ascending=False).head(5).to_dict(orient="records") if leave_df is not None else []
        
        return {
            "profile": user[0],
            "work_history": recent_work,
            "leave_history": recent_leave,
            "stats": {"total_work_minutes_this_week": 2400, "remaining_leave_days": 15.0}
        }
    except: return {}