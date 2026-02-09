from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import sys
import time

# 프로젝트 루트 경로 계산 (backend 폴더의 상위)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# 인사이트 라우터 임포트 (경로 문제 방지를 위해 절대 임포트 시도)
try:
    from backend.insight import router as insight_router
    from backend.recruitment import router as recruitment_router
except ImportError:
    from insight import router as insight_router
    from recruitment import router as recruitment_router

app = FastAPI()

# CORS 설정 완화 (브라우저 통신 문제 해결)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 모든 오리진 허용 (개발용)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 간단한 요청 로거 미들웨어
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    print(f"DEBUG: {request.method} {request.url.path} - Status: {response.status_code} - {duration:.2f}s")
    return response

# 라우터 등록
app.include_router(insight_router)
app.include_router(recruitment_router)

def load_csv(category, filename):
    # 절대 경로로 변경
    path = os.path.join(PROJECT_ROOT, "services", "csv_tables", category, filename)
    if not os.path.exists(path): 
        print(f"DEBUG: File not found: {path}")
        return None
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
    return '2025-12-31'

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

@app.get("/api/work/admin/daily-status")
def get_all_daily_status(date: str = None):
    try:
        target_date = date if date else get_today_str()
        
        # 1. 직원 목록
        emp_df = load_csv("HR_Core", "basic_info.csv").drop_duplicates('EMP_ID')[['EMP_ID', 'NAME', 'ENG_NAME']]
        
        # 2. 부서 정보 추가
        dept_info = load_csv("HR_Core", "department_info.csv")
        dept_master = load_csv("HR_Core", "department.csv")
        if dept_info is not None and dept_master is not None:
            dept_info = dept_info.sort_values('DEP_APP_START_DATE').drop_duplicates('EMP_ID', keep='last')
            emp_df = pd.merge(emp_df, dept_info[['EMP_ID', 'DEP_ID']], on="EMP_ID", how="left")
            emp_df = pd.merge(emp_df, dept_master[['DEP_ID', 'DEP_NAME']], on="DEP_ID", how="left")
        
        # 3. 근무 기록
        work_df = load_csv("Time_Attendance", "detailed_working_info.csv")
        if work_df is not None:
            today_work = work_df[work_df['DATE'] == target_date][['EMP_ID', 'DATE_START_TIME', 'DATE_END_TIME', 'WORK_ETC']]
            emp_df = pd.merge(emp_df, today_work, on="EMP_ID", how="left")
            
        # 4. 휴가 기록
        leave_df = load_csv("Time_Attendance", "detailed_leave_info.csv")
        if leave_df is not None:
             # 휴가는 범위일 수 있으나 여기선 단순화하여 해당 날짜의 기록만 확인
            today_leave = leave_df[leave_df['DATE'] == target_date][['EMP_ID', 'LEAVE_TYPE_NAME']] # 컬럼명 확인 필요하나 가정
            if 'LEAVE_TYPE_NAME' in leave_df.columns:
                emp_df = pd.merge(emp_df, today_leave, on="EMP_ID", how="left")
        
        # 5. 상태 결정 로직
        def determine_status(row):
            if pd.notna(row.get('LEAVE_TYPE_NAME')) and row.get('LEAVE_TYPE_NAME') != "":
                return "휴가"
            if pd.notna(row.get('DATE_START_TIME')) and row.get('DATE_START_TIME') != "":
                if pd.notna(row.get('DATE_END_TIME')) and row.get('DATE_END_TIME') != "":
                    return "퇴근"
                return "근무중"
            return "미출근"

        emp_df['STATUS'] = emp_df.apply(determine_status, axis=1)
        
        result = emp_df.fillna("").to_dict(orient="records")
        return result
    except Exception as e:
        print(f"Admin API Error: {e}")
        return []

