from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os

app = FastAPI()

# CORS 설정
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_csv(category, filename):
    path = os.path.join("services", "csv_tables", category, filename)
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return None
    return pd.read_csv(path).fillna("")

@app.get("/")
def read_root():
    return {"message": "Flex Clone Backend is running!"}

@app.get("/api/employees")
def get_employees(limit: int = 200):
    try:
        # 1. 기본 정보 로드
        df = load_csv("HR_Core", "basic_info.csv")
        if df is None:
            return []
        
        # 중복 방지를 위해 기본 정보에서 사번 기준 중복 제거 (만약의 경우)
        df = df.drop_duplicates('EMP_ID')

        # 2. 부서 정보 조인
        dept_info = load_csv("HR_Core", "department_info.csv")
        dept_master = load_csv("HR_Core", "department.csv")
        
        if dept_info is not None and dept_master is not None:
            # 날짜형 변환 후 정렬하여 최신 기록만 추출
            dept_info['DEP_APP_START_DATE'] = pd.to_datetime(dept_info['DEP_APP_START_DATE'], errors='coerce')
            dept_info = dept_info.sort_values('DEP_APP_START_DATE').drop_duplicates('EMP_ID', keep='last')
            
            # 부서 마스터도 ID 중복 제거 (안전장치)
            dept_master = dept_master.drop_duplicates('DEP_ID')
            
            dept_combined = pd.merge(dept_info[['EMP_ID', 'DEP_ID']], 
                                    dept_master[['DEP_ID', 'DEP_NAME']], 
                                    on="DEP_ID", how="left")
            
            # 병합 전 dept_combined에 중복 사번이 없는지 다시 확인
            dept_combined = dept_combined.drop_duplicates('EMP_ID')
            
            df = pd.merge(df, dept_combined, on="EMP_ID", how="left")

        # 3. 직위 정보 조인
        pos_info = load_csv("HR_Core", "position_info.csv")
        pos_master = load_csv("HR_Core", "position.csv")
        
        if pos_info is not None and pos_master is not None:
            # 날짜형 변환 후 정렬하여 최신 기록만 추출
            pos_info['POSITION_START_DATE'] = pd.to_datetime(pos_info['POSITION_START_DATE'], errors='coerce')
            pos_info = pos_info.sort_values('POSITION_START_DATE').drop_duplicates('EMP_ID', keep='last')
            
            # 직위 마스터 ID 중복 제거
            pos_master = pos_master.drop_duplicates('POSITION_ID')
            
            pos_combined = pd.merge(pos_info[['EMP_ID', 'POSITION_ID']], 
                                   pos_master[['POSITION_ID', 'POSITION_NAME']], 
                                   on="POSITION_ID", how="left")
            
            # 병합 전 중복 사번 제거
            pos_combined = pos_combined.drop_duplicates('EMP_ID')
            
            df = pd.merge(df, pos_combined, on="EMP_ID", how="left")

        # 결과 정리
        df = df.fillna("")
        df = df.rename(columns={'DEP_NAME': 'DEPT_NAME'})
        
        # 마지막으로 전체 결과에서 EMP_ID 중복 제거 (최종 안전장치)
        df = df.drop_duplicates('EMP_ID')
        
        return df.head(limit).to_dict(orient="records")
    except Exception as e:
        print(f"Error in get_employees: {e}")
        import traceback
        traceback.print_exc() # 에러 로그를 터미널에 상세히 출력
        return []

@app.get("/api/dashboard/{emp_id}")
def get_dashboard_data(emp_id: str):
    basic_df = load_csv("HR_Core", "basic_info.csv")
    if basic_df is None:
        raise HTTPException(status_code=500, detail="Basic info data not found")
    
    user_info = basic_df[basic_df['EMP_ID'] == emp_id].to_dict(orient="records")
    if not user_info:
        raise HTTPException(status_code=404, detail="User not found")
    user = user_info[0]

    work_df = load_csv("Time_Attendance", "daily_working_info.csv")
    recent_work = []
    if work_df is not None:
        user_work = work_df[work_df['EMP_ID'] == emp_id]
        user_work = user_work.sort_values(by="DATE", ascending=False)
        recent_work = user_work.head(5).to_dict(orient="records")

    leave_df = load_csv("Time_Attendance", "detailed_leave_info.csv")
    leave_history = []
    if leave_df is not None:
        user_leave = leave_df[leave_df['EMP_ID'] == emp_id]
        leave_history = user_leave.sort_values(by="DATE", ascending=False).head(5).to_dict(orient="records")

    return {
        "profile": user,
        "work_history": recent_work,
        "leave_history": leave_history,
        "stats": {
            "total_work_minutes_this_week": 2400,
            "remaining_leave_days": 15.0
        }
    }