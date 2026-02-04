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

@app.get("/api/work/{emp_id}")
def get_work_records(emp_id: str, year: int = None, month: int = None):
    try:
        df = load_csv("Time_Attendance", "daily_working_info.csv")
        if df is None: return {"summary": {}, "records": []}
        
        # Filter by Employee
        user_df = df[df['EMP_ID'] == emp_id].copy()
        
        # Filter by Date (if provided)
        if year and month:
            user_df['DATE'] = pd.to_datetime(user_df['DATE'])
            user_df = user_df[
                (user_df['DATE'].dt.year == year) & 
                (user_df['DATE'].dt.month == month)
            ]
            user_df['DATE'] = user_df['DATE'].dt.strftime('%Y-%m-%d')
        
        # Sort by date desc
        user_df = user_df.sort_values('DATE', ascending=False)
        
        records = user_df.to_dict(orient="records")
        
        # Calculate Summary
        total_work = user_df['ACTUAL_WORK_MINUTES'].sum()
        total_overtime = user_df['OVERTIME_MINUTES'].sum()
        
        return {
            "summary": {
                "total_work_minutes": total_work,
                "total_overtime_minutes": total_overtime,
                "work_days": len(user_df)
            },
            "records": records
        }
    except Exception as e:
        print(f"Error: {e}")
        return {"summary": {}, "records": []}

# --- Attendance / Clock-In / Clock-Out Logic ---
from datetime import datetime

ATTENDANCE_FILE = os.path.join("services", "csv_tables", "Time_Attendance", "detailed_working_info.csv")

def get_today_str():
    return datetime.now().strftime('%Y-%m-%d')

def get_now_str():
    return datetime.now().strftime('%H:%M')

@app.get("/api/attendance/today/{emp_id}")
def get_today_attendance(emp_id: str):
    try:
        # 파일이 크므로 필요한 부분만 읽거나, 전체 로드 후 필터링 (Pandas는 20MB 정도는 거뜬함)
        if not os.path.exists(ATTENDANCE_FILE):
             return {"status": "clean", "data": None}
        
        df = pd.read_csv(ATTENDANCE_FILE)
        today = get_today_str()
        
        record = df[(df['EMP_ID'] == emp_id) & (df['DATE'] == today)]
        
        if record.empty:
            return {"status": "before_work", "data": None}
        
        row = record.iloc[0].to_dict()
        if pd.isna(row['DATE_END_TIME']) or row['DATE_END_TIME'] == "":
            return {"status": "working", "data": row}
        else:
            return {"status": "after_work", "data": row}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/attendance/clock-in")
def clock_in(item: dict):
    emp_id = item.get("emp_id")
    try:
        df = pd.read_csv(ATTENDANCE_FILE)
        today = get_today_str()
        
        # 이미 기록이 있는지 확인
        mask = (df['EMP_ID'] == emp_id) & (df['DATE'] == today)
        if df[mask].shape[0] > 0:
            return {"message": "Already clocked in", "status": "working"}
        
        # 새 기록 추가
        new_row = {
            "EMP_ID": emp_id,
            "DATE": today,
            "DATE_START_TIME": get_now_str(),
            "DATE_END_TIME": "",
            "WORK_ETC": ""
        }
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        df.to_csv(ATTENDANCE_FILE, index=False, encoding='utf-8-sig')
        
        return {"message": "Clocked in successfully", "status": "working", "start_time": new_row["DATE_START_TIME"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/attendance/clock-out")
def clock_out(item: dict):
    emp_id = item.get("emp_id")
    try:
        df = pd.read_csv(ATTENDANCE_FILE)
        today = get_today_str()
        
        mask = (df['EMP_ID'] == emp_id) & (df['DATE'] == today)
        if df[mask].empty:
             raise HTTPException(status_code=400, detail="No clock-in record found for today")
        
        # 퇴근 시간 업데이트
        df.loc[mask, 'DATE_END_TIME'] = get_now_str()
        df.to_csv(ATTENDANCE_FILE, index=False, encoding='utf-8-sig')
        
        return {"message": "Clocked out successfully", "status": "after_work"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/attendance/off-site")
def apply_off_site(item: dict):
    # 외근 신청: type, start_time, end_time, location, reason 등을 받아서 WORK_ETC에 저장하거나
    # DATE_START/END_TIME을 업데이트할 수도 있음. 여기서는 WORK_ETC에 JSON 형태로 저장한다고 가정.
    emp_id = item.get("emp_id")
    info = item.get("info") # 외근 정보 텍스트
    try:
        df = pd.read_csv(ATTENDANCE_FILE)
        today = get_today_str()
        
        # 외근도 근태 기록이 있어야 한다면 생성, 아니면 업데이트. 
        # 보통 외근 신청은 미리 할 수도 있으나, 여기선 '당일 외근 신청'으로 가정하고 행이 없으면 만듦.
        mask = (df['EMP_ID'] == emp_id) & (df['DATE'] == today)
        
        if df[mask].empty:
             new_row = {
                "EMP_ID": emp_id,
                "DATE": today,
                "DATE_START_TIME": "",
                "DATE_END_TIME": "",
                "WORK_ETC": f"[외근] {info}"
            }
             df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        else:
            current_etc = df.loc[mask, 'WORK_ETC'].values[0]
            if pd.isna(current_etc): current_etc = ""
            df.loc[mask, 'WORK_ETC'] = f"{current_etc} | [외근] {info}"
            
        df.to_csv(ATTENDANCE_FILE, index=False, encoding='utf-8-sig')
        return {"message": "Off-site work applied"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))