@app.get("/api/work/admin/monthly-stats")
def get_all_monthly_stats(year: int, month: int):
    try:
        # 1. 직원 목록
        emp_df = load_csv("HR_Core", "basic_info.csv").drop_duplicates('EMP_ID')[['EMP_ID', 'NAME']]
        
        # 2. 부서 정보
        dept_info = load_csv("HR_Core", "department_info.csv")
        dept_master = load_csv("HR_Core", "department.csv")
        if dept_info is not None and dept_master is not None:
            dept_info = dept_info.sort_values('DEP_APP_START_DATE').drop_duplicates('EMP_ID', keep='last')
            emp_df = pd.merge(emp_df, dept_info[['EMP_ID', 'DEP_ID']], on="EMP_ID", how="left")
            emp_df = pd.merge(emp_df, dept_master[['DEP_ID', 'DEP_NAME']], on="DEP_ID", how="left")

        # 3. 월간 근무 요약 데이터 (daily_working_info.csv 활용)
        work_df = load_csv("Time_Attendance", "daily_working_info.csv")
        if work_df is not None:
            work_df['DATE'] = pd.to_datetime(work_df['DATE'])
            monthly_df = work_df[(work_df['DATE'].dt.year == year) & (work_df['DATE'].dt.month == month)]
            
            # 직원별 집계
            stats = monthly_df.groupby('EMP_ID').agg({
                'ACTUAL_WORK_MINUTES': 'sum',
                'OVERTIME_MINUTES': 'sum',
                'DATE': 'count' # 근무 일수
            }).reset_index().rename(columns={'DATE': 'WORK_DAYS'})
            
            emp_df = pd.merge(emp_df, stats, on="EMP_ID", how="left")
            
        result = emp_df.fillna(0).to_dict(orient="records")
        return result
    except Exception as e:
        print(f"Monthly Admin API Error: {e}")
        return []

# --- Leaves API ---

# 경로를 좀 더 안전하게 절대 경로로 변환 시도
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
LEAVE_FILE = os.path.join(PROJECT_ROOT, "services", "csv_tables", "Time_Attendance", "detailed_leave_info.csv")
LEAVE_TYPE_FILE = os.path.join(PROJECT_ROOT, "services", "csv_tables", "Time_Attendance", "leave_type.csv")

@app.get("/api/leaves/types")
def get_leave_types():
    try:
        if not os.path.exists(LEAVE_TYPE_FILE):
            print(f"Leave Type File Not Found: {LEAVE_TYPE_FILE}")
            return []
        df = pd.read_csv(LEAVE_TYPE_FILE)
        return df.to_dict(orient="records")
    except Exception as e:
        print(f"Leave Types Error: {e}")
        return []

@app.get("/api/leaves/my/{emp_id}")
def get_my_leaves(emp_id: str):
    try:
        # 1. 휴가 유형 로드
        if not os.path.exists(LEAVE_TYPE_FILE):
             print(f"Type file missing: {LEAVE_TYPE_FILE}")
             return {"summary": {"remaining": 0}, "history": []}
             
        type_df = pd.read_csv(LEAVE_TYPE_FILE)
        type_map = type_df.set_index('LEAVE_TYPE_ID')['LEAVE_TYPE_NAME'].to_dict()
        
        # 2. 내 휴가 기록 로드
        if not os.path.exists(LEAVE_FILE):
             print(f"Leave file missing: {LEAVE_FILE}")
             return {"summary": {"remaining": 0}, "history": []}

        df = pd.read_csv(LEAVE_FILE)
        my_leaves = df[df['EMP_ID'] == emp_id].copy()
        
        # 날짜 필터링 (2025년 고정)
        current_year = 2025
        my_leaves['DATE_DT'] = pd.to_datetime(my_leaves['DATE'])
        my_leaves = my_leaves[my_leaves['DATE_DT'].dt.year == current_year]
        
        # 3. 상세 정보 매핑
        my_leaves['LEAVE_TYPE_NAME'] = my_leaves['LEAVE_TYPE_ID'].map(type_map)
        my_leaves = my_leaves.sort_values('DATE', ascending=False)
        
        # 4. 잔여 연차 계산
        total_used = my_leaves['LEAVE_LENGTH'].sum()
        total_given = 15.0
        remaining = total_given - total_used
        
        # 반환 시 임시 컬럼 제거
        result_history = my_leaves.drop(columns=['DATE_DT']).fillna("").to_dict(orient="records")

        return {
            "summary": {
                "total_given": total_given,
                "total_used": total_used,
                "remaining": remaining
            },
            "history": result_history
        }
    except Exception as e:
        print(f"My Leave Error: {e}")
        # import traceback
        # traceback.print_exc()
        return {"summary": {"remaining": 0, "total_given": 15, "total_used": 0}, "history": []}

