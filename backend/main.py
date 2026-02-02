from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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

# 데이터 로드 유틸리티 함수
def load_csv(category, filename):
    path = os.path.join("services", "csv_tables", category, filename)
    if not os.path.exists(path):
        return None
    return pd.read_csv(path).fillna("")

@app.get("/")
def read_root():
    return {"message": "Flex Clone Backend is running!"}

@app.get("/api/employees")
def get_employees(limit: int = 20):
    df = load_csv("HR_Core", "basic_info.csv")
    if df is None:
        return {"error": "Employee data file not found."}
    
    # 상위 limit개만 반환
    return df.head(limit).to_dict(orient="records")

@app.get("/api/dashboard/{emp_id}")
def get_dashboard_data(emp_id: str):
    # 1. 기본 정보 조회
    basic_df = load_csv("HR_Core", "basic_info.csv")
    if basic_df is None:
        raise HTTPException(status_code=500, detail="Basic info data not found")
    
    user_info = basic_df[basic_df['EMP_ID'] == emp_id].to_dict(orient="records")
    if not user_info:
        raise HTTPException(status_code=404, detail="User not found")
    user = user_info[0]

    # 2. 이번 주 근무 기록 조회 (최근 7일 데이터 예시)
    # 실제로는 날짜 기준으로 필터링해야 하지만, 데이터가 과거 데이터일 수 있으므로
    # 해당 사원의 가장 최근 근무 기록 5개를 가져오는 것으로 대체
    work_df = load_csv("Time_Attendance", "daily_working_info.csv")
    recent_work = []
    if work_df is not None:
        user_work = work_df[work_df['EMP_ID'] == emp_id]
        # 날짜 내림차순 정렬
        user_work = user_work.sort_values(by="DATE", ascending=False)
        recent_work = user_work.head(5).to_dict(orient="records")

    # 3. 휴가 기록 조회
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
            "total_work_minutes_this_week": 2400, # 더미 데이터 (계산 로직 복잡함 생략)
            "remaining_leave_days": 15.0          # 더미 데이터
        }
    }
