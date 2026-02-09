from fastapi import APIRouter, HTTPException
import pandas as pd
import os

router = APIRouter(prefix="/api/recruitment", tags=["recruitment"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RECRUITMENT_DIR = os.path.join(BASE_DIR, "services", "csv_tables", "Recruitment")

def load_csv(filename):
    path = os.path.join(RECRUITMENT_DIR, filename)
    if not os.path.exists(path):
        return None
    return pd.read_csv(path).fillna("")

@router.get("/positions")
async def get_positions():
    df = load_csv("positions.csv")
    if df is None: return []
    return df.to_dict(orient="records")

@router.get("/applicants")
async def get_applicants(tab: str = "진행중"):
    df_app = load_csv("applicants.csv")
    df_pos = load_csv("positions.csv")
    
    if df_app is None: return []
    
    # 포지션 정보 조인
    if df_pos is not None:
        df = pd.merge(df_app, df_pos[['POSITION_ID', 'TITLE']], on='POSITION_ID', how='left')
    else:
        df = df_app

    # 탭 필터링
    # 진행중: STAGE가 최종합격이 아니고, STATUS가 불합격이 아닌 경우
    # 종료: STAGE가 최종합격이거나, STATUS가 불합격인 경우
    if tab == "진행중":
        mask = (df['STAGE'] != '최종합격') & (df['STATUS'] != '불합격')
    else: # 종료
        mask = (df['STAGE'] == '최종합격') | (df['STATUS'] == '불합격')
        
    return df[mask].to_dict(orient="records")

@router.post("/update-stage")
async def update_applicant_stage(item: dict):
    # item: { applicant_id, stage, status }
    path = os.path.join(RECRUITMENT_DIR, "applicants.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
        
    df = pd.read_csv(path)
    idx = df[df['APPLICANT_ID'] == item['applicant_id']].index
    
    if len(idx) == 0:
        raise HTTPException(status_code=404, detail="Applicant not found")
        
    if 'stage' in item:
        df.loc[idx, 'STAGE'] = item['stage']
    if 'status' in item:
        df.loc[idx, 'STATUS'] = item['status']
        
    df.to_csv(path, index=False, encoding='utf-8-sig')
    return {"message": "Updated successfully"}