@app.post("/api/leaves/apply")
def apply_leave(item: dict):
    try:
        df = pd.read_csv(LEAVE_FILE)
        
        new_row = {
            "EMP_ID": item['emp_id'],
            "DATE": item['date'],
            "LEAVE_TYPE_ID": item['leave_type_id'],
            "LEAVE_LENGTH": float(item['leave_length'])
        }
        
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        df.to_csv(LEAVE_FILE, index=False, encoding='utf-8-sig')
        return {"message": "Leave applied successfully"}
    except Exception as e:
        print(f"Apply Leave Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/leaves/admin/status")
def get_admin_leaves_status(year: int = 2025):
    try:
        # 1. 직원 목록
        emp_df = load_csv("HR_Core", "basic_info.csv").drop_duplicates('EMP_ID')[['EMP_ID', 'NAME']]
        dept_info = load_csv("HR_Core", "department_info.csv")
        dept_master = load_csv("HR_Core", "department.csv")
        if dept_info is not None and dept_master is not None:
             dept_info = dept_info.sort_values('DEP_APP_START_DATE').drop_duplicates('EMP_ID', keep='last')
             emp_df = pd.merge(emp_df, dept_info[['EMP_ID', 'DEP_ID']], on="EMP_ID", how="left")
             emp_df = pd.merge(emp_df, dept_master[['DEP_ID', 'DEP_NAME']], on="DEP_ID", how="left")

        # 2. 휴가 통계
        if os.path.exists(LEAVE_FILE):
            leave_df = pd.read_csv(LEAVE_FILE)
            
            # 선택된 연도 데이터만 필터링
            leave_df['DATE'] = pd.to_datetime(leave_df['DATE'])
            leave_df = leave_df[leave_df['DATE'].dt.year == year]
            
            stats = leave_df.groupby('EMP_ID')['LEAVE_LENGTH'].sum().reset_index().rename(columns={'LEAVE_LENGTH': 'USED_DAYS'})
            emp_df = pd.merge(emp_df, stats, on="EMP_ID", how="left").fillna(0)
        else:
            emp_df['USED_DAYS'] = 0

        emp_df['TOTAL_DAYS'] = 15.0 # 고정
        emp_df['REMAINING_DAYS'] = emp_df['TOTAL_DAYS'] - emp_df['USED_DAYS']
        
        return emp_df.to_dict(orient="records")
    except Exception as e:
        print(f"Admin Leave Error: {e}")
        return []

# --- Payroll API ---

PAYROLL_MONTHLY_FILE = os.path.join(PROJECT_ROOT, "services", "csv_tables", "Payroll", "detailed_monthly_payroll_info.csv")
PAYROLL_ITEM_FILE = os.path.join(PROJECT_ROOT, "services", "csv_tables", "Payroll", "payroll_item.csv")
PAYROLL_YEARLY_FILE = os.path.join(PROJECT_ROOT, "services", "csv_tables", "Payroll", "yearly_payroll_info.csv")

@app.get("/api/payroll/years/{emp_id}")
def get_payroll_years(emp_id: str):
    try:
        if not os.path.exists(PAYROLL_MONTHLY_FILE):
             return []
        df = pd.read_csv(PAYROLL_MONTHLY_FILE)
        
        user_df = df[df['EMP_ID'] == emp_id].copy()
        if user_df.empty:
            return []
            
        # PAY_PERIOD is YYYY-MM
        user_df['YEAR'] = user_df['PAY_PERIOD'].astype(str).str.slice(0, 4)
        years = sorted(user_df['YEAR'].unique().tolist(), reverse=True)
        
        # Exclude 2026 as requested
        years = [y for y in years if y != '2026']
        
        return years
    except Exception as e:
        print(f"Payroll Years Error: {e}")
        return []

