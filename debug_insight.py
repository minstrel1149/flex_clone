import pandas as pd
import os
import sys

sys.path.append(os.getcwd())

from services.insight.loader import load_all_base_data
from services.insight.preparer import prepare_basic_proposal_data

def debug_data():
    print("=== 1. Data Load Test ===")
    try:
        base_data = load_all_base_data()
        emp_df = base_data.get("emp_df")
        salary_df = base_data.get("salary_contract_info_df")
        
        print(f"SUCCESS: emp_df loaded. Row count: {len(emp_df)}")
        
        if salary_df is not None:
            print(f"SUCCESS: salary_df loaded. Row count: {len(salary_df)}")
            print(f"Salary Columns: {list(salary_df.columns)}")
        else:
            print("FAILED: salary_df is None.")
        
        if 'CURRENT_EMP_YN' in emp_df.columns:
            print(f"CURRENT_EMP_YN value counts:\n{emp_df['CURRENT_EMP_YN'].value_counts()}")
        else:
            print("WARNING: 'CURRENT_EMP_YN' column not found!")

        print("\n=== 2. Preparation Test (Basic Proposal) ===")
        result = prepare_basic_proposal_data()
        if not result:
            print("RESULT: prepare_basic_proposal_data returned an empty dict.")
        elif "data_bundle" in result:
            print(f"SUCCESS: data_bundle found. Dimensions: {len(result['data_bundle'])}")
            if '전체' in result['data_bundle']:
                print("Monthly data head:")
                print(result['data_bundle']['전체']['monthly'].head(3))
        else:
            print(f"RESULT: Unexpected structure keys: {list(result.keys())}")
            
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_data()