@app.get("/api/payroll/my/monthly/{emp_id}")
def get_my_monthly_payroll(emp_id: str, year: str = None):
    try:
        if not os.path.exists(PAYROLL_MONTHLY_FILE):
             return []
        
        try:
            df = pd.read_csv(PAYROLL_MONTHLY_FILE, encoding='utf-8-sig')
        except:
            df = pd.read_csv(PAYROLL_MONTHLY_FILE)
            
        # Ensure string type for filtering
        df['PAY_PERIOD'] = df['PAY_PERIOD'].astype(str)
        
        user_df = df[df['EMP_ID'] == emp_id].copy()
        
        if year:
             user_df = user_df[user_df['PAY_PERIOD'].str.startswith(str(year))]
        
        summary_list = []
        periods = user_df['PAY_PERIOD'].unique()
        
        for period in sorted(periods, reverse=True):
            period_df = user_df[user_df['PAY_PERIOD'] == period]
            
            # Simply sum the pay amount. 
            # In a real app, we would distinguish payments and deductions.
            total_amount = period_df['PAY_AMOUNT'].sum()
            
            pay_date = period_df.iloc[0]['PAY_DATE'] if 'PAY_DATE' in period_df.columns else ""
            
            summary_list.append({
                "pay_period": period,
                "pay_date": pay_date,
                "total_amount": total_amount,
                "pre_tax_amount": total_amount, 
                "total_deduction": 0 
            })
            
        return summary_list
    except Exception as e:
        print(f"My Payroll Error: {e}")
        return []

@app.get("/api/payroll/my/detail/{emp_id}")
def get_payroll_detail(emp_id: str, pay_period: str):
    try:
        if not os.path.exists(PAYROLL_MONTHLY_FILE): return {}
        
        try:
            df = pd.read_csv(PAYROLL_MONTHLY_FILE, encoding='utf-8-sig')
        except:
            df = pd.read_csv(PAYROLL_MONTHLY_FILE)

        # Filter
        target_df = df[(df['EMP_ID'] == emp_id) & (df['PAY_PERIOD'] == pay_period)].copy()
        
        if target_df.empty: return {}
        
        # Join with Item Master for names
        if os.path.exists(PAYROLL_ITEM_FILE):
            try:
                item_df = pd.read_csv(PAYROLL_ITEM_FILE, encoding='utf-8-sig')
            except:
                item_df = pd.read_csv(PAYROLL_ITEM_FILE)
                
            # Drop category from target if it exists to avoid duplication or collision
            if 'PAYROLL_ITEM_CATEGORY' in target_df.columns:
                target_df = target_df.drop(columns=['PAYROLL_ITEM_CATEGORY'])
                
            target_df = pd.merge(target_df, item_df[['PAYROLL_ITEM_ID', 'PAYROLL_ITEM_NAME', 'PAYROLL_ITEM_CATEGORY']], on='PAYROLL_ITEM_ID', how='left')
        else:
            target_df['PAYROLL_ITEM_NAME'] = target_df['PAYROLL_ITEM_ID']
            if 'PAYROLL_ITEM_CATEGORY' not in target_df.columns:
                 target_df['PAYROLL_ITEM_CATEGORY'] = '기타'
            
        # Organize by Category
        items = target_df.fillna("").to_dict(orient="records")
        
        # Calculate totals
        total_pay = target_df['PAY_AMOUNT'].sum()
        
        return {
            "pay_period": pay_period,
            "pay_date": target_df.iloc[0]['PAY_DATE'] if 'PAY_DATE' in target_df.columns else "",
            "total_pay": total_pay,
            "items": items
        }
    except Exception as e:
        print(f"Payroll Detail Error: {e}")
        return {}

@app.get("/api/payroll/admin/monthly")
def get_admin_payroll_monthly(pay_period: str):
    try:
        if not os.path.exists(PAYROLL_MONTHLY_FILE): return []
        
        try:
            df = pd.read_csv(PAYROLL_MONTHLY_FILE, encoding='utf-8-sig')
        except:
            df = pd.read_csv(PAYROLL_MONTHLY_FILE)
        
        # Filter by Period
        df['PAY_PERIOD'] = df['PAY_PERIOD'].astype(str)
        period_df = df[df['PAY_PERIOD'] == pay_period].copy()
        
        if period_df.empty: return []
        
        # 1. Total Pay & Pay Date
        summary = period_df.groupby('EMP_ID').agg({
            'PAY_AMOUNT': 'sum',
            'PAY_DATE': 'first'
        }).reset_index().rename(columns={'PAY_AMOUNT': 'TOTAL_PAY'})
        
        # 2. Category Breakdown
        pivot = period_df.pivot_table(
            index='EMP_ID', 
            columns='PAYROLL_ITEM_CATEGORY', 
            values='PAY_AMOUNT', 
            aggfunc='sum', 
            fill_value=0
        ).reset_index()
        
        # Merge summary with pivot
        grouped = pd.merge(summary, pivot, on='EMP_ID', how='left')
        
        # Ensure columns exist and rename
        cat_map = {
            '기본급여': 'BASIC_PAY',
            '정기수당': 'REGULAR_PAY',
            '변동급여': 'VARIABLE_PAY'
        }
        
        for ko_col, en_col in cat_map.items():
            if ko_col not in grouped.columns:
                grouped[en_col] = 0
            else:
                grouped = grouped.rename(columns={ko_col: en_col})
        
        # Fill missing columns if they were not in the pivot at all (e.g. rename didn't happen because column didn't exist)
        for en_col in cat_map.values():
            if en_col not in grouped.columns:
                grouped[en_col] = 0

        # Join with Employee Info (Name, Dept)
        emp_df = load_csv("HR_Core", "basic_info.csv").drop_duplicates('EMP_ID')[['EMP_ID', 'NAME', 'ENG_NAME']]
        dept_info = load_csv("HR_Core", "department_info.csv")
        dept_master = load_csv("HR_Core", "department.csv")
        
        if dept_info is not None and dept_master is not None:
             dept_info = dept_info.sort_values('DEP_APP_START_DATE').drop_duplicates('EMP_ID', keep='last')
             emp_df = pd.merge(emp_df, dept_info[['EMP_ID', 'DEP_ID']], on="EMP_ID", how="left")
             emp_df = pd.merge(emp_df, dept_master[['DEP_ID', 'DEP_NAME']], on="DEP_ID", how="left")
             
        result = pd.merge(emp_df, grouped, on="EMP_ID", how="inner") # Only those who got paid
        
        return result.fillna(0).to_dict(orient="records")
    except Exception as e:
        print(f"Admin Payroll Error: {e}")
        return []

@app.get("/api/payroll/admin/yearly")
def get_admin_yearly_stats(year: int):
    try:
        if not os.path.exists(PAYROLL_MONTHLY_FILE): return []
        
        try:
            df = pd.read_csv(PAYROLL_MONTHLY_FILE, encoding='utf-8-sig')
        except:
            df = pd.read_csv(PAYROLL_MONTHLY_FILE)
            
        # Filter by Year
        df['PAY_PERIOD'] = df['PAY_PERIOD'].astype(str)
        # Assuming PAY_PERIOD is 'YYYY-MM'
        yearly_df = df[df['PAY_PERIOD'].str.startswith(str(year))].copy()
        
        if yearly_df.empty: return []
        
        # 1. Total Pay
        summary = yearly_df.groupby('EMP_ID').agg({
            'PAY_AMOUNT': 'sum',
            'PAY_PERIOD': 'count' # Count months paid
        }).reset_index().rename(columns={'PAY_AMOUNT': 'TOTAL_PAY', 'PAY_PERIOD': 'PAID_MONTHS'})
        
        # 2. Category Breakdown
        pivot = yearly_df.pivot_table(
            index='EMP_ID', 
            columns='PAYROLL_ITEM_CATEGORY', 
            values='PAY_AMOUNT', 
            aggfunc='sum', 
            fill_value=0
        ).reset_index()
        
        # Merge
        grouped = pd.merge(summary, pivot, on='EMP_ID', how='left')
        
        # Standardize columns
        cat_map = {
            '기본급여': 'BASIC_PAY',
            '정기수당': 'REGULAR_PAY',
            '변동급여': 'VARIABLE_PAY'
        }
        
        for ko_col, en_col in cat_map.items():
            if ko_col not in grouped.columns:
                grouped[en_col] = 0
            else:
                grouped = grouped.rename(columns={ko_col: en_col})
        
        for en_col in cat_map.values():
            if en_col not in grouped.columns:
                grouped[en_col] = 0
                
        # Join Employee Info
        emp_df = load_csv("HR_Core", "basic_info.csv").drop_duplicates('EMP_ID')[['EMP_ID', 'NAME', 'ENG_NAME']]
        dept_info = load_csv("HR_Core", "department_info.csv")
        dept_master = load_csv("HR_Core", "department.csv")
        
        if dept_info is not None and dept_master is not None:
             dept_info = dept_info.sort_values('DEP_APP_START_DATE').drop_duplicates('EMP_ID', keep='last')
             emp_df = pd.merge(emp_df, dept_info[['EMP_ID', 'DEP_ID']], on="EMP_ID", how="left")
             emp_df = pd.merge(emp_df, dept_master[['DEP_ID', 'DEP_NAME']], on="DEP_ID", how="left")
             
        result = pd.merge(emp_df, grouped, on="EMP_ID", how="inner")
        
        return result.fillna(0).to_dict(orient="records")
    except Exception as e:
        print(f"Admin Yearly Payroll Error: {e}")
        return []

# --- Document / Approval API ---

DOCS_FILE = os.path.join(PROJECT_ROOT, "services", "csv_tables", "Approval", "approval_docs.csv")
LINES_FILE = os.path.join(PROJECT_ROOT, "services", "csv_tables", "Approval", "approval_lines.csv")

@app.get("/api/documents/my-drafts/{emp_id}")
def get_my_drafts(emp_id: str):
    try:
        if not os.path.exists(DOCS_FILE): return []
        df = pd.read_csv(DOCS_FILE).fillna("")
        
        # 내가 작성한 문서
        my_docs = df[df['EMP_ID'] == emp_id].copy().sort_values('CREATED_AT', ascending=False)
        return my_docs.to_dict(orient="records")
    except Exception as e:
        print(f"My Drafts Error: {e}")
        return []

@app.get("/api/documents/to-approve/{emp_id}")
def get_docs_to_approve(emp_id: str):
    try:
        if not os.path.exists(DOCS_FILE) or not os.path.exists(LINES_FILE): return []
        
        docs = pd.read_csv(DOCS_FILE).fillna("")
        lines = pd.read_csv(LINES_FILE).fillna("")
        
        # 내가 결재할 차례인 라인 찾기 (Status is Pending and Approver is Me)
        # 실제로는 Step 순서 체크가 필요하지만, 프로토타입에서는 Pending인 본인 건은 다 보여줌
        my_lines = lines[(lines['APPROVER_ID'] == emp_id) & (lines['STATUS'] == 'Pending')]
        
        # Join with Docs
        merged = pd.merge(my_lines, docs, on='DOC_ID', how='left')
        
        # Filter out if doc is already completed (safety check)
        merged = merged[merged['STATUS_y'] != 'Approved'] # STATUS_y is Doc Status
        
        # Clean up
        result = merged.rename(columns={'STATUS_y': 'DOC_STATUS', 'STATUS_x': 'MY_STATUS'}).fillna("")
        return result.sort_values('CREATED_AT', ascending=False).to_dict(orient="records")
    except Exception as e:
        print(f"To Approve Error: {e}")
        return []

@app.post("/api/documents/approve")
def approve_document(item: dict):
    # item: { doc_id, approver_id, comment }
    try:
        if not os.path.exists(DOCS_FILE) or not os.path.exists(LINES_FILE): 
            raise HTTPException(status_code=404, detail="Files not found")
            
        lines = pd.read_csv(LINES_FILE)
        docs = pd.read_csv(DOCS_FILE)
        
        doc_id = item['doc_id']
        approver_id = item['approver_id']
        comment = item.get('comment', '')
        today = datetime.now().strftime('%Y-%m-%d')
        
        # 1. Update Line
        line_mask = (lines['DOC_ID'] == doc_id) & (lines['APPROVER_ID'] == approver_id) & (lines['STATUS'] == 'Pending')
        if lines[line_mask].empty:
            raise HTTPException(status_code=400, detail="No pending approval found")
            
        lines.loc[line_mask, 'STATUS'] = 'Approved'
        lines.loc[line_mask, 'APPROVED_AT'] = today
        lines.loc[line_mask, 'COMMENT'] = comment
        lines.to_csv(LINES_FILE, index=False, encoding='utf-8-sig')
        
        # 2. Check if all lines are approved? 
        # For prototype, assume 1-step approval or check if any pending lines left
        pending_lines = lines[(lines['DOC_ID'] == doc_id) & (lines['STATUS'] == 'Pending')]
        if pending_lines.empty:
            # Update Doc Status
            docs.loc[docs['DOC_ID'] == doc_id, 'STATUS'] = 'Approved'
            docs.loc[docs['DOC_ID'] == doc_id, 'COMPLETED_AT'] = today
            docs.to_csv(DOCS_FILE, index=False, encoding='utf-8-sig')
            
        return {"message": "Approved successfully"}
    except Exception as e:
        print(f"Approve Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/reject")
def reject_document(item: dict):
    try:
        lines = pd.read_csv(LINES_FILE)
        docs = pd.read_csv(DOCS_FILE)
        
        doc_id = item['doc_id']
        approver_id = item['approver_id']
        comment = item.get('comment', '')
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Update Line
        line_mask = (lines['DOC_ID'] == doc_id) & (lines['APPROVER_ID'] == approver_id) & (lines['STATUS'] == 'Pending')
        if not lines[line_mask].empty:
            lines.loc[line_mask, 'STATUS'] = 'Rejected'
            lines.loc[line_mask, 'APPROVED_AT'] = today
            lines.loc[line_mask, 'COMMENT'] = comment
            lines.to_csv(LINES_FILE, index=False, encoding='utf-8-sig')
        
        # Update Doc Status immediately
        docs.loc[docs['DOC_ID'] == doc_id, 'STATUS'] = 'Rejected'
        docs.loc[docs['DOC_ID'] == doc_id, 'COMPLETED_AT'] = today
        docs.to_csv(DOCS_FILE, index=False, encoding='utf-8-sig')
        
        return {"message": "Rejected successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/create")
def create_document(item: dict):
    try:
        docs = pd.read_csv(DOCS_FILE) if os.path.exists(DOCS_FILE) else pd.DataFrame(columns=['DOC_ID','EMP_ID','DOC_TYPE','TITLE','CONTENT','STATUS','CREATED_AT','COMPLETED_AT'])
        lines = pd.read_csv(LINES_FILE) if os.path.exists(LINES_FILE) else pd.DataFrame(columns=['LINE_ID','DOC_ID','APPROVER_ID','STEP','STATUS','APPROVED_AT','COMMENT'])
        
        # Generate IDs
        new_doc_id = f"DOC{len(docs) + 1:03d}"
        
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Create Doc
        new_doc = {
            'DOC_ID': new_doc_id,
            'EMP_ID': item['emp_id'],
            'DOC_TYPE': item['doc_type'],
            'TITLE': item['title'],
            'CONTENT': item['content'],
            'STATUS': 'Pending',
            'CREATED_AT': today,
            'COMPLETED_AT': ''
        }
        docs = pd.concat([docs, pd.DataFrame([new_doc])], ignore_index=True)
        docs.to_csv(DOCS_FILE, index=False, encoding='utf-8-sig')
        
        # Create Line (Single Approver for now)
        approver_id = item.get('approver_id', 'E00001') # Default to Admin
        new_line_id = f"L{len(lines) + 1:03d}"
        
        new_line = {
            'LINE_ID': new_line_id,
            'DOC_ID': new_doc_id,
            'APPROVER_ID': approver_id,
            'STEP': 1,
            'STATUS': 'Pending',
            'APPROVED_AT': '',
            'COMMENT': ''
        }
        lines = pd.concat([lines, pd.DataFrame([new_line])], ignore_index=True)
        lines.to_csv(LINES_FILE, index=False, encoding='utf-8-sig')
        
        return {"message": "Document created", "doc_id": new_doc_id}
    except Exception as e:
        print(f"Create Doc Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))